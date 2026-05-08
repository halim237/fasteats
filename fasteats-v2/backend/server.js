require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const driverRoutes = require('./routes/drivers');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== Middleware =====
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true,
}));
app.use(express.json());

// ===== Routes =====
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/drivers', driverRoutes);

// ===== Health Check =====
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'FastEats Backend يعمل ✅' });
});

// ===== Global Error Handler =====
app.use((err, _req, res, _next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ error: 'خطأ داخلي في الخادم' });
});

// ===== Start =====
app.listen(PORT, () => {
  console.log(`🚀 FastEats Backend يعمل على http://localhost:${PORT}`);
});
