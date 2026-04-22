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
  ChartMeta,
  PriceChartSeries,
  EquityChartSeries,
} from '../types/rtdb';
import { RTDB_PATHS } from '../utils/constants';
import { kstNow } from '../utils/format';

const TIMEOUT_MS = 10_000;

export type InboxItem = { uuid: string; data: unknown };

const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms),
    ),
  ]);

const dbRef = (path: string) => ref(getDatabase(getApp()), path);

export const readOnce = async <T>(path: string): Promise<T | null> => {
  const snap = await withTimeout(get(dbRef(path)), TIMEOUT_MS);
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

const readInbox = async (path: string): Promise<InboxItem[]> => {
  const tree = await readOnce<Record<string, InboxRecord>>(path);
  if (!tree) return [];
  return Object.entries(tree)
    .filter(([, v]) => v.processed !== true)
    .map(([uuid, data]) => ({ uuid, data }));
};

export const readInboxFills = (): Promise<InboxItem[]> =>
  readInbox(RTDB_PATHS.FILLS_INBOX);

export const readInboxBalanceAdjusts = (): Promise<InboxItem[]> =>
  readInbox(RTDB_PATHS.BALANCE_ADJUST_INBOX);

export const readInboxFillDismiss = (): Promise<InboxItem[]> =>
  readInbox(RTDB_PATHS.FILL_DISMISS_INBOX);

export const readInboxModelSync = (): Promise<InboxItem[]> =>
  readInbox(RTDB_PATHS.MODEL_SYNC_INBOX);

// ─── 쓰기 헬퍼 (inbox push) ───

export const submitModelSync = async (): Promise<void> => {
  const key = uuid.v4() as string;
  const payload: ModelSyncPayload = { input_time_kst: kstNow() };
  await withTimeout(
    set(dbRef(`${RTDB_PATHS.MODEL_SYNC_INBOX}/${key}`), payload),
    TIMEOUT_MS,
  );
};

export const submitFill = async (p: FillPayload): Promise<void> => {
  const key = uuid.v4() as string;
  const payload: FillPayload = {
    ...p,
    input_time_kst: p.input_time_kst || kstNow(),
    reason: p.reason ?? '',
  };
  await withTimeout(
    set(dbRef(`${RTDB_PATHS.FILLS_INBOX}/${key}`), payload),
    TIMEOUT_MS,
  );
};

export const submitBalanceAdjust = async (
  p: BalanceAdjustPayload,
): Promise<void> => {
  const key = uuid.v4() as string;
  const payload: BalanceAdjustPayload = {
    ...p,
    input_time_kst: p.input_time_kst || kstNow(),
  };
  await withTimeout(
    set(dbRef(`${RTDB_PATHS.BALANCE_ADJUST_INBOX}/${key}`), payload),
    TIMEOUT_MS,
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
    TIMEOUT_MS,
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
    TIMEOUT_MS,
  );
};

// ─── /charts/* ───

export const readPriceChartMeta = (
  assetId: AssetId,
): Promise<ChartMeta | null> =>
  readOnce<ChartMeta>(`${RTDB_PATHS.CHARTS_PRICES}/${assetId}/meta`);

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

export const readEquityChartMeta = (): Promise<ChartMeta | null> =>
  readOnce<ChartMeta>(`${RTDB_PATHS.CHARTS_EQUITY}/meta`);

export const readEquityChartRecent = (): Promise<EquityChartSeries | null> =>
  readOnce<EquityChartSeries>(`${RTDB_PATHS.CHARTS_EQUITY}/recent`);

export const readEquityChartArchive = (
  year: number,
): Promise<EquityChartSeries | null> =>
  readOnce<EquityChartSeries>(
    `${RTDB_PATHS.CHARTS_EQUITY}/archive/${year}`,
  );

// ─── 히스토리 읽기 (중첩 트리 → flat 최신순 배열) ───

export const readHistoryFills = async (): Promise<FillHistory[]> => {
  const tree = await readOnce<Record<string, Record<string, FillHistory>>>(
    RTDB_PATHS.HISTORY_FILLS,
  );
  if (!tree) return [];
  const flat: FillHistory[] = [];
  for (const date of Object.keys(tree)) {
    const byUuid = tree[date];
    if (!byUuid) continue;
    for (const uuidKey of Object.keys(byUuid)) {
      const v = byUuid[uuidKey];
      if (v) flat.push(v);
    }
  }
  flat.sort((a, b) => b.input_time_kst.localeCompare(a.input_time_kst));
  return flat;
};

export const readHistoryBalanceAdjusts = async (): Promise<
  BalanceAdjustHistory[]
> => {
  const tree = await readOnce<
    Record<string, Record<string, BalanceAdjustHistory>>
  >(RTDB_PATHS.HISTORY_BALANCE_ADJUSTS);
  if (!tree) return [];
  const flat: BalanceAdjustHistory[] = [];
  for (const date of Object.keys(tree)) {
    const byUuid = tree[date];
    if (!byUuid) continue;
    for (const uuidKey of Object.keys(byUuid)) {
      const v = byUuid[uuidKey];
      if (v) flat.push(v);
    }
  }
  flat.sort((a, b) => b.applied_at.localeCompare(a.applied_at));
  return flat;
};

export type SignalHistoryEntry = {
  date: string;
  asset_id: AssetId;
  signal: SignalHistory;
};

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
