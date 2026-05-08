const express = require('express');
const pool = require('../db');

const router = express.Router();

// ===================================================
// GET /api/restaurants — كل المطاعم مع tags
// ===================================================
router.get('/', async (_req, res) => {
  try {
    // جلب المطاعم
    const restaurantsResult = await pool.query(
      `SELECT r.restaurant_id, r.name, r.location, r.phone, r.image, r.rating,
              m.menu_id, m.name AS menu_name,
              COALESCE(
                json_agg(DISTINCT rt.tag) FILTER (WHERE rt.tag IS NOT NULL),
                '[]'
              ) AS tags
       FROM restaurants r
       LEFT JOIN menus m ON m.restaurant_id = r.restaurant_id
       LEFT JOIN restaurant_tags rt ON rt.restaurant_id = r.restaurant_id
       GROUP BY r.restaurant_id, r.name, r.location, r.phone, r.image, r.rating, m.menu_id, m.name
       ORDER BY r.rating DESC`
    );

    // لكل مطعم، نجلب عدد أصناف القائمة
    const restaurants = await Promise.all(
      restaurantsResult.rows.map(async (row) => {
        const itemsCount = await pool.query(
          'SELECT COUNT(*) FROM menu_items WHERE menu_id = $1',
          [row.menu_id]
        );

        return {
          restaurantId: row.restaurant_id,
          name: row.name,
          location: row.location,
          phone: row.phone,
          image: row.image,
          rating: parseFloat(row.rating),
          tags: row.tags,
          menu: {
            menuId: row.menu_id,
            name: row.menu_name,
            itemsCount: parseInt(itemsCount.rows[0].count),
          },
        };
      })
    );

    res.json(restaurants);
  } catch (err) {
    console.error('GET /restaurants error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب المطاعم' });
  }
});

// ===================================================
// GET /api/restaurants/:id — تفاصيل مطعم واحد + قائمته
// ===================================================
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // بيانات المطعم
    const restaurantResult = await pool.query(
      `SELECT r.restaurant_id, r.name, r.location, r.phone, r.image, r.rating,
              m.menu_id, m.name AS menu_name,
              COALESCE(
                json_agg(DISTINCT rt.tag) FILTER (WHERE rt.tag IS NOT NULL),
                '[]'
              ) AS tags
       FROM restaurants r
       LEFT JOIN menus m ON m.restaurant_id = r.restaurant_id
       LEFT JOIN restaurant_tags rt ON rt.restaurant_id = r.restaurant_id
       WHERE r.restaurant_id = $1
       GROUP BY r.restaurant_id, r.name, r.location, r.phone, r.image, r.rating, m.menu_id, m.name`,
      [id]
    );

    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({ error: 'المطعم غير موجود' });
    }

    const row = restaurantResult.rows[0];

    const showAll = req.query.all === 'true';

    let itemsQuery = `
       SELECT item_id, name, price, description, image, is_available
       FROM menu_items
       WHERE menu_id = $1
    `;
    
    if (!showAll) {
      itemsQuery += ` AND is_available = true`;
    }
    
    itemsQuery += ` ORDER BY name`;

    // أصناف القائمة
    const itemsResult = await pool.query(itemsQuery, [row.menu_id]);

    const restaurant = {
      restaurantId: row.restaurant_id,
      name: row.name,
      location: row.location,
      phone: row.phone,
      image: row.image,
      rating: parseFloat(row.rating),
      tags: row.tags,
      menu: {
        menuId: row.menu_id,
        name: row.menu_name,
        items: itemsResult.rows.map((item) => ({
          itemId: item.item_id,
          name: item.name,
          price: parseFloat(item.price),
          description: item.description,
          image: item.image,
          isAvailable: item.is_available,
        })),
      },
    };

    res.json(restaurant);
  } catch (err) {
    console.error('GET /restaurants/:id error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب بيانات المطعم' });
  }
});

// ===================================================
// POST /api/restaurants — إضافة مطعم جديد
// ===================================================
router.post('/', async (req, res) => {
  const { name, location, phone, image, tags } = req.body;

  try {
    // 1. إضافة المطعم
    const result = await pool.query(
      'INSERT INTO restaurants (name, location, phone, image, rating) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, location, phone, image, 4.5] // Default rating 4.5
    );
    const newRes = result.rows[0];

    // 2. إنشاء قائمة افتراضية للمطعم
    await pool.query(
      'INSERT INTO menus (restaurant_id, name) VALUES ($1, $2)',
      [newRes.restaurant_id, `Menu de ${newRes.name}`]
    );

    // 3. إضافة الوسوم إذا وجدت
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        await pool.query(
          'INSERT INTO restaurant_tags (restaurant_id, tag) VALUES ($1, $2)',
          [newRes.restaurant_id, tag]
        );
      }
    }

    res.status(201).json(newRes);
  } catch (err) {
    console.error('POST /restaurants error:', err.message);
    res.status(500).json({ error: 'خطأ في إضافة المطعم' });
  }
});

