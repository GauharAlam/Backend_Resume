const AnalyticsEvent = require('../../models/AnalyticsEvent');

const createEvent = async ({ event, payload, path, timestamp, ip, userAgent }) => {
  const analyticsEvent = new AnalyticsEvent({
    event: event.trim(),
    payload: payload && typeof payload === 'object' ? payload : {},
    path: path || '',
    timestamp: timestamp ? new Date(timestamp) : new Date(),
    ip,
    userAgent,
  });

  const saved = await analyticsEvent.save();
  return saved;
};

module.exports = {
  createEvent,
};
