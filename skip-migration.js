const { Sequelize } = require('sequelize');
const config = require('./config/config.json').development;

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect
});

async function skipMigration() {
  try {
    await sequelize.query(`
      INSERT INTO "SequelizeMeta" (name) VALUES ('create-sms-transactions.js')
    `);
    console.log('✅ Skipped create-sms-transactions migration');
  } catch (error) {
    if (error.message.includes('duplicate')) {
      console.log('Already skipped');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await sequelize.close();
  }
}

skipMigration();