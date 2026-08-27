'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create join table
    await queryInterface.createTable('TeacherSubjects', {
      teacherId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Teachers', key: 'id' },
        onDelete: 'CASCADE'
      },
      subjectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Subjects', key: 'id' },
        onDelete: 'CASCADE'
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

    // 2. Migrate existing assignments
    const teachers = await queryInterface.sequelize.query(
      `SELECT id, "subjectId" FROM "Teachers" WHERE "subjectId" IS NOT NULL`
    );
    const rows = teachers[0] || [];
    if (rows.length > 0) {
      const insertValues = rows.map(t => ({
        teacherId: t.id,
        subjectId: t.subjectId,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      await queryInterface.bulkInsert('TeacherSubjects', insertValues);
    }

    // 3. Drop old subjectId column
    await queryInterface.removeColumn('Teachers', 'subjectId');
  },

  down: async (queryInterface, Sequelize) => {
    // Add back subjectId
    await queryInterface.addColumn('Teachers', 'subjectId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Subjects', key: 'id' },
      onDelete: 'SET NULL'
    });
    // We could restore data but it's complex; just drop the join table
    await queryInterface.dropTable('TeacherSubjects');
  }
};