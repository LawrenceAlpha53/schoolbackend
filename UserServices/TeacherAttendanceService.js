const db = require('../models');
const { Op } = require('sequelize');

class TeacherAttendanceService {

  // ================= CREATE ATTENDANCE =================
  async createAttendance(data) {
    try {
      const now = new Date();
      const ugandaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // UTC+3
      const dateStr = ugandaTime.toISOString().split('T')[0];

      // Check if attendance already exists for this teacher today
      const existing = await db.TeacherAttendance.findOne({
        where: {
          teacherId: data.teacherId,
          date: dateStr
        }
      });

      if (existing && (existing.status === 'signed_in' || existing.status === 'present')) {
        throw new Error('Attendance already recorded for today');
      }

      const attendance = await db.TeacherAttendance.create({
        ...data,
        date: dateStr
      });
      return attendance;
    } catch (error) {
      throw error;
    }
  }

  // ================= GET ATTENDANCE BY DATE =================
  async getAttendanceByDate(date, teacherId = null) {
    try {
      const dateStr = date || new Date().toISOString().split('T')[0];
      const where = { date: dateStr };
      if (teacherId) {
        where.teacherId = parseInt(teacherId);
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
      console.error('getAttendanceByDate error:', error);
      throw error;
    }
  }

  // ================= GET ATTENDANCE BY TEACHER (HISTORY) =================
  async getAttendanceByTeacher(teacherId, startDate, endDate) {
    try {
      const where = { teacherId: parseInt(teacherId) };
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
    const attendance = await db.TeacherAttendance.findByPk(id);
    if (!attendance) throw new Error('Attendance not found');

    if (data.checkOutTime && attendance.checkInTime) {
      const checkIn = new Date(`${attendance.date}T${attendance.checkInTime}`);
      let checkOut = new Date(`${attendance.date}T${data.checkOutTime}`);
      if (checkOut < checkIn) {
        checkOut.setDate(checkOut.getDate() + 1);
      }

      const diffMs = checkOut - checkIn;
      const hours = diffMs / (1000 * 60 * 60);
      data.hoursWorked = parseFloat(hours.toFixed(2));
      data.status = 'signed_Out';
    }
    await attendance.update(data);
    return attendance;
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
        } else if (record.checkInTime && record.checkOutTime) {
          const inTime = new Date(`1970-01-01T${record.checkInTime}`);
          const outTime = new Date(`1970-01-01T${record.checkOutTime}`);
          const diff = (outTime - inTime) / 3600000;
          if (diff > 0 && diff < 24) totalHours += diff;
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

  // ================= ADD ALLOWANCE – FIXED =================
  async addAllowance(data) {
    try {
      const { teacherId, amount, date } = data;
      const now = new Date();
      const ugandaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
      const dateStr = date || ugandaTime.toISOString().split('T')[0];

      // 1. Find existing attendance record for this teacher + date
      const existing = await db.TeacherAttendance.findOne({
        where: { teacherId: parseInt(teacherId), date: dateStr }
      });

      // 2. If a record already has an allowance, prevent duplicate
      if (existing && parseFloat(existing.allowance) > 0) {
        throw new Error('Allowance already recorded for this teacher on this date. Please update manually.');
      }

      if (existing) {
        // Update the existing record
        existing.allowance = parseFloat(amount);
        existing.notes = existing.notes
          ? `${existing.notes} | Allowance: UGX ${parseFloat(amount).toLocaleString()}`
          : `Allowance: UGX ${parseFloat(amount).toLocaleString()}`;
        await existing.save();
        return existing;
      }

      // 3. No record exists – create a new one with status 'allowance'
      const newRecord = await db.TeacherAttendance.create({
        teacherId: parseInt(teacherId),
        date: dateStr,
        status: 'allowance',
        allowance: parseFloat(amount),
        notes: `Allowance: UGX ${parseFloat(amount).toLocaleString()}`
      });

      return newRecord;
    } catch (error) {
      throw error;
    }
  }

  // ================= GET ALLOWANCES =================
  async getAllowances(teacherId = null, startDate = null, endDate = null) {
    try {
      const where = { status: 'allowance' };
      if (teacherId) where.teacherId = parseInt(teacherId);
      if (startDate && endDate) {
        where.date = { [Op.between]: [startDate, endDate] };
      }

      const allowances = await db.TeacherAttendance.findAll({
        where,
        include: [{ model: db.Teacher, as: 'teacher' }],
        order: [['createdAt', 'DESC']]
      });

      return allowances;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new TeacherAttendanceService();