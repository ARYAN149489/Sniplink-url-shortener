const request = require('supertest');
const express = require('express');
const { shortenUrl } = require('../controllers/urlController');
const Url = require('../models/Url');
const redisConfig = require('../config/redis');

jest.mock('../models/Url');
jest.mock('../config/redis');
jest.mock('../utils/generateCode', () => jest.fn().mockResolvedValue('xyz789'));

describe('URL Controller Suite', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.post('/api/url/shorten', shortenUrl);
  });

  test('should return 400 if originalUrl is not provided', async () => {
    const res = await request(app).post('/api/url/shorten').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('URL is required.');
  });

  test('should return 400 for malformed URLs without protocol', async () => {
    const res = await request(app).post('/api/url/shorten').send({ originalUrl: 'not-a-valid-url' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Please enter a valid URL');
  });

  test('should return 400 for invalid custom alias length or characters', async () => {
    const res = await request(app).post('/api/url/shorten').send({
      originalUrl: 'https://github.com',
      customAlias: 'ab', // < 3 characters
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Custom alias must be 3-30 characters');
  });

  test('should return 400 if custom alias is already taken', async () => {
    Url.findOne.mockResolvedValueOnce({ _id: 'existing-id', customAlias: 'my-alias' });

    const res = await request(app).post('/api/url/shorten').send({
      originalUrl: 'https://github.com',
      customAlias: 'my-alias',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('This custom alias is already taken.');
  });

  test('should create short URL and pre-cache it in Redis', async () => {
    Url.findOne.mockResolvedValueOnce(null); // Alias not taken

    // Mock Url constructor and save
    const mockSave = jest.fn().mockResolvedValue(true);
    Url.mockImplementation(function (data) {
      this._id = 'mock-new-id';
      this.originalUrl = data.originalUrl;
      this.shortCode = data.shortCode;
      this.customAlias = data.customAlias;
      this.clicks = 0;
      this.createdAt = new Date();
      this.expiresAt = data.expiresAt;
      this.save = mockSave;
      return this;
    });

    redisConfig.setUrlCache.mockResolvedValue();

    const res = await request(app).post('/api/url/shorten').send({
      originalUrl: 'https://news.ycombinator.com',
      customAlias: 'hackernews',
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('URL shortened successfully!');
    expect(res.body.url.shortCode).toBe('xyz789');
    expect(res.body.url.customAlias).toBe('hackernews');
    expect(mockSave).toHaveBeenCalled();
    expect(redisConfig.setUrlCache).toHaveBeenCalled();
  });
});
