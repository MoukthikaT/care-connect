import { ROLES } from '../config/constants.js';

export const checkOwnership = (resourceUserIdGetter, ...bypassingRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Platform Admin & Ops Manager can bypass default ownership restrictions when allowed
    if (bypassingRoles.includes(req.user.role) || req.user.role === ROLES.ADMIN) {
      return next();
    }

    const resourceUserId = resourceUserIdGetter(req);
    if (!resourceUserId) {
      return res.status(400).json({ success: false, message: 'Invalid resource owner context.' });
    }

    if (resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this resource.'
      });
    }

    next();
  };
};
