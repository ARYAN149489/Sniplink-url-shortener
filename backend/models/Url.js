const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: [true, 'Original URL is required'],
    trim: true,
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  customAlias: {
    type: String,
    unique: true,
    sparse: true,  // Allows multiple null values
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,  // null for guest/anonymous users
  },
  clicks: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Check if URL is expired
urlSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Virtual for the effective short code (alias or generated)
urlSchema.virtual('effectiveCode').get(function () {
  return this.customAlias || this.shortCode;
});

module.exports = mongoose.model('Url', urlSchema);
