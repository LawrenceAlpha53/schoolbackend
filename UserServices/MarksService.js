// UserServices/MarksService.js
const db = require('../models');

const MarksService = {
  async createMark(data) {
    const { studentId, subjectId, teacherId, score, examType } = data;
    
    // Validate required fields
    if (!studentId || !subjectId || !teacherId) {
      throw new Error('studentId, subjectId, and teacherId are required');
    }
    
    // Check if mark already exists
    const existing = await db.Mark.findOne({
      where: { 
        studentId, 
        subjectId, 
        teacherId, 
        examType: examType || 'CAT 1' 
      }
    });

    if (existing) {
      await existing.update({ score, submitted: true });
      return existing;
    }

    return await db.Mark.create({
      studentId,
      subjectId,
      teacherId,
      score: score || null,
      examType: examType || 'CAT 1',
      submitted: true
    });
  },

  async getMarksByTeacher(teacherId, filters = {}) {
    // Validate teacherId
    if (!teacherId) {
      console.warn('⚠️ getMarksByTeacher called without teacherId');
      return [];
    }

    const where = { teacherId };
    if (filters.examType) where.examType = filters.examType;
    if (filters.subjectId) where.subjectId = filters.subjectId;

    try {
      const marks = await db.Mark.findAll({
        where,
        include: [
          { 
            model: db.Student, 
            as: 'student',
            attributes: ['id', 'fullName', 'studentNumber']
          },
          { 
            model: db.Subject, 
            as: 'subject',
            attributes: ['id', 'subjectName']
          },
          { 
            model: db.Teacher, 
            as: 'teacher',
            attributes: ['id', 'fullName']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      return marks;
    } catch (error) {
      console.error('❌ Error in getMarksByTeacher:', error);
      return [];
    }
  }
};

module.exports = MarksService;