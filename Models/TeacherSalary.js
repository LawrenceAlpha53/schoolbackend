'use strict';
module.exports = (sequelize, DataTypes) => {
  const TeacherSalary = sequelize.define('TeacherSalary', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Teachers', key: 'id' }
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '0-11 (January = 0)'
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amountPaid: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('paid', 'unpaid'),
      defaultValue: 'unpaid'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recordedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,   // ← make nullable to avoid constraint errors
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    tableName: 'TeacherSalaries',
    timestamps: true
  });

  TeacherSalary.associate = function(models) {
    TeacherSalary.belongsTo(models.Teacher, { foreignKey: 'teacherId', as: 'teacher' });
  };

  return TeacherSalary;
};