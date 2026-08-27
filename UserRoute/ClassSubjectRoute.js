// UserRoute/ClassSubjectRoute.js
const express = require('express');
const router = express.Router();
const ClassSubjectController = require('../UserControllers/ClassSubjectController');

// Assign subject to class
router.post('/assign', ClassSubjectController.assignSubjectToClass);

// Remove subject from class
router.delete('/remove', ClassSubjectController.removeSubjectFromClass);

// Get subjects by class
router.get('/class/:classId', ClassSubjectController.getSubjectsByClass);

// Get classes by subject
router.get('/subject/:subjectId', ClassSubjectController.getClassesBySubject);

module.exports = router;