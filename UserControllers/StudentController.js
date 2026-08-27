const StudentService = require('../UserServices/StudentServices');

const StudentController = {
  // ========== CREATE STUDENT ==========
  async createStudent(req, res, next) {
    try {
      const student = await StudentService.createStudent(req.body);
      res.status(201).json({
        success: true,
        data: student,
        message: 'Student created successfully'
      });
    } catch (error) {
      // Send a clear error message to the frontend
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create student'
      });
      // Also pass to global error handler for logging
      next(error);
    }
  },

  // ========== GET ALL STUDENTS ==========
  async getStudents(req, res, next) {
    try {
      const students = await StudentService.getStudents();
      res.json({
        success: true,
        data: students,
        count: students.length
      });
    } catch (error) {
      next(error);
    }
  },

  // ========== GET SINGLE STUDENT ==========
  async getStudent(req, res, next) {
    try {
      const student = await StudentService.getStudent(req.params.id);
      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      next(error);
    }
  },

  // ========== UPDATE STUDENT ==========
  async updateStudent(req, res, next) {
    try {
      const student = await StudentService.updateStudent(req.params.id, req.body);
      res.json({
        success: true,
        data: student,
        message: 'Student updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update student'
      });
      next(error);
    }
  },

  // ========== DELETE STUDENT ==========
  async deleteStudent(req, res, next) {
    try {
      await StudentService.deleteStudent(req.params.id);
      res.json({
        success: true,
        message: 'Student deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = StudentController;