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

// Health check endpoint - readiness (503 when DB down so LB stops traffic)
router.get('/health', (req, res) => {
    let dbState = 'unknown';
    try {
        const mongoose = require('mongoose');
        // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
        dbState = mongoose.connection.readyState === 1 ? 'connected' : 'not-ready';
    } catch {}
    const ready = dbState === 'connected';
    res.status(ready ? 200 : 503).json({
        success: ready,
        message: ready ? 'Server is running successfully!' : 'Server starting or DB unavailable',
        timestamp: new Date().toISOString(),
        db: dbState,
    });
});

module.exports = router;
