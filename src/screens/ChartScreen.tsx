import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { WebView } from 'react-native-webview';
import { COLORS } from '../utils/colors';
import { useStore } from '../store/useStore';
import type { AssetId } from '../types/rtdb';
import { injectEquityChart, injectPriceChart } from '../services/chartInject';
import { ChartTypeToggle, type ChartType } from '../components/ChartTypeToggle';
import { AssetSelector } from '../components/AssetSelector';
import { ChartWebView } from '../components/ChartWebView';
import { ChartLegend } from '../components/ChartLegend';
import {
  ChartValueHeader,
  type CrosshairValues,
} from '../components/ChartValueHeader';
import { Toast } from '../components/Toast';
import { chartLoadingKey } from '../utils/loadingKeys';
import { computeNextArchiveYear } from '../utils/chartArchive';

// 모든 archive 가 로드 완료되었는지 판단. computeNextArchiveYear 가 null 을 반환하면
// 더 이상 받을 데이터가 없는 상태(좌측 끝)로 간주. RN→WebView 신호로 fixLeftEdge 동적 전환.
const computeIsFullyLoaded = (
  meta: { archive_years: number[] } | null | undefined,
  recent: { dates: string[] } | null | undefined,
  archiveMap: Record<number, unknown> | null | undefined,
): boolean => {
  if (!meta || !recent || !archiveMap) return false;
  const firstDate = recent.dates[0];
  if (!firstDate) return false;
  const loadedYears = Object.keys(archiveMap).map(Number);
  return (
    computeNextArchiveYear(firstDate, meta.archive_years, loadedYears) === null
  );
};

// loading 맵의 키 접두사. useStore 의 loadingKeys 헬퍼 생성 규칙과 동일하게 맞춤.
// (chart_archive_{assetId}_{year} / chart_archive_equity_{year})
const PRICE_ARCHIVE_PREFIX = (assetId: AssetId): string =>
  `chart_archive_${assetId}_`;
const EQUITY_ARCHIVE_PREFIX = 'chart_archive_equity_';

// 좌측 스크롤 로드 시 필요한 연도 1개를 결정.
// 판정 규칙은 `computeNextArchiveYear` 에 통일 (초기 로드와 동일 규칙 공유).
// firstDate 빈 배열은 RTDB 계약 위반이므로 null + 호출부에서 사용자 에러 토스트.
const computeYearToLoad = (
  meta: { archive_years: number[] },
  recent: { dates: string[] },
  archiveMap: Record<number, unknown>,
  target: 'price' | 'equity',
): number | null => {
  const firstDate = recent.dates[0];
  if (!firstDate) {
    console.warn(`[chart] empty ${target} recent series, cannot load earlier`);
    return null;
  }
  const loadedYears = Object.keys(archiveMap).map(Number);
  return computeNextArchiveYear(firstDate, meta.archive_years, loadedYears);
};

interface CrosshairState {
  date: string | null;
  values: CrosshairValues | null;
}

