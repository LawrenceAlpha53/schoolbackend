'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TeacherAttendance extends Model {
    static associate(models) {
      TeacherAttendance.belongsTo(models.Teacher, {
        foreignKey: 'teacherId',
        as: 'teacher'
      });
    }
  }

  TeacherAttendance.init({
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'signed_in'
    },
    checkInTime: DataTypes.TIME,
    checkOutTime: DataTypes.TIME,
    hoursWorked: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    allowance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    emergencyReason: DataTypes.TEXT,
    notes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'TeacherAttendance',
    tableName: 'TeacherAttendance',
    freezeTableName: true,
    timestamps: true
  });

  return TeacherAttendance;
};