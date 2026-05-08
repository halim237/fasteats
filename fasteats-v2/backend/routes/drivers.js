const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    if (req.user.role !== 'Driver' && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'غير مصرح لك بالدخول كعامل توصيل' });
    }
    next();
  } catch {
    res.status(401).json({ error: 'جلسة منتهية، يرجى تسجيل الدخول مجدداً' });
  }
}

// Get available orders to pick up
router.get('/orders/available', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.order_id, o.total_price, o.order_time, o.status,
              r.name AS restaurant_name, r.location AS restaurant_location,
              u.name AS customer_name, u.phone AS customer_phone, u.address AS customer_address,
              d.delivery_id
       FROM orders o
       JOIN restaurants r ON r.restaurant_id = o.restaurant_id
       JOIN users u ON u.user_id = o.customer_id
       LEFT JOIN deliveries d ON d.order_id = o.order_id
       WHERE (o.status = 'pending' OR o.status = 'preparing') AND d.driver_id IS NULL
       ORDER BY o.order_time ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching available orders:', err.message);
    res.status(500).json({ error: 'خطأ في جلب الطلبات المتاحة' });
  }
});

// Get my deliveries
router.get('/orders/my', authenticate, async (req, res) => {
  try {
    const driverRes = await pool.query('SELECT driver_id FROM drivers WHERE user_id = $1', [req.user.userId]);
    if (driverRes.rows.length === 0) {
      return res.json([]);
    }
    const driverId = driverRes.rows[0].driver_id;

    const result = await pool.query(
      `SELECT o.order_id, o.total_price, o.order_time, o.status,
              r.name AS restaurant_name, r.location AS restaurant_location,
              u.name AS customer_name, u.phone AS customer_phone, u.address AS customer_address,
              d.delivery_id, d.status AS delivery_status
       FROM orders o
       JOIN restaurants r ON r.restaurant_id = o.restaurant_id
       JOIN users u ON u.user_id = o.customer_id
       JOIN deliveries d ON d.order_id = o.order_id
       WHERE d.driver_id = $1 AND o.status != 'delivered' AND o.status != 'cancelled'
       ORDER BY o.order_time ASC`,
      [driverId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching my deliveries:', err.message);
    res.status(500).json({ error: 'خطأ في جلب طلباتي' });
  }
});

// Accept an order
router.post('/orders/:orderId/accept', authenticate, async (req, res) => {
  const { orderId } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let driverRes = await pool.query('SELECT driver_id FROM drivers WHERE user_id = $1', [req.user.userId]);
    let driverId;
    if (driverRes.rows.length === 0) {
      const insertDriver = await client.query(
        'INSERT INTO drivers (user_id, vehicle_info) VALUES ($1, $2) RETURNING driver_id',
        [req.user.userId, 'Standard Vehicle']
      );
      driverId = insertDriver.rows[0].driver_id;
    } else {
      driverId = driverRes.rows[0].driver_id;
    }

    const orderRes = await client.query('SELECT driver_id FROM deliveries WHERE order_id = $1 FOR UPDATE', [orderId]);
    if (orderRes.rows.length === 0) {
      throw new Error('الطلب غير موجود');
    }
    if (orderRes.rows[0].driver_id !== null) {
      throw new Error('تم قبول هذا الطلب من قبل سائق آخر');
    }

    await client.query(
      `UPDATE deliveries SET driver_id = $1, status = 'picked_up', pickup_time = NOW() WHERE order_id = $2`,
      [driverId, orderId]
    );

    await client.query(
      `UPDATE orders SET status = 'delivering' WHERE order_id = $1`,
      [orderId]
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Accept order error:', err.message);
    res.status(400).json({ error: err.message || 'خطأ في قبول الطلب' });
  } finally {
    client.release();
  }
});

// Deliver an order
router.post('/orders/:orderId/deliver', authenticate, async (req, res) => {
  const { orderId } = req.params;
  try {
    await pool.query(`UPDATE deliveries SET status = 'delivered', delivery_time = NOW() WHERE order_id = $1`, [orderId]);
    await pool.query(`UPDATE orders SET status = 'delivered' WHERE order_id = $1`, [orderId]);
    await pool.query(`UPDATE payments SET status = 'completed', payment_time = NOW() WHERE order_id = $1`, [orderId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Deliver order error:', err.message);
    res.status(500).json({ error: 'خطأ في تسليم الطلب' });
  }
});

module.exports = router;
