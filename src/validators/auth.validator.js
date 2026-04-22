/**
 * Auth Validators - Input validation schemas for authentication
 */
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Validate register input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body;
    const errors = [];

    // Name validation
    if (!name || typeof name !== 'string') {
        errors.push({ field: 'name', message: 'Name is required' });
    } else if (name.trim().length < 2) {
        errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
    } else if (name.trim().length > 100) {
        errors.push({ field: 'name', message: 'Name cannot exceed 100 characters' });
    }

    // Email validation
    if (!email || typeof email !== 'string') {
        errors.push({ field: 'email', message: 'Email is required' });
    } else {
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            errors.push({ field: 'email', message: 'Please provide a valid email' });
        }
    }

    // Password validation
    if (!password || typeof password !== 'string') {
        errors.push({ field: 'password', message: 'Password is required' });
    } else if (password.length < 6) {
        errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Validation failed',
            errors,
        });
    }

    next();
};

/**
 * Validate login input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    // Email validation
    if (!email || typeof email !== 'string') {
        errors.push({ field: 'email', message: 'Email is required' });
    }

    // Password validation
    if (!password || typeof password !== 'string') {
        errors.push({ field: 'password', message: 'Password is required' });
    }

    if (errors.length > 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Validation failed',
            errors,
        });
    }

    next();
};

/**
 * Validate Google login input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateGoogleLogin = (req, res, next) => {
    const { credential } = req.body;

    if (!credential || typeof credential !== 'string') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Google credential is required',
        });
    }

    next();
};

/**
 * Validate token input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateToken = (req, res, next) => {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Token is required',
        });
    }

    next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateGoogleLogin,
    validateToken,
};
