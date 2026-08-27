'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the existing foreign key constraint
    await queryInterface.removeConstraint('Timetables', 'Timetables_subjectId_fkey');

    // Re-add it with ON DELETE CASCADE
    await queryInterface.addConstraint('Timetables', {
      fields: ['subjectId'],
      type: 'foreign key',
      name: 'Timetables_subjectId_fkey',
      references: {
        table: 'Subjects',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Restore the original constraint (without CASCADE)
    await queryInterface.removeConstraint('Timetables', 'Timetables_subjectId_fkey');
    await queryInterface.addConstraint('Timetables', {
      fields: ['subjectId'],
      type: 'foreign key',
      name: 'Timetables_subjectId_fkey',
      references: {
        table: 'Subjects',
        field: 'id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
  }
};