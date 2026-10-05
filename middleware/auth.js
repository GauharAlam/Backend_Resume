const { clerkMiddleware, getAuth, clerkClient } = require('@clerk/express');
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
        // Try to fetch real profile from Clerk to avoid placeholder PII
        let clerkName = 'Clerk User';
        let clerkEmail = `${userId}@placeholder.clerk.com`;
        let avatarUrl = undefined;
        try {
          if (clerkClient && clerkClient.users && typeof clerkClient.users.getUser === 'function') {
            const clerkUser = await clerkClient.users.getUser(userId);
            clerkName = clerkUser.firstName || clerkUser.username || clerkName;
            if (clerkUser.lastName) clerkName = `${clerkName} ${clerkUser.lastName}`.trim();
            const primaryEmail = clerkUser.emailAddresses?.find(e => e.id === clerkUser.primaryEmailAddressId) || clerkUser.emailAddresses?.[0];
            if (primaryEmail?.emailAddress) clerkEmail = primaryEmail.emailAddress;
            avatarUrl = clerkUser.imageUrl || undefined;
          }
        } catch (fetchErr) {
          console.warn('Could not fetch Clerk user details, using placeholder:', fetchErr.message);
        }
        user = await User.create({
          clerkId: userId,
          name: clerkName,
          email: clerkEmail,
          ...(avatarUrl ? { avatarUrl } : {}),
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
