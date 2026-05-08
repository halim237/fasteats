import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MenuItem, Order, User } from '../types';
import { authApi } from '../api/auth';
import { api } from '../api/apiClient';
import { useFavorites } from './favoritesStore';

interface CartStore {
// ... (rest of the interface stays same)
  items: MenuItem[];
  isDrawerOpen: boolean;
  activeRestaurantId: string | null;
  currentUser: User | null;
  searchQuery: string;
  authLoading: boolean;
  authError: string | null;

  addItem: (item: MenuItem, restaurantId: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  setDrawerOpen: (open: boolean) => void;
  clearCart: () => void;
  setSearchQuery: (query: string) => void;

  // Replacement Modal state
  pendingReplacement: { item: MenuItem; restaurantId: string } | null;
  setPendingReplacement: (data: { item: MenuItem; restaurantId: string } | null) => void;
  confirmReplacement: () => void;

  // Auth — async مع قاعدة البيانات
  login: (email: string, pass: string) => Promise<boolean>;
  registerUser: (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) => Promise<boolean>;
  logout: () => void;

  // Order
  createOrder: (restaurantId: string) => Promise<Order>;
  getTotal: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      activeRestaurantId: null,
      currentUser: null,
      searchQuery: '',
      authLoading: false,
      authError: null,

      pendingReplacement: null as { item: MenuItem; restaurantId: string } | null,
      setPendingReplacement: (data: any) => set({ pendingReplacement: data }),
      
      confirmReplacement: () => set((state) => {
        if (!state.pendingReplacement) return state;
        return {
          items: [state.pendingReplacement.item],
          activeRestaurantId: state.pendingReplacement.restaurantId,
          isDrawerOpen: true,
          pendingReplacement: null,
        };
      }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      addItem: (item, restaurantId) =>
        set((state) => {
          if (state.activeRestaurantId && state.activeRestaurantId !== restaurantId) {
            // Trigger custom modal instead of window.confirm
            return { pendingReplacement: { item, restaurantId } };
          }
          return {
            items: [...state.items, item],
            isDrawerOpen: true,
            activeRestaurantId: restaurantId,
          };
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.itemId !== id) })),

      updateQuantity: (id, delta) =>
        set((state) => {
          if (delta > 0) {
            const item = state.items.find((i) => i.itemId === id);
            if (item) return { items: [...state.items, item] };
          } else {
            const index = state.items.findIndex((i) => i.itemId === id);
            if (index !== -1) {
              const newItems = [...state.items];
              newItems.splice(index, 1);
              return { items: newItems };
            }
          }
          return state;
        }),

      setDrawerOpen: (open) => set({ isDrawerOpen: open }),
      clearCart: () => set({ items: [], activeRestaurantId: null }),

      // ===== Auth — يتصل بـ PostgreSQL =====
      login: async (email, pass) => {
        set({ authLoading: true, authError: null });
        try {
          const { token, user } = await authApi.login(email, pass);
          localStorage.setItem('fasteats_token', token);
          
          // Clear favorites from previous session
          useFavorites.getState().clearFavorites();
          
          set({ currentUser: user, authLoading: false });
          return true;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'خطأ في تسجيل الدخول';
          set({ authError: message, authLoading: false });
          return false;
        }
      },

      registerUser: async (userData) => {
        set({ authLoading: true, authError: null });
        try {
          const { token, user } = await authApi.register(userData);
          localStorage.setItem('fasteats_token', token);
          
          // Clear favorites from previous session
          useFavorites.getState().clearFavorites();
          
          set({ currentUser: user, authLoading: false });
          return true;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'خطأ في إنشاء الحساب';
          set({ authError: message, authLoading: false });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('fasteats_token');
        useFavorites.getState().clearFavorites();
        set({ currentUser: null, items: [], activeRestaurantId: null });
      },

      // ===== Order — يحفظ في PostgreSQL =====
      createOrder: async (restaurantId) => {
        const { items, getTotal } = get();

        // تحضير الأصناف مع الكميات
        const itemsMap = new Map<string, { item: MenuItem; quantity: number }>();
        for (const item of items) {
          if (itemsMap.has(item.itemId)) {
            itemsMap.get(item.itemId)!.quantity += 1;
          } else {
            itemsMap.set(item.itemId, { item, quantity: 1 });
          }
        }
        const orderItems = Array.from(itemsMap.values()).map(({ item, quantity }) => ({
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity,
          isAvailable: item.isAvailable,
        }));

        const order = await api.post<Order>('/orders', {
          restaurantId,
          items: orderItems,
          paymentMethod: 'cash',
        });

        return order;
      },

      getTotal: () => get().items.reduce((acc, item) => acc + item.price, 0),
    }),
    {
      name: 'fasteats-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        items: state.items,
        activeRestaurantId: state.activeRestaurantId,
      }),
    }
  )
);
