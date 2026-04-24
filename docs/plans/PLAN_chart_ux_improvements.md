# Implementation Plan: 차트 UX 개선 (빠른 스크롤 갭 / 날짜 포맷 / 크로스헤어 값 상단 표시)

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

**작성일**: 2026-04-24 18:00
**마지막 업데이트**: 2026-04-24 19:10
**관련 범위**: screens (ChartScreen), components (신규 ChartValueHeader, ChartWebView), utils (chartHtml, format), store (useStore)
**관련 문서**: CLAUDE.md §9 (WebView + TradingView Charts 규칙), docs/DESIGN_QBT_LIVE_FINAL.md

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

- [x] 목표 1: 차트 좌측 빠른 스크롤 시 발생하는 빈 구간을 **선제 로드 + 로딩 마스킹 오버레이** 조합으로 제거 (threshold 30 봉)
- [x] 목표 2: 차트 X축 눈금과 크로스헤어 날짜 라벨을 모두 `YYYY-MM-DD` 로 통일
- [x] 목표 3: 크로스헤어 이동 시 종가/EMA-200/상하단밴드(또는 Model/Actual) 값을 차트 상단에 실시간 표시, 손을 떼면 마지막 값 유지, 초기 진입 시 최신 봉 값 기본 표시

## 2) 비목표(Non-Goals)

