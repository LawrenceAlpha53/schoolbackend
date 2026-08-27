'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StaffSalaries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      staffId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Staff',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '0-11 (January=0)'
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      amountPaid: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0
      },
      paymentDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('paid', 'unpaid'),
        defaultValue: 'unpaid'
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      recordedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('StaffSalaries', ['staffId']);
    await queryInterface.addIndex('StaffSalaries', ['month', 'year']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('StaffSalaries');
  }
};