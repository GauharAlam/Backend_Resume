/**
 * Environment helpers
 */

const isProduction = process.env.NODE_ENV === 'production';

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        if (isProduction) {
            throw new Error('JWT_SECRET is required in production.');
        }
        return 'dev_jwt_secret_for_local_only';
    }

    return secret;
};

const getAllowedCorsOrigins = () => {
    const envOrigins = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (isProduction) {
        if (envOrigins.length === 0) {
            console.error('❌ CRITICAL ERROR: CORS_ORIGINS environment variable is missing.');
            console.error('Please set CORS_ORIGINS to your frontend URL (e.g., https://your-site.vercel.app) in your hosting dashboard.');
            throw new Error('CORS_ORIGINS must be set in production.');
        }
        if (envOrigins.includes('*')) {
            throw new Error('CORS_ORIGINS cannot include "*" in production for security reasons.');
        }
        return envOrigins;
    }

    if (envOrigins.length > 0) return envOrigins;

    return [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ];
};

module.exports = {
    isProduction,
    getJwtSecret,
    getAllowedCorsOrigins,
};
