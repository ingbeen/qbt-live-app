// Lightweight Charts 는 브라우저 전용 라이브러리. WebView 내부에서만 동작하므로
// RN JS 모듈에서 import 할 수 없고 CDN 으로 로드. 버전은 재현성을 위해 CHART_LIB_VERSION 에 고정.
// HTML 내부 색상은 Lightweight Charts 옵션에 직접 전달되므로 COLORS 상수를 직접 주입할 수 없음
// (CLAUDE.md §5.3 스타일링 / §5.4 절대 금지 목록 — 하드코딩 색상 hex 금지 규칙의 예외).
// 단, CHART_COLORS (colors.ts) 가 COLORS 를 참조하는 형태로 SoT 단일화되어 있어
// 여기서는 보간만 수행한다. alpha 변형은 ${CHART_COLORS.x}22 처럼 접미 보간.

import { CHART_COLORS } from './colors';
import { CHART_LIB_VERSION } from './constants';

export const generateChartHtml = (): string => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <script src="https://unpkg.com/lightweight-charts@${CHART_LIB_VERSION}/dist/lightweight-charts.standalone.production.js"></script>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: ${CHART_COLORS.background}; }
    #chart-wrap { position: relative; width: 100%; height: 100%; }
    #chart { width: 100%; height: 100%; }
    #chart-loading-overlay {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 40%;
      display: none;
      align-items: center;
      justify-content: center;
      background: ${CHART_COLORS.background};
      opacity: 0.9;
      color: ${CHART_COLORS.sub};
      font-family: -apple-system, Roboto, 'Segoe UI', sans-serif;
      font-size: 12px;
      pointer-events: none;
      z-index: 2;
    }
    body { overflow: hidden; }
  </style>
