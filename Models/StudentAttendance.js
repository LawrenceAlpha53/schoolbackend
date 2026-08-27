'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Attendance extends Model {
    static associate(models) {
      Attendance.belongsTo(models.Student, { foreignKey: 'studentId', as: 'student' });
      Attendance.belongsTo(models.Class, { foreignKey: 'classId', as: 'class' });
    }
  }

  Attendance.init({
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Students', key: 'id' }
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Classes', key: 'id' }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
      allowNull: false,
      defaultValue: 'present'
    },
    checkInTime: DataTypes.TIME,
    checkOutTime: DataTypes.TIME,
    remarks: DataTypes.TEXT,
    notes: DataTypes.TEXT,
    term: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Term 1' },
    academicYear: { type: DataTypes.STRING, allowNull: false }
  }, {
    sequelize,
    modelName: 'Attendance',
    tableName: 'Attendances',
    indexes: [{ unique: true, fields: ['studentId', 'date', 'classId'] }]
  });

  return Attendance;
};