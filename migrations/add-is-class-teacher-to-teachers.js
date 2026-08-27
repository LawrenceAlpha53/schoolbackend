// migrations/XXXXXXXXXXXXXX-add-is-class-teacher-to-teachers.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Teachers', 'isClassTeacher', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Teachers', 'isClassTeacher');
  },
};