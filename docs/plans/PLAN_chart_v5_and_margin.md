# Implementation Plan: lightweight-charts v5.1.0 업그레이드 + 좌우 경계 margin

> 작성/운영 규칙(SoT): 반드시 [docs/CLAUDE.md](../CLAUDE.md)를 참고하세요.
> (이 템플릿을 수정하거나 새로운 양식의 계획서를 만들 때도 [docs/CLAUDE.md](../CLAUDE.md)를 포인터로 두고 준수합니다.)

**상태**: In Progress

---

**이 영역은 삭제/수정 금지**

**상태 옵션**: Draft / In Progress / Done

**Done 처리 규칙**:

- Done 조건: DoD 모두 [x] + `npm run lint` / `npx tsc --noEmit` 통과 + 사용자 실기 검증 완료
- 스킵(미수행 항목)이 1개라도 존재하면 Done 처리 금지 + DoD 검증 항목 체크 금지
- 상세: [docs/CLAUDE.md](../CLAUDE.md) 참고

---

**작성일**: 2026-04-24 20:15
**마지막 업데이트**: 2026-04-24 20:40
**관련 범위**: utils (chartHtml, constants), CLAUDE.md §9, docs/COMMANDS.md (변경 없음)
**관련 문서**: CLAUDE.md §9 (WebView + TradingView Charts 규칙), DESIGN_QBT_LIVE_FINAL.md

---

## 0) 고정 규칙 (이 plan 은 반드시 아래 규칙을 따른다)

> **이 영역은 삭제/수정 금지**
> 이 섹션(0)은 지워지면 안 될 뿐만 아니라 **문구가 수정되면 안 됩니다.**
> 규칙의 상세 정의/예외는 반드시 [docs/CLAUDE.md](../CLAUDE.md)를 따릅니다.

- `npm run lint` / `npx tsc --noEmit` 는 **마지막 Phase 에서만 실행**한다. 실패하면 즉시 수정 후 재검증한다.
- Phase 0 은 "레드(의도적 미구현/실패 상태)" 허용, Phase 1 부터는 **그린 유지**를 원칙으로 한다.
- 이미 생성된 plan 은 **체크리스트 업데이트 외 수정 금지**한다.
- 스킵은 가능하면 **Phase 분해로 제거**한다.

---

## 1) 목표(Goal)

- [ ] 목표 1: `lightweight-charts` CDN 버전을 `4.2.0` → `5.1.0` 으로 업그레이드하되, 기존 차트 기능(4개 자산 주가/Equity 차트, MA·상하단밴드, 시그널·체결 마커, 크로스헤어 값 헤더, YYYY-MM-DD 라벨, 좌측 선제 로드 마스킹) 의 **동작 회귀 없이** 전환
- [ ] 목표 2: 좌우 경계 margin 60 봉 적용 — 우측은 `rightOffset: 60` + `fixRightEdge: true` / 좌측은 `subscribeVisibleLogicalRangeChange` 에서 `range.from < -60` 시 `setVisibleLogicalRange` 재조정 (whitespace 주입 없이)
- [ ] 목표 3: Phase 단위로 독립 검증 가능하도록 분리 (Phase 1 = 업그레이드만, Phase 2 = margin 만) — 회귀 원인 격리

## 2) 비목표(Non-Goals)

