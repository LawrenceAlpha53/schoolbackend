'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GradeScale extends Model {}

  GradeScale.init({
    grade: DataTypes.STRING,     // A, B, C, D, F
    minScore: DataTypes.INTEGER,
    maxScore: DataTypes.INTEGER,
    remark: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'GradeScale',
    tableName: 'GradeScales'
  });

  return GradeScale;
};