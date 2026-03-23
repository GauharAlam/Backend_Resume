/**
 * Application-wide constants
 */

const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
};

const AUTH_MESSAGES = {
    REGISTER_SUCCESS: 'User registered successfully!',
    LOGIN_SUCCESS: 'Login successful!',
    INVALID_CREDENTIALS: 'Invalid credentials.',
    USER_EXISTS: 'User with this email already exists.',
    USER_NOT_FOUND: 'User not found.',
    TOKEN_REQUIRED: 'Access token required.',
    TOKEN_INVALID: 'Invalid or expired token.',
    PASSWORD_TOO_SHORT: 'Password must be at least 6 characters.',
    MISSING_FIELDS: 'Please provide all required fields.',
};

const RESUME_MESSAGES = {
    CREATED: 'Resume created successfully!',
    UPDATED: 'Resume updated successfully!',
    DELETED: 'Resume deleted successfully!',
    NOT_FOUND: 'Resume not found.',
    FETCH_ERROR: 'Error fetching resumes.',
    MISSING_FIELDS: 'Please provide title and resumeData.',
};

const JWT_CONFIG = {
    EXPIRES_IN: '7d',
};

module.exports = {
    HTTP_STATUS,
    AUTH_MESSAGES,
    RESUME_MESSAGES,
    JWT_CONFIG,
};
