import { create } from 'zustand';
import type {
  Portfolio,
  Signal,
  PendingOrder,
  AssetId,
  FillPayload,
  BalanceAdjustPayload,
  FillDismissPayload,
  ModelSyncPayload,
  FillHistory,
  BalanceAdjustHistory,
  PriceChartMeta,
  EquityChartMeta,
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
  readPriceChartYear,
  readEquityChartMeta,
  readEquityChartYear,
  submitModelSync as submitModelSyncRtdb,
  submitFill as submitFillRtdb,
  submitBalanceAdjust as submitBalanceAdjustRtdb,
  submitFillDismiss as submitFillDismissRtdb,
} from '../services/rtdb';
import type { AuthUser } from '../services/auth';
import type { InboxItem, SignalHistoryEntry } from '../types/rtdb';
import { TOAST_MESSAGES } from '../utils/constants';
import {
  LOADING_HOME,
  LOADING_TRADE,
  chartLoadingKey,
  priceYearLoadingKey,
  equityYearLoadingKey,
} from '../utils/loadingKeys';
import { computeInitialYears } from '../utils/chartYears';

export type { AuthUser };

// 차트 탭 로컬 캐시. meta 는 첫 로드 전 null, years 는 연도별 지연 로드.
// 진입 시 computeInitialYears 로 12개월 보장 연도 목록을 병렬 fetch 하고,
// 좌측 스크롤 시 loadPriceYear / loadEquityYear 로 추가 연도를 점진 로드한다.
export interface PriceChartCache {
  meta: PriceChartMeta | null;
  years: Partial<Record<number, PriceChartSeries>>;
}

export interface EquityChartCache {
  meta: EquityChartMeta | null;
  years: Partial<Record<number, EquityChartSeries>>;
}

export type ChartTarget = AssetId | 'equity';

