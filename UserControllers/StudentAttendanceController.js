const AttendanceService = require('../UserServices/AttendanceService');

const AttendanceController = {
  async markAttendance(req, res, next) {
    try {
      const result = await AttendanceService.markAttendance(req.body);
      res.status(201).json({ success: true, message: `Marked ${result.success}`, data: result });
    } catch (error) {
      console.error('Mark error:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getAttendanceByClassAndDate(req, res, next) {
    try {
      const { classId, date } = req.params;
      const result = await AttendanceService.getAttendanceByClassAndDate(classId, date);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Get error:', error.message);
      res.json({ success: true, data: { records: [], stats: { total: 0, present: 0, absent: 0, late: 0, attendanceRate: 0 } } });
    }
  },

  async getStudentAttendanceHistory(req, res, next) {
    try {
      const { studentId } = req.params;
      const { startDate, endDate, limit } = req.query;
      const result = await AttendanceService.getStudentAttendanceHistory(studentId, startDate, endDate, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = AttendanceController;