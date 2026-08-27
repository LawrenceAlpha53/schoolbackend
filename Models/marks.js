'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class Mark extends Model {}



  Mark.associate = (models) => {

  Mark.belongsTo(models.Student, {
    foreignKey: 'studentId',
    as: 'student'
  });

  Mark.belongsTo(models.Subject, {
    foreignKey: 'subjectId',
    as: 'subject'
  });

  Mark.belongsTo(models.Teacher, {
    foreignKey: 'teacherId',
    as: 'teacher'
  });

};

  Mark.init({

   studentId: DataTypes.INTEGER,
subjectId: DataTypes.INTEGER,
teacherId: DataTypes.INTEGER,
score: DataTypes.INTEGER,
examType: DataTypes.STRING
  }, {

    sequelize,
    modelName: 'Mark',
    tableName: 'Marks'

  });

  return Mark;
};