'use strict';

module.exports = (sequelize, DataTypes) => {
  const SmsReply = sequelize.define('SmsReply', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sender: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    receivedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    messageId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'SmsReplies',
    timestamps: true
  });

  SmsReply.associate = function(models) {
    // No associations
  };

  return SmsReply;
};