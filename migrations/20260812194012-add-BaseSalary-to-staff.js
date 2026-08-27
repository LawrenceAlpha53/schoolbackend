// migrations/[timestamp]-add-BaseSalary-to-staff.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Staff', 'BaseSalary', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Staff', 'BaseSalary',);
  }
};