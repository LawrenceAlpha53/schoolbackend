// UserServices/TeacherAttendanceService.js
const db = require('../models');
const { Op } = require('sequelize');

class TeacherAttendanceService {
  
  // ================= CREATE ATTENDANCE =================
  async createAttendance(data) {
    try {
      // Check if attendance already exists for this teacher today
      const existing = await db.TeacherAttendance.findOne({
        where: {
          teacherId: data.teacherId,
          date: data.date || new Date().toISOString().split('T')[0]
        }
      });

      if (existing) {
        throw new Error('Attendance already recorded for today');
      }

      const attendance = await db.TeacherAttendance.create(data);
      return attendance;
    } catch (error) {
      throw error;
    }
  }

  // ================= GET ATTENDANCE BY DATE =================
  async getAttendanceByDate(date, teacherId = null) {
    try {
      const where = { date: date || new Date().toISOString().split('T')[0] };
      if (teacherId) {
        where.teacherId = teacherId;
      }

      const attendance = await db.TeacherAttendance.findAll({
        where,
        include: [
          { model: db.Teacher, as: 'teacher' }
        ],
        order: [['createdAt', 'DESC']]
      });

      return attendance;
    } catch (error) {
      throw error;
    }
  }

  // ================= GET ATTENDANCE BY TEACHER =================
  async getAttendanceByTeacher(teacherId, startDate, endDate) {
    try {
      const where = { teacherId };
      if (startDate && endDate) {
        where.date = { [Op.between]: [startDate, endDate] };
      }

      const attendance = await db.TeacherAttendance.findAll({
        where,
        include: [
          { model: db.Teacher, as: 'teacher' }
        ],
        order: [['date', 'DESC']]
      });

      return attendance;
    } catch (error) {
      throw error;
    }
  }

  // ================= UPDATE ATTENDANCE =================
  async updateAttendance(id, data) {
    try {
      const attendance = await db.TeacherAttendance.findByPk(id);
      if (!attendance) {
        throw new Error('Attendance record not found');
      }

      // If signing out, calculate hours worked
      if (data.status === 'signed_out' || data.status === 'emergency_signed_out') {
        if (attendance.checkInTime && data.checkOutTime) {
          const inTime = new Date(`1970-01-01T${attendance.checkInTime}`);
          const outTime = new Date(`1970-01-01T${data.checkOutTime}`);
          const diffHours = (outTime - inTime) / (1000 * 60 * 60);
          if (diffHours > 0) {
            data.hoursWorked = Math.round(diffHours * 10) / 10;
          }
        }
      }

      await attendance.update(data);
      return attendance;
    } catch (error) {
      throw error;
    }
  }

  // ================= GET STATS =================
  async getStats(date) {
    try {
      const attendanceData = await this.getAttendanceByDate(date);
      const total = await db.Teacher.count();
      
      const signedIn = attendanceData.filter(a => a.status === 'signed_in' || a.status === 'present').length;
      const signedOut = attendanceData.filter(a => a.status === 'signed_out').length;
      const emergency = attendanceData.filter(a => a.status === 'emergency_signed_out').length;
      const absent = attendanceData.filter(a => a.status === 'absent').length;
      
      let totalHours = 0;
      attendanceData.forEach(record => {
        if (record.hoursWorked) {
          totalHours += parseFloat(record.hoursWorked);
        }
      });

      const totalAllowances = attendanceData.reduce((sum, a) => sum + parseFloat(a.allowance || 0), 0);

      return {
        totalTeachers: total,
        signedInToday: signedIn,
        signedOutToday: signedOut,
        emergencyToday: emergency,
        absentToday: absent,
        attendanceRate: total > 0 ? Math.round(((signedIn + signedOut) / total) * 100) : 0,
        totalAllowances,
        totalHoursWorked: Math.round(totalHours * 10) / 10
      };
    } catch (error) {
      throw error;
    }
  }

  // ================= ADD ALLOWANCE =================
  async addAllowance(data) {
    try {
      const allowance = await db.TeacherAllowance.create(data);
      return allowance;
    } catch (error) {
      throw error;
    }
  }

  // ================= GET ALLOWANCES =================
  async getAllowances(teacherId = null, startDate = null, endDate = null) {
    try {
      const where = {};
      if (teacherId) where.teacherId = teacherId;
      if (startDate && endDate) {
        where.date = { [Op.between]: [startDate, endDate] };
      }

      const allowances = await db.TeacherAllowance.findAll({
        where,
        include: [
          { model: db.Teacher, as: 'teacher' },
          { model: db.User, as: 'recorder' },
          { model: db.User, as: 'approver' }
        ],
        order: [['createdAt', 'DESC']]
      });

      return allowances;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new TeacherAttendanceService();