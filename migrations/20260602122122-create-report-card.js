'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ReportCards', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      studentId: {
        type: Sequelize.INTEGER
      },
      totalMarks: {
        type: Sequelize.FLOAT
      },
      average: {
        type: Sequelize.FLOAT
      },
      position: {
        type: Sequelize.INTEGER
      },
      teacherComment: {
        type: Sequelize.TEXT
      },
      headTeacherComment: {
        type: Sequelize.TEXT
      },
      term: {
        type: Sequelize.STRING
      },
      academicYear: {
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ReportCards');
  }
};