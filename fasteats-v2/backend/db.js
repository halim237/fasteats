const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('✅ متصل بقاعدة البيانات PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ خطأ في اتصال PostgreSQL:', err.message);
});

module.exports = pool;
