'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ClassSubject extends Model {
    static associate(models) {
      ClassSubject.belongsTo(models.Class, {
        foreignKey: 'classId',
        as: 'class'
      });
      
      ClassSubject.belongsTo(models.Subject, {
        foreignKey: 'subjectId',
        as: 'subject'
      });
    }
  }

  ClassSubject.init({
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Classes',
        key: 'id'
      }
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Subjects',
        key: 'id'
      }
    },
    // If your table has these columns, keep them; if not, remove them
    // but timestamps: true will automatically add them if missing in model
  }, {
    sequelize,
    modelName: 'ClassSubject',
    tableName: 'ClassSubjects',
    // ✅ Enable timestamps – Sequelize will manage createdAt/updatedAt
    timestamps: true,
    // ✅ The table already has a composite primary key, so no need for an 'id' column
    id: false,
    indexes: [
      {
        unique: true,
        fields: ['classId', 'subjectId']
      }
    ]
  });

  return ClassSubject;
};