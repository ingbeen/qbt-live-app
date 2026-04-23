import { getApp } from '@react-native-firebase/app';
import { getDatabase, ref, get, set } from '@react-native-firebase/database';
import uuid from 'react-native-uuid';
import type {
  Portfolio,
  Signal,
  PendingOrder,
  AssetId,
  ModelSyncPayload,
  FillPayload,
  BalanceAdjustPayload,
  FillDismissPayload,
  FillHistory,
  BalanceAdjustHistory,
  SignalHistory,
  PriceChartMeta,
  EquityChartMeta,
  PriceChartSeries,
  EquityChartSeries,
  InboxItem,
  SignalHistoryEntry,
} from '../types/rtdb';

// 외부에서 서비스 계층을 거쳐 접근하던 호출부 호환을 위한 re-export.
export type { InboxItem, SignalHistoryEntry };
import { RTDB_PATHS, RTDB_TIMEOUT_MS } from '../utils/constants';
import { kstNow } from '../utils/format';

const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms),
    ),
  ]);

const dbRef = (path: string) => ref(getDatabase(getApp()), path);

/**
 * RTDB 경로에서 단발성 읽기. 경로가 존재하지 않거나 값이 null 인 경우 모두 null 을 리턴한다.
 * RTDB 는 빈 배열 / 빈 객체를 저장하지 않으므로, 빈 컬렉션 폴백이 필요한 호출부는
 * 결과에 `?? []` / `?? {}` 를 적용해 사용한다.
 */
export const readOnce = async <T>(path: string): Promise<T | null> => {
  const snap = await withTimeout(get(dbRef(path)), RTDB_TIMEOUT_MS);
  return snap.exists() ? (snap.val() as T) : null;
};

// ─── /latest/* ───

export const readPortfolio = (): Promise<Portfolio | null> =>
  readOnce<Portfolio>(RTDB_PATHS.LATEST_PORTFOLIO);

export const readAllSignals = (): Promise<Record<AssetId, Signal> | null> =>
  readOnce<Record<AssetId, Signal>>(RTDB_PATHS.LATEST_SIGNALS);

export const readAllPendingOrders = (): Promise<Partial<
  Record<AssetId, PendingOrder>
> | null> =>
  readOnce<Partial<Record<AssetId, PendingOrder>>>(
    RTDB_PATHS.LATEST_PENDING_ORDERS,
  );

// ─── inbox 4종 (processed !== true 필터) ───

type InboxRecord = { processed?: boolean } & Record<string, unknown>;

// 제네릭 T 로 호출부에서 정확한 payload 타입을 명시하여 단언 없이 it.data.X 접근 가능.
// 서버는 RTDB rules 로 필드 구조를 강제하므로 캐스팅이 안전.
const readInbox = async <T = unknown>(
  path: string,
): Promise<InboxItem<T>[]> => {
  const tree = await readOnce<Record<string, InboxRecord>>(path);
  if (!tree) return [];
  return Object.entries(tree)
    .filter(([, v]) => v.processed !== true)
    .map(([uuid, data]) => ({ uuid, data: data as T }));
};

export const readInboxFills = (): Promise<InboxItem<FillPayload>[]> =>
  readInbox<FillPayload>(RTDB_PATHS.FILLS_INBOX);

export const readInboxBalanceAdjusts = (): Promise<
  InboxItem<BalanceAdjustPayload>[]
> => readInbox<BalanceAdjustPayload>(RTDB_PATHS.BALANCE_ADJUST_INBOX);

export const readInboxFillDismiss = (): Promise<
  InboxItem<FillDismissPayload>[]
> => readInbox<FillDismissPayload>(RTDB_PATHS.FILL_DISMISS_INBOX);

export const readInboxModelSync = (): Promise<InboxItem<ModelSyncPayload>[]> =>
  readInbox<ModelSyncPayload>(RTDB_PATHS.MODEL_SYNC_INBOX);

// ─── 쓰기 헬퍼 (inbox push) ───

export const submitModelSync = async (): Promise<void> => {
  const key = uuid.v4() as string;
  const payload: ModelSyncPayload = { input_time_kst: kstNow() };
  await withTimeout(
    set(dbRef(`${RTDB_PATHS.MODEL_SYNC_INBOX}/${key}`), payload),
    RTDB_TIMEOUT_MS,
  );
};

// 호출부(FillForm) 가 input_time_kst / reason 을 채워 전달하므로 서비스 단 폴백을 두지 않는다.
export const submitFill = async (p: FillPayload): Promise<void> => {
  const key = uuid.v4() as string;
  await withTimeout(
    set(dbRef(`${RTDB_PATHS.FILLS_INBOX}/${key}`), p),
    RTDB_TIMEOUT_MS,
  );
};

