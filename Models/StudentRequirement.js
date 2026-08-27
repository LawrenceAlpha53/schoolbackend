'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StudentRequirement extends Model {
    static associate(models) {
      // Use the correct model names from your project
      StudentRequirement.belongsTo(models.Student, {
        foreignKey: 'studentId',
        as: 'student',
      });
      
      StudentRequirement.belongsTo(models.Requirement, {
        foreignKey: 'requirementId',
        as: 'requirement',
      });
      
      // Use 'Users' (plural) - matches your User model
      StudentRequirement.belongsTo(models.Users, {
        foreignKey: 'receivedBy',
        as: 'receiver',
      });
    }
  }

  StudentRequirement.init(
    {
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Students', key: 'id' },
      },
      requirementId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Requirements', key: 'id' },
      },
      requiredQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      quantityReceived: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      balance: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Partial', 'Completed', 'Overdue'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      academicYear: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '2026',
      },
      term: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Term 1',
      },
      condition: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      receivedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
      },
      receivedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'StudentRequirement',
      tableName: 'StudentRequirements',
      timestamps: true,
    }
  );
  return StudentRequirement;
};