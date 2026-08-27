'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Requirement extends Model {
    static associate(models) {
      // Use 'Users' (plural) - matches your User model
      Requirement.belongsTo(models.Users, {
        foreignKey: 'createdBy',
        as: 'creator',
      });
      
      Requirement.belongsTo(models.Class, {
        foreignKey: 'classId',
        as: 'class',
      });
      
      Requirement.hasMany(models.StudentRequirement, {
        foreignKey: 'requirementId',
        as: 'studentRequirements',
      });
    }
  }

  Requirement.init(
    {
      requirementName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM(
          'Cleaning',
          'Academic',
          'Boarding',
          'Kitchen',
          'Personal',
          'Hygiene',
          'Sports',
          'Laboratory',
          'Library',
          'Others'
        ),
        allowNull: false,
        defaultValue: 'Others',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      quantityRequired: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'piece',
      },
      appliesTo: {
        type: DataTypes.ENUM(
          'whole_school',
          'specific_class',
          'boarding_only',
          'girls_only',
          'boys_only'
        ),
        allowNull: false,
        defaultValue: 'whole_school',
      },
      genderRestriction: {
        type: DataTypes.ENUM('all', 'male', 'female'),
        allowNull: false,
        defaultValue: 'all',
      },
      boardingOption: {
        type: DataTypes.ENUM('all', 'boarding', 'day'),
        allowNull: false,
        defaultValue: 'all',
      },
      classId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Classes', key: 'id' },
      },
      academicYear: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      term: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      deadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      activeStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
      },
    },
    {
      sequelize,
      modelName: 'Requirement',
      tableName: 'Requirements',
      timestamps: true,
    }
  );
  return Requirement;
};