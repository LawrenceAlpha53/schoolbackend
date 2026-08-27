const db = require('../models');
const { Op } = require('sequelize');
const Attendance = db.Attendance || db.Attendances;
const Student = db.Student || db.Students;
const Class = db.Class || db.Classes;

const AttendanceService = {
  async markAttendance(data) {
    const { classId, date, term, academicYear, records, notes } = data;
    const classExists = await Class.findByPk(classId);
    if (!classExists) throw new Error('Class not found');

    const results = [], errors = [];
    for (const record of records) {
      try {
        const { studentId, status, checkInTime, checkOutTime, remarks } = record;
        const student = await Student.findOne({ where: { id: studentId, classId } });
        if (!student) { errors.push({ studentId, error: 'Student not found in this class' }); continue; }

        const existing = await Attendance.findOne({ where: { studentId, date, classId } });
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
            studentId, classId, date, status,
            checkInTime: checkInTime || null,
            checkOutTime: checkOutTime || null,
            remarks: remarks || null,
            notes: notes || null,
            term, academicYear
          });
        }
        results.push(attendance);
      } catch (err) { errors.push({ studentId: record.studentId, error: err.message }); }
    }
    return { success: results.length, failed: errors.length, results, errors, totalProcessed: records.length };
  },

  async getAttendanceByClassAndDate(classId, date) {
    const classExists = await Class.findByPk(classId);
    if (!classExists) throw new Error('Class not found');

    const students = await Student.findAll({ where: { classId }, order: [['fullName', 'ASC']] });
    const records = await Attendance.findAll({
      where: { classId, date },
      include: [{ model: Student, as: 'student' }]
    });

    const merged = students.map(student => {
      const record = records.find(r => r.studentId === student.id);
      return {
        student,
        attendance: record || null,
        status: record?.status || 'not_marked',
        checkInTime: record?.checkInTime || null,
        checkOutTime: record?.checkOutTime || null,
        remarks: record?.remarks || null
      };
    });

    const stats = this.calculateStats(records);
    return { date, class: classExists, totalStudents: students.length, marked: records.length, unmarked: students.length - records.length, records: merged, stats };
  },

  async getStudentAttendanceHistory(studentId, startDate, endDate, limit = 30) {
    const student = await Student.findByPk(studentId, { include: [{ model: Class, as: 'class' }] });
    if (!student) throw new Error('Student not found');
    const where = { studentId };
    if (startDate && endDate) where.date = { [Op.between]: [startDate, endDate] };
    const attendance = await Attendance.findAll({ where, include: [{ model: Class, as: 'class' }], order: [['date', 'DESC']], limit: parseInt(limit) });
    return { student, attendance, stats: this.calculateStats(attendance), totalRecords: attendance.length };
  },

  calculateStats(records) {
    let present = 0, absent = 0, late = 0, excused = 0;
    records.forEach(r => {
      switch (r.status) { case 'present': present++; break; case 'absent': absent++; break; case 'late': late++; break; case 'excused': excused++; break; }
    });
    const total = records.length;
    return { present, absent, late, excused, total, attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100 * 10) / 10 : 0 };
  }
};

module.exports = AttendanceService;