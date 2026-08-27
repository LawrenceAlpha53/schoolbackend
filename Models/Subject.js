'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Subject extends Model {
    static associate(models) {
      // Many-to-Many with Classes
      Subject.belongsToMany(models.Class, {
        through: 'ClassSubjects',
        foreignKey: 'subjectId',
        otherKey: 'classId',
        as: 'classes'
      });

      // Many-to-Many with Teachers
      Subject.belongsToMany(models.Teacher, {
        through: 'TeacherSubjects',
        foreignKey: 'subjectId',
        otherKey: 'teacherId',
        as: 'teachers'
      });

      // One-to-Many with Marks
      Subject.hasMany(models.Mark, {
        foreignKey: 'subjectId',
        as: 'marks'
      });
    }
  }

  Subject.init({
    subjectName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    subjectCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    level: {
      type: DataTypes.ENUM('olevel', 'alevel'),
      allowNull: false,
      defaultValue: 'olevel'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'core'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isCompulsory: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    examinable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Subject',
    tableName: 'Subjects'
  });

  return Subject;
};