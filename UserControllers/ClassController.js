const ClassService =
require('../UserServices/ClassServices');

const ClassController = {

  async createClass(req, res, next) {
    try {

      const classData =
      await ClassService.createClass(req.body);

      res.status(201).json(classData);

    } catch (error) {
      next(error);
    }
  },

  async getClasses(req, res, next) {
    try {

      const classes =
      await ClassService.getClasses();

      res.json(classes);

    } catch (error) {
      next(error);
    }
  },

  async getClass(req, res, next) {
    try {

      const classData =
      await ClassService.getClass(req.params.id);

      res.json(classData);

    } catch (error) {
      next(error);
    }
  },

  async updateClass(req, res, next) {
    try {

      const classData =
      await ClassService.updateClass(
        req.params.id,
        req.body
      );

      res.json(classData);

    } catch (error) {
      next(error);
    }
  },

  async deleteClass(req, res, next) {
    try {

      await ClassService.deleteClass(
        req.params.id
      );

      res.json({
        message: 'Class deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  }
};

module.exports = ClassController;