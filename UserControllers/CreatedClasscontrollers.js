const ClassService = require('../UserServices/CreatedClassServices');

const ClassController = {

  async createClass(req, res, next) {
    try {

      const classItem = await ClassService.createClass(req.body);

      res.status(201).json({
        success: true,
        data: classItem
      });

    } catch (error) {
      next(error);
    }
  },

  async getClasses(req, res, next) {
    try {

      const classes = await ClassService.getClasses();

      res.json({
        success: true,
        data: classes
      });

    } catch (error) {
      next(error);
    }
  },

  async getClass(req, res, next) {
    try {

      const classItem = await ClassService.getClass(req.params.id);

      res.json({
        success: true,
        data: classItem
      });

    } catch (error) {
      next(error);
    }
  },

  async updateClass(req, res, next) {
    try {

      const classItem = await ClassService.updateClass(
        req.params.id,
        req.body
      );

      res.json({
        success: true,
        data: classItem
      });

    } catch (error) {
      next(error);
    }
  },

  async deleteClass(req, res, next) {
    try {

      await ClassService.deleteClass(req.params.id);

      res.json({
        success: true,
        message: 'Class deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  }

};

module.exports = ClassController;