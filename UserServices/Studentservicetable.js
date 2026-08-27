const db = require('../Models');

const Student = db.Student;

const StudentService = {

  async createStudent(data) {
    return await Student.create(data);
  },

  async getStudents() {
    return await Student.findAll();
  },

  async getStudent(id) {
    return await Student.findByPk(id);
  },

  async updateStudent(id, data) {

    const student = await Student.findByPk(id);

    if (!student) {
      throw new Error('Student not found');
    }

    await student.update(data);

    return student;
  },

  async deleteStudent(id) {

    const student = await Student.findByPk(id);

    if (!student) {
      throw new Error('Student not found');
    }

    await student.destroy();

    return true;
  }
};

module.exports = StudentService;