- v5 에서 추가된 기능 (multi-pane, data conflation, text watermark primitive 등) 도입 없음
- TypeScript 패키지로의 전환 없음 — 현재 "CDN + 전역 `LightweightCharts`" 패턴 그대로 유지
- 차트 타입 / 렌더링 방식 변경 없음 (LineSeries 6개 그대로)
- 서버 데이터 계약 변경 없음
- 픽셀 단위 rightOffset (`rightOffsetPixels`) 사용 안 함 — 봉 단위로 충분

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- 현재 `CHART_LIB_VERSION = '4.2.0'` 은 2024-07-26 릴리스. 이후 v4.2.3 (2025-01-23) 까지 3 차례 패치가 있었고 TradingView 는 v4 계열 유지보수를 v4.2.3 이후 사실상 종료 (15개월 무패치)
- v5 는 활발히 유지보수 중 (최신 v5.1.0, 2025-12-16)
- 별개 요구: 차트 좌우 스크롤 한계에 "한 달 여유" (`first_date` 한 달 전 / `last_date` 한 달 후) 가 필요. v4/v5 어느 버전이든 `leftOffset` 옵션은 없음 → **스크롤 이벤트 재조정 방식** 으로 구현 (공식 확인)

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md`
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 SoT, 변경 금지)
- 실행 명령어 SoT: `docs/COMMANDS.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [ ] `CHART_LIB_VERSION = '5.1.0'` 로 변경되고 WebView 가 정상 로드
- [ ] 주가 차트 렌더 정상: 종가 / EMA / 상단밴드 / 하단밴드 / 마커 4종 (매수시그널 ▲ / 매도시그널 ▼ / 내 매수 ● / 내 매도 ●) 이 v4 동작과 동일하게 표시
- [ ] Equity 차트 렌더 정상: Model / Actual 라인
- [ ] 크로스헤어 상단 헤더 정상 (날짜/값/색상 스와치)
- [ ] 좌측 선제 로드 마스킹(`setLoadingOverlay`) 정상
- [ ] X축 눈금 및 크로스헤어 수직선 라벨 `YYYY-MM-DD` 유지
- [ ] 우측: 마지막 봉 뒤 60 봉 여유 + 그 이상 오른쪽 스크롤 불가
- [ ] 좌측: 첫 봉 앞 60 봉 여유까지 허용 + 그 이상 왼쪽 스크롤 시 -60 지점으로 재조정
- [ ] `npm run lint` 통과
- [ ] `npx tsc --noEmit` 통과
- [ ] `npx prettier --write .` 실행
- [ ] 사용자 실기 검증 완료 (Phase 1 / Phase 2 각각 + 통합)
- [ ] 필요한 문서 업데이트 (README.md 변경 없음 / `docs/COMMANDS.md` 변경 없음 / CLAUDE.md §9 의 버전 관련 서술 정합 여부 점검)
- [ ] plan 체크박스 최신화

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/utils/constants.ts` — `CHART_LIB_VERSION = '5.1.0'` 갱신
- `src/utils/chartHtml.ts`:
  - Phase 1: `chart.addLineSeries(...)` → `chart.addSeries(LightweightCharts.LineSeries, ...)` 변환 (6개 시리즈)
  - Phase 1: `closeSeries.setMarkers(markers)` → `LightweightCharts.createSeriesMarkers(closeSeries, markers)` 변환 + primitive 인스턴스 관리 (이전 primitive detach)
  - Phase 2: `timeScale` 옵션에 `rightOffset: 60`, `fixRightEdge: true` 추가
  - Phase 2: 기존 `subscribeVisibleLogicalRangeChange` 콜백에 좌측 재조정 분기 추가
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음 (실행 명령어/CLI 옵션 무관)
- `CLAUDE.md`: §9 에 CDN 버전을 직접 명시하는 부분이 없다면 변경 없음. 메시지 화이트리스트 / 주입 함수 섹션도 변경 없음.

### 데이터/결과 영향

- RTDB payload 스키마 변경 없음
- 네트워크: CDN 에서 다운받는 번들 크기 소폭 변화 (v5 는 "16% 번들 사이즈 감소" 발표). 실제로 v5.1.0 production.js 는 189 KB (v4.2.0 대비 약간 감소 추정)
- 렌더링 동작: "기능 동일, 내부 렌더러만 업데이트" 가 목표. 실기 검증에서 시각적 회귀 없음 확인.

## 6) 단계별 계획(Phases)

### Phase 0 — v5 API 매핑 / margin 규칙 고정 (레드 허용, 코드 변경 없음)

**작업 내용**:

- [x] **v5 API 매핑표 확정** (우리 앱 사용 API 한정):

  | v4 (현재) | v5 (목표) | 호출 위치 |
  | --- | --- | --- |
  | `chart.addLineSeries({...})` | `chart.addSeries(LightweightCharts.LineSeries, {...})` | `setPriceChart` 4회 + `setEquityChart` 2회 |
  | `series.setMarkers(markers)` | `LightweightCharts.createSeriesMarkers(series, markers)` 가 반환하는 primitive 인스턴스로 관리. 교체 시 이전 primitive 의 `detach()` 호출 후 새로 생성 | `setPriceChart` 의 markers 블록 |
  | `chart.subscribeCrosshairMove(cb)` | 동일 | 1회 (chart 생성 직후) |
  | `chart.timeScale().subscribeVisibleLogicalRangeChange(cb)` | 동일 | 1회 (chart 생성 직후) |
  | `createChart(el, { layout, grid, timeScale, rightPriceScale, crosshair, localization })` | 동일 | 1회 |
  | `timeScale.tickMarkFormatter` / `localization.timeFormatter` / `localization.dateFormat` | 동일 | 1회 |
  | `chart.removeSeries(series)` | 동일 | `clearAllSeries` |

- [x] **CDN 경로 / 전역 네임스페이스 확정**:
  - URL: `https://unpkg.com/lightweight-charts@5.1.0/dist/lightweight-charts.standalone.production.js` — 파일명 동일 (v5.1.0 의 dist 에 존재 확인 완료)
  - 전역: `window.LightweightCharts` (UMD 번들 관례, v5 에도 유지)
