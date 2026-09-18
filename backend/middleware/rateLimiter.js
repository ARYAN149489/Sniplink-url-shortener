 const rateLimit = require('express-rate-limit');

/**
 * Standard JSON error response handler for rate limit violations
 */
const rateLimitHandler = (message) => (req, res) => {
  res.status(429).json({
    error: message,
    retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
  });
};

/**
 * General API Limiter
 * Applied across all /api routes to prevent general scraping and abuse.
 * 100 requests per 15-minute window per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler('Too many requests from this IP. Please try again later.'),
  skip: (req) => req.path === '/health', // Don't rate limit uptime monitoring checks
});

/**
 * Strict Auth Limiter
 * Applied to login and register endpoints to mitigate brute force & credential stuffing.
 * 10 attempts per 15-minute window per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler('Too many authentication attempts. Please wait 15 minutes before trying again.'),
});

/**
 * Link Creation Limiter
 * Applied to POST /api/url/shorten to prevent link spamming & DB flood.
 * 30 link creations per 15 minutes per IP.
 */
const createUrlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler('You have reached the link creation limit. Please slow down.'),
});

/**
 * Public Redirect Limiter
 * Applied to /:code redirect handler to protect the server and database
 * against high-volume click floods and DDoS attacks while maintaining fast redirects.
 * 300 requests per 15 minutes per IP.
 */
const redirectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler('Too many redirect requests. Please try again in a few moments.'),
});

module.exports = {
  apiLimiter,
  authLimiter,
  createUrlLimiter,
  redirectLimiter,
};