// ===================================================
// DELETE /api/restaurants/:id — حذف مطعم
// ===================================================
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM restaurants WHERE restaurant_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المطعم غير موجود' });
    }
    res.json({ message: 'تم حذف المطعم بنجاح' });
  } catch (err) {
    console.error('DELETE /restaurants error:', err.message);
    res.status(500).json({ error: 'خطأ في حذف المطعم' });
  }
});

// ===================================================
// PATCH /api/restaurants/:id — تحديث بيانات مطعم
// ===================================================
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, location, phone, image, tags } = req.body;

  try {
    // 1. تحديث الجدول الأساسي
    await pool.query(
      'UPDATE restaurants SET name = $1, location = $2, phone = $3, image = $4 WHERE restaurant_id = $5',
      [name, location, phone, image, id]
    );

    // 2. تحديث الوسوم (ببساطة: حذف وإعادة إضافة)
    if (tags && Array.isArray(tags)) {
      await pool.query('DELETE FROM restaurant_tags WHERE restaurant_id = $1', [id]);
      for (const tag of tags) {
        await pool.query(
          'INSERT INTO restaurant_tags (restaurant_id, tag) VALUES ($1, $2)',
          [id, tag]
        );
      }
    }

    res.json({ message: 'تم تحديث بيانات المطعم' });
  } catch (err) {
    console.error('PATCH /restaurants error:', err.message);
    res.status(500).json({ error: 'خطأ في تحديث المطعم' });
  }
});

// ===================================================
// POST /api/restaurants/:id/menu — إضافة صنف لقائمة المطعم
// ===================================================
router.post('/:id/menu', async (req, res) => {
  const { id } = req.params;
  const { name, price, description, image, isAvailable = true } = req.body;

  try {
    // 1. Get the menu_id for this restaurant
    const menuResult = await pool.query('SELECT menu_id FROM menus WHERE restaurant_id = $1', [id]);
    
    if (menuResult.rows.length === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على قائمة طعام لهذا المطعم' });
    }

    const menuId = menuResult.rows[0].menu_id;

    // 2. Insert the new menu item
    const result = await pool.query(
      `INSERT INTO menu_items (menu_id, name, price, description, image, is_available) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [menuId, name, price, description, image, isAvailable]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /restaurants/:id/menu error:', err.message);
    res.status(500).json({ error: 'خطأ في إضافة الصنف للقائمة' });
  }
});

// ===================================================
// DELETE /api/restaurants/:id/menu/:itemId — حذف صنف من قائمة المطعم
// ===================================================
router.delete('/:id/menu/:itemId', async (req, res) => {
  const { id, itemId } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM menu_items 
       WHERE item_id = $1 
         AND menu_id IN (SELECT menu_id FROM menus WHERE restaurant_id = $2)
       RETURNING *`,
      [itemId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الصنف غير موجود أو لا ينتمي لهذا المطعم' });
    }

    res.json({ message: 'تم حذف الصنف بنجاح' });
  } catch (err) {
    console.error('DELETE /restaurants/:id/menu/:itemId error:', err.message);
    res.status(500).json({ error: 'خطأ في حذف الصنف' });
  }
});

// ===================================================
// PATCH /api/restaurants/:id/menu/:itemId/availability — تحديث حالة توفر صنف
// ===================================================
router.patch('/:id/menu/:itemId/availability', async (req, res) => {
  const { id, itemId } = req.params;
  const { isAvailable } = req.body;

  try {
    const result = await pool.query(
      `UPDATE menu_items 
       SET is_available = $1 
       WHERE item_id = $2 
         AND menu_id IN (SELECT menu_id FROM menus WHERE restaurant_id = $3)
       RETURNING *`,
      [isAvailable, itemId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الصنف غير موجود أو لا ينتمي لهذا المطعم' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /restaurants/:id/menu/:itemId/availability error:', err.message);
    res.status(500).json({ error: 'خطأ في تحديث حالة التوفر' });
  }
});

module.exports = router;
