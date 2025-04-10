import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreKey } from "../constant";

interface AuthState {
  isAuthenticated: boolean;
  isRefreshing: boolean;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setRefreshing: (isRefreshing: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isRefreshing: false,
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setRefreshing: (isRefreshing) => set({ isRefreshing }),
    }),
    {
      name: StoreKey.Auth,
    },
  ),
);
