'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class schoolManagement extends Model {}

  schoolManagement.init(
    {
      fullName: DataTypes.STRING,
      email: DataTypes.STRING,
      username: DataTypes.STRING,
      password: DataTypes.STRING,
      role: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'schoolManagement',
      tableName: 'schoolManagements', // your actual DB table
    }
  );

  return schoolManagement;
};