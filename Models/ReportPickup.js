'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ReportPickup extends Model {
    static associate(models) {
      ReportPickup.belongsTo(models.Student, {
        foreignKey: 'studentId',
        as: 'student'
      });
      
      ReportPickup.belongsTo(models.Users, {
        foreignKey: 'secretaryId',
        as: 'secretary'
      });
    }
  }

  ReportPickup.init({
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Students',
        key: 'id'
      }
    },
    secretaryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    term: {
      type: DataTypes.STRING,
      allowNull: false
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pickupDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    pickupTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isPicked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'ReportPickup',
    tableName: 'ReportPickups',
    indexes: [
      {
        unique: true,
        fields: ['studentId', 'term', 'academicYear']
      }
    ]
  });

  return ReportPickup;
};