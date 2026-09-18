require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Middleware imports
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const urlRoutes = require('./routes/url');
const analyticsRoutes = require('./routes/analytics');
const redirectRoutes = require('./routes/redirect');

const app = express();

// Trust reverse proxies (Render, Vercel, Heroku, AWS, Nginx)
app.set('trust proxy', 1);

// Standard Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoose = require('mongoose');
const { pingRedis } = require('./config/redis');

// Health check endpoint (bypasses rate limiter, keeps Render, MongoDB, and Redis warm)
app.get('/api/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  let redisStatus = 'offline';
  try {
    const isAlive = await pingRedis();
    if (isAlive) redisStatus = 'connected';
  } catch {
    redisStatus = 'error';
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    services: {
      mongodb: mongoStatus,
      redis: redisStatus,
    },
  });
});

// API routes protected by global apiLimiter
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/url', urlRoutes);
app.use('/api/analytics', analyticsRoutes);

// Public URL redirect handler (must be registered after API routes)
app.use('/', redirectRoutes);

// 404 handler for unknown routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
