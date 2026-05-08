const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware: التحقق من JWT (Admin فقط)
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول كأدمن' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'Admin') {
      return res.status(403).json({ error: 'غير مصرح لك بالدخول' });
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'جلسة منتهية' });
  }
}

// GET /api/admin/stats
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const restaurantCount = await pool.query('SELECT COUNT(*)::int FROM restaurants');
    const orderCount = await pool.query('SELECT COUNT(*)::int FROM orders');
    const userCount = await pool.query('SELECT COUNT(*)::int FROM users');
    const revenueResult = await pool.query('SELECT SUM(total_price)::float FROM orders WHERE status = $1', ['delivered']);

    res.json({
      restaurantCount: restaurantCount.rows[0].count || 0,
      orderCount: orderCount.rows[0].count || 0,
      userCount: userCount.rows[0].count || 0,
      monthlyRevenue: revenueResult.rows[0].sum || 0
    });
  } catch (err) {
    console.error('GET /admin/stats error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب الإحصائيات' });
  }
});

module.exports = router;
