const db = require('../models');
const { Op } = require('sequelize');
const Attendance = db.Attendance;
const Student = db.Student;
const Class = db.Class;
const SettingsService = require('../UserServices/SettingsService');

const AttendanceService = {
  // ================= MARK ATTENDANCE =================



  
  async markAttendance(data) {
    const { classId, date, term, academicYear, records, notes } = data;
    
    const classExists = await Class.findByPk(classId);
    if (!classExists) {
      throw new Error('Class not found');
    }

    const results = [];
    const errors = [];

    for (const record of records) {
      try {
        const { studentId, status, checkInTime, checkOutTime, remarks } = record;

        const student = await Student.findOne({
          where: { id: studentId, classId }
        });
        if (!student) {
          errors.push({ studentId, error: 'Student not found or not in this class' });
          continue;
        }

        // Check for existing attendance
        const existing = await Attendance.findOne({
          where: { studentId, date, classId }
        });

        let attendance;
        if (existing) {
          await existing.update({
            status,
            checkInTime: checkInTime || existing.checkInTime,
            checkOutTime: checkOutTime || existing.checkOutTime,
            remarks: remarks || existing.remarks,
            notes: notes || existing.notes
          });
          attendance = existing;
        } else {
          attendance = await Attendance.create({
            studentId,
            classId,
            date,
            status,
            checkInTime: checkInTime || null,
            checkOutTime: checkOutTime || null,
            remarks: remarks || null,
            notes: notes || null,
            term,
            academicYear
          });
        }

        results.push(attendance);
      } catch (error) {
        errors.push({
          studentId: record.studentId,
          error: error.message
        });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors,
      totalProcessed: records.length
    };
  },

  // ================= GET ATTENDANCE BY CLASS AND DATE =================
  async getAttendanceByClassAndDate(classId, date) {
    const classExists = await Class.findByPk(classId);
    if (!classExists) {
      throw new Error('Class not found');
    }

    // Get all students in the class
    const students = await Student.findAll({
      where: { classId },
      order: [['fullName', 'ASC']]
    });

    // Get attendance records for this date
    const attendanceRecords = await Attendance.findAll({
      where: { classId, date },
      include: [
        {
          model: Student,
          as: 'student'
        }
      ]
    });

    // Merge: show all students with their attendance status
    const merged = students.map(student => {
      const record = attendanceRecords.find(r => r.studentId === student.id);
      return {
        student,
        attendance: record || null,
        status: record?.status || 'not_marked',
        checkInTime: record?.checkInTime || null,
        checkOutTime: record?.checkOutTime || null,
        remarks: record?.remarks || null
      };
    });

    // Calculate statistics
    const stats = this.calculateStats(attendanceRecords);

    return {
      date,
      class: classExists,
      totalStudents: students.length,
      marked: attendanceRecords.length,
      unmarked: students.length - attendanceRecords.length,
      records: merged,
      stats
    };
  },

  // ================= GET STUDENT ATTENDANCE HISTORY =================
  async getStudentAttendanceHistory(studentId, startDate, endDate, limit = 30) {
    const student = await Student.findByPk(studentId, {
      include: [{ model: Class, as: 'class' }]
    });
    if (!student) {
      throw new Error('Student not found');
    }

    const where = { studentId };
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const attendance = await Attendance.findAll({
      where,
      include: [{ model: Class, as: 'class' }],
      order: [['date', 'DESC']],
      limit: parseInt(limit)
    });

    const stats = this.calculateStats(attendance);

    return {
      student,
      attendance,
      stats,
      totalRecords: attendance.length
    };
  },

  // ================= GET CLASS ATTENDANCE SUMMARY =================
  async getClassAttendanceSummary(classId, startDate, endDate) {
    const classExists = await Class.findByPk(classId);
    if (!classExists) {
      throw new Error('Class not found');
    }

    const where = { classId };
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const attendance = await Attendance.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student'
        }
      ],
      order: [['date', 'DESC']]
    });

    // Group by student
    const studentStats = {};
    attendance.forEach(record => {
      const studentId = record.studentId;
      if (!studentStats[studentId]) {
        studentStats[studentId] = {
          student: record.student,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0
        };
      }
      studentStats[studentId][record.status]++;
      studentStats[studentId].total++;
    });

    const studentSummary = Object.values(studentStats).map(item => ({
      ...item,
      attendanceRate: item.total > 0 ? ((item.present + item.late) / item.total * 100) : 0
    }));

    studentSummary.sort((a, b) => b.attendanceRate - a.attendanceRate);

    const overallStats = this.calculateStats(attendance);

    return {
      class: classExists,
      overall: overallStats,
      studentSummary,
      totalDays: attendance.length
    };
  },

  // ================= GET TOP ATTENDING STUDENTS =================
  async getTopAttendingStudents(classId, limit = 10, startDate, endDate) {
    const where = { classId };
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const attendance = await Attendance.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student'
        }
      ]
    });

    const studentStats = {};
    attendance.forEach(record => {
      const studentId = record.studentId;
      if (!studentStats[studentId]) {
        studentStats[studentId] = {
          student: record.student,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0
        };
      }
      studentStats[studentId][record.status]++;
      studentStats[studentId].total++;
    });

    const ranked = Object.values(studentStats).map(item => ({
      ...item,
      attendanceRate: item.total > 0 ? ((item.present + item.late) / item.total * 100) : 0
    }));

    ranked.sort((a, b) => b.attendanceRate - a.attendanceRate);

    return ranked.slice(0, parseInt(limit)).map((item, index) => ({
      rank: index + 1,
      ...item
    }));
  },

  // ================= GET ATTENDANCE TRENDS =================
  async getAttendanceTrends(classId, weeks = 4) {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7));

    const attendance = await Attendance.findAll({
      where: {
        classId,
        date: {
          [Op.gte]: startDate
        }
      }
    });

    const weeklyData = {};
    attendance.forEach(record => {
      const date = new Date(record.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          weekLabel: `Week ${Object.keys(weeklyData).length + 1}`,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0
        };
      }
      weeklyData[weekKey][record.status]++;
      weeklyData[weekKey].total++;
    });

    const result = Object.values(weeklyData).sort((a, b) => a.week.localeCompare(b.week));
    
    return result.map(week => ({
      ...week,
      attendanceRate: week.total > 0 ? ((week.present + week.late) / week.total * 100) : 0
    }));
  },

  // ================= GET WEEKLY ATTENDANCE REPORT =================
  async getWeeklyAttendanceReport(classId, weekStartDate) {
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const attendance = await Attendance.findAll({
      where: {
        classId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Student,
          as: 'student'
        }
      ],
      order: [['date', 'ASC']]
    });

    const students = await Student.findAll({
      where: { classId }
    });

    const matrix = students.map(student => {
      const records = attendance.filter(r => r.studentId === student.id);
      const days = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const record = records.find(r => r.date.toISOString().split('T')[0] === dateStr);
        days[dateStr] = record ? record.status : 'not_marked';
      }
      return {
        student,
        days,
        totalPresent: records.filter(r => r.status === 'present').length,
        totalAbsent: records.filter(r => r.status === 'absent').length,
        totalLate: records.filter(r => r.status === 'late').length,
        totalExcused: records.filter(r => r.status === 'excused').length,
        total: records.length
      };
    });

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      weekDays.push(date.toISOString().split('T')[0]);
    }

    return {
      weekStart: startDate,
      weekEnd: endDate,
      weekDays,
      students: matrix,
      summary: this.calculateStats(attendance)
    };
  },

  // ================= CALCULATE STATS =================
  calculateStats(records) {
    let present = 0, absent = 0, late = 0, excused = 0;
    let total = records.length;

    records.forEach(record => {
      switch(record.status) {
        case 'present': present++; break;
        case 'absent': absent++; break;
        case 'late': late++; break;
        case 'excused': excused++; break;
        default: break;
      }
    });

    const attendanceRate = total > 0 ? ((present + late) / total * 100) : 0;

    return {
      present,
      absent,
      late,
      excused,
      total,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      presentRate: total > 0 ? (present / total * 100) : 0,
      absentRate: total > 0 ? (absent / total * 100) : 0,
      lateRate: total > 0 ? (late / total * 100) : 0,
      excusedRate: total > 0 ? (excused / total * 100) : 0
    };
  }
};

module.exports = AttendanceService;