- 서버(QBT 본체) 의 RTDB 계약 변경 없음
- 차트 타입(주가/Equity) 토글 UI 변경 없음
- 마커(buy/sell/user_buys/user_sells) 처리 변경 없음
- `lightweight-charts` CDN 버전 업그레이드 없음 (`CHART_LIB_VERSION` 유지)
- iOS 지원 논의 없음 (Android 전용 유지)
- 차트 줌 / pan 동작 방식 변경 없음 (마스킹은 시각적 overlay 만, 인터랙션은 기존 gesture 그대로)
- 기간 선택 버튼 추가 없음 (CLAUDE.md §14 금지 목록 준수)

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- **빠른 스크롤 갭**: [src/utils/chartHtml.ts](../../src/utils/chartHtml.ts) 의 좌측 끝 감지 threshold 가 `range.from < 10` 으로 임박 시점에만 로드 요청. 1500ms throttle 과 "1회 요청당 1년치" 제약이 겹쳐 관성 스크롤에 로드가 따라오지 못함.
- **날짜 포맷 불일치**: Lightweight Charts 기본 포맷(`24 Oct '25`, `2022`)과 앱의 일관된 표기 규칙([CLAUDE.md §7.4](../../CLAUDE.md): 날짜는 ISO 8601 `YYYY-MM-DD`) 이 맞지 않음.
- **값 확인 수단 부재**: 사용자가 특정 날짜의 종가/EMA/밴드 수치를 정확히 읽을 방법이 없음 (마우스가 없는 모바일 환경). 크로스헤어는 보이지만 숫자 표시가 축 라벨로 한정.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md`
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 SoT, 변경 금지)
- 실행 명령어 SoT: `docs/COMMANDS.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [ ] 차트 좌측으로 관성 스크롤 시 2~3 프레임 이상 비어 보이는 구간이 사라짐 — 사용자 실기 검증 대기
- [ ] 선제 로드 동작: 좌측 감지 1회당 현재 연도 + 그 전년도까지 2년치가 병렬 로드됨 (archive_years 에 포함될 때) — 사용자 실기 검증 대기
- [ ] 로딩 중에도 보이는 구간이 있다면 `불러오는 중…` 텍스트가 있는 좌측 마스킹 오버레이로 덮임 — 사용자 실기 검증 대기
- [ ] X축 눈금 표기가 모두 `YYYY-MM-DD` 형식 — 사용자 실기 검증 대기
- [ ] 크로스헤어 수직선의 날짜 라벨이 `YYYY-MM-DD` 형식 — 사용자 실기 검증 대기
- [ ] 차트 상단(자산 선택 아래, 차트 위)에 값 표시 영역이 고정 높이로 존재 — 사용자 실기 검증 대기
- [ ] 주가 모드: 날짜 / 종가 / EMA-200 / 상단밴드 / 하단밴드 값 표시 (USD 포맷) — 사용자 실기 검증 대기
- [ ] Equity 모드: 날짜 / Model / Actual 값 표시 (USD 포맷) — 사용자 실기 검증 대기
- [ ] 크로스헤어를 차트 위에서 움직이면 상단 값이 실시간 갱신됨 — 사용자 실기 검증 대기
- [ ] 차트에서 손을 떼도 마지막 값이 유지됨 — 사용자 실기 검증 대기
- [ ] 초기 진입 / 자산 전환 / 모드 전환 시 자동으로 최신 봉의 값이 표시됨 — 사용자 실기 검증 대기
- [x] `npm run lint` 통과 (0 errors, 기존 warnings 8개)
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행
- [ ] 사용자 실기 검증 완료 (차트 탭 / SSO·QLD·GLD·TLT / Equity / 좌측 관성 스크롤)
- [x] 필요한 문서 업데이트 (README.md 변경 없음 / `docs/COMMANDS.md` 변경 없음 / CLAUDE.md §9.2 메시지 화이트리스트 `crosshair` 및 주입 함수 `setLoadingOverlay` 추가 완료)
- [x] plan 체크박스 최신화

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/utils/chartHtml.ts` — threshold 30 적용, 로딩 오버레이 HTML/CSS/`window.setLoadingOverlay`, `localization.timeFormatter` + `timeScale.tickMarkFormatter`, `subscribeCrosshairMove` 추가, 메시지 타입 `crosshair` 추가
- `src/store/useStore.ts` — `loadPriceArchive` / `loadEquityArchive` 에서 "현재 연도 + 전년도 병렬 선제 로드" 적용. 기존 단일 연도 호출 시그니처 유지
- `src/screens/ChartScreen.tsx` — 크로스헤어 state 관리, 상단 `ChartValueHeader` 렌더, 로딩 오버레이 동기화 (`setLoadingOverlay` inject), 초기/자산전환/모드전환 시 최신 봉 값으로 reset
- `src/components/ChartWebView.tsx` — onMessage 파서에 `crosshair` 타입 추가 (기존 `ready` / `load_earlier` 외)
- `src/components/ChartValueHeader.tsx` (신규) — props: `type: 'price'|'equity'`, `date: string|null`, `values: {...} | null`. 색상 스와치 + 값 포맷.
- `src/utils/format.ts` — 크로스헤어 라벨용 USD 포맷 재사용 (기존 `formatUSD` / `formatUSDInt`). 신규 함수 불필요.
- `CLAUDE.md` §9.2 — WebView 메시지 화이트리스트에 `crosshair` 추가
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음 (실행 명령어/CLI 옵션 변경 없음)

### 데이터/결과 영향

- RTDB payload 스키마 변경 없음
- 네트워크: 좌측 스크롤 1회당 archive 요청 최대 2회 (병렬). 기존 1회 → 2회. 1년치 ≈ 30~60 KB 이므로 체감 영향 미미
- 상태 저장 구조 변경 없음 (`priceCharts[assetId].archive` / `equityChart.archive` Map 유지)
- WebView → RN 메시지 타입 추가: `crosshair` (payload: `{ date: string, values: { close?, ma?, upper?, lower?, model?, actual? } }`). 기존 `ready` / `load_earlier` 와 공존
- RN → WebView 주입 함수 추가: `window.setLoadingOverlay(boolean)`

## 6) 단계별 계획(Phases)

### Phase 0 — 메시지 프로토콜 / 정책 고정 (레드 허용)

> WebView ↔ RN 경계의 신규 메시지 타입과 컴포넌트 인터페이스를 먼저 확정한다.
> 이 Phase 에서는 코드 미변경. 규칙만 고정한다.

**작업 내용**:

- [x] **WebView → RN 메시지 타입 화이트리스트 확장**:
  - `ready` (기존)
  - `load_earlier` (기존)
  - `crosshair` (신규) — payload: `{ type: 'crosshair', date: string, values: { close?: number; ma?: number; upper?: number; lower?: number; model?: number; actual?: number } }`
  - `crosshair_leave` 는 **미도입**: 사용자 선택이 "손 떼면 마지막 값 유지" 이므로 leave 이벤트 필요 없음. param.time 이 없는 호출은 무시.
- [x] **RN → WebView 주입 함수**:
  - 기존: `window.setPriceChart(data)`, `window.setEquityChart(data)`
  - 신규: `window.setLoadingOverlay(on: boolean)` — 좌측 영역에 `#chart-loading-overlay` div 의 visibility 만 토글
