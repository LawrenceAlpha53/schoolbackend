// models/TeacherAdvance.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TeacherAdvance extends Model {
    static associate(models) {
      TeacherAdvance.belongsTo(models.Teacher, {
        foreignKey: 'teacherId',
        as: 'teacher'
      });
      TeacherAdvance.belongsTo(models.Users, {
        foreignKey: 'approvedBy',
        as: 'approver'
      });
      TeacherAdvance.belongsTo(models.Users, {
        foreignKey: 'recordedBy',
        as: 'recorder'
      });
    }
  }

  TeacherAdvance.init({
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
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('emergency', 'medical', 'school_fees', 'transport', 'funeral', 'wedding', 'housing', 'business', 'other'),
      allowNull: false,
      defaultValue: 'other'
    },
    dateRequested: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    dateApproved: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    dateDisbursed: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    repaymentPlan: {
      type: DataTypes.STRING,
      allowNull: true
    },
    repaymentMonths: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 3
    },
    monthlyDeduction: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    balanceRemaining: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'disbursed', 'partially_repaid', 'fully_repaid', 'rejected', 'cancelled'),
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
    },
    attachment: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'TeacherAdvance',
    tableName: 'TeacherAdvances',
    timestamps: true
  });

  return TeacherAdvance;
};