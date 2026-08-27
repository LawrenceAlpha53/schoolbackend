const { Sequelize } = require('sequelize');
const config = require('./config/config.json').development;

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect
});

async function fixTable() {
  try {
    await sequelize.query(`
      DROP TABLE IF EXISTS "ClassSubjects" CASCADE;
      
      CREATE TABLE "ClassSubjects" (
        id SERIAL PRIMARY KEY,
        "classId" INTEGER NOT NULL REFERENCES "Classes"(id) ON DELETE CASCADE,
        "subjectId" INTEGER NOT NULL REFERENCES "Subjects"(id) ON DELETE CASCADE,
        "isCompulsory" BOOLEAN DEFAULT false,
        "term" VARCHAR(255),
        "academicYear" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE("classId", "subjectId")
      );
    `);
    console.log('✅ ClassSubjects table fixed!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixTable();