import type { WebView } from 'react-native-webview';
import type {
  EquityChartSeries,
  PriceChartSeries,
} from '../types/rtdb';
import { mergeChartSeries, mergeEquitySeries } from './chart';

// 차트 탭의 캐시 (recent + archive 연도별) 에서 WebView 주입용 병합 시리즈를 생성하고 inject.
// ChartScreen 은 WebView ref 와 캐시만 넘기면 된다 (관심사 분리, CLAUDE.md §17.3).

export const injectPriceChart = (
  webview: WebView | null,
  recent: PriceChartSeries,
  archiveMap: Partial<Record<number, PriceChartSeries>>,
): void => {
  if (!webview) return;
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
  if (!webview) return;
  const archives = Object.values(archiveMap).filter(
    (v): v is EquityChartSeries => v !== undefined,
  );
  const merged = mergeEquitySeries(recent, archives);
  webview.injectJavaScript(
    `window.setEquityChart(${JSON.stringify(merged)}); true;`,
  );
};
