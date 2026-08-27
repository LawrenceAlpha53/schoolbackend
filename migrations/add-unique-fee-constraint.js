'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('Fees', {
      fields: ['studentId', 'term', 'academicYear'],
      type: 'unique',
      name: 'unique_student_term_year'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Fees', 'unique_student_term_year');
  }
};