- [x] **컴포넌트 인터페이스**:
  ```typescript
  // src/components/ChartValueHeader.tsx
  interface ChartValueHeaderProps {
    type: 'price' | 'equity';
    date: string | null; // YYYY-MM-DD, null 이면 '--'
    values: CrosshairValues | null;
  }
  interface CrosshairValues {
    close?: number;
    ma?: number;
    upper?: number;
    lower?: number;
    model?: number;
    actual?: number;
  }
  ```
- [x] **선제 로드 규칙**:
  - `loadPriceArchive(assetId, year)` 호출 시 본체 로드 완료 후 `year - 1` 이 `meta.archive_years` 에 포함되고 아직 로드/로드중이 아닐 때 `loadPriceArchive(assetId, year - 1)` 를 **병렬**로 호출 (파이어앤포겟 방식으로 await 하지 않음 — 호출부 latency 는 1년치 응답만 기다림)
  - equity 도 동일
  - threshold 는 HTML 상수 `LOAD_EARLIER_THRESHOLD = 30` 으로 고정
- [x] **로딩 오버레이 가시성 규칙**:
  - 차트 좌측 40% 너비 (CSS `width: 40%`) 의 절대 위치 div
  - 배경: `CHART_COLORS.background` + 반투명 (`opacity: 0.9`)
  - 내용: `불러오는 중…` 텍스트 (sub 색)
  - 제어: `loading[priceArchiveLoadingKey(assetId, any year)]` 또는 `loading[equityArchiveLoadingKey(any year)]` 중 하나라도 true 일 때 표시

---

### Phase 1 — 빠른 스크롤 갭 해결 (선제 로드 + 마스킹) (그린 유지)

**작업 내용**:

- [x] `src/utils/chartHtml.ts`:
  - threshold `range.from < 10` → `range.from < 30`
  - HTML 에 `<div id="chart-loading-overlay">불러오는 중…</div>` 추가 (좌측 40% 너비, 세로 100%, 반투명 배경)
  - `window.setLoadingOverlay(on)` 정의 — `display` 를 `flex`/`none` 토글
- [x] `src/store/useStore.ts::loadPriceArchive`:
  - 선택적 파라미터 `prefetchNext = true` 추가. 기존 호출부 호환 유지.
  - 본체 로드 완료 후 `year - 1` 조건(meta 존재 + archive_years 에 포함 + archive Map 에 미존재 + 이미 로드 중 아님) 충족 시 `loadPriceArchive(assetId, year - 1, false)` 를 `.catch(() => {})` 로 fire-and-forget
  - 재귀 1단계만 진행 (내부 호출은 prefetchNext=false)
- [x] `src/store/useStore.ts::loadEquityArchive`: 동일 패턴 적용
- [x] `src/screens/ChartScreen.tsx`:
  - `isArchiveLoading` 메모이제이션 추가. 접두사: `chart_archive_${assetId}_` (price), `chart_archive_equity_` (equity)
  - `useEffect` 에서 `isArchiveLoading` 변화 시 `webviewRef.current?.injectJavaScript('window.setLoadingOverlay(<bool>); true;')`

---

### Phase 2 — X축/크로스헤어 날짜 `YYYY-MM-DD` 포맷 (그린 유지)

**작업 내용**:

- [x] `src/utils/chartHtml.ts`:
  - `identityDateFormatter` 선언 (문자열 time 을 그대로 통과)
  - `createChart` 옵션에 `timeScale.tickMarkFormatter: identityDateFormatter` 추가
  - `localization: { dateFormat: 'yyyy-MM-dd', timeFormatter: identityDateFormatter }` 추가
- [x] 주가 / Equity 두 시리즈 타입 모두에 영향. 별도 분기 불필요.

---

### Phase 3 — 크로스헤어 값 상단 표시 (그린 유지)

**작업 내용**:

- [x] `src/components/ChartValueHeader.tsx` 신규 작성:
  - Props: `{ type, date, values }`
  - 주가 모드 행: 날짜 + 종가 + EMA + 상단 + 하단 각각 라벨 색상 + 값(USD) 배치 (라벨 짧게 변경)
  - Equity 모드 행: 날짜 + Model + Actual
  - 값이 undefined 이면 `--` 로 표기
  - `StyleSheet.create` + `COLORS` 상수 사용 (CLAUDE.md §5.3)
