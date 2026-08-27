// migrations/xxxxxxxxxxxxxx-create-teacher-loans.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TeacherLoans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      teacherId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Teachers',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      interestRate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0
      },
      loanTermMonths: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 12
      },
      monthlyPayment: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      balanceRemaining: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      purpose: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      dateGranted: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      dateApproved: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      approvedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'active', 'completed', 'defaulted', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('TeacherLoans');
  }
};