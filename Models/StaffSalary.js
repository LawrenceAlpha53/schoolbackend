// models/StaffSalary.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const StaffSalary = sequelize.define('StaffSalary', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    staffId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Staff', key: 'id' }
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '0-11'
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amountPaid: {
      type: DataTypes.DECIMAL(15, 2),
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
      allowNull: true,
      references: { model: 'Users', key: 'id' }
    }
  }, {
    tableName: 'StaffSalaries',
    timestamps: true
  });

  StaffSalary.associate = function(models) {
    StaffSalary.belongsTo(models.Staff, { foreignKey: 'staffId', as: 'staff' });
  };

  return StaffSalary;
};