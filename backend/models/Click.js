const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  ip: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  referrer: {
    type: String,
    default: 'Direct',
  },
  country: {
    type: String,
    default: 'Unknown',
  },
  browser: {
    type: String,
    default: 'Unknown',
  },
  os: {
    type: String,
    default: 'Unknown',
  },
  device: {
    type: String,
    default: 'Unknown',
  },
});

module.exports = mongoose.model('Click', clickSchema);
