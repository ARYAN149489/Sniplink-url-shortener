const express = require('express');
const { redirectLimiter } = require('../middleware/rateLimiter');
const { handleRedirect } = require('../controllers/redirectController');

const router = express.Router();

router.get('/:code', redirectLimiter, handleRedirect);

module.exports = router;
