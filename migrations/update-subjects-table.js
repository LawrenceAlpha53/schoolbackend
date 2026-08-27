// migrations/XXXXXXXXXXXXXX-update-subjects-table.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new columns
    await queryInterface.addColumn('Subjects', 'subjectCode', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Subjects', 'level', {
      type: Sequelize.ENUM('olevel', 'alevel'),
      allowNull: true,
      defaultValue: 'olevel'
    });

    await queryInterface.addColumn('Subjects', 'category', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'core'
    });

    await queryInterface.addColumn('Subjects', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Subjects', 'isCompulsory', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('Subjects', 'examinable', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });

    // Remove teacherName if exists
    try {
      await queryInterface.removeColumn('Subjects', 'teacherName');
    } catch (error) {
      console.log('teacherName column does not exist');
    }

    // Make classId nullable
    await queryInterface.changeColumn('Subjects', 'classId', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // Update existing records with default values
    await queryInterface.sequelize.query(`
      UPDATE "Subjects" 
      SET "subjectCode" = 'SUB' || id,
          "level" = 'olevel',
          "category" = 'core'
      WHERE "subjectCode" IS NULL
    `);

    // Make subjectCode NOT NULL after populating
    await queryInterface.changeColumn('Subjects', 'subjectCode', {
      type: Sequelize.STRING,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove new columns
    await queryInterface.removeColumn('Subjects', 'examinable');
    await queryInterface.removeColumn('Subjects', 'isCompulsory');
    await queryInterface.removeColumn('Subjects', 'description');
    await queryInterface.removeColumn('Subjects', 'category');
    await queryInterface.removeColumn('Subjects', 'level');
    await queryInterface.removeColumn('Subjects', 'subjectCode');

    // Add teacherName back
    await queryInterface.addColumn('Subjects', 'teacherName', {
      type: Sequelize.STRING
    });

    // Change classId back to NOT NULL
    await queryInterface.changeColumn('Subjects', 'classId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  }
};