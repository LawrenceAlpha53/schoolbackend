'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ClassSubjects', 'isCompulsory', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    await queryInterface.addColumn('ClassSubjects', 'term', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('ClassSubjects', 'academicYear', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ClassSubjects', 'isCompulsory');
    await queryInterface.removeColumn('ClassSubjects', 'term');
    await queryInterface.removeColumn('ClassSubjects', 'academicYear');
  }
};