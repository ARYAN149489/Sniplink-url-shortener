const request = require('supertest');
const express = require('express');
const { apiLimiter, authLimiter, createUrlLimiter, redirectLimiter } = require('../middleware/rateLimiter');

describe('Rate Limiter Middleware Suite', () => {
  let testApp;

  beforeEach(() => {
    testApp = express();
    testApp.use(express.json());
  });

  test('apiLimiter should add draft-7 RateLimit headers to responses', async () => {
    testApp.get('/test-api', apiLimiter, (req, res) => res.json({ ok: true }));

    const res = await request(testApp).get('/test-api');
    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty('ratelimit');
    expect(res.headers.ratelimit).toContain('limit=100');
  });

  test('authLimiter should throttle after exceeding max requests', async () => {
    testApp.post('/test-auth', authLimiter, (req, res) => res.json({ ok: true }));

    // Send 10 allowed requests
    for (let i = 0; i < 10; i++) {
      const res = await request(testApp).post('/test-auth');
      expect(res.status).toBe(200);
    }

    // 11th request should be throttled (429)
    const throttled = await request(testApp).post('/test-auth');
    expect(throttled.status).toBe(429);
    expect(throttled.body).toHaveProperty('error');
    expect(throttled.body.error).toContain('Too many authentication attempts');
    expect(throttled.body).toHaveProperty('retryAfter');
    expect(typeof throttled.body.retryAfter).toBe('number');
  });

  test('createUrlLimiter should throttle link creation beyond limit', async () => {
    testApp.post('/test-shorten', createUrlLimiter, (req, res) => res.json({ ok: true }));

    // Send 30 allowed requests
    for (let i = 0; i < 30; i++) {
      const res = await request(testApp).post('/test-shorten');
      expect(res.status).toBe(200);
    }

    // 31st request triggers 429
    const throttled = await request(testApp).post('/test-shorten');
    expect(throttled.status).toBe(429);
    expect(throttled.body.error).toContain('link creation limit');
  });

  test('redirectLimiter should set draft-7 headers and allow redirection requests', async () => {
    testApp.get('/r/:code', redirectLimiter, (req, res) => res.redirect(302, 'https://example.com'));

    const res = await request(testApp).get('/r/xyz123');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com');
    expect(res.headers).toHaveProperty('ratelimit');
    expect(res.headers.ratelimit).toContain('limit=300');
  });
});
