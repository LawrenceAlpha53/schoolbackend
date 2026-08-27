// Middlewares/AuthMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../models');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log('🔍 Auth Middleware - Headers:', req.headers);
    console.log('🔍 Auth Middleware - Authorization:', authHeader);

    if (!authHeader) {
      console.log('❌ No authorization header');
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Invalid token format');
      return res.status(401).json({
        success: false,
        message: "Invalid token format. Use Bearer <token>"
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔍 Token received:', token.substring(0, 30) + '...');

    if (!token) {
      console.log('❌ No token in authorization header');
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");
    console.log('✅ Token verified for user:', decoded.email || decoded.id);
    console.log('✅ Decoded payload:', decoded);

    // ---- BLOCK CHECK ----
    // ✅ Only ONE declaration of `user`
    const user = await db.Users.findByPk(decoded.id);
    if (user && user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Please contact the system ADMINISTRATOR(Director) or the DEVELOPER(0787332384).",
      });
    }

    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role?.toLowerCase()
    };

    // ---- TEACHER FETCH ----
    if (req.user.role === 'teacher') {
      try {
        const teacher = await db.Teacher.findOne({ where: { userId: req.user.id } });
        if (teacher) {
          req.teacher = teacher;
          req.teacherClassId = teacher.classId;
          req.teacherId = teacher.id;
          console.log(`✅ Teacher attached: classId=${teacher.classId}, teacherId=${teacher.id}`);
        } else {
          console.warn(`⚠️ No Teacher record found for userId: ${req.user.id}`);
        }
      } catch (err) {
        console.error('❌ Error fetching teacher:', err);
        // proceed anyway
      }
    }

    next();

  } catch (error) {
    console.error('❌ Auth Middleware Error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again."
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again."
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed: " + error.message
    });
  }
};