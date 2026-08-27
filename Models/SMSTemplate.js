'use strict';

module.exports = (sequelize, DataTypes) => {
  const SmsTemplate = sequelize.define('SmsTemplate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM(
        'fee_reminder', 'attendance', 'results', 'examination',
        'meeting', 'event', 'emergency', 'birthday',
        'admission', 'payment_confirmation', 'allowance', 'general'
      ),
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    variables: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'SmsTemplates',
    timestamps: true
  });

  SmsTemplate.associate = function(models) {
    // No associations
  };

  return SmsTemplate;
};