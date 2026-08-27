'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the existing constraint
    await queryInterface.removeConstraint('Attendances', 'Attendances_studentId_fkey');

    // Add it back with ON DELETE CASCADE
    await queryInterface.addConstraint('Attendances', {
      fields: ['studentId'],
      type: 'foreign key',
      name: 'Attendances_studentId_fkey',
      references: {
        table: 'Students',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Attendances', 'Attendances_studentId_fkey');
    await queryInterface.addConstraint('Attendances', {
      fields: ['studentId'],
      type: 'foreign key',
      name: 'Attendances_studentId_fkey',
      references: {
        table: 'Students',
        field: 'id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
  }
};