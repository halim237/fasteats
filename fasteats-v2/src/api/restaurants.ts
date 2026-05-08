import { api } from './apiClient';
import type { Restaurant } from '../types';

export const restaurantApi = {
  getAll: () => api.get<Restaurant[]>('/restaurants'),
  getById: (id: string) => api.get<Restaurant>(`/restaurants/${id}`),
};
