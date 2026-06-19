require('dotenv').config();
const express = require('express');
const cors = require('cors');
const UAParser = require('ua-parser-js');
const connectDB = require('./config/db');
const Url = require('./models/Url');
const Click = require('./models/Click');

// Import routes
const authRoutes = require('./routes/auth');
const urlRoutes = require('./routes/url');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/url', urlRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── URL Redirect Handler ──────────────────────────────────
// This MUST come after API routes to avoid conflicts
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // Find URL by short code or custom alias
    const url = await Url.findOne({
      $or: [{ shortCode: code }, { customAlias: code }],
    });

    if (!url) {
      return res.status(404).json({ error: 'Short URL not found.' });
    }

    // Check if URL is active
    if (!url.isActive) {
      return res.status(410).json({ error: 'This link has been deactivated.' });
    }

    // Check if URL is expired
    if (url.isExpired()) {
      return res.status(410).json({ error: 'This link has expired.' });
    }

    // Increment click count
    url.clicks += 1;
    await url.save();

    // Parse user agent for analytics
    const parser = new UAParser(req.headers['user-agent']);
    const browserInfo = parser.getBrowser();
    const osInfo = parser.getOS();
    const deviceInfo = parser.getDevice();

    // Record click analytics (async, don't block redirect)
    Click.create({
      urlId: url._id,
      ip: req.ip || req.connection?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      referrer: req.headers['referer'] || req.headers['referrer'] || 'Direct',
      browser: browserInfo.name || 'Unknown',
      os: osInfo.name || 'Unknown',
      device: deviceInfo.type || 'Desktop',
      country: 'Unknown',  // Would need a GeoIP service for real data
    }).catch((err) => console.error('Click tracking error:', err));

    // Redirect to original URL
    res.redirect(301, url.originalUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Start Server ───────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 SnipLink server running on http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api`);
    console.log(`💊 Health check: http://localhost:${PORT}/api/health\n`);
  });
};

startServer();