</head>
<body>
  <div id="chart-wrap">
    <div id="chart"></div>
    <div id="chart-loading-overlay">불러오는 중…</div>
  </div>
  <script>
    (function () {
      // 날짜 포맷: 축 tickMark 와 크로스헤어 수직 라벨 모두 YYYY-MM-DD 로 통일.
      // Lightweight Charts 가 Time 을 문자열로 받으면 그대로 통과시키는 formatter.
      var identityDateFormatter = function (time) {
        return typeof time === 'string' ? time : '';
      };

      var chart = LightweightCharts.createChart(document.getElementById('chart'), {
        layout: { background: { color: '${CHART_COLORS.background}' }, textColor: '${CHART_COLORS.sub}' },
        grid: { vertLines: { color: '${CHART_COLORS.border}22' }, horzLines: { color: '${CHART_COLORS.border}22' } },
        timeScale: {
          borderColor: '${CHART_COLORS.border}',
          tickMarkFormatter: identityDateFormatter
        },
        rightPriceScale: { borderColor: '${CHART_COLORS.border}' },
        crosshair: { mode: 1 },
        localization: {
          dateFormat: 'yyyy-MM-dd',
          timeFormatter: identityDateFormatter
        }
      });

      var closeSeries = null;
      var maSeries = null;
      var upperSeries = null;
      var lowerSeries = null;
      var modelSeries = null;
      var actualSeries = null;
      // v5 에서 markers 는 별도 primitive. series 제거 전 detach 필요.
      var closeMarkers = null;

      function clearAllSeries() {
        if (closeMarkers) { closeMarkers.detach(); closeMarkers = null; }
        if (closeSeries) { chart.removeSeries(closeSeries); closeSeries = null; }
        if (maSeries) { chart.removeSeries(maSeries); maSeries = null; }
        if (upperSeries) { chart.removeSeries(upperSeries); upperSeries = null; }
        if (lowerSeries) { chart.removeSeries(lowerSeries); lowerSeries = null; }
        if (modelSeries) { chart.removeSeries(modelSeries); modelSeries = null; }
        if (actualSeries) { chart.removeSeries(actualSeries); actualSeries = null; }
      }

      // 주가 차트 모드
      window.setPriceChart = function (data) {
        clearAllSeries();

        closeSeries = chart.addSeries(LightweightCharts.LineSeries, { color: '${CHART_COLORS.accent}', lineWidth: 2 });
        maSeries = chart.addSeries(LightweightCharts.LineSeries, { color: '${CHART_COLORS.yellow}', lineWidth: 1, lineStyle: 2 });
        upperSeries = chart.addSeries(LightweightCharts.LineSeries, { color: '${CHART_COLORS.red}aa', lineWidth: 1, lineStyle: 2 });
        lowerSeries = chart.addSeries(LightweightCharts.LineSeries, { color: '${CHART_COLORS.green}aa', lineWidth: 1, lineStyle: 2 });

        closeSeries.setData(data.dates.map(function (d, i) { return { time: d, value: data.close[i] }; }));
        maSeries.setData(
          data.dates
            .map(function (d, i) { return { time: d, value: data.ma_value[i] }; })
            .filter(function (p) { return p.value !== null && p.value !== undefined; })
        );
        upperSeries.setData(
          data.dates
            .map(function (d, i) { return { time: d, value: data.upper_band[i] }; })
            .filter(function (p) { return p.value !== null && p.value !== undefined; })
        );
        lowerSeries.setData(
          data.dates
            .map(function (d, i) { return { time: d, value: data.lower_band[i] }; })
            .filter(function (p) { return p.value !== null && p.value !== undefined; })
        );

        // 마커 4종 — 시그널 ▲▼ + 내 체결 ●
        var markers = [];
        (data.buy_signals || []).forEach(function (d) {
          markers.push({ time: d, position: 'belowBar', color: '${CHART_COLORS.green}', shape: 'arrowUp', text: '' });
        });
        (data.sell_signals || []).forEach(function (d) {
          markers.push({ time: d, position: 'aboveBar', color: '${CHART_COLORS.red}', shape: 'arrowDown', text: '' });
        });
        (data.user_buys || []).forEach(function (d) {
          markers.push({ time: d, position: 'belowBar', color: '${CHART_COLORS.green}', shape: 'circle', text: '' });
        });
        (data.user_sells || []).forEach(function (d) {
          markers.push({ time: d, position: 'aboveBar', color: '${CHART_COLORS.red}', shape: 'circle', text: '' });
        });
        markers.sort(function (a, b) { return a.time.localeCompare(b.time); });
        // v5: setMarkers 대신 createSeriesMarkers primitive 를 closeSeries 에 attach.
        // clearAllSeries 에서 detach 하므로 여기서는 매 호출 새로 생성.
        closeMarkers = LightweightCharts.createSeriesMarkers(closeSeries, markers);
      };

      // Equity 차트 모드
      window.setEquityChart = function (data) {
        clearAllSeries();

        modelSeries = chart.addSeries(LightweightCharts.LineSeries, { color: '${CHART_COLORS.accent}', lineWidth: 2, title: 'Model' });
        actualSeries = chart.addSeries(LightweightCharts.LineSeries, { color: '${CHART_COLORS.green}', lineWidth: 2, lineStyle: 2, title: 'Actual' });
        modelSeries.setData(data.dates.map(function (d, i) { return { time: d, value: data.model_equity[i] }; }));
        actualSeries.setData(data.dates.map(function (d, i) { return { time: d, value: data.actual_equity[i] }; }));
      };

      // 좌측 끝 감지 → RN 에 archive 로드 요청 (throttle: 같은 호출 반복 방지)
      // threshold 는 관성 스크롤 대응을 위해 30봉 이내로 들어오면 선제 로드 요청.
      var lastEarlierRequest = 0;
      chart.timeScale().subscribeVisibleLogicalRangeChange(function (range) {
        if (!range) return;
        if (range.from < 30) {
          var now = Date.now();
          if (now - lastEarlierRequest < 1500) return;
          lastEarlierRequest = now;
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'load_earlier' }));
        }
      });

      // RN 이 archive 로드 중임을 알려올 때 좌측 영역을 반투명 마스킹. 연속 호출에 idempotent.
      window.setLoadingOverlay = function (on) {
        var el = document.getElementById('chart-loading-overlay');
        if (!el) return;
        el.style.display = on ? 'flex' : 'none';
      };

      // 크로스헤어 이동 시 각 시리즈 값을 RN 상단 헤더로 전송. series 교체 후에도
      // 모듈 scope 의 *Series 참조가 최신이라 별도 재구독 불필요.
      chart.subscribeCrosshairMove(function (param) {
        if (!param || !param.time || !param.seriesData) return;
        var v = {};
        if (closeSeries) {
          var d1 = param.seriesData.get(closeSeries);
          if (d1 && typeof d1.value === 'number') v.close = d1.value;
        }
        if (maSeries) {
          var d2 = param.seriesData.get(maSeries);
          if (d2 && typeof d2.value === 'number') v.ma = d2.value;
        }
        if (upperSeries) {
          var d3 = param.seriesData.get(upperSeries);
          if (d3 && typeof d3.value === 'number') v.upper = d3.value;
        }
        if (lowerSeries) {
          var d4 = param.seriesData.get(lowerSeries);
          if (d4 && typeof d4.value === 'number') v.lower = d4.value;
        }
        if (modelSeries) {
          var d5 = param.seriesData.get(modelSeries);
          if (d5 && typeof d5.value === 'number') v.model = d5.value;
        }
        if (actualSeries) {
          var d6 = param.seriesData.get(actualSeries);
          if (d6 && typeof d6.value === 'number') v.actual = d6.value;
        }
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'crosshair', date: param.time, values: v })
        );
      });

      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    })();
  </script>
</body>
</html>
`;
