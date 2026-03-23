/**
 * Resume Controller - Request handlers for resume operations
 */
const { asyncHandler } = require('../utils');
const { ApiResponse } = require('../utils');
const resumeService = require('../services/resume.service');

/**
 * @desc    Get all resumes for the logged-in user
 * @route   GET /api/resumes
 * @access  Private
 */
const getAllResumes = asyncHandler(async (req, res) => {
    const resumes = await resumeService.getAllResumes(req.userId);

    res.status(200).json(
        ApiResponse.success(resumes)
    );
});

/**
 * @desc    Get a specific resume by ID
 * @route   GET /api/resumes/:id
 * @access  Private
 */
const getResumeById = asyncHandler(async (req, res) => {
    const resume = await resumeService.getResumeById(req.params.id, req.userId);

    res.status(200).json(
        ApiResponse.success(resume)
    );
});

/**
 * @desc    Create a new resume
 * @route   POST /api/resumes
 * @access  Private
 */
const createResume = asyncHandler(async (req, res) => {
    const { title, resumeData } = req.body;

    // Validation
    if (!title || !resumeData) {
        return res.status(400).json(
            ApiResponse.error('Please provide title and resumeData.', 400)
        );
    }

    const resume = await resumeService.createResume({
        userId: req.userId,
        title,
        resumeData,
    });

    res.status(201).json(
        ApiResponse.success(resume, 'Resume created successfully!')
    );
});

/**
 * @desc    Update an existing resume
 * @route   PUT /api/resumes/:id
 * @access  Private
 */
const updateResume = asyncHandler(async (req, res) => {
    const { title, resumeData } = req.body;

    const resume = await resumeService.updateResume(
        req.params.id,
        req.userId,
        { title, resumeData }
    );

    res.status(200).json(
        ApiResponse.success(resume, 'Resume updated successfully!')
    );
});

/**
 * @desc    Toggle the public status of a resume
 * @route   PATCH /api/resumes/:id/share
 * @access  Private
 */
const togglePublicStatus = asyncHandler(async (req, res) => {
    const { isPublic } = req.body;

    if (typeof isPublic !== 'boolean') {
        return res.status(400).json(
            ApiResponse.error('Please provide a boolean isPublic status.', 400)
        );
    }

    const resume = await resumeService.togglePublicStatus(
        req.params.id,
        req.userId,
        isPublic
    );

    res.status(200).json(
        ApiResponse.success(resume, `Resume sharing ${isPublic ? 'enabled' : 'disabled'} successfully!`)
    );
});

/**
 * @desc    Get a resume by its public shareId
 * @route   GET /api/resumes/share/:shareId
 * @access  Public
 */
const getPublicResume = asyncHandler(async (req, res) => {
    const resume = await resumeService.getPublicResume(req.params.shareId);

    // We only return the necessary data for public view (security/privacy)
    const publicData = {
        title: resume.title,
        resumeData: resume.resumeData,
        updatedAt: resume.updatedAt,
    };

    res.status(200).json(
        ApiResponse.success(publicData)
    );
});

/**
 * @desc    Delete a resume
 * @route   DELETE /api/resumes/:id
 * @access  Private
 */
const deleteResume = asyncHandler(async (req, res) => {
    await resumeService.deleteResume(req.params.id, req.userId);

    res.status(200).json(
        ApiResponse.success(null, 'Resume deleted successfully!')
    );
});

module.exports = {
    getAllResumes,
    getResumeById,
    createResume,
    updateResume,
    deleteResume,
    togglePublicStatus,
    getPublicResume,
};
