/**
 * Auth Controller - Request handlers for authentication
 */
const { asyncHandler } = require('../utils');
const { ApiResponse } = require('../utils');
const authService = require('../services/auth.service');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
        return res.status(400).json(
            ApiResponse.error('Please provide name, email, and password.', 400)
        );
    }

    if (password.length < 6) {
        return res.status(400).json(
            ApiResponse.error('Password must be at least 6 characters.', 400)
        );
    }

    const result = await authService.registerUser({ name, email, password });

    res.status(201).json(
        ApiResponse.success(
            {
                token: result.token,
                user: result.user,
            },
            'User registered successfully!'
        )
    );
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json(
            ApiResponse.error('Please provide email and password.', 400)
        );
    }

    const result = await authService.loginUser({ email, password });

    res.status(200).json(
        ApiResponse.success(
            {
                token: result.token,
                user: result.user,
            },
            'Login successful!'
        )
    );
});

/**
 * @desc    Get current user info
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
    const user = await authService.getUserById(req.user.userId);

    res.status(200).json(
        ApiResponse.success({ user })
    );
});

/**
 * @desc    Verify JWT token
 * @route   POST /api/auth/verify-token
 * @access  Public
 */
const verifyToken = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json(
            ApiResponse.error('Token required.', 400)
        );
    }

    const result = authService.verifyToken(token);

    res.status(200).json(
        ApiResponse.success(result)
    );
});

module.exports = {
    register,
    login,
    getMe,
    verifyToken,
};