- [x] `src/utils/chartHtml.ts` 모듈 scope `chart.subscribeCrosshairMove(...)` 한 번만 등록 (series 교체 후에도 모듈 scope 의 `*Series` 참조가 최신이므로 재구독 불필요).
- [x] subscribe 구현:
  ```js
  chart.subscribeCrosshairMove(function (param) {
    if (!param || !param.time || !param.seriesData) return;
    var v = {};
    if (closeSeries && param.seriesData.get(closeSeries))
      v.close = param.seriesData.get(closeSeries).value;
    if (maSeries && param.seriesData.get(maSeries))
      v.ma = param.seriesData.get(maSeries).value;
    if (upperSeries && param.seriesData.get(upperSeries))
      v.upper = param.seriesData.get(upperSeries).value;
    if (lowerSeries && param.seriesData.get(lowerSeries))
      v.lower = param.seriesData.get(lowerSeries).value;
    if (modelSeries && param.seriesData.get(modelSeries))
      v.model = param.seriesData.get(modelSeries).value;
    if (actualSeries && param.seriesData.get(actualSeries))
      v.actual = param.seriesData.get(actualSeries).value;
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'crosshair', date: param.time, values: v }),
    );
  });
  ```
- [x] `src/components/ChartWebView.tsx`:
  - `IncomingMessage` 유니온에 `{ type: 'crosshair'; date: string; values: CrosshairValues }` 추가
  - `isIncomingMessage` 가드에 해당 타입 검증 추가
  - `onCrosshair(date, values)` 콜백 prop 로 상위에 전달
- [x] `src/screens/ChartScreen.tsx`:
  - state 추가: `const [crosshair, setCrosshair] = useState<CrosshairState>({ date: null, values: null });`
  - Effect 4 추가: `chartType`/`assetId`/`priceCache?.recent`/`equityCache.recent` 변화 시 recent 의 마지막 인덱스 값으로 reset
  - 상단 레이아웃: `controls` 아래 `<ChartValueHeader type={chartType} date={crosshair.date} values={crosshair.values} />`
  - `<ChartWebView onCrosshair={handleCrosshair} />` 연결

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] `CLAUDE.md §9.2` 메시지 타입 화이트리스트에 `crosshair` 추가 + 주입 함수 `setLoadingOverlay` 명시
- [x] `README.md` / `docs/COMMANDS.md` 변경 없음 확인
- [x] `npx prettier --write .` 실행 (자동 포맷 적용)
- [ ] 변경 기능 및 전체 플로우 최종 검증 (사용자 실기 확인) — 대기
- [x] DoD 체크리스트 최종 업데이트 및 체크 완료 (실기 검증 항목 제외)
- [x] 전체 Phase 체크리스트 최종 업데이트 및 상태 확정

**Validation**:

- [x] `npm run lint` 통과 — 0 errors, 기존 warnings 8개 (이번 변경과 무관)
- [x] `npx tsc --noEmit` 통과 — 출력 없음
- [ ] 사용자 실기 검증:
  - 차트 탭 진입 직후 최신 봉의 값이 상단에 표시됨 (SSO/QLD/GLD/TLT 각각)
  - Equity 모드 진입 직후 최신 봉의 Model/Actual 값 표시
  - 차트 위에서 손가락을 좌우로 움직이면 상단 값이 실시간 갱신됨
  - 손을 떼도 마지막 값이 유지됨
  - X축 눈금과 크로스헤어 수직선 라벨이 모두 `YYYY-MM-DD`
  - 관성 스크롤로 차트를 빠르게 왼쪽으로 밀 때 공백이 사라짐 (혹은 공백 생길 구간이 `불러오는 중…` 마스킹으로 덮임)
  - 로드 완료 후 마스킹 자연 해제

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. 차트 / 빠른 스크롤 갭 제거 + 날짜 포맷 YYYY-MM-DD + 크로스헤어 값 상단 표시
2. 차트 / UX 3종 개선 (선제 archive 로드, 로딩 오버레이, 크로스헤어 값 헤더)
3. feat: 차트 상단 크로스헤어 값 표시 + 좌측 스크롤 마스킹
4. 차트 / ChartValueHeader 신설 및 chartHtml 크로스헤어 프로토콜 확장
5. 차트 / archive 선제 로드 2년치 병렬 + 축/라벨 YYYY-MM-DD 일원화 + 상단 값 표시

## 7) 리스크(Risks)

