// migrations/xxxxxxxxxxxxxx-create-teacher-attendances.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TeacherAttendances', {
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
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      status: {
        type: Sequelize.ENUM('signed_in', 'signed_out', 'emergency_signed_out', 'present', 'absent', 'late', 'excused'),
        allowNull: false,
        defaultValue: 'absent'
      },
      checkInTime: {
        type: Sequelize.TIME,
        allowNull: true
      },
      checkOutTime: {
        type: Sequelize.TIME,
        allowNull: true
      },
      allowance: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      },
      allowanceReason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      emergencyReason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      hoursWorked: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add unique constraint for teacherId and date
    await queryInterface.addConstraint('TeacherAttendances', {
      fields: ['teacherId', 'date'],
      type: 'unique',
      name: 'unique_teacher_attendance_per_day'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('TeacherAttendances');
  }
};