import type { Restaurant } from '../types';

// ⚠️ تم حذف البيانات الوهمية — يتم جلب البيانات من قاعدة البيانات SQL
// يجب استبدال هذا الملف باستدعاءات API تجلب البيانات من الخادم

export const RESTAURANTS: Restaurant[] = [];
// سيتم ملؤها من قاعدة البيانات عبر API مثل:
// const response = await fetch('/api/restaurants');
// const data = await response.json();
