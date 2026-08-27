const express = require('express');
const router = express.Router();
const ClassTeacherController = require('../UserControllers/ClassTeacherController');
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');

router.use(verifyToken);

// Class teacher dashboard
router.get('/dashboard', role('teacher'), ClassTeacherController.getDashboard);

// Get student details for promotion
router.get('/student/:studentId', role('teacher'), ClassTeacherController.getStudentDetails);

// Finalize promotion decisions
router.post('/finalize-promotion/:classId', role('teacher'), ClassTeacherController.finalizePromotion);

module.exports = router;