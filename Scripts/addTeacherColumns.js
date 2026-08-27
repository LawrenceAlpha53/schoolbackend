// scripts/addTeacherColumns.js
// Run this script ONCE to add missing columns to the Teachers table.
// Usage: node scripts/addTeacherColumns.js

const { sequelize } = require('../models');

const columns = [
  { name: 'fullName', type: 'VARCHAR(255)', options: 'NOT NULL DEFAULT \'\'' },
  { name: 'employeeNumber', type: 'VARCHAR(255)', options: 'UNIQUE' },
  { name: 'email', type: 'VARCHAR(255)', options: 'UNIQUE' },
  { name: 'phoneNumber', type: 'VARCHAR(255)' },
  { name: 'basicSalary', type: 'DECIMAL(15,2)', options: 'DEFAULT 0' },
  { name: 'qualification', type: 'VARCHAR(255)' },
  { name: 'yearsOfExperience', type: 'INTEGER', options: 'DEFAULT 0' },
  { name: 'status', type: 'VARCHAR(50)', options: 'DEFAULT \'Active\'' },
  { name: 'userId', type: 'INTEGER', options: 'REFERENCES "Users"("id") ON DELETE SET NULL' },
  { name: 'alternativePhone', type: 'VARCHAR(255)' },
  { name: 'dateOfBirth', type: 'DATE' },
  { name: 'gender', type: 'VARCHAR(20)' },
  { name: 'nationalId', type: 'VARCHAR(255)', options: 'UNIQUE' },
  { name: 'specialization', type: 'VARCHAR(255)' },
  { name: 'startDate', type: 'DATE' },
  { name: 'employmentStatus', type: 'VARCHAR(50)', options: 'DEFAULT \'Contract\'' },
  { name: 'salaryScale', type: 'VARCHAR(255)' },
  { name: 'bankName', type: 'VARCHAR(255)' },
  { name: 'bankAccountNumber', type: 'VARCHAR(255)' },
  { name: 'emergencyContactName', type: 'VARCHAR(255)' },
  { name: 'emergencyContactPhone', type: 'VARCHAR(255)' },
  { name: 'emergencyContactRelation', type: 'VARCHAR(255)' },
  { name: 'homeAddress', type: 'TEXT' },
  { name: 'district', type: 'VARCHAR(255)' },
  { name: 'subCounty', type: 'VARCHAR(255)' },
  { name: 'village', type: 'VARCHAR(255)' },
  { name: 'isActive', type: 'BOOLEAN', options: 'DEFAULT TRUE' },
  { name: 'terminationDate', type: 'DATE' },
  { name: 'terminationReason', type: 'TEXT' },
];

async function addMissingColumns() {
  try {
    // Ensure the table exists
    await sequelize.query(`CREATE TABLE IF NOT EXISTS "Teachers" (id SERIAL PRIMARY KEY);`);

    for (const col of columns) {
      // Check if column already exists
      const [results] = await sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name='Teachers' AND column_name='${col.name}';`
      );
      if (results.length === 0) {
        const sql = `ALTER TABLE "Teachers" ADD COLUMN "${col.name}" ${col.type} ${col.options || ''};`;
        await sequelize.query(sql);
        console.log(`✅ Added column: ${col.name}`);
      } else {
        console.log(`⏩ Column ${col.name} already exists, skipping.`);
      }
    }
    console.log('✅ All missing columns added to Teachers table.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    process.exit(1);
  }
}

addMissingColumns();