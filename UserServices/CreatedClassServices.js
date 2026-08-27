const db = require('../Models');
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

    const classItem = await Class.findByPk(id);

    if (!classItem) {
      throw new Error('Class not found');
    }

    await classItem.update(data);

    return classItem;
  },

  async deleteClass(id) {

    const classItem = await Class.findByPk(id);

    if (!classItem) {
      throw new Error('Class not found');
    }

    await classItem.destroy();

    return true;
  }

};

module.exports = ClassService;