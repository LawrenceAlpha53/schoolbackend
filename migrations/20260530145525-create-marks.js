'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('Marks', {

      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      studentId: {
        type: Sequelize.INTEGER
      },

      subjectId: {
        type: Sequelize.INTEGER
      },

      teacherId: {
        type: Sequelize.INTEGER
      },

      score: {
        type: Sequelize.INTEGER
      },

      examType: {
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
    await queryInterface.dropTable('Marks');
  }
};