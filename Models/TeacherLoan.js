// models/TeacherLoan.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TeacherLoan extends Model {
    static associate(models) {
      TeacherLoan.belongsTo(models.Teacher, {
        foreignKey: 'teacherId',
        as: 'teacher'
      });
      TeacherLoan.belongsTo(models.Users, {
        foreignKey: 'approvedBy',
        as: 'approver'
      });
    }
  }

  TeacherLoan.init({
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Teachers',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    interestRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0
    },
    loanTermMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 12
    },
    monthlyPayment: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    balanceRemaining: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    purpose: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dateGranted: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    dateApproved: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'active', 'completed', 'defaulted', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'TeacherLoan',
    tableName: 'TeacherLoans',
    timestamps: true
  });

  return TeacherLoan;
};