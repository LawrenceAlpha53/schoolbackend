// migrations/create-sms-transactions.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('SmsTransactions', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    });

    await queryInterface.addColumn('SmsTransactions', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: true
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('SmsTransactions', 'userId');
    await queryInterface.removeColumn('SmsTransactions', 'metadata');
  }
};