// create-table.js
const { Sequelize } = require('sequelize');
const config = require('./config/config.json').development;
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  port: config.port || 5432
});

sequelize.query(`
  CREATE TABLE IF NOT EXISTS "TeacherAttendances" (
    id SERIAL PRIMARY KEY,
    "teacherId" INTEGER NOT NULL REFERENCES "Teachers"(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'signed_in',
    "checkInTime" TIME,
    "checkOutTime" TIME,
    "hoursWorked" DECIMAL(5,2),
    allowance DECIMAL(12,2) DEFAULT 0,
    "emergencyReason" TEXT,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  )
`).then(() => {
  console.log('Table created!');
  sequelize.close();
}).catch(e => {
  console.log('Error:', e.message);
  sequelize.close();
});