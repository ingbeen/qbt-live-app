import { create } from 'zustand';

export type AuthUser = {
  uid: string;
  email: string | null;
};

interface Store {
  user: AuthUser | null;
  isOnline: boolean;
  lastError: string | null;

  setUser: (user: AuthUser | null) => void;
  setOnline: (online: boolean) => void;
  setLastError: (error: string | null) => void;
  clearAll: () => void;
}

export const useStore = create<Store>((set) => ({
  user: null,
  isOnline: true,
  lastError: null,

  setUser: (user) => set({ user }),
  setOnline: (online) => set({ isOnline: online }),
  setLastError: (lastError) => set({ lastError }),
  clearAll: () => set({ user: null, lastError: null }),
}));
