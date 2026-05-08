import type { User } from '../types';

// ⚠️ تم حذف المستخدمين الوهميين — يتم التحقق من المستخدمين عبر قاعدة البيانات SQL
// يجب استبدال هذا الملف بـ API calls حقيقية للمصادقة

export const MOCK_USERS: User[] = [];
// سيتم التحقق من المستخدمين عبر API مثل:
// POST /api/auth/login  { email, password }
// POST /api/auth/register { name, email, password, phone, address }
