'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Check if the column already exists
    const tableDescription = await queryInterface.describeTable('Users');
    const columnExists = !!tableDescription.status;

    // 2. Create the ENUM type (safe – does nothing if it already exists)
    await queryInterface.sequelize.query(
      `DO $$ BEGIN
        CREATE TYPE "enum_Users_status" AS ENUM ('active', 'blocked', 'inactive');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`
    );

    // 3. Add the column only if it does NOT exist
    if (!columnExists) {
      await queryInterface.addColumn('Users', 'status', {
        type: Sequelize.ENUM('active', 'blocked', 'inactive'),
        defaultValue: 'active',
        allowNull: false,
      });
      console.log('✅ Added status column to Users.');
    } else {
      console.log('⏩ Column "status" already exists – skipping addColumn.');
      
      // (Optional) Ensure all rows have a value – set to 'active' if NULL
      await queryInterface.sequelize.query(
        `UPDATE "Users" SET status = 'active' WHERE status IS NULL;`
      );
    }
  },

  async down(queryInterface) {
    // Only remove the column if it exists
    const tableDescription = await queryInterface.describeTable('Users');
    if (tableDescription.status) {
      await queryInterface.removeColumn('Users', 'status');
    }
    // We do NOT drop the ENUM type here to avoid breaking other tables that might use it.
  },
};