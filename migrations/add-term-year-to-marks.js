'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Marks', 'term', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'Term 1',
    });
    await queryInterface.addColumn('Marks', 'academicYear', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: new Date().getFullYear().toString(),
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('Marks', 'term');
    await queryInterface.removeColumn('Marks', 'academicYear');
  },
};