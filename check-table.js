// check-table.js
const { Sequelize } = require('sequelize');
const config = require('./config/config.json').development;
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  port: config.port || 5432
});

sequelize.query(
  "SELECT table_name FROM information_schema.tables WHERE table_name ILIKE '%teacher%'"
).then(r => {
  console.log('Tables found:', r[0]);
  sequelize.close();
}).catch(e => {
  console.log('Error:', e.message);
  sequelize.close();
});