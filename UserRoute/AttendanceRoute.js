const express = require('express');
const router = express.Router();
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');
const db = require('../models');
const { Op } = require('sequelize');
const AttendanceService = require('../UserServices/AttendanceService'); // ← MISSING IMPORT

// ================= Term Summary =================
router.get('/term-summary', verifyToken, async (req, res) => {
  try {
    const { term, academicYear } = req.query;
    if (!term || !academicYear) {
      return res.status(400).json({ success: false, message: 'term and academicYear are required' });
    }

    const classes = await db.Class.findAll();
    const summary = [];

    for (const cls of classes) {
      const attendanceRecords = await db.Attendance.findAll({
        where: { classId: cls.id, term, academicYear },
        attributes: ['status']
      });

      const present = attendanceRecords.filter(a => a.status === 'present').length;
      const absent  = attendanceRecords.filter(a => a.status === 'absent').length;
      const late    = attendanceRecords.filter(a => a.status === 'late').length;
      const excused = attendanceRecords.filter(a => a.status === 'excused').length;
      const total   = attendanceRecords.length;

      if (total > 0) {
        summary.push({
          className: cls.className,
          present,
          absent,
          late,
          excused,
          total,
          attendanceRate: total > 0 ? Math.round((present + late) / total * 100) : 0
        });
      }
    }

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Term summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================= My Class (teacher) =================
router.get('/my-class', verifyToken, async (req, res) => {
  // … your existing implementation (unchanged)
});

// ================= Attendance CRUD =================
router.post('/', verifyToken, role('admin', 'teacher'), async (req, res, next) => {
  try {
    const result = await AttendanceService.markAttendance(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.get('/class/:classId/date/:date', verifyToken, async (req, res, next) => {
  try {
    const result = await AttendanceService.getAttendanceByClassAndDate(req.params.classId, req.params.date);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.get('/student/:studentId', verifyToken, async (req, res, next) => {
  try {
    const result = await AttendanceService.getStudentAttendanceHistory(
      req.params.studentId,
      req.query.startDate,
      req.query.endDate,
      req.query.limit
    );
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.get('/class/:classId/summary', verifyToken, async (req, res, next) => {
  try {
    const result = await AttendanceService.getClassAttendanceSummary(
      req.params.classId,
      req.query.startDate,
      req.query.endDate
    );
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.get('/class/:classId/top', verifyToken, async (req, res, next) => {
  try {
    const result = await AttendanceService.getTopAttendingStudents(
      req.params.classId,
      req.query.limit,
      req.query.startDate,
      req.query.endDate
    );
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.get('/class/:classId/trends', verifyToken, async (req, res, next) => {
  try {
    const result = await AttendanceService.getAttendanceTrends(
      req.params.classId,
      req.query.weeks
    );
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.get('/class/:classId/weekly', verifyToken, role('admin', 'teacher'), async (req, res, next) => {
  try {
    const result = await AttendanceService.getWeeklyAttendanceReport(
      req.params.classId,
      req.query.weekStart
    );
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.get('/daily/:date', verifyToken, role('admin', 'teacher'), async (req, res) => {
  res.json({ success: true, data: {} });
});

module.exports = router;