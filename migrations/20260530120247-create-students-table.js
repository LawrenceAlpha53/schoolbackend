'use strict';

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
        unique: true
      },

      fullName: {
        type: Sequelize.STRING,
        allowNull: false
      },

      gender: {
        type: Sequelize.STRING
      },

      dateOfBirth: {
        type: Sequelize.DATE
      },

      course: {
        type: Sequelize.STRING
      },

      email: {
        type: Sequelize.STRING
      },

      phoneNumber: {
        type: Sequelize.STRING
      },

      address: {
        type: Sequelize.STRING
      },

      guardianName: {
        type: Sequelize.STRING
      },

      guardianPhone: {
        type: Sequelize.STRING
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