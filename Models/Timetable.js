'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Timetable extends Model {
    static associate(models) {
      Timetable.belongsTo(models.Class, {
        foreignKey: 'classId',
        as: 'class'
      });
      
      Timetable.belongsTo(models.Subject, {
        foreignKey: 'subjectId',
        as: 'subject'
      });
      
      Timetable.belongsTo(models.Teacher, {
        foreignKey: 'teacherId',
        as: 'teacher'
      });
    }
  }

  Timetable.init({
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Classes',
        key: 'id'
      }
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Subjects',
        key: 'id'
      }
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Teachers',
        key: 'id'
      }
    },
    dayOfWeek: {
      type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
      allowNull: false
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    room: {
      type: DataTypes.STRING,
      allowNull: true
    },
    term: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Term 1'
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Timetable',
    tableName: 'Timetables',
    indexes: [
      {
        unique: true,
        fields: ['classId', 'dayOfWeek', 'startTime', 'term', 'academicYear']
      }
    ]
  });

  return Timetable;
};