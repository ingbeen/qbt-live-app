import { getApp } from '@react-native-firebase/app';
import { getDatabase, ref, get, set } from '@react-native-firebase/database';
import uuid from 'react-native-uuid';
import type {
  Portfolio,
  Signal,
  PendingOrder,
  AssetId,
  ModelSyncPayload,
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
