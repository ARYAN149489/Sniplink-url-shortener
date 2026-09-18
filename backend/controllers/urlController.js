const Url = require('../models/Url');
const generateShortCode = require('../utils/generateCode');
const { setUrlCache, invalidateUrlCache } = require('../config/redis');

/**
 * Helper to build the full short URL string
 */
const getShortUrlString = (code) => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/${code}`;
};

/**
 * POST /api/url/shorten
 * Create a shortened URL (guest or authenticated)
 */
const shortenUrl = async (req, res, next) => {
  try {
    const { originalUrl, customAlias, expiresIn } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: 'URL is required.' });
    }

    try {
      new URL(originalUrl);
    } catch {
      return res.status(400).json({ error: 'Please enter a valid URL (include http:// or https://).' });
    }

    if (customAlias) {
      const aliasRegex = /^[a-zA-Z0-9_-]{3,30}$/;
      if (!aliasRegex.test(customAlias)) {
        return res.status(400).json({
          error: 'Custom alias must be 3-30 characters and contain only letters, numbers, hyphens, and underscores.',
        });
      }

      const existing = await Url.findOne({
        $or: [{ customAlias }, { shortCode: customAlias }],
      });
      if (existing) {
        return res.status(400).json({ error: 'This custom alias is already taken.' });
      }
    }

    const shortCode = await generateShortCode();

    let expiresAt = null;
    if (expiresIn) {
      const days = parseInt(expiresIn, 10);
      if (days > 0 && days <= 365) {
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }
    }

    const url = new Url({
      originalUrl,
      shortCode,
      customAlias: customAlias || undefined,
      userId: req.userId || null,
      expiresAt,
    });

    await url.save();

    // Pre-cache URL in Redis for instant first-hit redirection
    const cacheData = {
      id: url._id.toString(),
      originalUrl: url.originalUrl,
      isActive: url.isActive,
      expiresAt: url.expiresAt ? new Date(url.expiresAt).toISOString() : null,
    };
    setUrlCache(url.shortCode, cacheData, 86400).catch(() => {});
    if (url.customAlias) {
      setUrlCache(url.customAlias, cacheData, 86400).catch(() => {});
    }

    res.status(201).json({
      message: 'URL shortened successfully!',
      url: {
        id: url._id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        customAlias: url.customAlias,
        shortUrl: getShortUrlString(url.customAlias || url.shortCode),
        clicks: url.clicks,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/url/my-links
 * Get all URLs created by the authenticated user
 */
const getMyLinks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = { userId: req.userId };
    if (search) {
      query.$or = [
        { originalUrl: { $regex: search, $options: 'i' } },
        { shortCode: { $regex: search, $options: 'i' } },
        { customAlias: { $regex: search, $options: 'i' } },
      ];
    }

    const [urls, total] = await Promise.all([
      Url.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Url.countDocuments(query),
    ]);

    res.json({
      urls: urls.map((url) => ({
        id: url._id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        customAlias: url.customAlias,
        shortUrl: getShortUrlString(url.customAlias || url.shortCode),
        clicks: url.clicks,
        isActive: url.isActive,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/url/:id
 * Delete a URL (owner only)
 */
const deleteUrl = async (req, res, next) => {
  try {
    const url = await Url.findOne({ _id: req.params.id, userId: req.userId });
    if (!url) {
      return res.status(404).json({ error: 'URL not found or access denied.' });
    }

    await Url.deleteOne({ _id: req.params.id });

    // Invalidate Redis cache
    invalidateUrlCache(url.shortCode).catch(() => {});
    if (url.customAlias) {
      invalidateUrlCache(url.customAlias).catch(() => {});
    }

    res.json({ message: 'URL deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/url/:id
 * Update a URL (toggle active status, update expiration)
 */
const updateUrl = async (req, res, next) => {
  try {
    const url = await Url.findOne({ _id: req.params.id, userId: req.userId });
    if (!url) {
      return res.status(404).json({ error: 'URL not found or access denied.' });
    }

    const { isActive, expiresIn } = req.body;

    if (typeof isActive === 'boolean') {
      url.isActive = isActive;
    }

    if (expiresIn !== undefined) {
      if (expiresIn === null) {
        url.expiresAt = null;
      } else {
        const days = parseInt(expiresIn, 10);
        if (days > 0 && days <= 365) {
          url.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        }
      }
    }

    await url.save();

    // Refresh updated status in Redis cache
    const updatedCacheData = {
      id: url._id.toString(),
      originalUrl: url.originalUrl,
      isActive: url.isActive,
      expiresAt: url.expiresAt ? new Date(url.expiresAt).toISOString() : null,
    };
    setUrlCache(url.shortCode, updatedCacheData, 86400).catch(() => {});
    if (url.customAlias) {
      setUrlCache(url.customAlias, updatedCacheData, 86400).catch(() => {});
    }

    res.json({
      message: 'URL updated successfully.',
      url: {
        id: url._id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        customAlias: url.customAlias,
        shortUrl: getShortUrlString(url.customAlias || url.shortCode),
        clicks: url.clicks,
        isActive: url.isActive,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  shortenUrl,
  getMyLinks,
  deleteUrl,
  updateUrl,
};
