'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class ReportCard extends Model {

    static associate(models) {

      ReportCard.belongsTo(models.Student, {
        foreignKey: 'studentId',
        as: 'student'
      });

    }

  }

  ReportCard.init({

    studentId: DataTypes.INTEGER,
    totalMarks: DataTypes.FLOAT,
    average: DataTypes.FLOAT,
    position: DataTypes.INTEGER,
    teacherComment: DataTypes.TEXT,
    headTeacherComment: DataTypes.TEXT,
    term: DataTypes.STRING,
    academicYear: DataTypes.STRING

  }, {

    sequelize,
    modelName: 'ReportCard',
    tableName: 'ReportCards'

  });

  return ReportCard;
};