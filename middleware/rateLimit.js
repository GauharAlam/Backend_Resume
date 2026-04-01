/**
 * Simple in-memory rate limiter middleware factory
 * Good baseline protection for auth endpoints.
 */

const createRateLimiter = ({ windowMs, maxRequests, keyPrefix = 'global' }) => {
    const requestLog = new Map();

    return (req, res, next) => {
        const now = Date.now();
        const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const key = `${keyPrefix}:${ip}`;

        const previous = requestLog.get(key) || [];
        const recent = previous.filter((timestamp) => now - timestamp < windowMs);

        if (recent.length >= maxRequests) {
            const retryAfterMs = windowMs - (now - recent[0]);
            const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
            res.setHeader('Retry-After', String(retryAfterSeconds));
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
            });
        }

        recent.push(now);
        requestLog.set(key, recent);
        return next();
    };
};

module.exports = {
    createRateLimiter,
};
