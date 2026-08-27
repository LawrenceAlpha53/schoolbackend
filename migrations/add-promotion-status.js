// migrations/XXXXXXXXXXXXXX-add-promotion-status.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Students', 'promotionStatus', {
      type: Sequelize.ENUM('pending', 'promoted', 'not_promoted', 'repeated'),
      allowNull: false,
      defaultValue: 'pending'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Students', 'promotionStatus');
  }
};