import type { AssetId } from '../types/rtdb';

export const OWNER_UID = 'SxwvCeg6fRUeUrK9IpyazTzrLJJ2';

export const RTDB_URL =
  'https://qbt-live-default-rtdb.asia-southeast1.firebasedatabase.app';

export const ANDROID_PACKAGE = 'com.ingbeen.qbtlive';

export const APP_VERSION = '1.0.0';

// ─── 네트워크 / 타임아웃 ───

export const RTDB_TIMEOUT_MS = 10_000;

// ─── UI 수치 ───

export const TOAST_AUTO_HIDE_MS = 3_000;

// UpdateStatusBadge: execution_date 가 오늘로부터 N일 초과 경과 시 경고. 달력일 기준.
export const STALE_WARNING_DAYS = 4;

// ModelCompareCard: model/actual 현금 차이가 이 값 이상일 때만 경고 색상.
export const CASH_DIFF_THRESHOLD_USD = 1;

// ─── 외부 라이브러리 버전 ───

export const CHART_LIB_VERSION = '4.2.0';

// ─── RTDB 경로 ───

export const RTDB_PATHS = {
  // read
  LATEST_PORTFOLIO: '/latest/portfolio',
  LATEST_SIGNALS: '/latest/signals',
  LATEST_PENDING_ORDERS: '/latest/pending_orders',
  CHARTS_PRICES: '/charts/prices',
  CHARTS_EQUITY: '/charts/equity',
  HISTORY_FILLS: '/history/fills',
  HISTORY_BALANCE_ADJUSTS: '/history/balance_adjusts',
  HISTORY_SIGNALS: '/history/signals',
  // write
  FILLS_INBOX: '/fills/inbox',
  BALANCE_ADJUST_INBOX: '/balance_adjust/inbox',
  FILL_DISMISS_INBOX: '/fill_dismiss/inbox',
  MODEL_SYNC_INBOX: '/model_sync/inbox',
  DEVICE_TOKENS: '/device_tokens',
} as const;

// ─── 자산 ───

export const ASSETS: readonly AssetId[] = ['sso', 'qld', 'gld', 'tlt'];

// AdjustForm 대상: 4자산 + 현금. ASSETS 재사용으로 중복 하드코딩 방지.
export const ASSET_TARGETS: readonly (AssetId | 'cash')[] = [...ASSETS, 'cash'];

// ─── 기호 화이트리스트 ───

export const SYMBOLS = {
  WARN: '⚠',
  BOLT: '⚡',
  ARROW_UP: '▲',
  ARROW_DOWN: '▼',
  CIRCLE: '●',
  CLOSE: '✕',
  ARROW_RIGHT: '→',
} as const;
