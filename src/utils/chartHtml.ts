// Lightweight Charts 는 브라우저 전용 라이브러리. WebView 내부에서만 동작하므로
// RN JS 모듈에서 import 할 수 없고 CDN 으로 로드. 버전은 재현성을 위해 @4.2.0 고정.
// HTML 내부 색상은 Lightweight Charts 옵션에 직접 전달되므로 COLORS 상수를 주입할 수 없음
// (CLAUDE.md §7 WebView 범주 — §3.3 RN 컴포넌트 하드코딩 금지 규칙의 예외).

export const generateChartHtml = (): string => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <script src="https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js"></script>
  <style>
    html, body, #chart { margin: 0; padding: 0; width: 100%; height: 100%; background: #161b22; }
    body { overflow: hidden; }
  </style>
</head>
<body>
  <div id="chart"></div>
  <script>
    (function () {
      var chart = LightweightCharts.createChart(document.getElementById('chart'), {
        layout: { background: { color: '#161b22' }, textColor: '#8b949e' },
        grid: { vertLines: { color: '#30363d22' }, horzLines: { color: '#30363d22' } },
        timeScale: { borderColor: '#30363d' },
        rightPriceScale: { borderColor: '#30363d' },
        crosshair: { mode: 1 }
      });

      var closeSeries = null;
      var maSeries = null;
      var upperSeries = null;
      var lowerSeries = null;
      var modelSeries = null;
      var actualSeries = null;

      function clearAllSeries() {
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

        closeSeries = chart.addLineSeries({ color: '#58a6ff', lineWidth: 2 });
        maSeries = chart.addLineSeries({ color: '#d29922', lineWidth: 1, lineStyle: 2 });
        upperSeries = chart.addLineSeries({ color: '#f85149aa', lineWidth: 1, lineStyle: 2 });
        lowerSeries = chart.addLineSeries({ color: '#3fb950aa', lineWidth: 1, lineStyle: 2 });

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
          markers.push({ time: d, position: 'belowBar', color: '#3fb950', shape: 'arrowUp', text: '' });
        });
        (data.sell_signals || []).forEach(function (d) {
          markers.push({ time: d, position: 'aboveBar', color: '#f85149', shape: 'arrowDown', text: '' });
        });
        (data.user_buys || []).forEach(function (d) {
          markers.push({ time: d, position: 'belowBar', color: '#3fb950', shape: 'circle', text: '' });
        });
        (data.user_sells || []).forEach(function (d) {
          markers.push({ time: d, position: 'aboveBar', color: '#f85149', shape: 'circle', text: '' });
        });
        markers.sort(function (a, b) { return a.time.localeCompare(b.time); });
        closeSeries.setMarkers(markers);
      };

      // Equity 차트 모드
      window.setEquityChart = function (data) {
        clearAllSeries();

        modelSeries = chart.addLineSeries({ color: '#58a6ff', lineWidth: 2, title: 'Model' });
        actualSeries = chart.addLineSeries({ color: '#3fb950', lineWidth: 2, lineStyle: 2, title: 'Actual' });
        modelSeries.setData(data.dates.map(function (d, i) { return { time: d, value: data.model_equity[i] }; }));
        actualSeries.setData(data.dates.map(function (d, i) { return { time: d, value: data.actual_equity[i] }; }));
      };

      // 좌측 끝 감지 → RN 에 archive 로드 요청 (throttle: 같은 호출 반복 방지)
      var lastEarlierRequest = 0;
      chart.timeScale().subscribeVisibleLogicalRangeChange(function (range) {
        if (!range) return;
        if (range.from < 10) {
          var now = Date.now();
          if (now - lastEarlierRequest < 1500) return;
          lastEarlierRequest = now;
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'load_earlier' }));
        }
      });

      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    })();
  </script>
</body>
</html>
`;
