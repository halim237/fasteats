import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favorites: string[]; // Array of restaurant IDs
  toggleFavorite: (restaurantId: string) => void;
  isFavorite: (restaurantId: string) => boolean;
  clearFavorites: () => void;
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (restaurantId) =>
        set((state) => {
          if (state.favorites.includes(restaurantId)) {
            return { favorites: state.favorites.filter((id) => id !== restaurantId) };
          } else {
            return { favorites: [...state.favorites, restaurantId] };
          }
        }),
      isFavorite: (restaurantId) => get().favorites.includes(restaurantId),
      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: 'fasteats-favorites',
    }
  )
);
