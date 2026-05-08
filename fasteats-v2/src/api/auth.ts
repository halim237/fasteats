import { api } from './apiClient';
import type { User } from '../types';

interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) => api.post<AuthResponse>('/auth/register', data),
};
