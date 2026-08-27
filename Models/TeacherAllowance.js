// models/TeacherAllowance.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TeacherAllowance extends Model {
    static associate(models) {
      TeacherAllowance.belongsTo(models.Teacher, {
        foreignKey: 'teacherId',
        as: 'teacher'
      });
      TeacherAllowance.belongsTo(models.Users, {
        foreignKey: 'recordedBy',
        as: 'recorder'
      });
      TeacherAllowance.belongsTo(models.Users, {
        foreignKey: 'approvedBy',
        as: 'approver'
      });
    }
  }

  TeacherAllowance.init({
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Teachers',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('transport', 'lunch', 'extra_duty', 'emergency', 'travel', 'workshop', 'overtime', 'other'),
      allowNull: false,
      defaultValue: 'transport'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid'),
      allowNull: false,
      defaultValue: 'pending'
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    recordedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'TeacherAllowance',
    tableName: 'TeacherAllowances',
    timestamps: true
  });

  return TeacherAllowance;
};