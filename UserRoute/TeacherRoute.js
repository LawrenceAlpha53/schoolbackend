console.log('✅ TeacherRoute file loaded');
const express = require('express');
const router = express.Router();
const TeacherController = require('../UserControllers/teacherController');
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware'); // ✅ ADDED
const db = require('../models');

// ================= SPECIFIC ROUTES (must come before /:id) =================
router.get('/me', verifyToken, TeacherController.getCurrentTeacher);
router.get('/me/students', verifyToken, TeacherController.getMyStudents);
router.get('/me/classes', verifyToken, TeacherController.getMyClasses);
router.get('/me/subjects', verifyToken, TeacherController.getMySubjects);

// ================= ROUTES FOR A SPECIFIC TEACHER ID =================
// These handle /teachers/48/classes and /teachers/48/students
router.get('/:id/classes', verifyToken, TeacherController.getTeacherClasses);
router.get('/:id/students', verifyToken, TeacherController.getTeacherStudents);

// ================= CRUD ROUTES =================
router.post('/', verifyToken, TeacherController.createTeacher);
router.get('/', verifyToken, TeacherController.getTeachers);
router.get('/:id', verifyToken, TeacherController.getTeacher);
router.put('/:id', verifyToken, TeacherController.updateTeacher);
router.delete('/:id', verifyToken, TeacherController.deleteTeacher);
router.put('/:id/assign-class-teacher', verifyToken, role('admin'), TeacherController.assignClassTeacher);
router.get('/class-teacher/:classId', verifyToken, TeacherController.getClassTeacher);

// ================= FORCE DELETE =================
router.delete('/:id/force', verifyToken, async (req, res) => {
  try {
    const teacherId = req.params.id;
    console.log(`🔍 Force deleting teacher ${teacherId}...`);

    await db.TeacherAttendance.destroy({ where: { teacherId } }).catch(() => {});
    await db.TeacherAllowance.destroy({ where: { teacherId } }).catch(() => {});
    await db.TeacherAdvance.destroy({ where: { teacherId } }).catch(() => {});
    await db.TeacherLoan.destroy({ where: { teacherId } }).catch(() => {});
    await db.TeacherDocument.destroy({ where: { teacherId } }).catch(() => {});
    await db.TeacherLeave.destroy({ where: { teacherId } }).catch(() => {});
    await db.Mark.destroy({ where: { teacherId } }).catch(() => {});
    await db.Timetable.destroy({ where: { teacherId } }).catch(() => {});
    if (db.TeacherSubject) {
      await db.TeacherSubject.destroy({ where: { teacherId } }).catch(() => {});
    }

    const teacher = await db.Teacher.findByPk(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    await teacher.destroy();
    res.json({ success: true, message: 'Teacher and all related records deleted successfully' });
  } catch (error) {
    console.error('❌ Force delete teacher error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================= DOCUMENTS, ADVANCES, ALLOWANCES, LOANS =================
router.get('/:id/documents', verifyToken, async (req, res) => {
  try {
    const docs = await db.TeacherDocument.findAll({
      where: { teacherId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/advances', verifyToken, async (req, res) => {
  try {
    const advances = await db.TeacherAdvance.findAll({
      where: { teacherId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: advances });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/allowances', verifyToken, async (req, res) => {
  try {
    const allowances = await db.TeacherAllowance.findAll({
      where: { teacherId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: allowances });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/loans', verifyToken, async (req, res) => {
  try {
    const loans = await db.TeacherLoan.findAll({
      where: { teacherId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: loans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

console.log('✅ TeacherRoute exported');
module.exports = router;