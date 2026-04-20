import type { AssetId } from '../types/rtdb';

export const OWNER_UID = 'SxwvCeg6fRUeUrK9IpyazTzrLJJ2';

export const RTDB_URL =
  'https://qbt-live-default-rtdb.asia-southeast1.firebasedatabase.app';

export const ANDROID_PACKAGE = 'com.ingbeen.qbtlive';

export const APP_VERSION = '1.0.0';

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

export const ASSETS: readonly AssetId[] = ['sso', 'qld', 'gld', 'tlt'];

export const SYMBOLS = {
  WARN: '⚠',
  BOLT: '⚡',
  ARROW_UP: '▲',
  ARROW_DOWN: '▼',
  CIRCLE: '●',
  CLOSE: '✕',
  ARROW_RIGHT: '→',
} as const;
