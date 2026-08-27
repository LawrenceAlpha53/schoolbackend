const express = require('express');
const router = express.Router();

const ReportController = require('../UserControllers/ReportController');

// middleware
const auth = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');

// 📊 DASHBOARD (ADMIN ONLY)
router.get(
  '/dashboard',
  auth,
  role('admin'),
  ReportController.getDashboardStats
);

// 💰 FEES REPORT (ADMIN + TEACHER)
router.get(
  '/fees',
  auth,
  role('admin', 'teacher'),
  ReportController.getFeesReport
);

// 📚 MARKS REPORT (ADMIN + TEACHER)
router.get(
  '/marks',
  auth,
  role('teacher', 'admin'),
  ReportController.getMarksReport
);

// 👨‍🎓 STUDENTS REPORT (ADMIN + TEACHER)
router.get(
  '/students',
  auth,
  role('admin', 'teacher'),
  ReportController.getStudentReport
);


// router.get('/print', auth, role('admin', 'teacher'), ReportController.getPrintableReportCard);

module.exports = router;