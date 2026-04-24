import type { PriceChartSeries } from '../types/rtdb';

// Firebase RTDB 는 모든 원소가 null 인 배열을 저장하지 않는 관습이 있어,
// 예를 들어 first_date 에 가까운 초기 archive (전 구간 MA 워밍업) 는
// ma_value / upper_band / lower_band 필드가 payload 에서 통째로 부재한다.
// 서비스 계층에서 읽은 직후 이 함수를 한 번 통과시키면, 이후 앱 내부 로직
// (chart.ts 병합, ChartScreen 접근 등) 은 "필수 필드가 항상 존재한다" 는
// 단일 불변조건 위에서 동작할 수 있다 (CLAUDE.md §8.2 서비스 단일 경유 + §19 간결성).

// RTDB 원시 payload 모양. PriceChartSeries 의 모든 필드가 optional 일 수 있음을 타입으로 표현.
export type RawPriceChartSeries = {
  dates?: string[];
  close?: number[];
  ma_value?: (number | null)[];
  upper_band?: (number | null)[];
  lower_band?: (number | null)[];
  buy_signals?: string[];
  sell_signals?: string[];
  user_buys?: string[];
  user_sells?: string[];
};

// 부재 필드를 dates.length 길이의 null 배열로 채워 내부 로직의 접근을 안전하게 만든다.
// 마커(buy_signals 등) 는 이미 optional 이고 호출부가 `?? []` 로 폴백하므로 손대지 않는다 (YAGNI).
export const normalizePriceSeries = (
  s: RawPriceChartSeries,
): PriceChartSeries => {
  const dates = s.dates ?? [];
  const n = dates.length;
  const nullArr = (): (number | null)[] =>
    new Array(n).fill(null) as (number | null)[];
  return {
    dates,
    close: s.close ?? [],
    ma_value: s.ma_value ?? nullArr(),
    upper_band: s.upper_band ?? nullArr(),
    lower_band: s.lower_band ?? nullArr(),
    buy_signals: s.buy_signals,
    sell_signals: s.sell_signals,
    user_buys: s.user_buys,
    user_sells: s.user_sells,
  };
};
