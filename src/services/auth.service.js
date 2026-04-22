/**
 * Auth Service - Business logic for authentication
 */
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const ApiError = require('../utils/ApiError');
const { getGoogleClientId, getJwtSecret } = require('../utils/env');

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

const formatUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
});

const getGoogleAuthConfig = () => {
    const clientId = getGoogleClientId();

    if (!clientId) {
        return {
            clientId: '',
            googleClient: null,
        };
    }

    return {
        clientId,
        googleClient: new OAuth2Client(clientId),
    };
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
        user: formatUser(newUser),
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

    if (!user.password) {
        throw ApiError.unauthorized('This account uses Google sign-in. Please continue with Google.');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw ApiError.unauthorized('Invalid credentials. Password does not match.');
    }

    // Generate token
    const token = generateToken(user);

    return {
        user: formatUser(user),
        token,
    };
};

/**
 * Login or register user with Google
 * @param {Object} payload - { credential }
 * @returns {Object} { user, token }
 */
const loginWithGoogle = async ({ credential }) => {
    const { clientId, googleClient } = getGoogleAuthConfig();

    if (!clientId || !googleClient) {
        throw ApiError.internal('Google sign-in is not configured on the server.');
    }

    let googlePayload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: clientId,
        });
        googlePayload = ticket.getPayload();
    } catch (error) {
        throw ApiError.unauthorized('Invalid Google sign-in token.');
    }

    if (!googlePayload?.sub || !googlePayload?.email || !googlePayload.email_verified) {
        throw ApiError.unauthorized('Google account email could not be verified.');
    }

    const email = googlePayload.email.toLowerCase();
    const name = googlePayload.name || email.split('@')[0];
    const avatarUrl = googlePayload.picture || '';

    let user = await User.findOne({
        $or: [{ googleId: googlePayload.sub }, { email }],
    });

    if (!user) {
        user = new User({
            name,
            email,
            googleId: googlePayload.sub,
            avatarUrl,
            createdAt: new Date(),
        });
    } else {
        user.googleId = googlePayload.sub;
        if (avatarUrl) {
            user.avatarUrl = avatarUrl;
        }
        if (!user.name && name) {
            user.name = name;
        }
    }

    await user.save();

    return {
        user: formatUser(user),
        token: generateToken(user),
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
        ...formatUser(user),
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
    loginWithGoogle,
    getUserById,
    verifyToken,
};
