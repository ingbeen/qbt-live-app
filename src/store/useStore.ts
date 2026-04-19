import { create } from 'zustand';
import type {
  Portfolio,
  Signal,
  PendingOrder,
  AssetId,
} from '../types/rtdb';
import {
  readPortfolio,
  readAllSignals,
  readAllPendingOrders,
  readInboxFills,
  readInboxBalanceAdjusts,
  readInboxFillDismiss,
  readInboxModelSync,
  type InboxItem,
} from '../services/rtdb';

export type AuthUser = {
  uid: string;
  email: string | null;
};

interface Store {
  // 인증 / 네트워크
  user: AuthUser | null;
  isOnline: boolean;
  lastError: string | null;

  // /latest/*
  portfolio: Portfolio | null;
  signals: Record<AssetId, Signal> | null;
  pendingOrders: Partial<Record<AssetId, PendingOrder>> | null;

  // inbox 4종
  inboxFills: InboxItem[] | null;
  inboxBalanceAdjusts: InboxItem[] | null;
  inboxFillDismiss: InboxItem[] | null;
  inboxModelSync: InboxItem[] | null;

  // UI
  loading: Partial<Record<string, boolean>>;

  // 액션: 세션
  setUser: (user: AuthUser | null) => void;
  setOnline: (online: boolean) => void;
  setLastError: (error: string | null) => void;
  clearAll: () => void;

  // 액션: 읽기
  refreshHome: () => Promise<void>;
}

const toUserMessage = (e: unknown): string => {
  const raw = e instanceof Error ? e.message : String(e);
  if (raw.includes('PERMISSION_DENIED') || raw.includes('permission')) {
    return '권한이 없습니다. OWNER_UID 설정을 확인하세요.';
  }
  if (raw.includes('timeout') || raw.includes('network')) {
    return '데이터를 불러올 수 없습니다. 잠시 후 다시 시도하세요.';
  }
  return '데이터를 불러올 수 없습니다.';
};

export const useStore = create<Store>((set, get) => ({
  user: null,
  isOnline: true,
  lastError: null,

  portfolio: null,
  signals: null,
  pendingOrders: null,

  inboxFills: null,
  inboxBalanceAdjusts: null,
  inboxFillDismiss: null,
  inboxModelSync: null,

  loading: {},

  setUser: (user) => set({ user }),
  setOnline: (online) => set({ isOnline: online }),
  setLastError: (lastError) => set({ lastError }),
  clearAll: () =>
    set({
      user: null,
      lastError: null,
      portfolio: null,
      signals: null,
      pendingOrders: null,
      inboxFills: null,
      inboxBalanceAdjusts: null,
      inboxFillDismiss: null,
      inboxModelSync: null,
      loading: {},
    }),

  refreshHome: async () => {
    set({ loading: { ...get().loading, home: true } });
    try {
      const [
        portfolio,
        signals,
        pendingOrders,
        inboxFills,
        inboxBalanceAdjusts,
        inboxFillDismiss,
        inboxModelSync,
      ] = await Promise.all([
        readPortfolio(),
        readAllSignals(),
        readAllPendingOrders(),
        readInboxFills(),
        readInboxBalanceAdjusts(),
        readInboxFillDismiss(),
        readInboxModelSync(),
      ]);
      set({
        portfolio,
        signals,
        pendingOrders,
        inboxFills,
        inboxBalanceAdjusts,
        inboxFillDismiss,
        inboxModelSync,
        lastError: null,
        loading: { ...get().loading, home: false },
      });
    } catch (e) {
      console.error('[store] refreshHome failed:', e);
      set({
        lastError: toUserMessage(e),
        loading: { ...get().loading, home: false },
      });
    }
  },
}));
