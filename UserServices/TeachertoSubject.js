const db = require('../Models');
const Teacher = db.Teacher;

const TeacherService = {

  async createTeacher(data) {
    return await Teacher.create(data);
  },

  async getTeachers() {
    return await Teacher.findAll({
      include: [
        { model: db.Class, as: 'class' },
        { model: db.Subject, as: 'subject' }
      ]
    });
  },

  async getTeacher(id) {
    return await Teacher.findByPk(id);
  },

  async updateTeacher(id, data) {

    const teacher = await Teacher.findByPk(id);

    if (!teacher) throw new Error('Teacher not found');

    await teacher.update(data);

    return teacher;
  },

  async deleteTeacher(id) {

    const teacher = await Teacher.findByPk(id);

    if (!teacher) throw new Error('Teacher not found');

    await teacher.destroy();

    return true;
  }

};

module.exports = TeacherService;    