const pool = require('./db');
const bcrypt = require('bcryptjs');

async function setDriver() {
  const hash = await bcrypt.hash('driver', 12);
  try {
    await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, address, role) 
       VALUES ('FastEats Driver', 'driver@fasteats.com', $1, '0660112233', 'Alger, Centre', 'Driver')
       ON CONFLICT (email) DO UPDATE SET role = 'Driver', password_hash = $1`,
      [hash]
    );
    console.log('Driver user created/updated: driver@fasteats.com / driver');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

setDriver();
