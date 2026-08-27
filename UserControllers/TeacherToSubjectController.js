const TeacherService = require('../UserServices/TeachertoSubject');

const TeacherController = {

  async createTeacher(req, res, next) {
    try {

      const teacher = await TeacherService.createTeacher(req.body);

      res.status(201).json({
        success: true,
        data: teacher
      });

    } catch (error) {
      next(error);
    }
  },

  async getTeachers(req, res, next) {
    try {

      const teachers = await TeacherService.getTeachers();

      res.json({
        success: true,
        data: teachers
      });

    } catch (error) {
      next(error);
    }
  }

};

module.exports = TeacherController;