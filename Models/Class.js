'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Class extends Model {
    static associate(models) {
      Class.hasMany(models.Student, {
        foreignKey: 'classId',
        as: 'students'
      });

Class.hasMany(models.StudentPromotion, {
  foreignKey: 'fromClassId',
  as: 'fromPromotions',
});
Class.hasMany(models.StudentPromotion, {
  foreignKey: 'toClassId',
  as: 'toPromotions',
});



      Class.hasMany(models.Teacher, {
        foreignKey: 'classId',
        as: 'teachers'
      });

      Class.belongsToMany(models.Subject, {
        through: 'ClassSubjects',
        foreignKey: 'classId',
        otherKey: 'subjectId',
        as: 'subjects'
      });
    }
  }

  Class.init({
    className: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    classTeacher: {
      type: DataTypes.STRING,
      allowNull: true
    }
    // ✅ No custom 'Id' or 'level' fields here
  }, {
    sequelize,
    modelName: 'Class',
    tableName: 'Classes'
  });

  return Class;
};