const express = require('express');
const router = express.Router();
const verifyToken = require('../Middlewares/AuthMiddleware');
const AttendanceController = require('../UserControllers/AttendanceController');

router.post('/', verifyToken, AttendanceController.markAttendance);
router.get('/class/:classId/date/:date', verifyToken, AttendanceController.getAttendanceByClassAndDate);
router.get('/student/:studentId', verifyToken, AttendanceController.getStudentAttendanceHistory);

module.exports = router;