// 호출부(AdjustForm) 가 input_time_kst 를 채워 전달.
export const submitBalanceAdjust = async (
  p: BalanceAdjustPayload,
): Promise<void> => {
  const key = uuid.v4() as string;
  await withTimeout(
    set(dbRef(`${RTDB_PATHS.BALANCE_ADJUST_INBOX}/${key}`), p),
    RTDB_TIMEOUT_MS,
  );
};

export const submitFillDismiss = async (
  assetId: AssetId,
  reason?: string,
): Promise<void> => {
  const key = uuid.v4() as string;
  const payload: FillDismissPayload = {
    asset_id: assetId,
    reason: reason ?? '수동 스킵',
    input_time_kst: kstNow(),
  };
  await withTimeout(
    set(dbRef(`${RTDB_PATHS.FILL_DISMISS_INBOX}/${key}`), payload),
    RTDB_TIMEOUT_MS,
  );
};

// ─── /device_tokens/* (FCM registration) ───

// 설계서 §8.2.10 형식 1 (문자열). device_id 는 앱이 선택하는 메모리 UUID.
export const submitDeviceToken = async (
  deviceId: string,
  token: string,
): Promise<void> => {
  await withTimeout(
    set(dbRef(`${RTDB_PATHS.DEVICE_TOKENS}/${deviceId}`), token),
    RTDB_TIMEOUT_MS,
  );
};

// ─── /charts/* ───

export const readPriceChartMeta = (
  assetId: AssetId,
): Promise<PriceChartMeta | null> =>
  readOnce<PriceChartMeta>(`${RTDB_PATHS.CHARTS_PRICES}/${assetId}/meta`);

export const readPriceChartRecent = (
  assetId: AssetId,
): Promise<PriceChartSeries | null> =>
  readOnce<PriceChartSeries>(`${RTDB_PATHS.CHARTS_PRICES}/${assetId}/recent`);

export const readPriceChartArchive = (
  assetId: AssetId,
  year: number,
): Promise<PriceChartSeries | null> =>
  readOnce<PriceChartSeries>(
    `${RTDB_PATHS.CHARTS_PRICES}/${assetId}/archive/${year}`,
  );

export const readEquityChartMeta = (): Promise<EquityChartMeta | null> =>
  readOnce<EquityChartMeta>(`${RTDB_PATHS.CHARTS_EQUITY}/meta`);

export const readEquityChartRecent = (): Promise<EquityChartSeries | null> =>
  readOnce<EquityChartSeries>(`${RTDB_PATHS.CHARTS_EQUITY}/recent`);

export const readEquityChartArchive = (
  year: number,
): Promise<EquityChartSeries | null> =>
  readOnce<EquityChartSeries>(`${RTDB_PATHS.CHARTS_EQUITY}/archive/${year}`);

// ─── 히스토리 읽기 (중첩 트리 → flat 최신순 배열) ───

// /history/{fills,balance_adjusts}/{date}/{uuid} 구조 공통 로더.
// RTDB 2단계 중첩 트리를 flatten 후 sortKey 기준 내림차순 정렬.
const readNested2LevelTree = async <T>(
  path: string,
  sortKeyOf: (v: T) => string,
): Promise<T[]> => {
  const tree = await readOnce<Record<string, Record<string, T>>>(path);
  if (!tree) return [];
  const flat: T[] = [];
  for (const date of Object.keys(tree)) {
    const byUuid = tree[date];
    if (!byUuid) continue;
    for (const uuidKey of Object.keys(byUuid)) {
      const v = byUuid[uuidKey];
      if (v) flat.push(v);
    }
  }
  flat.sort((a, b) => sortKeyOf(b).localeCompare(sortKeyOf(a)));
  return flat;
};

export const readHistoryFills = (): Promise<FillHistory[]> =>
  readNested2LevelTree<FillHistory>(
    RTDB_PATHS.HISTORY_FILLS,
    v => v.input_time_kst,
  );

export const readHistoryBalanceAdjusts = (): Promise<BalanceAdjustHistory[]> =>
  readNested2LevelTree<BalanceAdjustHistory>(
    RTDB_PATHS.HISTORY_BALANCE_ADJUSTS,
    v => v.applied_at,
  );

export const readHistorySignals = async (): Promise<SignalHistoryEntry[]> => {
  const tree = await readOnce<
    Record<string, Partial<Record<AssetId, SignalHistory>>>
  >(RTDB_PATHS.HISTORY_SIGNALS);
  if (!tree) return [];
  const flat: SignalHistoryEntry[] = [];
  for (const date of Object.keys(tree)) {
    const byAsset = tree[date];
    if (!byAsset) continue;
    for (const assetKey of Object.keys(byAsset) as AssetId[]) {
      const signal = byAsset[assetKey];
      if (signal) flat.push({ date, asset_id: assetKey, signal });
    }
  }
  flat.sort((a, b) => b.date.localeCompare(a.date));
  return flat;
};
