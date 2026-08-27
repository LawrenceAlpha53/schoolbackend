const express = require('express');
const router = express.Router();

const SubjectController = require('../UserControllers/SubjectController');
const verifyToken = require('../Middlewares/AuthMiddleware');

// ---------- CRUD ----------
router.post('/', verifyToken, SubjectController.createSubject);
router.get('/', verifyToken, SubjectController.getSubjects);
router.get('/:id', verifyToken, SubjectController.getSubject);
router.put('/:id', verifyToken, SubjectController.updateSubject);
router.delete('/:id', verifyToken, SubjectController.deleteSubject);

// ---------- TEACHER ASSIGNMENT ----------
router.post('/:subjectId/teachers/:teacherId', verifyToken, SubjectController.assignTeacher);
router.delete('/:subjectId/teachers/:teacherId', verifyToken, SubjectController.removeTeacher);

// ---------- CLASS ASSIGNMENT ----------
router.post('/:subjectId/class/:classId', verifyToken, SubjectController.assignClass);
router.delete('/:subjectId/class', verifyToken, SubjectController.removeClass);

module.exports = router;