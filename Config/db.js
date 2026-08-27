const { Pool } = require('pg');

const pool = new Pool({
    user: 'Lawrence',
    host: 'localhost',
    database: 'postgres',
    password: 'Lawrence5379',
    port: 5432,
});

// ONLY LOG ONCE
pool.connect()
    .then(() => console.log('✅ Database connected successfully'))
    .catch(err => console.error('❌ DB Connection Error:', err.stack));

module.exports = pool;