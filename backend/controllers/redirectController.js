const UAParser = require('ua-parser-js');
const Url = require('../models/Url');
const Click = require('../models/Click');
const { getUrlCache, setUrlCache } = require('../config/redis');

/**
 * Handle high-speed link redirection with Redis caching & async analytics
 * GET /:code
 */
const handleRedirect = async (req, res, next) => {
  try {
    const { code } = req.params;

    // 1. Check Redis Cache first (sub-millisecond RAM retrieval)
    let urlData = await getUrlCache(code);

    if (!urlData) {
      // 2. Cache miss -> query MongoDB with lean & projection for maximum speed
      const url = await Url.findOne({
        $or: [{ shortCode: code }, { customAlias: code }],
      })
        .select('_id originalUrl isActive expiresAt shortCode customAlias')
        .lean();

      if (!url) {
        return res.status(404).json({ error: 'Short URL not found.' });
      }

      urlData = {
        id: url._id.toString(),
        originalUrl: url.originalUrl,
        isActive: url.isActive,
        expiresAt: url.expiresAt ? new Date(url.expiresAt).toISOString() : null,
      };

      // Store in Redis with a 24-hour TTL (non-blocking)
      setUrlCache(code, urlData, 86400).catch(() => {});
      if (url.customAlias && url.customAlias !== code) {
        setUrlCache(url.customAlias, urlData, 86400).catch(() => {});
      }
      if (url.shortCode && url.shortCode !== code) {
        setUrlCache(url.shortCode, urlData, 86400).catch(() => {});
      }
    }

    // 3. In-memory status & expiration checks
    if (!urlData.isActive) {
      return res.status(410).json({ error: 'This link has been deactivated.' });
    }

    if (urlData.expiresAt && new Date() > new Date(urlData.expiresAt)) {
      return res.status(410).json({ error: 'This link has expired.' });
    }

    // 4. Send Immediate 302 Found Redirect (Sub-5ms response time)
    res.redirect(302, urlData.originalUrl);

    // 5. Asynchronous background processing (non-blocking, executed after client redirect)
    setImmediate(() => {
      // Non-blocking atomic click increment in database
      Url.updateOne({ _id: urlData.id }, { $inc: { clicks: 1 } })
        .catch((err) => console.error('Click count increment error:', err));

      // Asynchronous user-agent parsing & analytics recording
      try {
        const userAgent = req.headers['user-agent'] || '';
        const parser = new UAParser(userAgent);
        const browserInfo = parser.getBrowser();
        const osInfo = parser.getOS();
        const deviceInfo = parser.getDevice();

        Click.create({
          urlId: urlData.id,
          ip: req.ip || req.connection?.remoteAddress || '',
          userAgent,
          referrer: req.headers['referer'] || req.headers['referrer'] || 'Direct',
          browser: browserInfo.name || 'Unknown',
          os: osInfo.name || 'Unknown',
          device: deviceInfo.type || 'Desktop',
          country: 'Unknown',
        }).catch((err) => console.error('Click tracking error:', err));
      } catch (analyticsErr) {
        console.error('Analytics tracking error:', analyticsErr);
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleRedirect,
};
