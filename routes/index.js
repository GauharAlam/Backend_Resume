/**
 * Routes Index
 * Central route aggregator
 */
const express = require('express');
const router = express.Router();


const resumeRoutes = require('./resume.routes');
const analyticsRoutes = require('./analytics.routes');
const aiRoutes = require('./ai.routes');

// Mount routes

router.use('/resumes', resumeRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai', aiRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running successfully!',
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
