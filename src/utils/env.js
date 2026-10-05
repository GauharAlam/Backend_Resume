/**
 * Environment helpers
 */

const isProduction = process.env.NODE_ENV === 'production';

const getAllowedCorsOrigins = () => {
    const envOrigins = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (isProduction) {
        if (envOrigins.length === 0) {
            console.error('🚫 CORS_ORIGINS is not set in production. All browser origins will be blocked (fail-closed). Set CORS_ORIGINS to your frontend URL.');
            return [];
        }
        if (envOrigins.includes('*')) {
            console.error('🚫 CORS_ORIGINS includes "*" in production. Refusing wildcard with credentials — set explicit origins.');
            return envOrigins.filter((o) => o !== '*');
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
    getAllowedCorsOrigins,
};
