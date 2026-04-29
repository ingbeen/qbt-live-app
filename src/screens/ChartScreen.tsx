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
import { PullToRefreshScrollView } from '../components/PullToRefreshScrollView';
import { chartLoadingKey } from '../utils/loadingKeys';
import { computeNextYear } from '../utils/chartYears';

type YearsMapLike = Partial<Record<number, { dates: string[] }>>;

// 가장 오래된 연도 슬라이스의 첫 날짜를 반환. 좌측 끝 더 받을 게 없는지 판단할 때 사용.
const earliestSliceFirstDate = (
  yearsMap: YearsMapLike | null | undefined,
): string | undefined => {
  if (!yearsMap) return undefined;
  const ys = Object.keys(yearsMap)
    .map(Number)
    .filter(y => !Number.isNaN(y))
    .sort((a, b) => a - b);
  for (const y of ys) {
    const s = yearsMap[y];
    const d = s?.dates[0];
    if (d) return d;
  }
  return undefined;
};

// 모든 연도 슬라이스가 로드 완료되었는지 판단. computeNextYear 가 null 을 반환하면
// 더 이상 받을 데이터가 없는 상태(좌측 끝)로 간주. RN→WebView 신호로 fixLeftEdge 동적 전환.
const computeIsFullyLoaded = (
  meta: { years: number[] } | null | undefined,
  yearsMap: YearsMapLike | null | undefined,
): boolean => {
  if (!meta || !yearsMap) return false;
  const firstDate = earliestSliceFirstDate(yearsMap);
  if (!firstDate) return false;
  const loadedYears = Object.keys(yearsMap).map(Number);
  return computeNextYear(firstDate, meta.years, loadedYears) === null;
};

// loading 맵의 키 접두사. useStore 의 loadingKeys 헬퍼 생성 규칙과 동일하게 맞춤.
// (chart_year_{assetId}_{year} / chart_year_equity_{year})
const PRICE_YEAR_PREFIX = (assetId: AssetId): string =>
  `chart_year_${assetId}_`;
const EQUITY_YEAR_PREFIX = 'chart_year_equity_';

// 좌측 스크롤 로드 시 필요한 연도 1개를 결정.
// 판정 규칙은 `computeNextYear` 에 통일 (초기 로드와 동일 규칙 공유).
// firstDate 빈 배열/부재는 슬라이스 미로드 상태이므로 사용자 에러 토스트.
const computeYearToLoad = (
  meta: { years: number[] },
  yearsMap: YearsMapLike,
  target: 'price' | 'equity',
): number | null => {
  const firstDate = earliestSliceFirstDate(yearsMap);
  if (!firstDate) {
    console.warn(`[chart] empty ${target} years cache, cannot load earlier`);
    return null;
  }
  const loadedYears = Object.keys(yearsMap).map(Number);
  return computeNextYear(firstDate, meta.years, loadedYears);
};

