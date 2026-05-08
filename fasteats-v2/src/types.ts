/**
 * Fast Eats Delivery System - Type Definitions
 * Based on the professional Class Diagram architecture.
 */

export type UserRole = 'Customer' | 'Driver' | 'Admin';

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  password?: string;
}

export interface Customer extends User {
  address: string;
  phone: string;
}

export interface Driver extends User {
  vehicleInfo: string;
  status: 'available' | 'busy' | 'offline';
}

export interface MenuItem {
  itemId: string;
  name: string;
  price: number;
  isAvailable: boolean;
  image?: string;
  description?: string;
}

export interface Menu {
  menuId: string;
  name: string;
  items: MenuItem[];
}

export interface Restaurant {
  restaurantId: string;
  name: string;
  location: string;
  phone: string;
  image: string;
  rating: number;
  tags: string[];
  menu: Menu;
}

export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

export interface Order {
  orderId: string;
  customerId: string;
  restaurantId: string;
  totalPrice: number;
  orderTime: string;
  status: OrderStatus;
  payment: Payment;
  delivery: Delivery;
  qrSeal: QRSeal;
  items: MenuItem[];
}

export interface Payment {
  paymentId: string;
  amount: number;
  method: 'cash' | 'card';
  paymentTime: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface Delivery {
  deliveryId: string;
  status: 'pending' | 'picked_up' | 'delivered';
  pickupTime?: string;
  deliveryTime?: string;
  driverId?: string;
}

export interface QRSeal {
  qrCode: string;
  isValid: boolean;
  generatedTime: string;
}

export interface Review {
  reviewId: string;
  orderId: string;
  customerId: string;
  rating: number;
  comment: string;
  reviewTime: string;
}
