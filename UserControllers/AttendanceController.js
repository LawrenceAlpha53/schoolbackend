const AttendanceService = require('../UserServices/AttendanceService');
const db = require('../models');

// Helper to notify all admins
const notifyAdmins = async (title, message, category, metadata = {}) => {
  try {
    const admins = await db.Users.findAll({ where: { role: 'admin' } });
    for (const admin of admins) {
      await db.Notification.create({
        userId: admin.id,
        title,
        message,
        type: 'info',
        category,
        priority: 'medium',
        sender: 'System',
        actionLink: '/admin',
        actionLabel: 'View Dashboard',
        isRead: false,
        metadata
      });
    }
  } catch (e) {
    console.error('Notification error:', e.message);
  }
};

const AttendanceController = {

  async markAttendance(req, res, next) {
    try {
      const result = await AttendanceService.markAttendance(req.body);
      
      // Notify admins
      if (result.success > 0) {
        const classInfo = await db.Class.findByPk(req.body.classId);
        await notifyAdmins(
          '📋 Attendance Marked',
          `Attendance recorded for ${classInfo?.className || 'a class'} on ${req.body.date || 'today'}: ${result.success} marked`,
          'attendance',
          { classId: req.body.classId, date: req.body.date, count: result.success }
        );
      }
      
      res.status(201).json({
        success: true,
        message: `Attendance processed: ${result.success} marked, ${result.failed} failed`,
        data: result
      });
    } catch (error) { next(error); }
  },

  async getAttendanceByClassAndDate(req, res, next) {
    try {
      let classId = req.params.classId;
      if (req.user.role === 'teacher' && req.teacherClassId) classId = req.teacherClassId;
      const result = await AttendanceService.getAttendanceByClassAndDate(classId, req.params.date);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  async getStudentAttendanceHistory(req, res, next) {
    try {
      const { studentId } = req.params;
      if (req.user.role === 'teacher' && req.teacherClassId) {
        const student = await db.Student.findOne({ where: { id: studentId, classId: req.teacherClassId } });
        if (!student) return res.status(403).json({ success: false, message: 'Not allowed' });
      }
      const { startDate, endDate, limit } = req.query;
      const result = await AttendanceService.getStudentAttendanceHistory(studentId, startDate, endDate, limit);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  async getClassAttendanceSummary(req, res, next) {
    try {
      let classId = req.params.classId;
      if (req.user.role === 'teacher' && req.teacherClassId) classId = req.teacherClassId;
      const { startDate, endDate } = req.query;
      const result = await AttendanceService.getClassAttendanceSummary(classId, startDate, endDate);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  async getTopAttendingStudents(req, res, next) {
    try {
      let classId = req.params.classId;
      if (req.user.role === 'teacher' && req.teacherClassId) classId = req.teacherClassId;
      const { limit = 10, startDate, endDate } = req.query;
      const topStudents = await AttendanceService.getTopAttendingStudents(classId, parseInt(limit), startDate, endDate);
      res.json({ success: true, data: topStudents });
    } catch (error) { next(error); }
  },

  async getAttendanceTrends(req, res, next) {
    try {
      let classId = req.params.classId;
      if (req.user.role === 'teacher' && req.teacherClassId) classId = req.teacherClassId;
      const { weeks = 4 } = req.query;
      const trends = await AttendanceService.getAttendanceTrends(classId, parseInt(weeks));
      res.json({ success: true, data: trends });
    } catch (error) { next(error); }
  },

  async getWeeklyAttendanceReport(req, res, next) {
    try {
      let classId = req.params.classId;
      if (req.user.role === 'teacher' && req.teacherClassId) classId = req.teacherClassId;
      const { weekStart } = req.query;
      const report = await AttendanceService.getWeeklyAttendanceReport(classId, weekStart || new Date().toISOString().split('T')[0]);
      res.json({ success: true, data: report });
    } catch (error) { next(error); }
  },

  async getMyClassAttendance(req, res, next) {
    try {
      if (!req.teacherClassId) return res.status(400).json({ success: false, message: 'No class assigned' });
      const { date } = req.query;
      const result = await AttendanceService.getAttendanceByClassAndDate(req.teacherClassId, date || new Date().toISOString().split('T')[0]);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
};

module.exports = AttendanceController;