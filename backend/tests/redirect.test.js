const request = require('supertest');
const express = require('express');
const { handleRedirect } = require('../controllers/redirectController');
const Url = require('../models/Url');
const Click = require('../models/Click');
const redisConfig = require('../config/redis');

// Mock dependencies
jest.mock('../models/Url');
jest.mock('../models/Click');
jest.mock('../config/redis');

describe('Redirect Controller & Caching Suite', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    Url.updateOne.mockReturnValue(Promise.resolve());
    Click.create.mockReturnValue(Promise.resolve());
    app = express();
    app.get('/:code', handleRedirect);
  });

  test('should redirect immediately with 302 Found when URL is in Redis cache', async () => {
    redisConfig.getUrlCache.mockResolvedValueOnce({
      id: 'mock-id-1',
      originalUrl: 'https://example.com/cached-page',
      isActive: true,
      expiresAt: null,
    });

    const res = await request(app).get('/cached123');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com/cached-page');
    // Database query should NOT have been executed
    expect(Url.findOne).not.toHaveBeenCalled();
  });

  test('should fallback to database on cache miss, redirect with 302, and cache in Redis', async () => {
    redisConfig.getUrlCache.mockResolvedValueOnce(null); // Cache miss
    redisConfig.setUrlCache.mockResolvedValueOnce();

    Url.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'db-id-1',
          originalUrl: 'https://example.com/db-page',
          shortCode: 'dbcode',
          customAlias: null,
          isActive: true,
          expiresAt: null,
        }),
      }),
    });

    Url.updateOne.mockReturnValue({
      catch: jest.fn(),
    });

    const res = await request(app).get('/dbcode');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com/db-page');
    expect(Url.findOne).toHaveBeenCalled();
    expect(redisConfig.setUrlCache).toHaveBeenCalledWith(
      'dbcode',
      expect.objectContaining({
        originalUrl: 'https://example.com/db-page',
        isActive: true,
      }),
      86400
    );
  });

  test('should return 404 when short link does not exist in cache or database', async () => {
    redisConfig.getUrlCache.mockResolvedValueOnce(null);

    Url.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    const res = await request(app).get('/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Short URL not found.');
  });

  test('should return 410 Gone when link is deactivated', async () => {
    redisConfig.getUrlCache.mockResolvedValueOnce({
      id: 'mock-id-deactivated',
      originalUrl: 'https://example.com/secret',
      isActive: false,
      expiresAt: null,
    });

    const res = await request(app).get('/deactivated');

    expect(res.status).toBe(410);
    expect(res.body).toHaveProperty('error', 'This link has been deactivated.');
  });

  test('should return 410 Gone when link has expired', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    redisConfig.getUrlCache.mockResolvedValueOnce({
      id: 'mock-id-expired',
      originalUrl: 'https://example.com/old',
      isActive: true,
      expiresAt: yesterday,
    });

    const res = await request(app).get('/expired');

    expect(res.status).toBe(410);
    expect(res.body).toHaveProperty('error', 'This link has expired.');
  });
});
