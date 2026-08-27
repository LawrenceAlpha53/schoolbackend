const TeacherAttendanceService = require('../UserServices/TeacherAttendanceService');
const db = require('../models');

const TeacherAttendanceController = {

  // ================= MARK ATTENDANCE =================
  async markAttendance(req, res, next) {
    try {
      const data = { ...req.body }; // REMOVE recordedBy
      const attendance = await TeacherAttendanceService.createAttendance(data);
      res.status(201).json({
        success: true,
        data: attendance,
        message: 'Attendance recorded successfully'
      });
    } catch (error) {
      console.error('Mark attendance error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ================= GET ATTENDANCE BY DATE =================
  async getAttendanceByDate(req, res, next) {
    try {
      const { date, teacherId } = req.query;
      const attendance = await TeacherAttendanceService.getAttendanceByDate(
        date || new Date().toISOString().split('T')[0],
        teacherId
      );
      res.json({
        success: true,
        data: attendance,
        count: attendance.length
      });
    } catch (error) {
      console.error('Get attendance error:', error);
      next(error);
    }
  },

  // ================= GET ATTENDANCE BY TEACHER (History) =================
  async getAttendanceByTeacher(req, res, next) {
    try {
      const { teacherId } = req.params;
      const { startDate, endDate } = req.query;
      const attendance = await TeacherAttendanceService.getAttendanceByTeacher(
        parseInt(teacherId),
        startDate,
        endDate
      );
      res.json({
        success: true,
        data: attendance,
        count: attendance.length
      });
    } catch (error) {
      console.error('Get teacher attendance error:', error);
      next(error);
    }
  },

  // ================= UPDATE ATTENDANCE =================
  async updateAttendance(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;
      const attendance = await TeacherAttendanceService.updateAttendance(id, data);
      res.json({
        success: true,
        data: attendance,
        message: 'Attendance updated successfully'
      });
    } catch (error) {
      console.error('Update attendance error:', error);
      next(error);
    }
  },

  // ================= GET STATS =================
  async getStats(req, res, next) {
    try {
      const { date } = req.query;
      const stats = await TeacherAttendanceService.getStats(
        date || new Date().toISOString().split('T')[0]
      );
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      next(error);
    }
  },

  // ================= ADD ALLOWANCE – FIXED =================
  async addAllowance(req, res, next) {
    try {
      const { teacherId, amount, date } = req.body;

      const allowance = await TeacherAttendanceService.addAllowance({
        teacherId: parseInt(teacherId),
        amount: parseFloat(amount),
        date: date || new Date().toISOString().split('T')[0]
      });

      res.status(201).json({
        success: true,
        data: allowance,
        message: 'Allowance recorded successfully'
      });
    } catch (error) {
      console.error('Add allowance error:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ================= GET ALLOWANCES (unchanged) =================
  async getAllowances(req, res, next) {
    try {
      const { teacherId, startDate, endDate } = req.query;
      const allowances = await TeacherAttendanceService.getAllowances(
        teacherId ? parseInt(teacherId) : null,
        startDate,
        endDate
      );
      res.json({
        success: true,
        data: allowances,
        count: allowances.length
      });
    } catch (error) {
      console.error('Get allowances error:', error);
      next(error);
    }
  }
};

module.exports = TeacherAttendanceController;