/**
 * Auth Service - Business logic for authentication
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const ApiError = require('../utils/ApiError');
const { getJwtSecret } = require('../utils/env');

const JWT_SECRET = getJwtSecret();
const JWT_EXPIRES_IN = '7d';

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        { userId: user._id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

/**
 * Register a new user
 * @param {Object} userData - { name, email, password }
 * @returns {Object} { user, token }
 */
const registerUser = async ({ name, email, password }) => {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw ApiError.conflict('User with this email already exists.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
        name,
        email,
        password: hashedPassword,
        createdAt: new Date(),
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser);

    return {
        user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
        },
        token,
    };
};

/**
 * Login user
 * @param {Object} credentials - { email, password }
 * @returns {Object} { user, token }
 */
const loginUser = async ({ email, password }) => {
    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw ApiError.unauthorized('Invalid credentials. User not found.');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw ApiError.unauthorized('Invalid credentials. Password does not match.');
    }

    // Generate token
    const token = generateToken(user);

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
        },
        token,
    };
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Object} User object
 */
const getUserById = async (userId) => {
    const user = await User.findById(userId).select('-password');

    if (!user) {
        throw ApiError.notFound('User not found.');
    }

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
    };
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return {
            valid: true,
            user: {
                id: decoded.userId,
                email: decoded.email,
                name: decoded.name,
            },
        };
    } catch (error) {
        throw ApiError.unauthorized('Invalid or expired token.');
    }
};

module.exports = {
    generateToken,
    registerUser,
    loginUser,
    getUserById,
    verifyToken,
};
