'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    static associate(models) {
      // Define associations here
      Users.hasMany(models.StudentPromotion, {
        foreignKey: 'promotedBy',
        as: 'promotedStudents',
      });
      // Add other associations as needed
    }
  }

  Users.init(
    {
      Fname: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      Lname: {
        type: DataTypes.STRING,
        allowNull: true,
      },

isBlocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },


    status: {
      type: DataTypes.ENUM('active', 'blocked', 'inactive'),
      defaultValue: 'active',
      allowNull: false,
    },






      Email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      Phonenumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('admin', 'teacher', 'student', 'secretary'),
        defaultValue: 'admin',
        allowNull: false,
      },
      nin: {                            // ✅ ADD THIS FIELD
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Users',
      tableName: 'Users',
      timestamps: true,
    }
  );

  return Users;
};