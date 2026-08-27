// models/SmsDeliveryReport.js - SIMPLIFIED VERSION WITHOUT ENUMS
'use strict';

module.exports = (sequelize, DataTypes) => {
  const SmsDeliveryReport = sequelize.define('SmsDeliveryReport', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    messageId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    recipient: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,  // Changed from ENUM to STRING
      defaultValue: 'pending'
    },
    providerMessageId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    errorCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'SmsDeliveryReports',
    timestamps: true
  });

  SmsDeliveryReport.associate = function(models) {
    // No associations
  };

  return SmsDeliveryReport;
};