- [x] **마커 primitive 수명 관리 규칙**:
  - 모듈 scope 에 `closeMarkers` 변수 보관
  - `setPriceChart` 최상단 `clearAllSeries` 에서 `closeMarkers` 가 존재하면 `closeMarkers.detach()` 후 `null` 대입
  - 새 markers 세팅 시 `closeMarkers = LightweightCharts.createSeriesMarkers(closeSeries, markers)`
- [x] **margin 규칙 확정**:
  - `CHART_EDGE_MARGIN_BARS = 60` (chartHtml 내부 상수)
  - 우측: `timeScale: { rightOffset: 60, fixRightEdge: true, tickMarkFormatter: ... }`
  - 좌측: 기존 `subscribeVisibleLogicalRangeChange` 콜백에 `if (range.from < -60) chart.timeScale().setVisibleLogicalRange({ from: -60, to: range.to })` 분기 추가. 기존 `load_earlier` 트리거 분기와 함께 같은 콜백 내부에서 공존.
  - `fixLeftEdge` 는 건드리지 않음 (기본 false 유지. true 면 "첫 봉 = 왼쪽 고정" 이 되어 margin 을 덮어씀)
- [x] **Phase 커밋 경계 확정**:
  - Phase 1 완료 시점에 사용자 커밋 1회 (업그레이드 단독)
  - Phase 2 완료 시점에 사용자 커밋 1회 (margin 단독)
  - 마지막 Phase 는 문서·체크박스 정리 중심이라 커밋 여부는 사용자 선택

---

### Phase 1 — v5.1.0 업그레이드 (동작 회귀 없음, 그린 유지)

> margin 관련 변경은 이 Phase 에서 **하지 않음**. 업그레이드만 독립 수행.

**작업 내용**:

- [x] `src/utils/constants.ts` — `CHART_LIB_VERSION = '5.1.0'`
- [x] `src/utils/chartHtml.ts`:
  - `var closeSeries = null; ...` 옆에 `var closeMarkers = null;` 추가
  - `clearAllSeries` 에 `if (closeMarkers) { closeMarkers.detach(); closeMarkers = null; }` 추가
  - 6개 `addLineSeries` 를 `addSeries(LightweightCharts.LineSeries, {...})` 로 치환
  - `closeSeries.setMarkers(markers)` 를 `closeMarkers = LightweightCharts.createSeriesMarkers(closeSeries, markers)` 로 치환
- [x] **margin 관련 옵션은 추가하지 않음** — Phase 2 전까지 동작 불변 유지
- [ ] 실기 검증 (Phase 1 한정) — 사용자 대기:
  - 차트 탭 진입 정상 (WebView 에러 없음)
  - 주가 차트 4개 자산 렌더 정상 (라인 / 밴드 / 마커 4종)
  - Equity 모드 렌더 정상
  - 크로스헤어 헤더 정상
  - 날짜 라벨 YYYY-MM-DD 유지
  - 좌측 선제 로드 마스킹 정상
  - 좌우 스크롤 동작은 **기존과 동일** (60 margin 없음 상태)
- [ ] **Phase 1 커밋 지점 — 사용자 대기**

---

### Phase 2 — 좌우 60 봉 margin 적용 (그린 유지)

> Phase 1 이 안정화된 v5 API 위에서 margin 옵션만 추가.

**작업 내용**:

- [ ] `src/utils/chartHtml.ts` `createChart` 옵션의 `timeScale` 블록 확장:
  - `rightOffset: 60`
  - `fixRightEdge: true`
  - (기존) `borderColor`, `tickMarkFormatter` 유지
- [ ] 기존 `subscribeVisibleLogicalRangeChange` 콜백 내부 로직 병합:
  ```js
  chart.timeScale().subscribeVisibleLogicalRangeChange(function (range) {
    if (!range) return;
    // 좌측 경계: -60 이상으로 끌려가면 -60 에서 고정
    if (range.from < -60) {
      chart.timeScale().setVisibleLogicalRange({ from: -60, to: range.to });
      return;
    }
    // 선제 archive 로드 트리거 (기존 threshold 30 유지)
    if (range.from < 30) {
      var now = Date.now();
      if (now - lastEarlierRequest < 1500) return;
      lastEarlierRequest = now;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'load_earlier' }));
    }
  });
  ```
- [ ] 상수화 — chartHtml 내부에 `var CHART_EDGE_MARGIN_BARS = 60;` 선언하고 위 두 곳 (`rightOffset`, 좌측 가드) 에서 참조
- [ ] 실기 검증 (Phase 2 한정):
  - 우측: 마지막 봉 뒤 약 60 봉 빈 공간 존재, 그 이상 오른쪽 스크롤 불가 (튕김 허용)
  - 좌측: 첫 봉 앞 약 60 봉 빈 공간까지 스크롤 가능, 그 이상은 -60 에서 재조정 (튕김)
  - 기존 선제 로드 (threshold 30) 는 정상 동작
  - 마스킹 오버레이 정상
- [ ] **Phase 2 커밋 지점 — 사용자 대기**

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [ ] `CLAUDE.md` §9 의 "TradingView Lightweight Charts CDN 방식" 서술 점검 (버전 명시 부분이 있으면 정합 확인. 현재 §9.4 는 `CHART_LIB_VERSION` 참조만 하므로 변경 없음 추정)
- [ ] `README.md` / `docs/COMMANDS.md` 변경 없음 확인
- [ ] `npx prettier --write .` 실행
- [ ] 변경 기능 및 전체 플로우 최종 검증 (사용자 실기 확인)
- [ ] DoD 체크리스트 최종 업데이트 및 체크 완료
- [ ] 전체 Phase 체크리스트 최종 업데이트 및 상태 확정

**Validation**:

- [ ] `npm run lint` 통과
- [ ] `npx tsc --noEmit` 통과
- [ ] 사용자 실기 검증:
  - 전체 통합 플로우: 차트 탭 진입 → 자산 전환(SSO/QLD/GLD/TLT) → Equity 전환 → 좌측 관성 스크롤 → 우측 경계 스크롤
  - 크로스헤어 / 마커 / 날짜 라벨 / 마스킹 / 선제 로드 전부 정상

#### Commit Messages (Final candidates) — 5개 중 1개 선택 (또는 Phase 1 / Phase 2 를 분리 커밋 시 각자 별도)

1. 차트 / lightweight-charts v5.1.0 업그레이드 + 좌우 60봉 margin
2. chartHtml / v5 API 전환 (addSeries / createSeriesMarkers) + 경계 margin
3. feat: 차트 v5 업그레이드 및 좌우 60봉 여유
4. utils / 차트 라이브러리 v4.2.0 → v5.1.0 마이그레이션
5. 차트 / v5.1.0 + rightOffset/fixRightEdge + 좌측 스크롤 재조정

**Phase 별 커밋 후보 (사용자가 분리 커밋 시)**:

- Phase 1: `차트 / lightweight-charts v5.1.0 업그레이드 (API 마이그레이션, 동작 불변)`
- Phase 2: `차트 / 좌우 60봉 경계 margin 적용 (rightOffset + 좌측 재조정)`

## 7) 리스크(Risks)

