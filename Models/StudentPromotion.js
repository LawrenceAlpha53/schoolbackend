// models/StudentPromotion.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StudentPromotion extends Model {
    static associate(models) {
      StudentPromotion.belongsTo(models.Student, {
        foreignKey: 'studentId',
        as: 'student'
      });
      StudentPromotion.belongsTo(models.Class, {
        foreignKey: 'fromClassId',
        as: 'fromClass'
      });
      StudentPromotion.belongsTo(models.Class, {
        foreignKey: 'toClassId',
        as: 'toClass'
      });
      StudentPromotion.belongsTo(models.Users, {
        foreignKey: 'promotedBy',
        as: 'promoter'
      });
    }
  }

  StudentPromotion.init({
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Students', key: 'id' }
    },
    fromClassId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Classes', key: 'id' }
    },
    toClassId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Classes', key: 'id' }
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false
    },
    term: {
      type: DataTypes.STRING,
      allowNull: false
    },
    promotionDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    promotedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    }
  }, {
    sequelize,
    modelName: 'StudentPromotion',
    tableName: 'StudentPromotions'
  });

  return StudentPromotion;
};