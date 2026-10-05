/**
 * Simple in-memory rate limiter middleware factory
 * Good baseline protection for auth endpoints.
 */

const createRateLimiter = ({ windowMs, maxRequests, keyPrefix = 'global' }) => {
    const requestLog = new Map();
    const CLEANUP_INTERVAL = Math.min(windowMs, 10 * 60 * 1000);
    const MAX_KEYS = 10000;

    // Periodic cleanup to prevent unbounded memory growth (no-op in serverless but safe for long-running)
    const cleanup = () => {
        const now = Date.now();
        for (const [key, timestamps] of requestLog.entries()) {
            const recent = timestamps.filter((ts) => now - ts < windowMs);
            if (recent.length === 0) requestLog.delete(key);
            else requestLog.set(key, recent);
        }
        // Hard cap: remove oldest keys if still over limit
        if (requestLog.size > MAX_KEYS) {
            const toDelete = requestLog.size - MAX_KEYS;
            let i = 0;
            for (const k of requestLog.keys()) {
                if (i++ >= toDelete) break;
                requestLog.delete(k);
            }
        }
    };
    const interval = setInterval(cleanup, CLEANUP_INTERVAL);
    if (interval.unref) interval.unref();

    return (req, res, next) => {
        const now = Date.now();
        const rawIp = req.ip || (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
        const key = `${keyPrefix}:${rawIp}`;

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
