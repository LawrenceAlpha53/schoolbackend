// UserControllers/MarksController.js - WITH ADMIN NOTIFICATIONS
const MarksService = require('../UserServices/MarksService');
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
        actionLink: '/admin/analytics',
        actionLabel: 'View Analytics',
        isRead: false,
        metadata
      });
    }
  } catch (e) {
    console.error('Notification error:', e.message);
  }
};

const MarksController = {

  // ================= CREATE/UPDATE MARK =================
  async createMark(req, res, next) {
    try {
      if (req.user.role === 'teacher') {
        if (!req.teacherClassId) {
          return res.status(400).json({ success: false, message: 'No class assigned to you' });
        }
        const student = await db.Student.findOne({ 
          where: { id: req.body.studentId, classId: req.teacherClassId } 
        });
        if (!student) {
          return res.status(403).json({ success: false, message: 'You cannot mark this student' });
        }
        req.body.teacherId = req.teacherId;
      }
      const mark = await MarksService.createMark(req.body);
      
      // Notify admins
      const student = await db.Student.findByPk(req.body.studentId);
      const subject = await db.Subject.findByPk(req.body.subjectId);
      await notifyAdmins(
        '📝 Mark Recorded',
        `${student?.fullName || 'A student'} scored ${req.body.score}% in ${subject?.subjectName || 'a subject'} (${req.body.examType || 'Exam'})`,
        'academic',
        { studentId: req.body.studentId, score: req.body.score, examType: req.body.examType }
      );
      
      res.status(201).json({ success: true, data: mark });
    } catch (error) { next(error); }
  },

  // ================= BULK MARKS ENTRY =================
  async bulkCreateMarks(req, res, next) {
    try {
      const { records, examType, subjectId, classId } = req.body;
      const results = [];
      const errors = [];
      let targetClassId = classId;
      
      if (req.user.role === 'teacher') {
        if (!req.teacherClassId) {
          return res.status(400).json({ success: false, message: 'No class assigned to you' });
        }
        targetClassId = req.teacherClassId;
      }

      for (const record of records) {
        try {
          if (targetClassId) {
            const student = await db.Student.findOne({ 
              where: { id: record.studentId, classId: targetClassId } 
            });
            if (!student) {
              errors.push({ studentId: record.studentId, error: 'Student not in your class' });
              continue;
            }
          }
          const mark = await MarksService.createMark({
            studentId: record.studentId,
            subjectId: subjectId || record.subjectId,
            teacherId: req.user.role === 'teacher' ? req.teacherId : req.user.id,
            score: record.score,
            examType: examType,
            submitted: true
          });
          results.push(mark);
        } catch (error) {
          errors.push({ studentId: record.studentId, error: error.message });
        }
      }

      // Notify admins about bulk marks
      if (results.length > 0) {
        const subject = await db.Subject.findByPk(subjectId);
        await notifyAdmins(
          '📝 Bulk Marks Recorded',
          `${results.length} students' marks recorded in ${subject?.subjectName || 'a subject'} (${examType || 'Exam'})`,
          'academic',
          { count: results.length, examType, subjectId }
        );
      }

      res.status(201).json({
        success: true,
        message: `${results.length} marks recorded`,
        data: { results, errors, total: records.length, successful: results.length, failed: errors.length }
      });
    } catch (error) { next(error); }
  },

  // ================= GET MARKS BY TEACHER =================
  async getTeacherMarks(req, res, next) {
    try {
      let teacherId = req.params.teacherId || req.query.teacherId;
      if (req.user.role === 'teacher' && req.teacherId) {
        teacherId = req.teacherId;
      }
      const { classId, subjectId, examType } = req.query;
      const marks = await MarksService.getMarksByTeacher(teacherId, { classId, subjectId, examType });
      res.json({ success: true, data: marks, count: marks.length });
    } catch (error) { next(error); }
  },

  async getStudentMarks(req, res, next) {
    try {
      const { studentId } = req.params;
      const marks = await db.Mark.findAll({
        where: { studentId },
        include: [
          { model: db.Student, as: 'student' },
          { model: db.Subject, as: 'subject' },
          { model: db.Teacher, as: 'teacher' }
        ],
        order: [['createdAt', 'DESC']]
      });
      res.json({ success: true, data: marks, count: marks.length });
    } catch (error) { next(error); }
  },

  async getMyMarks(req, res, next) {
    try {
      const userId = req.user.id;
      const teacher = await db.Teacher.findOne({ where: { userId } });
      if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
      const marks = await MarksService.getMarksByTeacher(teacher.id, req.query);
      res.json({ success: true, data: marks, count: marks.length });
    } catch (error) { next(error); }
  },

  async getAllMarks(req, res, next) {
    try {
      const marks = await db.Mark.findAll({
        include: [
          { model: db.Student, as: 'student' },
          { model: db.Subject, as: 'subject' },
          { model: db.Teacher, as: 'teacher' }
        ],
        order: [['createdAt', 'DESC']]
      });
      res.json({ success: true, data: marks, count: marks.length });
    } catch (error) { next(error); }
  },

  async updateMark(req, res, next) {
    try {
      const { id } = req.params;
      const { score } = req.body;
      const mark = await db.Mark.findByPk(id);
      if (!mark) return res.status(404).json({ success: false, message: 'Mark not found' });
      await mark.update({ score });
      res.json({ success: true, data: mark });
    } catch (error) { next(error); }
  },

  async deleteMark(req, res, next) {
    try {
      const { id } = req.params;
      const mark = await db.Mark.findByPk(id);
      if (!mark) return res.status(404).json({ success: false, message: 'Mark not found' });
      await mark.destroy();
      res.json({ success: true, message: 'Mark deleted successfully' });
    } catch (error) { next(error); }
  },

  async submitMarks(req, res, next) {
    try {
      const { classId } = req.params;
      const { subjectId, examType } = req.body;
      const where = { classId, subjectId, examType, submitted: false };
      const [updated] = await db.Mark.update({ submitted: true, submittedAt: new Date() }, { where });
      
      // Notify admins
      if (updated > 0) {
        const classInfo = await db.Class.findByPk(classId);
        const subject = await db.Subject.findByPk(subjectId);
        await notifyAdmins(
          '✅ Marks Submitted & Locked',
          `${updated} marks submitted for ${classInfo?.className || 'class'} in ${subject?.subjectName || 'subject'} (${examType})`,
          'academic',
          { classId, subjectId, examType, count: updated }
        );
      }
      
      res.json({ success: true, message: `${updated} marks submitted successfully`, data: { updated } });
    } catch (error) { next(error); }
  },

  async markAbsent(req, res, next) {
    try {
      const { studentId, subjectId, examType, reason } = req.body;
      let mark = await db.Mark.findOne({ where: { studentId, subjectId, examType } });
      if (mark) {
        await mark.update({ score: 'ABS', status: 'absent', reason });
      } else {
        mark = await db.Mark.create({
          studentId, subjectId, teacherId: req.teacherId || req.user.id,
          score: 'ABS', examType, status: 'absent', reason, submitted: true
        });
      }
      res.json({ success: true, message: 'Student marked as absent', data: mark });
    } catch (error) { next(error); }
  },

  async getMarksSummary(req, res, next) {
    try {
      const teachers = await db.Teacher.findAll({
        include: [
          { model: db.Class, as: 'class' },
          { model: db.Subject, as: 'subject' }
        ]
      });
      const summary = [];
      let totalMarksEntered = 0, totalPending = 0;
      for (const teacher of teachers) {
        const marks = await db.Mark.findAll({ where: { teacherId: teacher.id } });
        const students = await db.Student.count({ where: { classId: teacher.classId } });
        const entered = marks.length;
        const pending = students - entered;
        totalMarksEntered += entered;
        totalPending += pending;
        summary.push({
          teacher: { id: teacher.id, fullName: teacher.fullName || teacher.name || 'N/A' },
          class: teacher.class?.className || 'N/A',
          subject: teacher.subject?.subjectName || 'N/A',
          totalStudents: students, marksEntered: entered, pending: pending,
          completionRate: students > 0 ? ((entered / students) * 100).toFixed(1) : 0
        });
      }
      const recentMarks = await db.Mark.findAll({
        limit: 10, order: [['createdAt', 'DESC']],
        include: [
          { model: db.Student, as: 'student' },
          { model: db.Subject, as: 'subject' },
          { model: db.Teacher, as: 'teacher' }
        ]
      });
      res.json({
        success: true,
        data: { summary, overallStats: { totalMarksEntered, totalPending, totalTeachers: teachers.length }, recentMarks }
      });
    } catch (error) { next(error); }
  }
};

module.exports = MarksController;