// UserRoute/TeacherAttendanceRoute.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');
const TeacherAttendanceController = require('../UserControllers/TeacherAttendanceController');

// ================= ATTENDANCE ROUTES =================
// Mark attendance (secretary/admin)
router.post('/', verifyToken, role('admin', 'secretary'), TeacherAttendanceController.markAttendance);

// Get attendance by date (all)
router.get('/', verifyToken, TeacherAttendanceController.getAttendanceByDate);

// Get attendance by teacher
router.get('/teacher/:teacherId', verifyToken, TeacherAttendanceController.getAttendanceByTeacher);

// Update attendance
router.put('/:id', verifyToken, role('admin', 'secretary'), TeacherAttendanceController.updateAttendance);

// Get stats
router.get('/stats', verifyToken, role('admin', 'secretary'), TeacherAttendanceController.getStats);

// ================= ALLOWANCE ROUTES =================
// Add allowance
router.post('/allowances', verifyToken, role('admin', 'secretary'), TeacherAttendanceController.addAllowance);

// Get allowances
router.get('/allowances', verifyToken, role('admin', 'secretary'), TeacherAttendanceController.getAllowances);

module.exports = router;