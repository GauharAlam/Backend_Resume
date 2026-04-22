/**
 * Environment helpers
 */

const isProduction = process.env.NODE_ENV === 'production';

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        if (isProduction) {
            console.error('❌ CRITICAL: JWT_SECRET is missing in production. Using insecure fallback.');
        }
        return 'dev_jwt_secret_for_local_only';
    }

    return secret;
};

const getGoogleClientId = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
        if (isProduction) {
            console.error('❌ CRITICAL: GOOGLE_CLIENT_ID is missing in production. Google sign-in will fail.');
        }
        return '';
    }

    return clientId;
};

const getAllowedCorsOrigins = () => {
    const envOrigins = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (isProduction) {
        if (envOrigins.length === 0) {
            console.warn('⚠️ WARNING: CORS_ORIGINS is not set in production. All cross-origin requests will be blocked.');
            return [];
        }
        if (envOrigins.includes('*')) {
            console.warn('⚠️ WARNING: CORS_ORIGINS includes "*" in production. This is insecure.');
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
    getGoogleClientId,
    getAllowedCorsOrigins,
};
