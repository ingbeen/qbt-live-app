import type { WebView } from 'react-native-webview';
import type { EquityChartSeries, PriceChartSeries } from '../types/rtdb';
import { mergeChartSeries, mergeEquitySeries } from './chart';

// 차트 탭의 캐시 (recent + archive 연도별) 에서 WebView 주입용 병합 시리즈를 생성하고 inject.
// ChartScreen 은 WebView ref 와 캐시만 넘기면 된다 (관심사 분리, CLAUDE.md §10.1 폴더 역할 / §19.3 모듈 독립성).

export const injectPriceChart = (
  webview: WebView | null,
  recent: PriceChartSeries,
  archiveMap: Partial<Record<number, PriceChartSeries>>,
): void => {
  if (!webview) {
    if (__DEV__) {
      throw new Error(
        '[chartInject] 내부 불변조건 위반: webview=null (호출 시점엔 항상 ref 가 채워져야 함)',
      );
    }
    console.error('[chartInject] 내부 불변조건 위반: webview=null');
    return;
  }
  const archives = Object.values(archiveMap).filter(
    (v): v is PriceChartSeries => v !== undefined,
  );
  const merged = mergeChartSeries(recent, archives);
  webview.injectJavaScript(
    `window.setPriceChart(${JSON.stringify(merged)}); true;`,
  );
};

export const injectEquityChart = (
  webview: WebView | null,
  recent: EquityChartSeries,
  archiveMap: Partial<Record<number, EquityChartSeries>>,
): void => {
  if (!webview) {
    if (__DEV__) {
      throw new Error(
        '[chartInject] 내부 불변조건 위반: webview=null (호출 시점엔 항상 ref 가 채워져야 함)',
      );
    }
    console.error('[chartInject] 내부 불변조건 위반: webview=null');
    return;
  }
  const archives = Object.values(archiveMap).filter(
    (v): v is EquityChartSeries => v !== undefined,
  );
  const merged = mergeEquitySeries(recent, archives);
  webview.injectJavaScript(
    `window.setEquityChart(${JSON.stringify(merged)}); true;`,
  );
};
