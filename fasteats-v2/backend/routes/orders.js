const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// ===== Middleware: التحقق من JWT =====
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'جلسة منتهية، يرجى تسجيل الدخول مجدداً' });
  }
}

// ===================================================
// POST /api/orders — إنشاء طلب جديد
// ===================================================
router.post('/', authenticate, async (req, res) => {
  const { restaurantId, items, paymentMethod = 'cash' } = req.body;
  const customerId = req.user.userId;

  if (!restaurantId || !items || items.length === 0) {
    return res.status(400).json({ error: 'بيانات الطلب غير مكتملة' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const totalPrice = items.reduce(
      (sum, item) => sum + item.price * (item.quantity || 1),
      0
    );

    const orderId = uuidv4();
    const now = new Date().toISOString();

    // إنشاء الطلب
    await client.query(
      `INSERT INTO orders (order_id, customer_id, restaurant_id, total_price, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [orderId, customerId, restaurantId, totalPrice]
    );

    // إدراج أصناف الطلب
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, item_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.itemId, item.quantity || 1, item.price]
      );
    }

    // إنشاء الدفع
    const paymentId = 'pay_' + uuidv4().slice(0, 8);
    await client.query(
      `INSERT INTO payments (payment_id, order_id, amount, method, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [paymentId, orderId, totalPrice, paymentMethod]
    );

    // إنشاء التوصيل
    const deliveryId = 'del_' + uuidv4().slice(0, 8);
    await client.query(
      `INSERT INTO deliveries (delivery_id, order_id, status)
       VALUES ($1, $2, 'pending')`,
      [deliveryId, orderId]
    );

    // إنشاء QR Seal
    const qrCode = 'QR_' + uuidv4().slice(0, 8).toUpperCase();
    await client.query(
      `INSERT INTO qr_seals (order_id, qr_code, is_valid, generated_time)
       VALUES ($1, $2, true, NOW())`,
      [orderId, qrCode]
    );

    await client.query('COMMIT');

    res.status(201).json({
      orderId,
      customerId,
      restaurantId,
      totalPrice,
      orderTime: now,
      status: 'pending',
      items,
      payment: {
        paymentId,
        amount: totalPrice,
        method: paymentMethod,
        paymentTime: now,
        status: 'pending',
      },
      delivery: {
        deliveryId,
        status: 'pending',
      },
      qrSeal: {
        qrCode,
        isValid: true,
        generatedTime: now,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /orders error:', err.message);
    res.status(500).json({ error: 'خطأ في إنشاء الطلب' });
  } finally {
    client.release();
  }
});

// ===================================================
// GET /api/orders/my — طلبات المستخدم الحالي
// ===================================================
router.get('/my', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.order_id, o.restaurant_id, r.name AS restaurant_name,
              o.total_price, o.order_time, o.status,
              q.qr_code, p.method AS payment_method
       FROM orders o
       JOIN restaurants r ON r.restaurant_id = o.restaurant_id
       LEFT JOIN qr_seals q ON q.order_id = o.order_id
       LEFT JOIN payments p ON p.order_id = o.order_id
       WHERE o.customer_id = $1
       ORDER BY o.order_time DESC`,
      [req.user.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('GET /orders/my error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب الطلبات' });
  }
});

// ===================================================
// GET /api/orders/admin — كل الطلبات (Admin فقط)
// ===================================================
router.get('/admin', authenticate, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'غير مصرح' });
  }

  try {
    const result = await pool.query(
      `SELECT o.order_id, o.customer_id, u.name AS customer_name,
              o.restaurant_id, r.name AS restaurant_name,
              o.total_price, o.order_time, o.status,
              p.method AS payment_method, p.status AS payment_status
       FROM orders o
       JOIN users u ON u.user_id = o.customer_id
       JOIN restaurants r ON r.restaurant_id = o.restaurant_id
       LEFT JOIN payments p ON p.order_id = o.order_id
       ORDER BY o.order_time DESC
       LIMIT 100`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('GET /orders/admin error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب الطلبات' });
  }
});

// ===================================================
// PATCH /api/orders/:id/status — تحديث حالة الطلب
// ===================================================
router.patch('/:id/status', authenticate, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // pending, preparing, delivering, delivered, cancelled

  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'غير مصرح' });
  }

  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    // إذا تم التوصيل، نحدث حالة الدفع أيضاً لتصبح مكتملة
    if (status === 'delivered') {
      await pool.query(
        "UPDATE payments SET status = 'completed', payment_time = NOW() WHERE order_id = $1",
        [id]
      );
      await pool.query(
        "UPDATE deliveries SET status = 'delivered', delivery_time = NOW() WHERE order_id = $1",
        [id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /orders/:id/status error:', err.message);
    res.status(500).json({ error: 'خطأ في تحديث حالة الطلب' });
  }
});

module.exports = router;