const emptyEquityCache = (): EquityChartCache => ({
  meta: null,
  years: {},
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
  inboxFills: InboxItem<FillPayload>[] | null;
  inboxBalanceAdjusts: InboxItem<BalanceAdjustPayload>[] | null;
  inboxFillDismiss: InboxItem<FillDismissPayload>[] | null;
  inboxModelSync: InboxItem<ModelSyncPayload>[] | null;

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
  loadPriceYear: (
    assetId: AssetId,
    year: number,
    prefetchNext?: boolean,
  ) => Promise<void>;
  loadEquityYear: (year: number, prefetchNext?: boolean) => Promise<void>;

  // 액션: 쓰기
  submitModelSync: () => Promise<void>;
  submitFill: (p: FillPayload) => Promise<void>;
  submitBalanceAdjust: (p: BalanceAdjustPayload) => Promise<void>;
  submitFillDismiss: (assetId: AssetId, reason?: string) => Promise<void>;
}

// RTDB 에러 메시지를 사용자용 한글 메시지로 변환.
// PERMISSION_DENIED / denied by Security Rules 같은 Firebase RTDB 고유 패턴만 "권한 오류" 로 분류.
// FCM / 일반 소문자 "permission" 에러는 RTDB 무관이므로 포함하지 않는다.
const RTDB_PERMISSION_RE = /PERMISSION_DENIED|denied by.*rules/i;

const toUserMessage = (e: unknown): string => {
  const raw = e instanceof Error ? e.message : String(e);
  if (RTDB_PERMISSION_RE.test(raw)) {
    return 'RTDB 접근 권한이 없습니다. 로그아웃 후 재로그인해 보세요.';
  }
  if (raw.includes('timeout') || raw.includes('network')) {
    return '데이터를 불러올 수 없습니다. 잠시 후 다시 시도하세요.';
  }
  return '데이터를 불러올 수 없습니다.';
};

export const useStore = create<Store>((set, get) => {
  // loading 플래그 토글 헬퍼. 기존 `set({ loading: { ...get().loading, key: bool } })` 반복 제거용.
  const setLoading = (key: string, value: boolean) =>
    set(state => ({ loading: { ...state.loading, [key]: value } }));

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

    // ─── 단순 setter / 캐시 초기화 / UI 상태 ───

    setUser: user => set({ user }),
    setOnline: online => set({ isOnline: online }),
    setLastError: lastError => set({ lastError }),
    setDeviceId: deviceId => set({ deviceId }),
    setFcmRegistered: fcmRegistered => set({ fcmRegistered }),
    // user / isOnline / deviceId / fcmRegistered 는 유지. 캐시 데이터만 초기화.
    // AppState.active 복귀 시 캐시 무효화 (§6.6) + 로그아웃 시 signOut 이 별도로 setUser(null) 호출.
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

    showToast: message => set({ lastToast: message }),
    hideToast: () => set({ lastToast: null }),

    // ─── 비동기 액션 (RTDB 읽기 / 쓰기 / 연도 슬라이스 지연 로드) ───
    // 순서: refreshHome → submitModelSync → refreshTrade → submit (fill/balance/dismiss) → refreshChart → loadArchive

    refreshHome: async () => {
      setLoading(LOADING_HOME, true);
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
        setLoading(LOADING_HOME, false);
      }
    },

    submitModelSync: async () => {
      try {
        await submitModelSyncRtdb();
        set({
          lastToast: TOAST_MESSAGES.MODEL_SYNC,
          lastError: null,
        });
      } catch (e) {
        console.error('[store] submitModelSync failed:', e);
        set({ lastError: toUserMessage(e) });
      }
    },

    refreshTrade: async () => {
      setLoading(LOADING_TRADE, true);
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
        setLoading(LOADING_TRADE, false);
      }
    },

    submitFill: async p => {
      try {
        await submitFillRtdb(p);
        set({
          lastToast: TOAST_MESSAGES.FILL,
          lastError: null,
        });
      } catch (e) {
        console.error('[store] submitFill failed:', e);
        set({ lastError: toUserMessage(e) });
        throw e;
      }
    },

    submitBalanceAdjust: async p => {
      try {
        await submitBalanceAdjustRtdb(p);
        set({
          lastToast: TOAST_MESSAGES.BALANCE_ADJUST,
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
          lastToast: TOAST_MESSAGES.FILL_DISMISS,
          lastError: null,
        });
      } catch (e) {
        console.error('[store] submitFillDismiss failed:', e);
        set({ lastError: toUserMessage(e) });
        throw e;
      }
    },

    refreshChart: async target => {
      // 진입 시: meta 1회 fetch → computeInitialYears(12개월 보장) → 필요한
      // 연도 슬라이스들을 Promise.all 로 병렬 fetch. 좌측 스크롤 추가 로드는
      // loadPriceYear / loadEquityYear 가 그대로 담당.
      const loadingKey = chartLoadingKey(target);
      setLoading(loadingKey, true);
      try {
        if (target === 'equity') {
          const meta = await readEquityChartMeta();
          if (!meta) {
            set({ equityChart: { meta: null, years: {} }, lastError: null });
            return;
          }
          const initialYears = computeInitialYears(
            meta.last_date,
            meta.years,
            12,
          );
          const fetched = await Promise.all(
            initialYears.map(y => readEquityChartYear(y)),
          );
          const years: Partial<Record<number, EquityChartSeries>> = {};
          initialYears.forEach((y, i) => {
            const v = fetched[i];
            if (v) years[y] = v;
          });
          set({ equityChart: { meta, years }, lastError: null });
        } else {
          const assetId = target;
          const meta = await readPriceChartMeta(assetId);
          if (!meta) {
            set({
              priceCharts: {
                ...get().priceCharts,
                [assetId]: { meta: null, years: {} },
              },
              lastError: null,
            });
            return;
          }
          const initialYears = computeInitialYears(
            meta.last_date,
            meta.years,
            12,
          );
          const fetched = await Promise.all(
            initialYears.map(y => readPriceChartYear(assetId, y)),
          );
          const years: Partial<Record<number, PriceChartSeries>> = {};
          initialYears.forEach((y, i) => {
            const v = fetched[i];
            if (v) years[y] = v;
          });
          set({
            priceCharts: {
              ...get().priceCharts,
              [assetId]: { meta, years },
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

    loadPriceYear: async (assetId, year, prefetchNext = true) => {
      const existing = get().priceCharts[assetId];
      if (existing?.years[year]) return;
      const loadingKey = priceYearLoadingKey(assetId, year);
      setLoading(loadingKey, true);
      try {
        const slice = await readPriceChartYear(assetId, year);
        if (!slice) return;
        const current = get().priceCharts[assetId] ?? {
          meta: null,
          years: {},
        };
        set({
          priceCharts: {
            ...get().priceCharts,
            [assetId]: {
              ...current,
              years: { ...current.years, [year]: slice },
            },
          },
          lastError: null,
        });
      } catch (e) {
        console.error('[store] loadPriceYear failed:', e);
        set({ lastError: toUserMessage(e) });
      } finally {
        setLoading(loadingKey, false);
      }
      // 선제 로드: 현재 연도 완료 후 전년도도 자동 확보. 재귀 폭주 방지 위해
      // 다음 호출은 prefetchNext=false 로 전달. 파이어앤포겟 — 실패해도 사용자
      // 경로(좌측 스크롤)에서 재시도되므로 catch 로 흡수만.
      if (prefetchNext) {
        const nextYear = year - 1;
        const latest = get().priceCharts[assetId];
        const nextLoading =
          get().loading[priceYearLoadingKey(assetId, nextYear)] === true;
        if (
          latest?.meta &&
          latest.meta.years.includes(nextYear) &&
          !latest.years[nextYear] &&
          !nextLoading
        ) {
          get()
            .loadPriceYear(assetId, nextYear, false)
            .catch(() => {});
        }
      }
    },

    loadEquityYear: async (year, prefetchNext = true) => {
      if (get().equityChart.years[year]) return;
      const loadingKey = equityYearLoadingKey(year);
      setLoading(loadingKey, true);
      try {
        const slice = await readEquityChartYear(year);
        if (!slice) return;
        const current = get().equityChart;
        set({
          equityChart: {
            ...current,
            years: { ...current.years, [year]: slice },
          },
          lastError: null,
        });
      } catch (e) {
        console.error('[store] loadEquityYear failed:', e);
        set({ lastError: toUserMessage(e) });
      } finally {
        setLoading(loadingKey, false);
      }
      if (prefetchNext) {
        const nextYear = year - 1;
        const latest = get().equityChart;
        const nextLoading =
          get().loading[equityYearLoadingKey(nextYear)] === true;
        if (
          latest.meta &&
          latest.meta.years.includes(nextYear) &&
          !latest.years[nextYear] &&
          !nextLoading
        ) {
          get()
            .loadEquityYear(nextYear, false)
            .catch(() => {});
        }
      }
    },
  };
});
