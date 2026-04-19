import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { WebView } from 'react-native-webview';
import { COLORS } from '../utils/colors';
import { useStore } from '../store/useStore';
import type { AssetId } from '../types/rtdb';
import { mergeChartSeries, mergeEquitySeries } from '../services/chart';
import { ChartTypeToggle, type ChartType } from '../components/ChartTypeToggle';
import { AssetSelector } from '../components/AssetSelector';
import { ChartWebView } from '../components/ChartWebView';
import { ChartLegend } from '../components/ChartLegend';
import { Toast } from '../components/Toast';

export const ChartScreen: React.FC = () => {
  const [chartType, setChartType] = useState<ChartType>('price');
  const [assetId, setAssetId] = useState<AssetId>('sso');
  const [webviewReady, setWebviewReady] = useState(false);
  const webviewRef = useRef<WebView>(null);

  const priceCache = useStore((s) => s.priceCharts[assetId]);
  const equityCache = useStore((s) => s.equityChart);
  const refreshChart = useStore((s) => s.refreshChart);
  const loadPriceArchive = useStore((s) => s.loadPriceArchive);
  const loadEquityArchive = useStore((s) => s.loadEquityArchive);
  const loading = useStore((s) => s.loading);
  const lastError = useStore((s) => s.lastError);
  const setLastError = useStore((s) => s.setLastError);

  const isPriceLoading = loading[`chart_${assetId}`] === true;
  const isEquityLoading = loading['chart_equity'] === true;
  const showSpinner =
    (chartType === 'price' && isPriceLoading && !priceCache?.recent) ||
    (chartType === 'equity' && isEquityLoading && !equityCache.recent);

  // Effect 1: 캐시 없으면 recent + meta 로드. 이미 있으면 skip (재진입 캐시 활용).
  useEffect(() => {
    if (chartType === 'price') {
      if (!priceCache?.recent) {
        refreshChart(assetId);
      }
    } else if (!equityCache.recent) {
      refreshChart('equity');
    }
  }, [
    chartType,
    assetId,
    priceCache?.recent,
    equityCache.recent,
    refreshChart,
  ]);

  // 주입 헬퍼: WebView 준비 + 캐시 존재 시에만 실행.
  const injectChartData = useCallback(() => {
    if (!webviewReady) return;
    if (chartType === 'price') {
      if (!priceCache?.recent) return;
      const archives = Object.values(priceCache.archive).filter(
        (v): v is NonNullable<typeof v> => v !== undefined,
      );
      const merged = mergeChartSeries(priceCache.recent, archives);
      webviewRef.current?.injectJavaScript(
        `window.setPriceChart(${JSON.stringify(merged)}); true;`,
      );
    } else {
      if (!equityCache.recent) return;
      const archives = Object.values(equityCache.archive).filter(
        (v): v is NonNullable<typeof v> => v !== undefined,
      );
      const merged = mergeEquitySeries(equityCache.recent, archives);
      webviewRef.current?.injectJavaScript(
        `window.setEquityChart(${JSON.stringify(merged)}); true;`,
      );
    }
  }, [webviewReady, chartType, priceCache, equityCache]);

  // Effect 2: 캐시/WebView 준비/archive 변경 시 재주입.
  useEffect(() => {
    injectChartData();
  }, [injectChartData]);

  // 좌측 끝 감지 → 필요한 전년도 archive 로드 후 재주입 (캐시 변경으로 Effect 2 자동 트리거).
  const loadEarlierData = useCallback(async () => {
    if (chartType === 'price') {
      const meta = priceCache?.meta;
      const recent = priceCache?.recent;
      const archiveMap = priceCache?.archive;
      if (!meta || !recent || !archiveMap || recent.dates.length === 0) return;
      const loadedYears = Object.keys(archiveMap).map(Number);
      const recentEarliestYear = parseInt(
        (recent.dates[0] ?? '').slice(0, 4),
        10,
      );
      if (!Number.isFinite(recentEarliestYear)) return;
      const earliestLoaded = Math.min(recentEarliestYear, ...loadedYears);
      const yearToLoad = earliestLoaded - 1;
      if (meta.archive_years.includes(yearToLoad)) {
        await loadPriceArchive(assetId, yearToLoad);
      }
    } else {
      const meta = equityCache.meta;
      const recent = equityCache.recent;
      if (!meta || !recent || recent.dates.length === 0) return;
      const loadedYears = Object.keys(equityCache.archive).map(Number);
      const recentEarliestYear = parseInt(
        (recent.dates[0] ?? '').slice(0, 4),
        10,
      );
      if (!Number.isFinite(recentEarliestYear)) return;
      const earliestLoaded = Math.min(recentEarliestYear, ...loadedYears);
      const yearToLoad = earliestLoaded - 1;
      if (meta.archive_years.includes(yearToLoad)) {
        await loadEquityArchive(yearToLoad);
      }
    }
  }, [
    chartType,
    assetId,
    priceCache,
    equityCache,
    loadPriceArchive,
    loadEquityArchive,
  ]);

  const handleReady = useCallback(() => {
    setWebviewReady(true);
  }, []);

  const handleWebViewError = useCallback(
    (message: string) => {
      setLastError(message);
    },
    [setLastError],
  );

  const handleToastClose = useCallback(() => {
    setLastError(null);
  }, [setLastError]);

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <ChartTypeToggle value={chartType} onChange={setChartType} />
        {chartType === 'price' ? (
          <View style={styles.assetRow}>
            <AssetSelector value={assetId} onChange={setAssetId} />
          </View>
        ) : null}
      </View>

      <View style={styles.chartArea}>
        <ChartWebView
          ref={webviewRef}
          onReady={handleReady}
          onLoadEarlier={loadEarlierData}
          onError={handleWebViewError}
        />
        {showSpinner ? (
          <View style={styles.overlay} pointerEvents="none">
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.overlayText}>차트 불러오는 중…</Text>
          </View>
        ) : null}
      </View>

      <ChartLegend type={chartType} />

      <Toast message={lastError} onClose={handleToastClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  controls: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  assetRow: {
    marginTop: 2,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  overlayText: {
    color: COLORS.sub,
    fontSize: 12,
  },
});
