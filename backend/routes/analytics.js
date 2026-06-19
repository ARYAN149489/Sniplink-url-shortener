const express = require('express');
const mongoose = require('mongoose');
const Url = require('../models/Url');
const Click = require('../models/Click');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/analytics/overview
 * Get aggregate analytics for the authenticated user's links
 */
router.get('/overview', auth, async (req, res) => {
  try {
    const urls = await Url.find({ userId: req.userId });
    const urlIds = urls.map((u) => u._id);

    const totalLinks = urls.length;
    const totalClicks = urls.reduce((sum, u) => sum + u.clicks, 0);

    // Top performing link
    const topLink = urls.length > 0
      ? urls.reduce((max, u) => (u.clicks > max.clicks ? u : max), urls[0])
      : null;

    // Clicks over last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const clicksOverTime = await Click.aggregate([
      {
        $match: {
          urlId: { $in: urlIds },
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days with 0 clicks
    const filledClicks = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const found = clicksOverTime.find((c) => c._id === dateStr);
      filledClicks.push({
        date: dateStr,
        clicks: found ? found.count : 0,
      });
    }

    // Recent clicks (last 10)
    const recentClicks = await Click.find({ urlId: { $in: urlIds } })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate({
        path: 'urlId',
        select: 'shortCode customAlias originalUrl',
      });

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

    res.json({
      totalLinks,
      totalClicks,
      topLink: topLink
        ? {
            originalUrl: topLink.originalUrl,
            shortUrl: `${baseUrl}/${topLink.customAlias || topLink.shortCode}`,
            clicks: topLink.clicks,
          }
        : null,
      clicksOverTime: filledClicks,
      recentClicks: recentClicks.map((click) => ({
        url: click.urlId
          ? {
              shortCode: click.urlId.customAlias || click.urlId.shortCode,
              originalUrl: click.urlId.originalUrl,
            }
          : null,
        browser: click.browser,
        os: click.os,
        device: click.device,
        country: click.country,
        referrer: click.referrer,
        timestamp: click.timestamp,
      })),
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

/**
 * GET /api/analytics/:code
 * Get detailed analytics for a specific short URL
 */
router.get('/:code', auth, async (req, res) => {
  try {
    const url = await Url.findOne({
      $or: [
        { shortCode: req.params.code },
        { customAlias: req.params.code },
      ],
      userId: req.userId,
    });

    if (!url) {
      return res.status(404).json({ error: 'URL not found or access denied.' });
    }

    const clicks = await Click.find({ urlId: url._id });

    // Browser breakdown
    const browsers = {};
    const devices = {};
    const countries = {};
    const referrers = {};
    const osList = {};

    clicks.forEach((click) => {
      browsers[click.browser] = (browsers[click.browser] || 0) + 1;
      devices[click.device] = (devices[click.device] || 0) + 1;
      countries[click.country] = (countries[click.country] || 0) + 1;
      referrers[click.referrer] = (referrers[click.referrer] || 0) + 1;
      osList[click.os] = (osList[click.os] || 0) + 1;
    });

    // Clicks over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const clicksOverTime = await Click.aggregate([
      {
        $match: {
          urlId: url._id,
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days
    const filledClicks = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const found = clicksOverTime.find((c) => c._id === dateStr);
      filledClicks.push({
        date: dateStr,
        clicks: found ? found.count : 0,
      });
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

    res.json({
      url: {
        id: url._id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        customAlias: url.customAlias,
        shortUrl: `${baseUrl}/${url.customAlias || url.shortCode}`,
        totalClicks: url.clicks,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
      },
      analytics: {
        clicksOverTime: filledClicks,
        browsers: Object.entries(browsers)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        devices: Object.entries(devices)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        countries: Object.entries(countries)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        referrers: Object.entries(referrers)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        operatingSystems: Object.entries(osList)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      },
    });
  } catch (error) {
    console.error('Analytics detail error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
