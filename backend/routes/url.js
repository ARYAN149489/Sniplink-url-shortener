const express = require('express');
const Url = require('../models/Url');
const { auth, optionalAuth } = require('../middleware/auth');
const generateShortCode = require('../utils/generateCode');

const router = express.Router();

/**
 * POST /api/url/shorten
 * Create a shortened URL (works for both guests and authenticated users)
 */
router.post('/shorten', optionalAuth, async (req, res) => {
  try {
    const { originalUrl, customAlias, expiresIn } = req.body;

    // Validate URL
    if (!originalUrl) {
      return res.status(400).json({ error: 'URL is required.' });
    }

    // Basic URL validation
    try {
      new URL(originalUrl);
    } catch {
      return res.status(400).json({ error: 'Please enter a valid URL (include http:// or https://).' });
    }

    // Check custom alias availability
    if (customAlias) {
      // Validate alias format (alphanumeric, hyphens, underscores, 3-30 chars)
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

    // Generate short code
    const shortCode = await generateShortCode();

    // Calculate expiration date
    let expiresAt = null;
    if (expiresIn) {
      const days = parseInt(expiresIn);
      if (days > 0 && days <= 365) {
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }
    }

    // Create URL document
    const url = new Url({
      originalUrl,
      shortCode,
      customAlias: customAlias || undefined,
      userId: req.userId || null,
      expiresAt,
    });

    await url.save();

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const shortUrl = `${baseUrl}/${customAlias || shortCode}`;

    res.status(201).json({
      message: 'URL shortened successfully!',
      url: {
        id: url._id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        customAlias: url.customAlias,
        shortUrl,
        clicks: url.clicks,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
      },
    });
  } catch (error) {
    console.error('Shorten URL error:', error);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

/**
 * GET /api/url/my-links
 * Get all URLs created by the authenticated user
 */
router.get('/my-links', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build query
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

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

    res.json({
      urls: urls.map((url) => ({
        id: url._id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        customAlias: url.customAlias,
        shortUrl: `${baseUrl}/${url.customAlias || url.shortCode}`,
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
    console.error('Get my links error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

/**
 * DELETE /api/url/:id
 * Delete a URL (owner only)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const url = await Url.findOne({ _id: req.params.id, userId: req.userId });
    if (!url) {
      return res.status(404).json({ error: 'URL not found or access denied.' });
    }

    await Url.deleteOne({ _id: req.params.id });
    res.json({ message: 'URL deleted successfully.' });
  } catch (error) {
    console.error('Delete URL error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

/**
 * PATCH /api/url/:id
 * Update a URL (toggle active status, update expiration)
 */
router.patch('/:id', auth, async (req, res) => {
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
        const days = parseInt(expiresIn);
        if (days > 0 && days <= 365) {
          url.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        }
      }
    }

    await url.save();

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    res.json({
      message: 'URL updated successfully.',
      url: {
        id: url._id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        customAlias: url.customAlias,
        shortUrl: `${baseUrl}/${url.customAlias || url.shortCode}`,
        clicks: url.clicks,
        isActive: url.isActive,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
      },
    });
  } catch (error) {
    console.error('Update URL error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
