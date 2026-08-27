// Middlewares/RoleMiddleware.js - FIXED VERSION
module.exports = (...allowedRoles) => {  // ← ADD SPREAD OPERATOR
  return (req, res, next) => {
    try {
      // Check if user exists (should be set by auth middleware)
      if (!req.user) {
        console.log('❌ Role check failed - No user in request');
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      // Get user role
      const userRole = req.user.role?.toLowerCase();
      
      // allowedRoles is now an array from the spread operator
      const allowed = allowedRoles.map(r => r.toLowerCase());

      console.log(`🔍 Role check - User role: ${userRole}, Allowed: ${allowed.join(', ')}`);

      // Check if user role is allowed
      if (!userRole || !allowed.includes(userRole)) {
        console.log(`❌ Role check failed - ${userRole} not in ${allowed.join(', ')}`);
        return res.status(403).json({
          success: false,
          message: `Access denied. Only ${allowedRoles.join(' and ')} can perform this action. Your role: ${userRole}`
        });
      }

      console.log(`✅ Role check passed - ${userRole} allowed`);
      next();

    } catch (error) {
      console.error('❌ Role Middleware Error:', error);
      return res.status(500).json({
        success: false,
        message: "Role verification failed",
        error: error.message
      });
    }
  };
};