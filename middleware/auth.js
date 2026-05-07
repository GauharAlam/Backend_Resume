const { clerkMiddleware, getAuth } = require('@clerk/express');
const User = require('../models/User');

/**
 * Middleware to verify Clerk token and auto-provision user in DB
 */
const verifyToken = [
  clerkMiddleware(),
  async (req, res, next) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // Check if user exists in DB
      let user = await User.findOne({ clerkId: userId });
      
      if (!user) {
        user = await User.create({
          clerkId: userId,
          name: 'Clerk User', // Placeholder
          email: `${userId}@placeholder.clerk.com`, // Placeholder
        });
      }

      req.user = user;
      req.userId = user._id; // Use mongo _id for internal relations
      next();
    } catch (error) {
      console.error('Error in auth middleware:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
];

/**
 * Optional auth middleware
 */
const optionalAuth = async (req, res, next) => {
  next();
};

module.exports = {
  verifyToken,
  optionalAuth,
};
