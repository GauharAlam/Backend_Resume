const express = require('express');
const router = express.Router();

const analyticsController = require('../src/controllers/analytics.controller');
const { validateAnalyticsEvent } = require('../src/validators/analytics.validator');
const { createRateLimiter } = require('../middleware/rateLimit');

const analyticsLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  keyPrefix: 'analytics',
});

router.post('/events', analyticsLimiter, validateAnalyticsEvent, analyticsController.ingestEvent);

module.exports = router;
