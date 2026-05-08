const { Pool } = require('pg');
require('dotenv').config();

console.log('DATABASE_URL is:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function test() {
  try {
    const res = await pool.query('SELECT 1 as val');
    console.log('DB connected:', res.rows);
  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    pool.end();
  }
}

test();
