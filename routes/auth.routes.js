/**
 * Auth Routes
 * Handles authentication endpoints
 */
const express = require('express');
const router = express.Router();

const authController = require('../src/controllers/auth.controller');
const { validateRegister, validateLogin, validateToken } = require('../src/validators/auth.validator');
const { verifyToken } = require('../middleware/auth');

// POST /api/auth/register - Register a new user
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login - Login user
router.post('/login', validateLogin, authController.login);

// GET /api/auth/me - Get current user info (protected)
router.get('/me', verifyToken, authController.getMe);

// POST /api/auth/verify-token - Verify JWT token
router.post('/verify-token', validateToken, authController.verifyToken);

module.exports = router;
