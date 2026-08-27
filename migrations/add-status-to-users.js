// migrations/20260807120000-add-status-to-users.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'status', {
      type: Sequelize.ENUM('active', 'blocked', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'status');
  },
};