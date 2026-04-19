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
// /charts/prices/{asset_id}/meta, /charts/equity/meta
// ============================================================

export interface ChartMeta {
  first_date: string;
  last_date: string;
  ma_window?: number;
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
  drift_pct: number[];
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
  reason?: string;
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
