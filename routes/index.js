/**
 * Routes Index
 * Central route aggregator
 */
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const resumeRoutes = require('./resume.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/resumes', resumeRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running successfully!',
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
