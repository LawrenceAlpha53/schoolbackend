'use strict';

const { types } = require("pg");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Students', {

      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      studentNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      fullName: {
        type: Sequelize.STRING,
        allowNull: false
      },

      gender: {
        type: Sequelize.STRING
      },

      Section: {
        type: Sequelize.STRING
      },

      dateOfBirth: {
        type: Sequelize.DATEONLY
      },

      className: {
        type: Sequelize.STRING
      },

      parentName: {
        type: Sequelize.STRING
      },

      parentPhone: {
        type: Sequelize.STRING
      },

      address: {
        type: Sequelize.TEXT
      },

      status: {
        type: Sequelize.STRING,
        defaultValue: 'Active'
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }

    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Students');
  }
};