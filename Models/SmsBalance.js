'use strict';

module.exports = (sequelize, DataTypes) => {
  const SmsBalance = sequelize.define('SmsBalance', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    balance: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Current SMS balance'
    },
    totalPurchased: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total SMS ever purchased'
    },
    totalUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total SMS ever used'
    },
    totalSpent: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Total money spent on SMS in UGX'
    },
    lastPurchaseDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastSyncDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'SmsBalances',
    timestamps: true
  });

  SmsBalance.associate = function(models) {
    // No associations needed
  };

  return SmsBalance;
};