'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SchoolSettings extends Model {
    static associate(models) {
      SchoolSettings.belongsTo(models.Users, {
        foreignKey: 'updatedBy',
        as: 'updater'
      });
    }
  }

  SchoolSettings.init({
    schoolName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Academic ERP System'
    },
    schoolAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    schoolPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    schoolEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    schoolLogo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    schoolMotto: {
      type: DataTypes.STRING,
      allowNull: true
    },
    principalName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    principalSignature: {
      type: DataTypes.STRING,
      allowNull: true
    },
    academicYearStart: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    academicYearEnd: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    termStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    termEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    currentTerm: {
      type: DataTypes.ENUM('Term 1', 'Term 2', 'Term 3'),
      allowNull: true,
      defaultValue: 'Term 1'
    },
    currentAcademicYear: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reportCardFormat: {
      type: DataTypes.ENUM('standard', 'detailed', 'compact'),
      defaultValue: 'standard'
    },
    feeCurrency: {
      type: DataTypes.STRING,
      defaultValue: 'UGX'
    },
    enableSMSNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    enableEmailNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    enableParentPortal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    enableStudentPortal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    maxLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    sessionTimeout: {
      type: DataTypes.INTEGER,
      defaultValue: 60
    },
    maintenanceMode: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'SchoolSettings',
    tableName: 'SchoolSettings'
  });

  return SchoolSettings;
};