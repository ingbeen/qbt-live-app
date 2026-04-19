import { create } from 'zustand';
import type {
  Portfolio,
  Signal,
  PendingOrder,
  AssetId,
  FillPayload,
  BalanceAdjustPayload,
  FillHistory,
  BalanceAdjustHistory,
} from '../types/rtdb';
import {
  readPortfolio,
  readAllSignals,
  readAllPendingOrders,
  readInboxFills,
  readInboxBalanceAdjusts,
  readInboxFillDismiss,
  readInboxModelSync,
  readHistoryFills,
  readHistoryBalanceAdjusts,
  readHistorySignals,
  submitModelSync as submitModelSyncRtdb,
  submitFill as submitFillRtdb,
  submitBalanceAdjust as submitBalanceAdjustRtdb,
  submitFillDismiss as submitFillDismissRtdb,
  type InboxItem,
  type SignalHistoryEntry,
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

  // /history/*
  historyFills: FillHistory[] | null;
  historyBalanceAdjusts: BalanceAdjustHistory[] | null;
  historySignals: SignalHistoryEntry[] | null;

  // UI
  loading: Partial<Record<string, boolean>>;
  lastToast: string | null;

  // 액션: 세션
  setUser: (user: AuthUser | null) => void;
  setOnline: (online: boolean) => void;
  setLastError: (error: string | null) => void;
  clearAll: () => void;

  // 액션: UI 알림
  showToast: (message: string) => void;
  hideToast: () => void;

  // 액션: 읽기
  refreshHome: () => Promise<void>;
  refreshTrade: () => Promise<void>;

  // 액션: 쓰기
  submitModelSync: () => Promise<void>;
  submitFill: (p: FillPayload) => Promise<void>;
  submitBalanceAdjust: (p: BalanceAdjustPayload) => Promise<void>;
  submitFillDismiss: (assetId: AssetId, reason?: string) => Promise<void>;
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

  historyFills: null,
  historyBalanceAdjusts: null,
  historySignals: null,

  loading: {},
  lastToast: null,

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
      historyFills: null,
      historyBalanceAdjusts: null,
      historySignals: null,
      loading: {},
      lastToast: null,
    }),

  showToast: (message) => set({ lastToast: message }),
  hideToast: () => set({ lastToast: null }),

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

  submitModelSync: async () => {
    try {
      await submitModelSyncRtdb();
      set({
        lastToast:
          '동기화 요청이 저장되었습니다.\n다음 실행에 반영됩니다.',
        lastError: null,
      });
    } catch (e) {
      console.error('[store] submitModelSync failed:', e);
      set({ lastError: toUserMessage(e) });
    }
  },

  refreshTrade: async () => {
    set({ loading: { ...get().loading, trade: true } });
    try {
      const [historyFills, historyBalanceAdjusts, historySignals] =
        await Promise.all([
          readHistoryFills(),
          readHistoryBalanceAdjusts(),
          readHistorySignals(),
        ]);
      set({
        historyFills,
        historyBalanceAdjusts,
        historySignals,
        lastError: null,
        loading: { ...get().loading, trade: false },
      });
    } catch (e) {
      console.error('[store] refreshTrade failed:', e);
      set({
        lastError: toUserMessage(e),
        loading: { ...get().loading, trade: false },
      });
    }
  },

  submitFill: async (p) => {
    try {
      await submitFillRtdb(p);
      set({
        lastToast:
          '체결이 저장되었습니다.\n다음 실행에 반영됩니다.',
        lastError: null,
      });
    } catch (e) {
      console.error('[store] submitFill failed:', e);
      set({ lastError: toUserMessage(e) });
      throw e;
    }
  },

  submitBalanceAdjust: async (p) => {
    try {
      await submitBalanceAdjustRtdb(p);
      set({
        lastToast:
          '보정이 저장되었습니다.\n다음 실행에 반영됩니다.',
        lastError: null,
      });
    } catch (e) {
      console.error('[store] submitBalanceAdjust failed:', e);
      set({ lastError: toUserMessage(e) });
      throw e;
    }
  },

  submitFillDismiss: async (assetId, reason) => {
    try {
      await submitFillDismissRtdb(assetId, reason);
      set({
        lastToast:
          '스킵이 저장되었습니다.\n다음 실행에 반영됩니다.',
        lastError: null,
      });
    } catch (e) {
      console.error('[store] submitFillDismiss failed:', e);
      set({ lastError: toUserMessage(e) });
      throw e;
    }
  },
}));
