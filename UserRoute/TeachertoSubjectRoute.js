const express = require('express');
const router = express.Router();

const TeacherController = require('../UserControllers/TeacherToSubjectController');
const verifyToken = require('../Middlewares/AuthMiddleware');

router.post('/', verifyToken, TeacherController.createTeacher);
router.get('/', verifyToken, TeacherController.getTeachers);

module.exports = router;