const pool = require('./db');
const bcrypt = require('bcryptjs');

async function setAdmin() {
  try {
    const password = 'admin'; // يمكنك تغيير هذه الكلمة
    const hash = await bcrypt.hash(password, 12);
    
    // مسح المشرف القديم إن وجد
    await pool.query("DELETE FROM users WHERE email='admin@fasteats.com'");
    
    // إضافة المشرف الجديد بكلمة المرور "admin"
    await pool.query(`
      INSERT INTO users (name, email, password_hash, phone, address, role) 
      VALUES ('FastEats Admin', 'admin@fasteats.com', $1, '0550998877', 'HQ, Alger', 'Admin')
    `, [hash]);

    console.log('✅ تم إعداد حساب المشرف بنجاح!');
    console.log('---------------------------------');
    console.log('البريد الإلكتروني: admin@fasteats.com');
    console.log('كلمة المرور: admin');
    console.log('---------------------------------');

  } catch (err) {
    console.error('❌ خطأ:', err.message);
  } finally {
    pool.end();
  }
}

setAdmin();
