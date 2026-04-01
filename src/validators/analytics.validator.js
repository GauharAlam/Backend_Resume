const { HTTP_STATUS } = require('../utils/constants');

const validateAnalyticsEvent = (req, res, next) => {
  const { event, payload, timestamp, path } = req.body || {};

  if (!event || typeof event !== 'string' || event.trim().length < 2 || event.trim().length > 120) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Invalid analytics event name.',
    });
  }

  if (payload !== undefined && (typeof payload !== 'object' || Array.isArray(payload))) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Invalid analytics payload.',
    });
  }

  if (path !== undefined && typeof path !== 'string') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Invalid analytics path.',
    });
  }

  if (timestamp !== undefined) {
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid analytics timestamp.',
      });
    }
  }

  return next();
};

module.exports = {
  validateAnalyticsEvent,
};
