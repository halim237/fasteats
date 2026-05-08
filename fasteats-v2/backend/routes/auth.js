const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');

const router = express.Router();

// ===================================================
// POST /api/auth/register — تسجيل مستخدم جديد
// ===================================================
router.post('/register', async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور إلزامية' });
  }

  try {
    // التحقق من عدم وجود البريد مسبقاً
    const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'البريد الإلكتروني مستخدم مسبقاً' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    const result = await pool.query(
      `INSERT INTO users (user_id, name, email, password_hash, phone, address, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'Customer')
       RETURNING user_id, name, email, phone, address, role`,
      [userId, name, email, passwordHash, phone || null, address || null]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'خطأ في إنشاء الحساب' });
  }
});

// ===================================================
// POST /api/auth/login — تسجيل الدخول
// ===================================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور إلزاميان' });
  }

  try {
    const result = await pool.query(
      'SELECT user_id, name, email, phone, address, role, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'خطأ في تسجيل الدخول' });
  }
});

module.exports = router;
