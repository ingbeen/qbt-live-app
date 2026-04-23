import type { PriceChartSeries, EquityChartSeries } from '../types/rtdb';

// RTDB recent 와 archive/{현재_연도} 는 경계 날짜가 겹치므로 Map 으로 dedupe.
// 구현 순서: archives 먼저 ingest → recent 로 마지막 덮어쓰기. Map.set 은 키가 같으면
// 값을 덮어쓰므로 동일 날짜에 대해 recent 값이 우선 적용된다 (서버 최신 기준).

type PricePoint = {
  close: number;
  ma_value: number | null;
  upper_band: number | null;
  lower_band: number | null;
};

type EquityPoint = {
  model_equity: number;
  actual_equity: number;
};

const dedupMarkers = (arr: string[]): string[] =>
  Array.from(new Set(arr)).sort();

// 시리즈 내부의 배열 길이가 일치하지 않으면 가장 짧은 길이 기준으로 잘라 로그 경고.
// RTDB 데이터 무결성 불변조건 위반 시 silent 실패를 막기 위함.
const priceLength = (s: PriceChartSeries): number => {
  const lens = [
    s.dates.length,
    s.close.length,
    s.ma_value.length,
    s.upper_band.length,
    s.lower_band.length,
  ];
  const min = Math.min(...lens);
  if (lens.some((l) => l !== min)) {
    console.warn('[chart] price series length mismatch:', lens);
  }
  return min;
};

const equityLength = (s: EquityChartSeries): number => {
  const lens = [
    s.dates.length,
    s.model_equity.length,
    s.actual_equity.length,
  ];
  const min = Math.min(...lens);
  if (lens.some((l) => l !== min)) {
    console.warn('[chart] equity series length mismatch:', lens);
  }
  return min;
};

export const mergeChartSeries = (
  recent: PriceChartSeries,
  archives: PriceChartSeries[],
): PriceChartSeries => {
  const map = new Map<string, PricePoint>();

  const ingest = (s: PriceChartSeries): void => {
    const len = priceLength(s);
    for (let i = 0; i < len; i += 1) {
      const date = s.dates[i];
      const close = s.close[i];
      if (date === undefined || close === undefined) continue;
      map.set(date, {
        close,
        ma_value: s.ma_value[i] ?? null,
        upper_band: s.upper_band[i] ?? null,
        lower_band: s.lower_band[i] ?? null,
      });
    }
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
    const len = equityLength(s);
    for (let i = 0; i < len; i += 1) {
      const date = s.dates[i];
      const model = s.model_equity[i];
      const actual = s.actual_equity[i];
      if (
        date === undefined ||
        model === undefined ||
        actual === undefined
      ) continue;
      map.set(date, {
        model_equity: model,
        actual_equity: actual,
      });
    }
  };

  archives.forEach(ingest);
  ingest(recent);

  const sortedDates = Array.from(map.keys()).sort();
  return {
    dates: sortedDates,
    model_equity: sortedDates.map((d) => map.get(d)!.model_equity),
    actual_equity: sortedDates.map((d) => map.get(d)!.actual_equity),
  };
};
