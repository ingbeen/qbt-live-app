import type { AssetId, Direction } from '../types/rtdb';

// ─── 금액 (USD) — 천 단위 콤마 + 소수점 2자리 ───

export const formatUSD = (amount: number): string => {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  return `${sign}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// ─── 정수 달러 (소수점 없음) ───

export const formatUSDInt = (amount: number): string => {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  return `${sign}$${Math.round(abs).toLocaleString('en-US')}`;
};

// ─── 주가 정밀도 (소수점 4자리) ───
// 서버의 actual_price 는 ROUND_PRICE = 6 자리까지 저장되므로 formatUSD (2자리) 로는 손실.
// 이력 조회 등 값 비교가 필요한 곳에서 사용한다.
export const formatUSDPrice = (amount: number): string => {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  return `${sign}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
};

// ─── 부호 포함 정수 달러 ───
// +$123 / -$45 / $0 형태. ModelCompareCard 의 현금 diff 같이 부호 강조가 필요한 곳에서 사용.
export const formatSignedUSD = (amount: number): string => {
  if (amount === 0) return '$0';
  const sign = amount > 0 ? '+' : '-';
  const abs = Math.abs(amount);
  return `${sign}$${Math.round(abs).toLocaleString('en-US')}`;
};

// ─── 수량 ───

export const formatShares = (shares: number): string =>
  `${shares.toLocaleString('ko-KR')}주`;

// ─── 퍼센트 (부호 포함, 비율 × 100) ───

export const formatSignedPct = (ratio: number, digits: number = 2): string => {
  const pct = ratio * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(digits)}%`;
};

// ─── 비중 (부호 없음, 소수점 1자리) ───

export const formatWeight = (ratio: number): string =>
  `${(ratio * 100).toFixed(1)}%`;

// ─── 날짜 ───

/**
 * 입력 Date 를 KST (UTC+9) 벽시계에 맞춰 조정한 Date 를 리턴.
 * KST 는 DST 없는 고정 UTC+9 오프셋이므로 시즌 무관.
 * 후속 `.toISOString()` 이 UTC 로 변환해도 슬라이스(0,10) 가 KST 날짜를 뽑아내게 하기 위함.
 */
const toKstDate = (d: Date): Date => {
  const offsetMin = 9 * 60;
  return new Date(d.getTime() + (offsetMin - d.getTimezoneOffset()) * 60_000);
};

/** KST 기준 오늘 날짜를 `YYYY-MM-DD` 로 리턴. */
export const today = (): string => toKstDate(new Date()).toISOString().slice(0, 10);

export const formatShortDate = (iso: string): string => {
  const parts = iso.split('-');
  const m = parts[1];
  const d = parts[2];
  if (m === undefined || d === undefined) return iso;
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
};

// ─── KST 타임스탬프 (RTDB 쓰기용) ───

/**
 * 현재 시각을 KST (UTC+9) ISO-8601 문자열로 리턴.
 * 예: "2026-04-22T15:30:22.000+09:00". RTDB 의 input_time_kst / applied_at 등에 사용.
 */
export const kstNow = (): string =>
  toKstDate(new Date()).toISOString().replace('Z', '+09:00');

// ─── 자산 ID → UI 표시 티커 ───

export const toUpperTicker = (id: AssetId): string => id.toUpperCase();

// ─── 자산 ID → 시그널 (MA 근접도) 티커 ───

export const toSignalTicker = (id: AssetId): string => {
  const map: Record<AssetId, string> = {
    sso: 'SPY',
    qld: 'QQQ',
    gld: 'GLD',
    tlt: 'TLT',
  };
  return map[id];
};

// ─── 방향 라벨 (delta 부호 또는 Direction enum → 한글) ───

export const directionLabel = (d: number | Direction): '매수' | '매도' => {
  if (typeof d === 'number') return d > 0 ? '매수' : '매도';
  return d === 'buy' ? '매수' : '매도';
};
