const pool = require('./db');

async function seed() {
  if (process.env.NODE_ENV === 'production' || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('onrender.com'))) {
    console.warn('⚠️  Cannot run seed script on a production/Render database. Exiting.');
    process.exit(0);
  }

  try {
    console.log('🔄 جاري إضافة مطاعم تجريبية...');

    // إدخال مطاعم
    const res = await pool.query(`
      INSERT INTO restaurants (name, location, phone, image, rating) VALUES
      ('مطعم البركة', 'الجزائر العاصمة', '0555123456', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', 4.5),
      ('بيتزا نابولي', 'وهران', '0666123456', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80', 4.8),
      ('برجر كينج السريع', 'قسنطينة', '0777123456', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', 4.2),
      ('سوشي ماستر', 'عنابة', '0550998877', 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=80', 4.9)
      RETURNING restaurant_id, name;
    `);

    const restaurants = res.rows;
    
    // إضافة وسوم لكل مطعم
    for (let i = 0; i < restaurants.length; i++) {
      let rId = restaurants[i].restaurant_id;
      let tags = [];
      if (i === 0) tags = ['جزائري', 'تقليدي'];
      if (i === 1) tags = ['بيتزا', 'إيطالي'];
      if (i === 2) tags = ['برجر', 'وجبات سريعة'];
      if (i === 3) tags = ['سوشي', 'آسيوي'];
      
      for (let tag of tags) {
        await pool.query('INSERT INTO restaurant_tags (restaurant_id, tag) VALUES ($1, $2)', [rId, tag]);
      }

      // إنشاء قائمة (Menu) لكل مطعم
      const menuRes = await pool.query('INSERT INTO menus (restaurant_id, name) VALUES ($1, $2) RETURNING menu_id', [rId, 'القائمة الرئيسية']);
      const menuId = menuRes.rows[0].menu_id;

      // إضافة أصناف القائمة
      await pool.query(`
        INSERT INTO menu_items (menu_id, name, price, description, image) VALUES
        ($1, 'وجبة 1', 1200, 'وصف لذيذ للوجبة الأولى', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'),
        ($1, 'وجبة 2', 800, 'وصف للوجبة الثانية', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80')
      `, [menuId]);
    }

    console.log('✅ تم إضافة المطاعم التجريبية بنجاح!');
  } catch (err) {
    console.error('❌ خطأ:', err.message);
  } finally {
    pool.end();
  }
}

seed();
