'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ClassSubjects', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      classId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Classes',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      subjectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Subjects',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      isCompulsory: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      term: {
        type: Sequelize.STRING,
        allowNull: true
      },
      academicYear: {
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

    await queryInterface.addConstraint('ClassSubjects', {
      fields: ['classId', 'subjectId'],
      type: 'unique',
      name: 'ClassSubjects_classId_subjectId_unique'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ClassSubjects');
  }
};