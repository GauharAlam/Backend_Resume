/**
 * Resume Service - Business logic for resume operations
 */
const Resume = require('../../models/Resume');
const ApiError = require('../utils/ApiError');

/**
 * Get all resumes for a user (paginated, non-deleted).
 * Backward-compat: returns array. Use ?page=&limit= (default 1/50, max 50).
 * @param {string} userId - User ID
 * @param {Object} opts - { page, limit }
 * @returns {Array} List of resumes
 */
const getAllResumes = async (userId, opts = {}) => {
    const page = Math.max(1, parseInt(opts.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(opts.limit, 10) || 50));
    const skip = (page - 1) * limit;
    const resumes = await Resume.find({ userId, isDeleted: { $ne: true } })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);
    return resumes;
};

/**
 * Get a specific resume by ID
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID (for ownership verification)
 * @returns {Object} Resume object
 */
const getResumeById = async (resumeId, userId) => {
    const resume = await Resume.findOne({ _id: resumeId, userId, isDeleted: { $ne: true } });

    if (!resume) {
        throw ApiError.notFound('Resume not found.');
    }

    return resume;
};

/**
 * Create a new resume
 * @param {Object} data - { userId, title, resumeData }
 * @returns {Object} Created resume
 */
const createResume = async ({ userId, title, resumeData }) => {
    const newResume = new Resume({
        userId,
        title: title.trim(),
        resumeData,
    });

    const savedResume = await newResume.save();
    return savedResume;
};

/**
 * Update an existing resume
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID (for ownership verification)
 * @param {Object} updates - { title, resumeData }
 * @returns {Object} Updated resume
 */
const updateResume = async (resumeId, userId, { title, resumeData }) => {
    const resume = await Resume.findOne({ _id: resumeId, userId, isDeleted: { $ne: true } });

    if (!resume) {
        throw ApiError.notFound('Resume not found or you do not have permission to update it.');
    }

    // Update fields
    if (title) resume.title = title.trim();
    if (resumeData) resume.resumeData = resumeData;
    resume.updatedAt = new Date();

    const updatedResume = await resume.save();
    return updatedResume;
};

/**
 * Soft-delete a resume (trash, auto-purged after 30 days via TTL).
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID (for ownership verification)
 * @returns {Object} Deleted resume
 */
const deleteResume = async (resumeId, userId) => {
    const resume = await Resume.findOneAndUpdate(
        { _id: resumeId, userId, isDeleted: { $ne: true } },
        { $set: { isDeleted: true, deletedAt: new Date(), isPublic: false } },
        { new: true }
    );

    if (!resume) {
        throw ApiError.notFound('Resume not found or you do not have permission to delete it.');
    }

    return resume;
};

const crypto = require('crypto');

/**
 * Toggle the public status of a resume
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID (for ownership verification)
 * @param {boolean} isPublic - Desired public status
 * @param {boolean} rotate - Force new shareId even if one exists (link revocation)
 * @returns {Object} Updated resume
 */
const togglePublicStatus = async (resumeId, userId, isPublic, rotate = false) => {
    const resume = await Resume.findOne({ _id: resumeId, userId, isDeleted: { $ne: true } });

    if (!resume) {
        throw ApiError.notFound('Resume not found.');
    }

    resume.isPublic = isPublic;
    
    // Generate a shareId if missing, or rotate on demand — ensure uniqueness with retry
    if (isPublic && (!resume.shareId || rotate)) {
        let attempts = 0;
        let unique = false;
        while (!unique && attempts < 5) {
            const candidate = crypto.randomBytes(8).toString('hex');
            const exists = await Resume.findOne({ shareId: candidate });
            if (!exists) {
                resume.shareId = candidate;
                unique = true;
            }
            attempts++;
        }
        if (!unique) {
            // Fallback to longer random if collisions persist
            resume.shareId = crypto.randomBytes(16).toString('hex');
        }
    }

    try {
        const updatedResume = await resume.save();
        return updatedResume;
    } catch (err) {
        // Handle race-case duplicate key on shareId
        if (err.code === 11000 && err.keyPattern && err.keyPattern.shareId) {
            resume.shareId = crypto.randomBytes(16).toString('hex');
            const retry = await resume.save();
            return retry;
        }
        throw err;
    }
};

/**
 * Get a resume by its public shareId
 * @param {string} shareId - Public share ID
 * @returns {Object} Resume object
 */
const getPublicResume = async (shareId) => {
    if (!shareId || !/^[0-9a-f]{16}([0-9a-f]{16})?$/i.test(String(shareId))) {
        throw ApiError.notFound('Public resume not found or access is restricted.');
    }
    const resume = await Resume.findOne({ shareId, isPublic: true, isDeleted: { $ne: true } });

    if (!resume) {
        throw ApiError.notFound('Public resume not found or access is restricted.');
    }

    return resume;
};

module.exports = {
    getAllResumes,
    getResumeById,
    createResume,
    updateResume,
    deleteResume,
    togglePublicStatus,
    getPublicResume,
};
