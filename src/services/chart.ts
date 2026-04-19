import type { PriceChartSeries, EquityChartSeries } from '../types/rtdb';

// RTDB recent 와 archive/{현재_연도} 는 경계 날짜가 겹치므로 Map 으로 dedupe.
// 동일 날짜에 대해 recent 가 우선 (더 최신).

type PricePoint = {
  close: number;
  ma_value: number | null;
  upper_band: number | null;
  lower_band: number | null;
};

type EquityPoint = {
  model_equity: number;
  actual_equity: number;
  drift_pct: number;
};

const dedupMarkers = (arr: string[]): string[] =>
  Array.from(new Set(arr)).sort();

export const mergeChartSeries = (
  recent: PriceChartSeries,
  archives: PriceChartSeries[],
): PriceChartSeries => {
  const map = new Map<string, PricePoint>();

  const ingest = (s: PriceChartSeries): void => {
    s.dates.forEach((date, i) => {
      map.set(date, {
        close: s.close[i] as number,
        ma_value: s.ma_value[i] ?? null,
        upper_band: s.upper_band[i] ?? null,
        lower_band: s.lower_band[i] ?? null,
      });
    });
  };

  archives.forEach(ingest);
  ingest(recent);

  const sortedDates = Array.from(map.keys()).sort();
  return {
    dates: sortedDates,
    close: sortedDates.map((d) => map.get(d)!.close),
    ma_value: sortedDates.map((d) => map.get(d)!.ma_value),
    upper_band: sortedDates.map((d) => map.get(d)!.upper_band),
    lower_band: sortedDates.map((d) => map.get(d)!.lower_band),
    buy_signals: dedupMarkers([
      ...(recent.buy_signals ?? []),
      ...archives.flatMap((a) => a.buy_signals ?? []),
    ]),
    sell_signals: dedupMarkers([
      ...(recent.sell_signals ?? []),
      ...archives.flatMap((a) => a.sell_signals ?? []),
    ]),
    user_buys: dedupMarkers([
      ...(recent.user_buys ?? []),
      ...archives.flatMap((a) => a.user_buys ?? []),
    ]),
    user_sells: dedupMarkers([
      ...(recent.user_sells ?? []),
      ...archives.flatMap((a) => a.user_sells ?? []),
    ]),
  };
};

export const mergeEquitySeries = (
  recent: EquityChartSeries,
  archives: EquityChartSeries[],
): EquityChartSeries => {
  const map = new Map<string, EquityPoint>();

  const ingest = (s: EquityChartSeries): void => {
    s.dates.forEach((date, i) => {
      map.set(date, {
        model_equity: s.model_equity[i] as number,
        actual_equity: s.actual_equity[i] as number,
        drift_pct: s.drift_pct[i] as number,
      });
    });
  };

  archives.forEach(ingest);
  ingest(recent);

  const sortedDates = Array.from(map.keys()).sort();
  return {
    dates: sortedDates,
    model_equity: sortedDates.map((d) => map.get(d)!.model_equity),
    actual_equity: sortedDates.map((d) => map.get(d)!.actual_equity),
    drift_pct: sortedDates.map((d) => map.get(d)!.drift_pct),
  };
};
