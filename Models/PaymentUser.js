'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class PaymentUser extends Model {

    static associate(models) {
      // Later we will add relationships here
      // Example:
      // PaymentUser.hasMany(models.PaymentTransaction)
    }

  }

  PaymentUser.init({

    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false
    },

    role: {
      type: DataTypes.ENUM(
        'admin',
        'accountant',
        'parent',
        'student'
      ),
      defaultValue: 'student'
    },

    status: {
      type: DataTypes.ENUM(
        'active',
        'inactive'
      ),
      defaultValue: 'active'
    },

    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    }

  }, {

    sequelize,
    modelName: 'PaymentUser',
    tableName: 'PaymentUsers',

    timestamps: true

  });


  return PaymentUser;

};