// UserControllers/ClassSubjectController.js
const { ClassSubject, Subject, Class } = require('../models');

const ClassSubjectController = {
  async assignSubjectToClass(req, res, next) {
    try {
      const { classId, subjectId, isCompulsory, term, academicYear } = req.body;

      // Check if already assigned
      const existing = await ClassSubject.findOne({
        where: { classId, subjectId }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Subject already assigned to this class'
        });
      }

      const assignment = await ClassSubject.create({
        classId,
        subjectId,
        isCompulsory: isCompulsory || false,
        term: term || 'Term 1',
        academicYear: academicYear || new Date().getFullYear().toString()
      });

      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Subject assigned to class successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async removeSubjectFromClass(req, res, next) {
    try {
      const { classId, subjectId } = req.body;

      const deleted = await ClassSubject.destroy({
        where: { classId, subjectId }
      });

      if (deleted === 0) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      res.json({
        success: true,
        message: 'Subject removed from class successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async getSubjectsByClass(req, res, next) {
    try {
      const { classId } = req.params;

      const subjects = await Subject.findAll({
        include: [
          {
            model: Class,
            as: 'classes',
            where: { id: classId },
            through: { attributes: ['isCompulsory', 'term', 'academicYear'] }
          }
        ]
      });

      res.json({
        success: true,
        data: subjects
      });
    } catch (error) {
      next(error);
    }
  },

  async getClassesBySubject(req, res, next) {
    try {
      const { subjectId } = req.params;

      const classes = await Class.findAll({
        include: [
          {
            model: Subject,
            as: 'subjects',
            where: { id: subjectId },
            through: { attributes: ['isCompulsory', 'term', 'academicYear'] }
          }
        ]
      });

      res.json({
        success: true,
        data: classes
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = ClassSubjectController;