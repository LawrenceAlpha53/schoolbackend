// models/SmsPurchase.js - SIMPLIFIED VERSION WITHOUT ENUMS
'use strict';

module.exports = (sequelize, DataTypes) => {
  const SmsPurchase = sequelize.define('SmsPurchase', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Number of SMS credits purchased'
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Total cost in UGX'
    },
    costPerSms: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 62,
      comment: 'Cost per SMS (UGX 62)'
    },
    paymentMethod: {
      type: DataTypes.STRING,  // Changed from ENUM to STRING
      allowNull: false
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Transaction reference from Yoola or bank'
    },
    yoolaTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Transaction ID from Yoola if available'
    },
    status: {
      type: DataTypes.STRING,  // Changed from ENUM to STRING
      defaultValue: 'completed'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about the purchase'
    },
    purchasedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User ID who recorded this purchase'
    },
    balanceBefore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    balanceAfter: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'SmsPurchases',
    timestamps: true
  });

  SmsPurchase.associate = function(models) {
    // No associations
  };

  return SmsPurchase;
};