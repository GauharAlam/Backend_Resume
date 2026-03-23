/**
 * Resume Routes
 * Handles resume CRUD endpoints
 */
const express = require('express');
const router = express.Router();

const resumeController = require('../src/controllers/resume.controller');
const { validateCreateResume, validateUpdateResume, validateResumeId } = require('../src/validators/resume.validator');
const { verifyToken } = require('../middleware/auth');

// Public route (accessible without login)
router.get('/share/:shareId', resumeController.getPublicResume);

// All resume routes require authentication
router.use(verifyToken);

// Toggle public sharing
router.patch('/:id/share', validateResumeId, resumeController.togglePublicStatus);

// GET /api/resumes - Get all resumes for the logged-in user
router.get('/', resumeController.getAllResumes);

// GET /api/resumes/:id - Get a specific resume by ID
router.get('/:id', validateResumeId, resumeController.getResumeById);

// POST /api/resumes - Create a new resume
router.post('/', validateCreateResume, resumeController.createResume);

// PUT /api/resumes/:id - Update an existing resume
router.put('/:id', validateResumeId, validateUpdateResume, resumeController.updateResume);

// DELETE /api/resumes/:id - Delete a resume
router.delete('/:id', validateResumeId, resumeController.deleteResume);

module.exports = router;
