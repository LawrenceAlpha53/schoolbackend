// migrations/XXXXXXXXXXXXXX-create-subjects-table.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Subjects', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      subjectName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subjectCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      level: {
        type: Sequelize.ENUM('olevel', 'alevel'),
        allowNull: false,
        defaultValue: 'olevel'
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'core'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isCompulsory: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      examinable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      classId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Classes',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
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
    await queryInterface.dropTable('Subjects');
  }
};