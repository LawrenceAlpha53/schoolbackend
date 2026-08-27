const db = require('../models');

const Class = db.Class;

const ClassService = {

  async createClass(data) {
    return await Class.create(data);
  },

  async getClasses() {
    return await Class.findAll();
  },

  async getClass(id) {
    return await Class.findByPk(id);
  },

  async updateClass(id, data) {

    const classData = await Class.findByPk(id);

    if (!classData) {
      throw new Error('Class not found');
    }

    await classData.update(data);

    return classData;
  },

  async deleteClass(id) {

    const classData = await Class.findByPk(id);

    if (!classData) {
      throw new Error('Class not found');
    }

    await classData.destroy();

    return true;
  }
};

module.exports = ClassService;