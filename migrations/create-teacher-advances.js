// migrations/xxxxxxxxxxxxxx-create-teacher-advances.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TeacherAdvances', {
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
      reason: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM('emergency', 'medical', 'school_fees', 'transport', 'funeral', 'wedding', 'housing', 'business', 'other'),
        allowNull: false,
        defaultValue: 'other'
      },
      dateRequested: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      dateApproved: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      dateDisbursed: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      repaymentPlan: {
        type: Sequelize.STRING,
        allowNull: true
      },
      repaymentMonths: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 3
      },
      monthlyDeduction: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      balanceRemaining: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'disbursed', 'partially_repaid', 'fully_repaid', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
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
      recordedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      attachment: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable('TeacherAdvances');
  }
};