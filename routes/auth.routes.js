/**
 * Auth Routes
 * Handles authentication endpoints
 */
const express = require('express');
const router = express.Router();

const authController = require('../src/controllers/auth.controller');
const { validateRegister, validateLogin, validateToken } = require('../src/validators/auth.validator');
const { verifyToken } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

const authAttemptLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'auth-attempt',
});

const tokenVerifyLimiter = createRateLimiter({
    windowMs: 5 * 60 * 1000,
    maxRequests: 30,
    keyPrefix: 'verify-token',
});

// POST /api/auth/register - Register a new user
router.post('/register', authAttemptLimiter, validateRegister, authController.register);

// POST /api/auth/login - Login user
router.post('/login', authAttemptLimiter, validateLogin, authController.login);

// GET /api/auth/me - Get current user info (protected)
router.get('/me', verifyToken, authController.getMe);

// POST /api/auth/verify-token - Verify JWT token
router.post('/verify-token', tokenVerifyLimiter, validateToken, authController.verifyToken);

module.exports = router;
