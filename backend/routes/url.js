const express = require('express');
const { auth, optionalAuth } = require('../middleware/auth');
const { createUrlLimiter } = require('../middleware/rateLimiter');
const {
  shortenUrl,
  getMyLinks,
  deleteUrl,
  updateUrl,
} = require('../controllers/urlController');

const router = express.Router();

router.post('/shorten', createUrlLimiter, optionalAuth, shortenUrl);
router.get('/my-links', auth, getMyLinks);
router.delete('/:id', auth, deleteUrl);
router.patch('/:id', auth, updateUrl);

module.exports = router;
