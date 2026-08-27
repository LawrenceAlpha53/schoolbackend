// models/Staff.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Staff extends Model {
    static associate(models) {
      // No associations needed
    }
  }

  Staff.init({
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    employeeNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: true
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    alternativePhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('Active', 'On Leave', 'Suspended', 'Terminated'),
      allowNull: false,
      defaultValue: 'Active'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    emergencyContactName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyContactPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    nin: {
      type: DataTypes.STRING,
      allowNull: true
    },

    BaseSalary: {
  type: DataTypes.DECIMAL(15, 2),
  allowNull: true,
  defaultValue: 0
}





  }, {
    sequelize,
    modelName: 'Staff',
    tableName: 'Staff',
    timestamps: true
  });

  return Staff;
};