export const ChartScreen: React.FC = () => {
  const [chartType, setChartType] = useState<ChartType>('price');
  const [assetId, setAssetId] = useState<AssetId>('sso');
  const [webviewReady, setWebviewReady] = useState(false);
  const [crosshair, setCrosshair] = useState<CrosshairState>({
    date: null,
    values: null,
  });
  const webviewRef = useRef<WebView>(null);

  const priceCache = useStore(s => s.priceCharts[assetId]);
  const equityCache = useStore(s => s.equityChart);
  const refreshChart = useStore(s => s.refreshChart);
  const loadPriceArchive = useStore(s => s.loadPriceArchive);
  const loadEquityArchive = useStore(s => s.loadEquityArchive);
  const loading = useStore(s => s.loading);
  const lastError = useStore(s => s.lastError);
  const setLastError = useStore(s => s.setLastError);

  const isPriceLoading = loading[chartLoadingKey(assetId)] === true;
  const isEquityLoading = loading[chartLoadingKey('equity')] === true;
  const showSpinner =
    (chartType === 'price' && isPriceLoading && !priceCache?.recent) ||
    (chartType === 'equity' && isEquityLoading && !equityCache.recent);

  // 좌측 archive 선제 로드 중인지 판단. 해당 차트 타입의 archive 키 중 하나라도
  // true 이면 WebView 좌측에 마스킹 오버레이 표시.
  const isArchiveLoading = React.useMemo(() => {
    const prefix =
      chartType === 'price'
        ? PRICE_ARCHIVE_PREFIX(assetId)
        : EQUITY_ARCHIVE_PREFIX;
    return Object.entries(loading).some(([k, v]) => v && k.startsWith(prefix));
  }, [loading, chartType, assetId]);

  // 모든 archive 로드 완료 여부. true 가 되면 WebView 가 fixLeftEdge 를 켜서
  // 좌측 끝 추가 스크롤(빈 여백) 을 차단한다. 자산/차트 타입 전환 시 재평가됨.
  const isFullyLoaded = React.useMemo(() => {
    if (chartType === 'price') {
      return computeIsFullyLoaded(
        priceCache?.meta,
        priceCache?.recent,
        priceCache?.archive,
      );
    }
    return computeIsFullyLoaded(
      equityCache.meta,
      equityCache.recent,
      equityCache.archive,
    );
  }, [chartType, priceCache, equityCache]);

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
      injectPriceChart(
        webviewRef.current,
        priceCache.recent,
        priceCache.archive,
      );
    } else {
      if (!equityCache.recent) return;
      injectEquityChart(
        webviewRef.current,
        equityCache.recent,
        equityCache.archive,
      );
    }
  }, [webviewReady, chartType, priceCache, equityCache]);

  // Effect 2: 캐시/WebView 준비/archive 변경 시 재주입.
  useEffect(() => {
    injectChartData();
  }, [injectChartData]);

  // Effect 3: archive 로드 중 여부를 WebView 로 전달하여 좌측 영역을 마스킹.
  useEffect(() => {
    if (!webviewReady) return;
    webviewRef.current?.injectJavaScript(
      `window.setLoadingOverlay(${isArchiveLoading}); true;`,
    );
  }, [webviewReady, isArchiveLoading]);

  // Effect 3-2: 모든 archive 로드 완료 시 WebView 의 fixLeftEdge 를 동적으로 켠다.
  // archive 가 남아있는 동안에는 false 유지(좌측 자유 스크롤 + load_earlier 트리거 보존).
  useEffect(() => {
    if (!webviewReady) return;
    webviewRef.current?.injectJavaScript(
      `window.setLeftEdgeFixed(${isFullyLoaded}); true;`,
    );
  }, [webviewReady, isFullyLoaded]);

  // Effect 4: 차트 타입/자산 전환 또는 캐시 로드 시 상단 헤더를 최신 봉 값으로 리셋.
  // 이후 사용자가 크로스헤어를 움직이면 handleCrosshair 가 값을 덮어씀.
  // recent 의 마지막 인덱스 기준 (병합 시리즈 최종 값과 동일).
  useEffect(() => {
    if (chartType === 'price') {
      const recent = priceCache?.recent;
      if (!recent) {
        setCrosshair({ date: null, values: null });
        return;
      }
      const idx = recent.dates.length - 1;
      if (idx < 0) {
        setCrosshair({ date: null, values: null });
        return;
      }
      const date = recent.dates[idx];
      if (!date) return;
      const values: CrosshairValues = {
        close: recent.close[idx] ?? undefined,
        ma: recent.ma_value[idx] ?? undefined,
        upper: recent.upper_band[idx] ?? undefined,
        lower: recent.lower_band[idx] ?? undefined,
      };
      setCrosshair({ date, values });
    } else {
      const recent = equityCache.recent;
      if (!recent) {
        setCrosshair({ date: null, values: null });
        return;
      }
      const idx = recent.dates.length - 1;
      if (idx < 0) {
        setCrosshair({ date: null, values: null });
        return;
      }
      const date = recent.dates[idx];
      if (!date) return;
      const values: CrosshairValues = {
        model: recent.model_equity[idx] ?? undefined,
        actual: recent.actual_equity[idx] ?? undefined,
      };
      setCrosshair({ date, values });
    }
  }, [chartType, assetId, priceCache?.recent, equityCache.recent]);

  const handleCrosshair = useCallback(
    (date: string, values: CrosshairValues) => {
      setCrosshair({ date, values });
    },
    [],
  );

  // 좌측 끝 감지 → 필요한 전년도 archive 로드 후 재주입 (캐시 변경으로 Effect 2 자동 트리거).
  // 분기는 유지 (각 cache/archive 로더 시그니처가 다름), 연도 계산만 computeYearToLoad 로 공통화.
  const loadEarlierData = useCallback(async () => {
    if (chartType === 'price') {
      const meta = priceCache?.meta;
      const recent = priceCache?.recent;
      const archiveMap = priceCache?.archive;
      if (!meta || !recent || !archiveMap) return;
      const yearToLoad = computeYearToLoad(meta, recent, archiveMap, 'price');
      if (yearToLoad === null) {
        if (recent.dates.length === 0) {
          setLastError('차트 데이터가 비어있습니다.');
        }
        return;
      }
      await loadPriceArchive(assetId, yearToLoad);
    } else {
      const meta = equityCache.meta;
      const recent = equityCache.recent;
      if (!meta || !recent) return;
      const yearToLoad = computeYearToLoad(
        meta,
        recent,
        equityCache.archive,
        'equity',
      );
      if (yearToLoad === null) {
        if (recent.dates.length === 0) {
          setLastError('차트 데이터가 비어있습니다.');
        }
        return;
      }
      await loadEquityArchive(yearToLoad);
    }
  }, [
    chartType,
    assetId,
    priceCache,
    equityCache,
    loadPriceArchive,
    loadEquityArchive,
    setLastError,
  ]);

  const handleReady = useCallback(() => {
    setWebviewReady(true);
  }, []);

  const handleWebViewError = useCallback(
    (message: string) => {
      // WebView 재로드 시 ready 이벤트가 다시 오므로 inject 대기 상태로 복귀.
      setWebviewReady(false);
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

      <ChartValueHeader
        type={chartType}
        date={crosshair.date}
        values={crosshair.values}
      />

      <View style={styles.chartArea}>
        <ChartWebView
          ref={webviewRef}
          onReady={handleReady}
          onLoadEarlier={loadEarlierData}
          onCrosshair={handleCrosshair}
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
