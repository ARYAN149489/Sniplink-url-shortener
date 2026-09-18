const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let redisClient = null;
let isConnected = false;

try {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 5) {
        // Stop reconnecting aggressively if Redis server is down
        return null;
      }
      return Math.min(times * 500, 3000);
    },
  });

  redisClient.on('connect', () => {
    isConnected = true;
    console.log('⚡ Redis connected successfully');
  });

  redisClient.on('ready', () => {
    isConnected = true;
  });

  redisClient.on('error', (err) => {
    isConnected = false;
    // Log once without crashing the process
    if (err.code === 'ECONNREFUSED') {
      // Redis is offline or not running locally; MongoDB fallback will be used seamlessly
    } else {
      console.warn('⚠️ Redis notice:', err.message);
    }
  });

  redisClient.on('close', () => {
    isConnected = false;
  });

  // Attempt initial non-blocking connection
  redisClient.connect().catch(() => {
    // Graceful fallback to MongoDB if Redis is not currently active
  });
} catch (error) {
  console.warn('⚠️ Redis initialization error (running in direct DB mode):', error.message);
  redisClient = null;
}

/**
 * Prefix used for URL cache keys
 */
const CACHE_PREFIX = 'url:';

/**
 * Retrieve cached URL data by short code or custom alias
 * @param {string} code
 * @returns {Promise<object|null>}
 */
const getUrlCache = async (code) => {
  if (!isConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(`${CACHE_PREFIX}${code}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn(`Redis get error for code ${code}:`, err.message);
    return null;
  }
};

/**
 * Cache URL data with a Time-To-Live (TTL)
 * @param {string} code
 * @param {object} urlData
 * @param {number} ttlSeconds - Default: 24 hours (86400 seconds)
 */
const setUrlCache = async (code, urlData, ttlSeconds = 86400) => {
  if (!isConnected || !redisClient) return;
  try {
    await redisClient.set(
      `${CACHE_PREFIX}${code}`,
      JSON.stringify(urlData),
      'EX',
      ttlSeconds
    );
  } catch (err) {
    console.warn(`Redis set error for code ${code}:`, err.message);
  }
};

/**
 * Invalidate cached URL data
 * @param {string} code
 */
const invalidateUrlCache = async (code) => {
  if (!isConnected || !redisClient || !code) return;
  try {
    await redisClient.del(`${CACHE_PREFIX}${code}`);
  } catch (err) {
    console.warn(`Redis del error for code ${code}:`, err.message);
  }
};

/**
 * Ping Redis server to verify connectivity
 * @returns {Promise<boolean>}
 */
const pingRedis = async () => {
  if (!isConnected || !redisClient) return false;
  try {
    const res = await redisClient.ping();
    return res === 'PONG';
  } catch {
    return false;
  }
};

module.exports = {
  redisClient,
  getUrlCache,
  setUrlCache,
  invalidateUrlCache,
  pingRedis,
  isRedisConnected: () => isConnected,
};

