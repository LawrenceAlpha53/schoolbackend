'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Requirements', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      requirementName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM(
          'Cleaning',
          'Academic',
          'Boarding',
          'Kitchen',
          'Personal',
          'Sports',
          'Laboratory',
          'Library',
          'Others'
        ),
        allowNull: false,
        defaultValue: 'Others',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      quantityRequired: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      unit: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'piece',
      },
      appliesTo: {
        type: Sequelize.ENUM(
          'whole_school',
          'specific_class',
          'boarding_only',
          'girls_only',
          'boys_only'
        ),
        allowNull: false,
        defaultValue: 'whole_school',
      },
      genderRestriction: {
        type: Sequelize.ENUM('all', 'male', 'female'),
        allowNull: false,
        defaultValue: 'all',
      },
      boardingOption: {
        type: Sequelize.ENUM('all', 'boarding', 'day'),
        allowNull: false,
        defaultValue: 'all',
      },
      classId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Classes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      academicYear: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      term: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      activeStatus: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('Requirements');
  },
};