/**
 * Resume Service - Business logic for resume operations
 */
const Resume = require('../../models/Resume');
const ApiError = require('../utils/ApiError');

/**
 * Get all resumes for a user
 * @param {string} userId - User ID
 * @returns {Array} List of resumes
 */
const getAllResumes = async (userId) => {
    const resumes = await Resume.find({ userId }).sort({ updatedAt: -1 });
    return resumes;
};

/**
 * Get a specific resume by ID
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID (for ownership verification)
 * @returns {Object} Resume object
 */
const getResumeById = async (resumeId, userId) => {
    const resume = await Resume.findOne({ _id: resumeId, userId });

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
    const resume = await Resume.findOne({ _id: resumeId, userId });

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
 * Delete a resume
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID (for ownership verification)
 * @returns {Object} Deleted resume
 */
const deleteResume = async (resumeId, userId) => {
    const resume = await Resume.findOneAndDelete({
        _id: resumeId,
        userId,
    });

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
 * @returns {Object} Updated resume
 */
const togglePublicStatus = async (resumeId, userId, isPublic) => {
    const resume = await Resume.findOne({ _id: resumeId, userId });

    if (!resume) {
        throw ApiError.notFound('Resume not found.');
    }

    resume.isPublic = isPublic;
    
    // Generate a shareId if it doesn't exist and the resume is being made public
    if (isPublic && !resume.shareId) {
        resume.shareId = crypto.randomBytes(8).toString('hex');
    }

    const updatedResume = await resume.save();
    return updatedResume;
};

/**
 * Get a resume by its public shareId
 * @param {string} shareId - Public share ID
 * @returns {Object} Resume object
 */
const getPublicResume = async (shareId) => {
    const resume = await Resume.findOne({ shareId, isPublic: true });

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
