const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function setupDatabase() {
  if (process.env.NODE_ENV === 'production' || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('onrender.com'))) {
    console.warn('⚠️  Cannot run setup-db on a production/Render database. Exiting to protect data.');
    process.exit(0);
  }

  try {
    console.log('🔄 جاري تنظيف وإعداد قاعدة البيانات...');
    
    // 1. Drop and recreate public schema to wipe all existing tables/enums
    await pool.query('DROP SCHEMA public CASCADE;');
    await pool.query('CREATE SCHEMA public;');
    await pool.query('GRANT ALL ON SCHEMA public TO postgres;');
    await pool.query('GRANT ALL ON SCHEMA public TO public;');

    // 2. Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'fasteats_database.txt');
    const sqlQuery = fs.readFileSync(sqlPath, 'utf8');

    // 3. Execute the queries
    await pool.query(sqlQuery);
    
    console.log('✅ تم إعادة بناء قاعدة البيانات والجداول بنجاح!');
  } catch (error) {
    console.error('❌ حدث خطأ أثناء إعداد قاعدة البيانات:', error.message);
  } finally {
    pool.end();
  }
}

setupDatabase();
