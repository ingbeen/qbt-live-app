import type { AssetId } from '../types/rtdb';

export const OWNER_UID = 'SxwvCeg6fRUeUrK9IpyazTzrLJJ2';

export const RTDB_URL =
  'https://qbt-live-default-rtdb.asia-southeast1.firebasedatabase.app';

export const ANDROID_PACKAGE = 'com.ingbeen.qbtlive';

export const APP_VERSION = '1.0.0';

// ─── 네트워크 / 타임아웃 ───

export const RTDB_TIMEOUT_MS = 10_000;

// ─── 시간 / 날짜 ───

// 하루의 밀리초. 날짜 차이 계산 등에서 사용.
export const MS_PER_DAY = 86_400_000;

// ─── UI 수치 ───

export const TOAST_AUTO_HIDE_MS = 3_000;

// ─── UI 레이아웃 공통 수치 ───
// 카드 / 배지 / 버튼 등에 공통 적용. 1 회성 수치는 인라인 유지 (YAGNI).

export const RADIUS_MD = 8;
export const PADDING_SM = 12;
export const PADDING_MD = 14;
export const MARGIN_SM = 8;
export const MARGIN_MD = 12;

// UpdateStatusBadge: execution_date 가 오늘로부터 N일 초과 경과 시 경고. 달력일 기준.
// execution_date 는 ET (미국 거래일), today() 는 KST 기준이라 평시에도 1 일 TZ 오프셋이
// 발생. 4 = 주말 2 일 + 공휴일 여유 + TZ 오프셋 을 모두 흡수하는 값.
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

// ─── Inbox 쓰기 성공 시 표시하는 토스트 메시지 ───
// 모든 inbox 쓰기는 "다음 실행에 반영됨" 이라는 공통 흐름. 메시지 토대는 같고 주어만 다름.

export const TOAST_MESSAGES = {
  MODEL_SYNC: '동기화 요청이 저장되었습니다.\n다음 실행에 반영됩니다.',
  FILL: '체결이 저장되었습니다.\n다음 실행에 반영됩니다.',
  BALANCE_ADJUST: '보정이 저장되었습니다.\n다음 실행에 반영됩니다.',
  FILL_DISMISS: '스킵이 저장되었습니다.\n다음 실행에 반영됩니다.',
} as const;

// ─── 이벤트 종류별 한글 라벨 ───
// RTDB 이벤트 종류(fill / balance_adjust / signal) 의 표시 라벨. HistoryList 등에서 반복 사용.

export const EVENT_LABELS = {
  fill: '체결',
  balance_adjust: '보정',
  signal: '신호',
} as const;