- **리스크 1 — 선제 로드 재귀 폭주**: `loadPriceArchive` 내부에서 `year - 1` 재귀 호출 시 무한 재귀 우려. 완화: `prefetchNext: boolean` 파라미터를 두어 내부 호출은 `false` 로 전달. 호출 깊이는 항상 2 이내.
- **리스크 2 — 로딩 오버레이가 영구적으로 표시됨**: archive 로드 실패 시 `finally` 에서 loading 해제하지 않으면 마스킹이 남음. 완화: `loadPriceArchive` / `loadEquityArchive` 의 기존 `finally { setLoading(loadingKey, false) }` 패턴 유지 (현재 이미 있음).
- **리스크 3 — 크로스헤어 메시지 과다**: 손가락 이동마다 초당 수십 개 메시지 발생 가능. 완화: Lightweight Charts 는 이미 봉 단위로만 이벤트 발행하므로 실질 초당 몇 개 수준. 추가 throttle 불필요.
- **리스크 4 — Equity 모드에서 주가 series 참조 남음**: `clearAllSeries` 에서 null 처리되어 있음. `subscribeCrosshairMove` 에서 각 series null 체크 필수.
- **리스크 5 — 초기 최신 봉 값 추출 복잡**: `recent.ma_value[last]` 가 null 일 수 있음 (워밍업 구간). 완화: `ma`/`upper`/`lower` 는 undefined 허용, 표시 시 `--` 로 폴백.
- **리스크 6 — X축 tickMarkFormatter 가 `YYYY-MM-DD` 를 그대로 표시 → 모바일 화면에서 공간 부족**: Lightweight Charts 가 자동으로 tick 간격을 조정하므로 실제 눈금 수는 줄어듦. 검증은 실기 확인에서 수행.

## 8) 메모(Notes)

### 메시지 프로토콜 확정 (Phase 0 결과물)

**WebView → RN 메시지 타입 화이트리스트**:

| type           | payload                           | 도입 시점 |
| -------------- | --------------------------------- | --------- |
| `ready`        | —                                 | 기존      |
| `load_earlier` | —                                 | 기존      |
| `crosshair`    | `{ date: string, values: {...} }` | 신규      |

**RN → WebView 주입 함수**:

| 함수                       | 인자          | 도입 시점 |
| -------------------------- | ------------- | --------- |
| `window.setPriceChart`     | data          | 기존      |
| `window.setEquityChart`    | data          | 기존      |
| `window.setLoadingOverlay` | `on: boolean` | 신규      |

### Phase 분해 근거

- Phase 0 에서 "프로토콜 + 컴포넌트 인터페이스 + 상수" 를 먼저 고정 (CLAUDE.md §1 Plan / §9 WebView 규칙 준수)
- Phase 1 (갭 해결) / Phase 2 (포맷) / Phase 3 (크로스헤어) 는 독립적이지만 모두 `chartHtml.ts` 를 건드리므로 **순서상 같은 파일을 3번 편집** 하는 대신 각 Phase 에서 해당 영역만 수정하여 충돌 최소화.
- Phase 3 에서 신규 컴포넌트 `ChartValueHeader` 와 `ChartWebView` 의 onMessage 확장이 함께 이루어지므로 한 Phase 로 묶음.

### 진행 로그 (KST)

- 2026-04-24 18:00: Draft 작성. 사용자 선택(1=E/threshold 30, 2=C, 3=전부 추천안) 반영. Phase 0/1/2/3/마지막 Phase 구성 승인 요청.
- 2026-04-24 19:10: 사용자 지시 "마지막 Phase 까지 승인/커밋 없이 전부 진행" 에 따라 Phase 0/1/2/3/마지막 Phase 를 연속 수행. 결과:
  - 신규: `src/utils/chartArchive.ts` (이전 plan), `src/components/ChartValueHeader.tsx`
  - 수정: `src/utils/chartHtml.ts` (오버레이 HTML/CSS, setLoadingOverlay, threshold 30, localization/tickMarkFormatter, subscribeCrosshairMove), `src/store/useStore.ts` (prefetchNext 파라미터 + fire-and-forget 선제 로드), `src/screens/ChartScreen.tsx` (isArchiveLoading, setLoadingOverlay inject, crosshair state + 최신 봉 초기화, ChartValueHeader 렌더), `src/components/ChartWebView.tsx` (crosshair 메시지 타입 + 가드), `CLAUDE.md §9.2` (crosshair 타입 + setLoadingOverlay 기록)
  - Validation: `npm run lint` 0 errors · `npx tsc --noEmit` 무오류 · `npx prettier --write .` 적용
  - 남은 항목: 사용자 실기 검증.

---
