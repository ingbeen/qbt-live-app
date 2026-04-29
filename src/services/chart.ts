import type { PriceChartSeries, EquityChartSeries } from '../types/rtdb';

// archive 연도별 slice 들을 단일 시계열로 결합한다. 연도 간 비중첩 보장(서버 SoT) 이라
// dedupe 는 불필요하지만, 동일 날짜가 두 archive 에 들어 있는 비정상 케이스에 대비해
// Map 으로 1회 흡수한다 (silent 실패 방지).

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
  if (lens.some(l => l !== min)) {
    console.warn('[chart] price series length mismatch:', lens);
  }
  return min;
};

const equityLength = (s: EquityChartSeries): number => {
  const lens = [s.dates.length, s.model_equity.length, s.actual_equity.length];
  const min = Math.min(...lens);
  if (lens.some(l => l !== min)) {
    console.warn('[chart] equity series length mismatch:', lens);
  }
  return min;
};

const emptyPriceSeries = (): PriceChartSeries => ({
  dates: [],
  close: [],
  ma_value: [],
  upper_band: [],
  lower_band: [],
  buy_signals: [],
  sell_signals: [],
  user_buys: [],
  user_sells: [],
});

const emptyEquitySeries = (): EquityChartSeries => ({
  dates: [],
  model_equity: [],
  actual_equity: [],
});

export const mergeChartSeries = (
  archives: PriceChartSeries[],
): PriceChartSeries => {
  if (archives.length === 0) return emptyPriceSeries();

  const map = new Map<string, PricePoint>();

  archives.forEach(s => {
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
  });

  const sortedDates = Array.from(map.keys()).sort();
  return {
    dates: sortedDates,
    close: sortedDates.map(d => map.get(d)!.close),
    ma_value: sortedDates.map(d => map.get(d)!.ma_value),
    upper_band: sortedDates.map(d => map.get(d)!.upper_band),
    lower_band: sortedDates.map(d => map.get(d)!.lower_band),
    buy_signals: dedupMarkers(archives.flatMap(a => a.buy_signals ?? [])),
    sell_signals: dedupMarkers(archives.flatMap(a => a.sell_signals ?? [])),
    user_buys: dedupMarkers(archives.flatMap(a => a.user_buys ?? [])),
    user_sells: dedupMarkers(archives.flatMap(a => a.user_sells ?? [])),
  };
};

export const mergeEquitySeries = (
  archives: EquityChartSeries[],
): EquityChartSeries => {
  if (archives.length === 0) return emptyEquitySeries();

  const map = new Map<string, EquityPoint>();

  archives.forEach(s => {
    const len = equityLength(s);
    for (let i = 0; i < len; i += 1) {
      const date = s.dates[i];
      const model = s.model_equity[i];
      const actual = s.actual_equity[i];
      if (date === undefined || model === undefined || actual === undefined)
        continue;
      map.set(date, {
        model_equity: model,
        actual_equity: actual,
      });
    }
  });

  const sortedDates = Array.from(map.keys()).sort();
  return {
    dates: sortedDates,
    model_equity: sortedDates.map(d => map.get(d)!.model_equity),
    actual_equity: sortedDates.map(d => map.get(d)!.actual_equity),
  };
};
