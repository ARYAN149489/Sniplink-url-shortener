const request = require('supertest');
const app = require('../app');

describe('App & Global Error Handler Suite', () => {
  test('GET /api/health should return ok status without rate limiting', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  test('Non-existent API route should return 404 JSON', async () => {
    const res = await request(app).get('/api/unknown-route-12345');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Route not found');
  });
});
