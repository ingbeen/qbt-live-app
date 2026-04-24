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
  readPriceChartRecent,
  readPriceChartArchive,
  readEquityChartMeta,
  readEquityChartRecent,
  readEquityChartArchive,
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
  priceArchiveLoadingKey,
  equityArchiveLoadingKey,
} from '../utils/loadingKeys';
import { computeNextArchiveYear } from '../utils/chartArchive';

export type { AuthUser };

// 차트 탭 로컬 캐시. meta/recent 는 첫 로드 전 null, archive 는 연도별 지연 로드.
export interface PriceChartCache {
  meta: PriceChartMeta | null;
  recent: PriceChartSeries | null;
  archive: Partial<Record<number, PriceChartSeries>>;
}

export interface EquityChartCache {
  meta: EquityChartMeta | null;
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
  loadPriceArchive: (
    assetId: AssetId,
    year: number,
    prefetchNext?: boolean,
  ) => Promise<void>;
  loadEquityArchive: (year: number, prefetchNext?: boolean) => Promise<void>;

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

    // ─── 비동기 액션 (RTDB 읽기 / 쓰기 / archive 지연 로드) ───
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
      const loadingKey = chartLoadingKey(target);
      setLoading(loadingKey, true);
      try {
        if (target === 'equity') {
          const [meta, recent] = await Promise.all([
            readEquityChartMeta(),
            readEquityChartRecent(),
          ]);
          // recent 가 해당 연도 1/1 부터 시작하지 않으면 recent 앞쪽을 채우기
          // 위해 첫 연도 archive 를 함께 로드. 실패해도 recent 는 세팅한다
          // (좌측 스크롤로 재시도 가능).
          const existingEquity = get().equityChart;
          const loadedYears = Object.keys(existingEquity.archive).map(Number);
          const firstYearToLoad =
            meta && recent
              ? computeNextArchiveYear(
                  recent.dates[0],
                  meta.archive_years,
                  loadedYears,
                )
              : null;
          let firstArchive: EquityChartSeries | null = null;
          if (firstYearToLoad !== null) {
            try {
              firstArchive = await readEquityChartArchive(firstYearToLoad);
            } catch (archErr) {
              console.error(
                '[store] refreshChart equity initial archive load failed:',
                archErr,
              );
            }
          }
          const mergedArchive: Partial<Record<number, EquityChartSeries>> = {
            ...existingEquity.archive,
          };
          if (firstYearToLoad !== null && firstArchive) {
            mergedArchive[firstYearToLoad] = firstArchive;
          }
          set({
            equityChart: {
              meta,
              recent,
              archive: mergedArchive,
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
          const loadedYears = existing
            ? Object.keys(existing.archive).map(Number)
            : [];
          const firstYearToLoad =
            meta && recent
              ? computeNextArchiveYear(
                  recent.dates[0],
                  meta.archive_years,
                  loadedYears,
                )
              : null;
          let firstArchive: PriceChartSeries | null = null;
          if (firstYearToLoad !== null) {
            try {
              firstArchive = await readPriceChartArchive(
                assetId,
                firstYearToLoad,
              );
            } catch (archErr) {
              console.error(
                '[store] refreshChart price initial archive load failed:',
                archErr,
              );
            }
          }
          const mergedArchive: Partial<Record<number, PriceChartSeries>> = {
            ...(existing?.archive ?? {}),
          };
          if (firstYearToLoad !== null && firstArchive) {
            mergedArchive[firstYearToLoad] = firstArchive;
          }
          set({
            priceCharts: {
              ...get().priceCharts,
              [assetId]: {
                meta,
                recent,
                archive: mergedArchive,
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

    loadPriceArchive: async (assetId, year, prefetchNext = true) => {
      const existing = get().priceCharts[assetId];
      if (existing?.archive[year]) return;
      const loadingKey = priceArchiveLoadingKey(assetId, year);
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
      // 선제 로드: 현재 연도 완료 후 전년도도 자동 확보. 재귀 폭주 방지 위해
      // 다음 호출은 prefetchNext=false 로 전달. 파이어앤포겟 — 실패해도 사용자
      // 경로(좌측 스크롤)에서 재시도되므로 catch 로 흡수만.
      if (prefetchNext) {
        const nextYear = year - 1;
        const latest = get().priceCharts[assetId];
        const nextLoading =
          get().loading[priceArchiveLoadingKey(assetId, nextYear)] === true;
        if (
          latest?.meta &&
          latest.meta.archive_years.includes(nextYear) &&
          !latest.archive[nextYear] &&
          !nextLoading
        ) {
          get()
            .loadPriceArchive(assetId, nextYear, false)
            .catch(() => {});
        }
      }
    },

    loadEquityArchive: async (year, prefetchNext = true) => {
      if (get().equityChart.archive[year]) return;
      const loadingKey = equityArchiveLoadingKey(year);
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
      if (prefetchNext) {
        const nextYear = year - 1;
        const latest = get().equityChart;
        const nextLoading =
          get().loading[equityArchiveLoadingKey(nextYear)] === true;
        if (
          latest.meta &&
          latest.meta.archive_years.includes(nextYear) &&
          !latest.archive[nextYear] &&
          !nextLoading
        ) {
          get()
            .loadEquityArchive(nextYear, false)
            .catch(() => {});
        }
      }
    },
  };
});
