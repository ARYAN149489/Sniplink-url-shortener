const express = require('express');
const { auth } = require('../middleware/auth');
const { getOverview, getUrlAnalytics } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/overview', auth, getOverview);
router.get('/:code', auth, getUrlAnalytics);

module.exports = router;
