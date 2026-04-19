import type {
  AssetId,
  BalanceAdjustPayload,
  FillPayload,
  Portfolio,
} from '../types/rtdb';
import { today } from './format';

export interface ValidationResult {
  valid: boolean;
  fieldErrors: Partial<Record<string, string>>;
  formError?: string;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const validateFill = (
  p: Partial<FillPayload>,
  portfolio: Portfolio | null,
): ValidationResult => {
  const fieldErrors: Record<string, string> = {};

  if (!p.asset_id) {
    fieldErrors.asset_id = '자산을 선택하세요';
  }
  if (!p.direction) {
    fieldErrors.direction = '방향을 선택하세요';
  }
  if (
    p.actual_shares == null ||
    p.actual_shares <= 0 ||
    !Number.isInteger(p.actual_shares)
  ) {
    fieldErrors.actual_shares = '수량은 양의 정수여야 합니다';
  }
  if (p.actual_price == null || p.actual_price <= 0) {
    fieldErrors.actual_price = '체결가는 양수여야 합니다';
  }
  if (!p.trade_date || !ISO_DATE_RE.test(p.trade_date)) {
    fieldErrors.trade_date = 'YYYY-MM-DD 형식이어야 합니다';
  } else if (p.trade_date > today()) {
    fieldErrors.trade_date = '미래 날짜는 입력할 수 없습니다';
  }

  if (
    p.direction === 'sell' &&
    p.asset_id &&
    p.actual_shares != null &&
    portfolio
  ) {
    const owned = portfolio.assets[p.asset_id]?.actual_shares ?? 0;
    if (p.actual_shares > owned) {
      fieldErrors.actual_shares = `매도 수량이 보유 주수(${owned}주)를 초과합니다`;
    }
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
};

export const validateBalanceAdjust = (
  p: Partial<BalanceAdjustPayload>,
  portfolio: Portfolio | null,
): ValidationResult => {
  const fieldErrors: Record<string, string> = {};

  const hasAnyValue =
    p.new_shares != null ||
    p.new_avg_price != null ||
    p.new_entry_date != null ||
    p.new_cash != null;

  if (!hasAnyValue) {
    return {
      valid: false,
      fieldErrors,
      formError: '빈 보정은 전송할 수 없습니다',
    };
  }

  const assetFieldsSet =
    p.new_shares != null ||
    p.new_avg_price != null ||
    p.new_entry_date != null;

  if (assetFieldsSet && !p.asset_id) {
    fieldErrors.asset_id = '자산을 선택하세요';
  }

  if (p.new_shares != null) {
    if (!Number.isInteger(p.new_shares) || p.new_shares < 0) {
      fieldErrors.new_shares = '새 주수는 0 이상 정수여야 합니다';
    }
  }
  if (p.new_avg_price != null) {
    if (p.new_avg_price <= 0) {
      fieldErrors.new_avg_price = '새 평균가는 양수여야 합니다';
    }
  }
  if (p.new_entry_date != null) {
    if (!ISO_DATE_RE.test(p.new_entry_date)) {
      fieldErrors.new_entry_date = 'YYYY-MM-DD 형식이어야 합니다';
    } else if (p.new_entry_date > today()) {
      fieldErrors.new_entry_date = '미래 날짜는 입력할 수 없습니다';
    }
  }
  if (p.new_cash != null) {
    if (p.new_cash < 0) {
      fieldErrors.new_cash = '새 현금은 0 이상이어야 합니다';
    }
  }

  if (
    p.asset_id &&
    portfolio &&
    (p.new_avg_price != null || p.new_entry_date != null) &&
    p.new_shares == null
  ) {
    const owned =
      portfolio.assets[p.asset_id as AssetId]?.actual_shares ?? 0;
    if (owned === 0) {
      fieldErrors.new_avg_price =
        '보유 주수가 0인 자산의 평균가/진입일을 설정할 수 없습니다';
    }
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
};
