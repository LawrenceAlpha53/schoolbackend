const StudentService =
require('../UserServices/Studentservicetable');

const StudentController = {

  async createStudent(req, res, next) {
    try {

      const student =
      await StudentService.createStudent(req.body);

      res.status(201).json(student);

    } catch (error) {
      next(error);
    }
  },

  async getStudents(req, res, next) {
    try {

      const students =
      await StudentService.getStudents();

      res.json(students);

    } catch (error) {
      next(error);
    }
  },

  async getStudent(req, res, next) {
    try {

      const student =
      await StudentService.getStudent(req.params.id);

      res.json(student);

    } catch (error) {
      next(error);
    }
  },

  async updateStudent(req, res, next) {
    try {

      const student =
      await StudentService.updateStudent(
        req.params.id,
        req.body
      );

      res.json(student);

    } catch (error) {
      next(error);
    }
  },

  async deleteStudent(req, res, next) {
    try {

      await StudentService.deleteStudent(
        req.params.id
      );

      res.json({
        message: 'Student deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  }
};

module.exports = StudentController;