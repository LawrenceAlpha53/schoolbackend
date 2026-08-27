// models/SmsMessage.js - SIMPLIFIED VERSION WITHOUT ENUMS
'use strict';

module.exports = (sequelize, DataTypes) => {
  const SmsMessage = sequelize.define('SmsMessage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    recipient: {
      type: DataTypes.STRING,
      allowNull: false
    },
    recipientName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    templateId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING,  // Changed from ENUM to STRING
      defaultValue: 'general'
    },
    priority: {
      type: DataTypes.STRING,  // Changed from ENUM to STRING
      defaultValue: 'normal'
    },
    status: {
      type: DataTypes.STRING,  // Changed from ENUM to STRING
      defaultValue: 'pending'
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failedReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    providerMessageId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    smsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    recipients: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    recipientType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    recipientIds: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    isBulk: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    totalRecipients: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    successfulCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    failedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'SmsMessages',
    timestamps: true
  });

  SmsMessage.associate = function(models) {
    // No associations
  };

  return SmsMessage;
};