// 차트 마지막 봉(=가장 최신 연도 슬라이스의 마지막 인덱스) 값 추출. 헤더 초기값에 사용.
const lastSlicePoint = <T extends { dates: string[] }>(
  yearsMap: Partial<Record<number, T>> | null | undefined,
): { series: T; idx: number } | null => {
  if (!yearsMap) return null;
  const ys = Object.keys(yearsMap)
    .map(Number)
    .filter(y => !Number.isNaN(y))
    .sort((a, b) => b - a);
  for (const y of ys) {
    const s = yearsMap[y];
    if (s && s.dates.length > 0) {
      return { series: s, idx: s.dates.length - 1 };
    }
  }
  return null;
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
  const loadPriceYear = useStore(s => s.loadPriceYear);
  const loadEquityYear = useStore(s => s.loadEquityYear);
  const loading = useStore(s => s.loading);
  const lastError = useStore(s => s.lastError);
  const setLastError = useStore(s => s.setLastError);

  const isPriceLoading = loading[chartLoadingKey(assetId)] === true;
  const isEquityLoading = loading[chartLoadingKey('equity')] === true;
  // 진입 직후 연도 슬라이스가 비어있을 때 스피너. 1개라도 채워지면 차트 표시 가능.
  const priceYearsEmpty =
    !priceCache || Object.keys(priceCache.years).length === 0;
  const equityYearsEmpty = Object.keys(equityCache.years).length === 0;
  const showSpinner =
    (chartType === 'price' && isPriceLoading && priceYearsEmpty) ||
    (chartType === 'equity' && isEquityLoading && equityYearsEmpty);

  // 좌측 연도 슬라이스 선제 로드 중인지 판단. 해당 차트 타입의 연도 키 중 하나라도
  // true 이면 WebView 좌측에 마스킹 오버레이 표시.
  const isYearLoading = React.useMemo(() => {
    const prefix =
      chartType === 'price' ? PRICE_YEAR_PREFIX(assetId) : EQUITY_YEAR_PREFIX;
    return Object.entries(loading).some(([k, v]) => v && k.startsWith(prefix));
  }, [loading, chartType, assetId]);

  // 모든 연도 슬라이스 로드 완료 여부. true 가 되면 WebView 가 fixLeftEdge 를 켜서
  // 좌측 끝 추가 스크롤(빈 여백) 을 차단한다. 자산/차트 타입 전환 시 재평가됨.
  const isFullyLoaded = React.useMemo(() => {
    if (chartType === 'price') {
      return computeIsFullyLoaded(priceCache?.meta, priceCache?.years);
    }
    return computeIsFullyLoaded(equityCache.meta, equityCache.years);
  }, [chartType, priceCache, equityCache]);

  // Effect 1: meta 가 없으면 진입 시 차트 로드. 재진입 시 캐시 활용.
  useEffect(() => {
    if (chartType === 'price') {
      if (!priceCache?.meta) {
        refreshChart(assetId);
      }
    } else if (!equityCache.meta) {
      refreshChart('equity');
    }
  }, [chartType, assetId, priceCache?.meta, equityCache.meta, refreshChart]);

  // 주입 헬퍼: WebView 준비 + 연도 슬라이스 1개 이상 시 실행.
  const injectChartData = useCallback(() => {
    if (!webviewReady) return;
    if (chartType === 'price') {
      if (!priceCache || Object.keys(priceCache.years).length === 0) return;
      injectPriceChart(webviewRef.current, priceCache.years);
    } else {
      if (Object.keys(equityCache.years).length === 0) return;
      injectEquityChart(webviewRef.current, equityCache.years);
    }
  }, [webviewReady, chartType, priceCache, equityCache]);

  // Effect 2: 캐시/WebView 준비/연도 변경 시 재주입.
  useEffect(() => {
    injectChartData();
  }, [injectChartData]);

  // Effect 3: 연도 슬라이스 로드 중 여부를 WebView 로 전달하여 좌측 영역을 마스킹.
  useEffect(() => {
    if (!webviewReady) return;
    webviewRef.current?.injectJavaScript(
      `window.setLoadingOverlay(${isYearLoading}); true;`,
    );
  }, [webviewReady, isYearLoading]);

  // Effect 3-2: 모든 연도 슬라이스 로드 완료 시 WebView 의 fixLeftEdge 를 동적으로 켠다.
  // 슬라이스가 남아있는 동안에는 false 유지(좌측 자유 스크롤 + load_earlier 트리거 보존).
  useEffect(() => {
    if (!webviewReady) return;
    webviewRef.current?.injectJavaScript(
      `window.setLeftEdgeFixed(${isFullyLoaded}); true;`,
    );
  }, [webviewReady, isFullyLoaded]);

  // Effect 4: 차트 타입/자산 전환 또는 캐시 로드 시 상단 헤더를 최신 봉 값으로 리셋.
  // 이후 사용자가 크로스헤어를 움직이면 handleCrosshair 가 값을 덮어씀.
  // 가장 최신 연도 슬라이스의 마지막 인덱스 기준 (병합 시리즈 최종 값과 동일).
  useEffect(() => {
    if (chartType === 'price') {
      const last = lastSlicePoint(priceCache?.years);
      if (!last) {
        setCrosshair({ date: null, values: null });
        return;
      }
      const date = last.series.dates[last.idx];
      if (!date) return;
      const values: CrosshairValues = {
        close: last.series.close[last.idx] ?? undefined,
        ma: last.series.ma_value[last.idx] ?? undefined,
        upper: last.series.upper_band[last.idx] ?? undefined,
        lower: last.series.lower_band[last.idx] ?? undefined,
      };
      setCrosshair({ date, values });
    } else {
      const last = lastSlicePoint(equityCache.years);
      if (!last) {
        setCrosshair({ date: null, values: null });
        return;
      }
      const date = last.series.dates[last.idx];
      if (!date) return;
      const values: CrosshairValues = {
        model: last.series.model_equity[last.idx] ?? undefined,
        actual: last.series.actual_equity[last.idx] ?? undefined,
      };
      setCrosshair({ date, values });
    }
  }, [chartType, assetId, priceCache?.years, equityCache.years]);

  const handleCrosshair = useCallback(
    (date: string, values: CrosshairValues) => {
      setCrosshair({ date, values });
    },
    [],
  );

  // 좌측 끝 감지 → 필요한 전년도 슬라이스 로드 후 재주입 (캐시 변경으로 Effect 2 자동 트리거).
  // 분기는 유지 (각 cache 로더 시그니처가 다름), 연도 계산만 computeYearToLoad 로 공통화.
  const loadEarlierData = useCallback(async () => {
    if (chartType === 'price') {
      const meta = priceCache?.meta;
      const yearsMap = priceCache?.years;
      if (!meta || !yearsMap) return;
      const yearToLoad = computeYearToLoad(meta, yearsMap, 'price');
      if (yearToLoad === null) {
        if (Object.keys(yearsMap).length === 0) {
          setLastError('차트 데이터가 비어있습니다.');
        }
        return;
      }
      await loadPriceYear(assetId, yearToLoad);
    } else {
      const meta = equityCache.meta;
      if (!meta) return;
      const yearToLoad = computeYearToLoad(meta, equityCache.years, 'equity');
      if (yearToLoad === null) {
        if (Object.keys(equityCache.years).length === 0) {
          setLastError('차트 데이터가 비어있습니다.');
        }
        return;
      }
      await loadEquityYear(yearToLoad);
    }
  }, [
    chartType,
    assetId,
    priceCache,
    equityCache,
    loadPriceYear,
    loadEquityYear,
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

  // PTR: 컨트롤 영역에서 화면을 당겨 차트 데이터(meta + years) 강제 갱신.
  // 차트 영역(WebView) 은 PTR 외부에 두어 핀치/스와이프 제스처와 충돌하지 않게 한다.
  const onPullRefresh = useCallback(() => {
    if (chartType === 'price') {
      refreshChart(assetId);
    } else {
      refreshChart('equity');
    }
  }, [chartType, assetId, refreshChart]);

  return (
    <View style={styles.container}>
      <PullToRefreshScrollView
        refreshing={chartType === 'price' ? isPriceLoading : isEquityLoading}
        onRefresh={onPullRefresh}
        style={styles.ptrWrap}
      >
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
      </PullToRefreshScrollView>

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
  // PTR ScrollView 가 flex:1 처럼 부모 영역을 채우지 못하도록 flexGrow:0 으로 고정.
  // 내부 컨트롤(주가/Equity 토글 + AssetSelector + ChartValueHeader) 의 자체 height
  // 만큼만 차지하고, 나머지 영역은 chartArea(flex:1) 가 차지하여 차트가 정상 크기로 그려진다.
  ptrWrap: {
    flexGrow: 0,
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
