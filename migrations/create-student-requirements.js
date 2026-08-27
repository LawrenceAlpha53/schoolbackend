'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('StudentRequirements', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      studentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Students', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      requirementId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Requirements', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      requiredQuantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      quantityReceived: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      balance: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('Pending', 'Partial', 'Completed', 'Overdue'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      condition: {
        type: Sequelize.ENUM('Good', 'Damaged', 'Incomplete'),
        allowNull: true,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      receivedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      receivedDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      academicYear: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      term: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    // Add unique constraint to avoid duplicate assignments
    await queryInterface.addConstraint('StudentRequirements', {
      fields: ['studentId', 'requirementId', 'academicYear', 'term'],
      type: 'unique',
      name: 'unique_student_requirement_term_year',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('StudentRequirements');
  },
};