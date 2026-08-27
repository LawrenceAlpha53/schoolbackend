// UserRoute/AuthRoute.js - Add this debug route
const express = require('express');
const router = express.Router();

const UserController = require('../UserControllers/Controller');
const auth = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');

// PUBLIC
router.post('/register', auth, role('admin'), UserController.register);
router.post('/login', UserController.login);

// ================= DEBUG ROUTE =================
// Add this to check what role is in your token
router.get('/debug-token', auth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    message: 'Token debug info - check the role field'
  });
});

// PROTECTED TEST
router.get('/dashboard', auth, role('admin'), (req, res) => {
  res.json({
    message: "Dashboard Access Granted",
    user: req.user
  });
});

module.exports = router;