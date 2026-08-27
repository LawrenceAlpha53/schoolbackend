'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ReportPickups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      studentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Students',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      secretaryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      term: {
        type: Sequelize.STRING,
        allowNull: false
      },
      academicYear: {
        type: Sequelize.STRING,
        allowNull: false
      },
      pickupDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      pickupTime: {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isPicked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    await queryInterface.addConstraint('ReportPickups', {
      fields: ['studentId', 'term', 'academicYear'],
      type: 'unique',
      name: 'unique_report_pickup_per_student_term'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ReportPickups');
  }
};