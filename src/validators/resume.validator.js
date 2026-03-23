/**
 * Resume Validators - Input validation schemas for resume operations
 */
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Validate create resume input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateCreateResume = (req, res, next) => {
    const { title, resumeData } = req.body;
    const errors = [];

    // Title validation
    if (!title || typeof title !== 'string') {
        errors.push({ field: 'title', message: 'Title is required' });
    } else if (title.trim().length < 1) {
        errors.push({ field: 'title', message: 'Title cannot be empty' });
    } else if (title.trim().length > 200) {
        errors.push({ field: 'title', message: 'Title cannot exceed 200 characters' });
    }

    // ResumeData validation
    if (!resumeData) {
        errors.push({ field: 'resumeData', message: 'Resume data is required' });
    } else if (typeof resumeData !== 'object') {
        errors.push({ field: 'resumeData', message: 'Resume data must be an object' });
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
 * Validate update resume input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateUpdateResume = (req, res, next) => {
    const { title, resumeData } = req.body;
    const errors = [];

    // At least one field must be provided
    if (!title && !resumeData) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'At least one field (title or resumeData) must be provided for update',
        });
    }

    // Title validation (if provided)
    if (title !== undefined) {
        if (typeof title !== 'string') {
            errors.push({ field: 'title', message: 'Title must be a string' });
        } else if (title.trim().length < 1) {
            errors.push({ field: 'title', message: 'Title cannot be empty' });
        } else if (title.trim().length > 200) {
            errors.push({ field: 'title', message: 'Title cannot exceed 200 characters' });
        }
    }

    // ResumeData validation (if provided)
    if (resumeData !== undefined && typeof resumeData !== 'object') {
        errors.push({ field: 'resumeData', message: 'Resume data must be an object' });
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
 * Validate resume ID parameter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateResumeId = (req, res, next) => {
    const { id } = req.params;

    // MongoDB ObjectId format validation (24 hex characters)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;

    if (!id || !objectIdRegex.test(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Invalid resume ID format',
        });
    }

    next();
};

module.exports = {
    validateCreateResume,
    validateUpdateResume,
    validateResumeId,
};
