const crypto = require('crypto');
const Url = require('../models/Url');

/**
 * Generates a unique 7-character alphanumeric short code.
 * Checks for collisions and retries if needed.
 */
const generateShortCode = async (length = 7) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    let code = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      code += chars[randomBytes[i] % chars.length];
    }

    // Check for collision
    const existing = await Url.findOne({ shortCode: code });
    if (!existing) {
      return code;
    }
    attempts++;
  }

  throw new Error('Failed to generate unique short code after maximum attempts');
};

module.exports = generateShortCode;
