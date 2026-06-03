const buckets = new Map();

const getClientIp = (req) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
};

const cleanupExpiredBuckets = (now) => {
    for (const [key, bucket] of buckets.entries()) {
        if (bucket.resetAt <= now) {
            buckets.delete(key);
        }
    }
};

const createRateLimiter = ({ windowMs, max, keyPrefix, message }) => {
    return (req, res, next) => {
        const now = Date.now();
        cleanupExpiredBuckets(now);

        const key = `${keyPrefix}:${getClientIp(req)}`;
        const bucket = buckets.get(key);

        if (!bucket || bucket.resetAt <= now) {
            buckets.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        bucket.count += 1;

        if (bucket.count > max) {
            const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
            res.set('Retry-After', String(retryAfter));
            return res.status(429).json({
                message,
                retry_after_seconds: retryAfter
            });
        }

        next();
    };
};

module.exports = {
    createRateLimiter
};
