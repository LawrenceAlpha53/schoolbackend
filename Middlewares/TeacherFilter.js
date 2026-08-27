const db = require('../models');

module.exports = async (req, res, next) => {
  // Only for teachers
  if (req.user && req.user.role === 'teacher') {
    const teacher = await db.Teacher.findOne({
      where: { userId: req.user.id }
    });
    if (teacher) {
      req.teacher = teacher;
      req.teacherClassId = teacher.classId;
      req.teacherId = teacher.id;
    }
  }
  next();
};