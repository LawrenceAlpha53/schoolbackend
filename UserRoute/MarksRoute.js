// UserRoute/MarksRoute.js - COMPLETE FIXED
const express = require('express');
const router = express.Router();
const MarksController = require('../UserControllers/MarksController');
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');

// ================= GET ALL MARKS (Admin/Secretary) =================
router.get('/', verifyToken, MarksController.getAllMarks);

// ================= GET MARKS FOR CURRENT TEACHER =================
router.get('/my-marks', verifyToken, role('teacher'), MarksController.getMyMarks);

// ================= GET MARKS BY TEACHER ID =================
router.get('/teacher/:teacherId', verifyToken, MarksController.getTeacherMarks);

// ================= GET MARKS BY STUDENT ID =================
router.get('/student/:studentId', verifyToken, MarksController.getStudentMarks);

// ================= CREATE SINGLE MARK =================
router.post('/', verifyToken, role('teacher', 'admin'), MarksController.createMark);

// ================= BULK CREATE MARKS =================
router.post('/bulk', verifyToken, role('teacher', 'admin'), MarksController.bulkCreateMarks);

// ================= UPDATE MARK =================
router.put('/:id', verifyToken, role('teacher', 'admin'), MarksController.updateMark);

// ================= DELETE MARK =================
router.delete('/:id', verifyToken, role('admin'), MarksController.deleteMark);

// ================= SUBMIT MARKS (Lock) =================
router.post('/submit/:classId', verifyToken, role('teacher', 'admin'), MarksController.submitMarks);

// ================= MARK STUDENT ABSENT =================
router.post('/absent', verifyToken, role('teacher', 'admin'), MarksController.markAbsent);

module.exports = router;