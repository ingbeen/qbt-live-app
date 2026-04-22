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
  ChartMeta,
  PriceChartSeries,
  EquityChartSeries,
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
  readPriceChartMeta,
  readPriceChartRecent,
  readPriceChartArchive,
  readEquityChartMeta,
  readEquityChartRecent,
  readEquityChartArchive,
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

// 차트 탭 로컬 캐시. meta/recent 는 첫 로드 전 null, archive 는 연도별 지연 로드.
export interface PriceChartCache {
  meta: ChartMeta | null;
  recent: PriceChartSeries | null;
  archive: Partial<Record<number, PriceChartSeries>>;
}

export interface EquityChartCache {
  meta: ChartMeta | null;
  recent: EquityChartSeries | null;
  archive: Partial<Record<number, EquityChartSeries>>;
}

export type ChartTarget = AssetId | 'equity';

const emptyEquityCache = (): EquityChartCache => ({
  meta: null,
  recent: null,
  archive: {},
});

interface Store {
  // 인증 / 네트워크 / FCM
  user: AuthUser | null;
  isOnline: boolean;
  lastError: string | null;
  deviceId: string | null;
  fcmRegistered: boolean;

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

  // /charts/*
  priceCharts: Partial<Record<AssetId, PriceChartCache>>;
  equityChart: EquityChartCache;

  // UI
  loading: Partial<Record<string, boolean>>;
  lastToast: string | null;

  // 액션: 세션
  setUser: (user: AuthUser | null) => void;
  setOnline: (online: boolean) => void;
  setLastError: (error: string | null) => void;
  setDeviceId: (deviceId: string | null) => void;
  setFcmRegistered: (registered: boolean) => void;
  clearAll: () => void;

  // 액션: UI 알림
  showToast: (message: string) => void;
  hideToast: () => void;

  // 액션: 읽기
  refreshHome: () => Promise<void>;
  refreshTrade: () => Promise<void>;
  refreshChart: (target: ChartTarget) => Promise<void>;
  loadPriceArchive: (assetId: AssetId, year: number) => Promise<void>;
  loadEquityArchive: (year: number) => Promise<void>;

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

export const useStore = create<Store>((set, get) => {
  // loading 플래그 토글 헬퍼. 기존 `set({ loading: { ...get().loading, key: bool } })` 반복 제거용.
  const setLoading = (key: string, value: boolean) =>
    set((state) => ({ loading: { ...state.loading, [key]: value } }));

  return {
  user: null,
  isOnline: true,
  lastError: null,
  deviceId: null,
  fcmRegistered: false,

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

  priceCharts: {},
  equityChart: emptyEquityCache(),

  loading: {},
  lastToast: null,

  setUser: (user) => set({ user }),
  setOnline: (online) => set({ isOnline: online }),
  setLastError: (lastError) => set({ lastError }),
  setDeviceId: (deviceId) => set({ deviceId }),
  setFcmRegistered: (fcmRegistered) => set({ fcmRegistered }),
  // user / isOnline / deviceId / fcmRegistered 는 유지. 캐시 데이터만 초기화.
  // AppState.active 복귀 시 캐시 무효화(§12.4) + 로그아웃 시 signOut 이 별도로 setUser(null) 호출.
  clearAll: () =>
    set({
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
      priceCharts: {},
      equityChart: emptyEquityCache(),
      loading: {},
      lastToast: null,
    }),

  showToast: (message) => set({ lastToast: message }),
  hideToast: () => set({ lastToast: null }),

  refreshHome: async () => {
    setLoading('home', true);
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
      });
    } catch (e) {
      console.error('[store] refreshHome failed:', e);
      set({ lastError: toUserMessage(e) });
    } finally {
      setLoading('home', false);
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
    setLoading('trade', true);
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
      });
    } catch (e) {
      console.error('[store] refreshTrade failed:', e);
      set({ lastError: toUserMessage(e) });
    } finally {
      setLoading('trade', false);
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

  refreshChart: async (target) => {
    const loadingKey = `chart_${target}`;
    setLoading(loadingKey, true);
    try {
      if (target === 'equity') {
        const [meta, recent] = await Promise.all([
          readEquityChartMeta(),
          readEquityChartRecent(),
        ]);
        set({
          equityChart: {
            meta,
            recent,
            archive: get().equityChart.archive,
          },
          lastError: null,
        });
      } else {
        const assetId = target;
        const [meta, recent] = await Promise.all([
          readPriceChartMeta(assetId),
          readPriceChartRecent(assetId),
        ]);
        const existing = get().priceCharts[assetId];
        set({
          priceCharts: {
            ...get().priceCharts,
            [assetId]: {
              meta,
              recent,
              archive: existing?.archive ?? {},
            },
          },
          lastError: null,
        });
      }
    } catch (e) {
      console.error('[store] refreshChart failed:', e);
      set({ lastError: toUserMessage(e) });
    } finally {
      setLoading(loadingKey, false);
    }
  },

  loadPriceArchive: async (assetId, year) => {
    const existing = get().priceCharts[assetId];
    if (existing?.archive[year]) return;
    const loadingKey = `chart_archive_${assetId}_${year}`;
    setLoading(loadingKey, true);
    try {
      const archive = await readPriceChartArchive(assetId, year);
      if (!archive) return;
      const current = get().priceCharts[assetId] ?? {
        meta: null,
        recent: null,
        archive: {},
      };
      set({
        priceCharts: {
          ...get().priceCharts,
          [assetId]: {
            ...current,
            archive: { ...current.archive, [year]: archive },
          },
        },
        lastError: null,
      });
    } catch (e) {
      console.error('[store] loadPriceArchive failed:', e);
      set({ lastError: toUserMessage(e) });
    } finally {
      setLoading(loadingKey, false);
    }
  },

  loadEquityArchive: async (year) => {
    if (get().equityChart.archive[year]) return;
    const loadingKey = `chart_archive_equity_${year}`;
    setLoading(loadingKey, true);
    try {
      const archive = await readEquityChartArchive(year);
      if (!archive) return;
      const current = get().equityChart;
      set({
        equityChart: {
          ...current,
          archive: { ...current.archive, [year]: archive },
        },
        lastError: null,
      });
    } catch (e) {
      console.error('[store] loadEquityArchive failed:', e);
      set({ lastError: toUserMessage(e) });
    } finally {
      setLoading(loadingKey, false);
    }
  },
  };
});
