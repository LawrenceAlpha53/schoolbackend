'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TeacherSubject extends Model {
    static associate(models) {
      TeacherSubject.belongsTo(models.Teacher, {
        foreignKey: 'teacherId',
        as: 'teacher'
      });
      TeacherSubject.belongsTo(models.Subject, {
        foreignKey: 'subjectId',
        as: 'subject'
      });
    }
  }

  TeacherSubject.init({
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Teachers',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Subjects',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'TeacherSubject',
    tableName: 'TeacherSubjects',
    timestamps: true,
    id: false
  });

  return TeacherSubject;
};