- **리스크 1 — v5 marker primitive 수명 관리 오류**: `createSeriesMarkers` 가 반환하는 primitive 를 detach 하지 않고 series 만 제거하면 메모리/내부 상태 잔존 가능. 완화: `clearAllSeries` 에서 반드시 `closeMarkers.detach()` 후 series 제거. 실기에서 자산 전환 반복 후 렌더 이상 없는지 확인.
- **리스크 2 — `LightweightCharts.LineSeries` 전역 노출 이슈**: v5 의 standalone UMD 가 `LightweightCharts.LineSeries` / `LightweightCharts.createSeriesMarkers` 를 전역으로 노출하는지는 실기에서 확인 필요. 만약 누락되면 import 가능 여부나 다른 경로 탐색. 완화: Phase 1 실기 검증 시 WebView 콘솔 에러 확인, 실패 시 `typings.d.ts` 기준 실제 전역 구조 재확인.
- **리스크 3 — `fixRightEdge + rightOffset` 조합 동작 해석**: "마지막 봉이 오른쪽에 고정" 과 "60 봉 여유" 가 동시 의미일 때 실제 동작이 사용자 기대와 다를 가능성. 완화: 실기 검증에서 "마지막 봉 뒤 60봉 빈 공간이 보이면서 그 이상 오른쪽 스크롤 불가" 가 맞는지 확인. 만약 fixRightEdge 가 rightOffset 을 덮어쓰면 `fixRightEdge: false` 로 두고 좌측과 동일한 스크롤 재조정 방식으로 구현 (Phase 2 내부 조정).
- **리스크 4 — 좌측 재조정 시 "튕김" UX**: `setVisibleLogicalRange` 가 매 프레임 호출되면 스크롤 중 떨림 현상 가능. 완화: 이미 `subscribeVisibleLogicalRangeChange` 는 봉 단위로 throttled 되어 과도한 호출 없음. 필요 시 rAF-throttle 추가는 Phase 2 내부 조정.
- **리스크 5 — v5 CDN latency**: unpkg 가 v5.1.0 번들을 캐시 못 받은 경우 최초 로드 지연. 완화: 번들 크기 189 KB 로 v4.2.0 과 유사. 2차 이후 HTTP 캐시 적용.
- **리스크 6 — Android WebView 엔진 호환성**: v5 는 ES 문법을 많이 씀 (v4 동일 수준). 우리 앱은 최신 Android WebView 사용이라 위험 낮음. 실기 검증에서 확인.

## 8) 메모(Notes)

### v5 API 매핑 최종 (Phase 0 결과물)

| v4 호출 (현재) | v5 호출 (목표) |
| --- | --- |
| `chart.addLineSeries({ color, lineWidth })` | `chart.addSeries(LightweightCharts.LineSeries, { color, lineWidth })` |
| `chart.addLineSeries({ color, lineWidth, lineStyle })` | `chart.addSeries(LightweightCharts.LineSeries, { color, lineWidth, lineStyle })` |
| `series.setData(points)` | 동일 |
| `series.setMarkers(markers)` | `const primitive = LightweightCharts.createSeriesMarkers(series, markers);` |
| `chart.removeSeries(series)` | 동일 (primitive 는 별도 detach) |
| `chart.subscribeCrosshairMove(cb)` | 동일 |
| `chart.timeScale().subscribeVisibleLogicalRangeChange(cb)` | 동일 |
| `chart.timeScale().setVisibleLogicalRange({ from, to })` | 동일 |

### margin 규칙 (Phase 0 결과물)

- 상수: `CHART_EDGE_MARGIN_BARS = 60` (chartHtml 내부)
- 우측: `timeScale: { rightOffset: 60, fixRightEdge: true, ... }`
- 좌측: `subscribeVisibleLogicalRangeChange` 콜백에서 `range.from < -60` 시 `setVisibleLogicalRange({ from: -60, to: range.to })`

### 진행 로그 (KST)

- 2026-04-24 20:15: Draft 작성. 사용자 지시 "옵션 B (1 plan, Phase 분리)" 확정. Phase 1 완료 시점 사용자 커밋 대기 → Phase 2 완료 시점 사용자 커밋 대기 → 마지막 Phase 최종 검증 흐름으로 진행 예정.
- 2026-04-24 20:40: Phase 0 / Phase 1 완료. `CHART_LIB_VERSION` 5.1.0 갱신, `chartHtml.ts` 의 `addLineSeries` 6개를 `addSeries(LightweightCharts.LineSeries, ...)` 로 치환, `setMarkers` 를 `createSeriesMarkers` primitive 패턴으로 치환 + `clearAllSeries` 에 detach 추가. `npx tsc --noEmit` 출력 없음(통과). Phase 2 진행 전 사용자 실기 검증 + 커밋 대기.

---
