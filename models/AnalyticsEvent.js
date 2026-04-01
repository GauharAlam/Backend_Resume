const mongoose = require('mongoose');

const ttlDays = Number(process.env.ANALYTICS_TTL_DAYS || 90);
const ttlSeconds = Number.isFinite(ttlDays) && ttlDays > 0 ? Math.floor(ttlDays * 24 * 60 * 60) : 90 * 24 * 60 * 60;

const AnalyticsEventSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
    index: true,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  path: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  ip: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  userAgent: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

AnalyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: ttlSeconds });

module.exports = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
