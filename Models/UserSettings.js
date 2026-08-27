'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserSettings extends Model {
    static associate(models) {
      UserSettings.belongsTo(models.Users, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  UserSettings.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    theme: {
      type: DataTypes.ENUM('light', 'dark', 'system'),
      defaultValue: 'light'
    },
    language: {
      type: DataTypes.ENUM('en', 'fr', 'sw'),
      defaultValue: 'en'
    },
    dashboardLayout: {
      type: DataTypes.JSON,
      allowNull: true
    },
    notificationsEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    pushNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'UserSettings',
    tableName: 'UserSettings'
  });

  return UserSettings;
};