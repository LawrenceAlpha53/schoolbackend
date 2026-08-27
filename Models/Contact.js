'use strict';

module.exports = (sequelize, DataTypes) => {
  const Contact = sequelize.define('Contact', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^256[0-9]{9}$/,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    group: {
      type: DataTypes.STRING,
      defaultValue: 'general',
    },
  }, {
    tableName: 'Contacts',
    timestamps: true,
  });

  Contact.associate = function(models) {
    // No associations needed
  };

  return Contact;
};