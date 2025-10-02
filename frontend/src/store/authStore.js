import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ 
    user, 
    isAuthenticated: true, 
    isLoading: false 
  }),

  logout: () => set({ 
    user: null, 
    isAuthenticated: false, 
    isLoading: false 
  }),

  setLoading: (isLoading) => set({ isLoading }),
}));