const { asyncHandler, ApiResponse } = require('../utils');
const analyticsService = require('../services/analytics.service');

const ingestEvent = asyncHandler(async (req, res) => {
  const { event, payload, timestamp, path } = req.body;
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0] : '') || req.ip || '';
  const userAgent = req.get('user-agent') || '';

  const saved = await analyticsService.createEvent({
    event,
    payload,
    timestamp,
    path,
    ip,
    userAgent,
  });

  res.status(201).json(
    ApiResponse.created({ id: saved._id }, 'Analytics event received')
  );
});

module.exports = {
  ingestEvent,
};
