// ============================================================
// Enum / Literal
// ============================================================

export type AssetId = 'sso' | 'qld' | 'gld' | 'tlt';
export type Direction = 'buy' | 'sell';
export type SignalState = 'buy' | 'sell';
export type DetectionState = 'buy' | 'sell' | 'none';

export type IntentType =
  | 'EXIT_ALL'
  | 'ENTER_TO_TARGET'
  | 'REDUCE_TO_TARGET'
  | 'INCREASE_TO_TARGET';

// ============================================================
// /latest/portfolio
// ============================================================

export interface AssetSnapshot {
  model_shares: number;
  actual_shares: number;
  signal_state: SignalState;
}

export interface Portfolio {
  execution_date: string;
  model_equity: number;
  actual_equity: number;
  drift_pct: number;
  shared_cash_model: number;
  shared_cash_actual: number;
  assets: Record<AssetId, AssetSnapshot>;
}

// ============================================================
// /latest/signals/{asset_id}
// ============================================================

export interface Signal {
  state: DetectionState;
  close: number;
  ma_value: number | null;
  ma_distance_pct: number;
  upper_band: number | null;
  lower_band: number | null;
}

// ============================================================
// /latest/pending_orders/{asset_id}
// ============================================================

export interface PendingOrder {
  asset_id: AssetId;
  intent_type: IntentType;
  signal_date: string;
  current_amount: number;
  target_amount: number;
  delta_amount: number;
  target_weight: number;
  hold_days_used: number;
  reason: string;
}

// ============================================================
// /charts/prices/{asset_id}/meta
// ============================================================

// 주가 차트 메타 — ma_window 필수 (이동평균 기간)
export interface PriceChartMeta {
  first_date: string;
  last_date: string;
  ma_window: number;
  recent_months: number;
  archive_years: number[];
}

// ============================================================
// /charts/equity/meta
// ============================================================

// equity 차트 메타 — ma_window 개념 없음 (포트폴리오 전체에는 이동평균 미적용)
export interface EquityChartMeta {
  first_date: string;
  last_date: string;
  recent_months: number;
  archive_years: number[];
}

// ============================================================
// /charts/prices/{asset_id}/(recent|archive/{YYYY})
// ============================================================

export interface PriceChartSeries {
  dates: string[];
  close: number[];
  ma_value: (number | null)[];
  upper_band: (number | null)[];
  lower_band: (number | null)[];
  buy_signals?: string[];
  sell_signals?: string[];
  user_buys?: string[];
  user_sells?: string[];
}

// ============================================================
// /charts/equity/(recent|archive/{YYYY})
// ============================================================

export interface EquityChartSeries {
  dates: string[];
  model_equity: number[];
  actual_equity: number[];
}

// ============================================================
// /fills/inbox/{uuid} (write)
// ============================================================

export interface FillPayload {
  asset_id: AssetId;
  direction: Direction;
  actual_price: number;
  actual_shares: number;
  trade_date: string;
  input_time_kst: string;
  memo?: string | null;
  // 사용자가 입력한 체결 사유 (자유 텍스트). 서버는 변환하지 않고
  // 그대로 /history/fills/.../reason 에 저장. 체결 탭(FillForm) 에는
  // 사유 입력 UI 가 없어 항상 빈 문자열을 전송. 보정 탭의
  // BalanceAdjustPayload.reason 은 별도이며 사용자 입력을 받는다.
  reason: string;
}

// ============================================================
// /balance_adjust/inbox/{uuid} (write)
// ============================================================

export interface BalanceAdjustPayload {
  asset_id?: AssetId | null;
  new_shares?: number | null;
  new_avg_price?: number | null;
  new_entry_date?: string | null;
  new_cash?: number | null;
  reason: string;
  input_time_kst: string;
}

// ============================================================
// /fill_dismiss/inbox/{uuid} (write)
// ============================================================

export interface FillDismissPayload {
  asset_id: AssetId;
  reason?: string;
  input_time_kst: string;
}

// ============================================================
// /model_sync/inbox/{uuid} (write)
// ============================================================

export interface ModelSyncPayload {
  input_time_kst: string;
}

// ============================================================
// /history/fills/{YYYY-MM-DD}/{uuid}
// ============================================================

export interface FillHistory {
  asset_id: AssetId;
  direction: Direction;
  actual_price: number;
  actual_shares: number;
  trade_date: string;
  input_time_kst: string;
  memo: string | null;
  reason: string;
  applied_at: string;
}

// ============================================================
// /history/balance_adjusts/{YYYY-MM-DD}/{uuid}
// ============================================================

export interface BalanceAdjustHistory {
  asset_id: AssetId | null;
  new_shares: number | null;
  new_avg_price: number | null;
  new_entry_date: string | null;
  new_cash: number | null;
  reason: string;
  input_time_kst: string;
  applied_at: string;
}

// ============================================================
// /history/signals/{YYYY-MM-DD}/{asset_id}
// ============================================================

export interface SignalHistory {
  state: DetectionState;
  close: number;
  ma_value: number | null;
  ma_distance_pct: number;
  upper_band: number | null;
  lower_band: number | null;
}

// ============================================================
// Service layer 결과 타입 (RTDB tree → 평탄화된 형태)
// ============================================================

// 제네릭 T 로 inbox payload 타입을 좁힐 수 있다 (디폴트 unknown).
// 사용처: useStore 에서 inbox 4종을 InboxItem<FillPayload> 등으로 정확화하면
// 호출부(PendingOrdersListBlock 등)에서 ad-hoc 타입 단언 없이 it.data.X 접근 가능.
export type InboxItem<T = unknown> = { uuid: string; data: T };

export type SignalHistoryEntry = {
  date: string;
  asset_id: AssetId;
  signal: SignalHistory;
};
