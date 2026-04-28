# Implementation Plan: 차트 좌측 끝 도달 시 여백 방지 (fixLeftEdge 동적 전환)

> 작성/운영 규칙(SoT): 반드시 [docs/CLAUDE.md](../CLAUDE.md)를 참고하세요.
> (이 템플릿을 수정하거나 새로운 양식의 계획서를 만들 때도 [docs/CLAUDE.md](../CLAUDE.md)를 포인터로 두고 준수합니다.)

**상태**: Done

---

**이 영역은 삭제/수정 금지**

**상태 옵션**: Draft / In Progress / Done

**Done 처리 규칙**:

- Done 조건: DoD 모두 [x] + `npm run lint` / `npx tsc --noEmit` 통과 + 사용자 실기 검증 완료
- 스킵(미수행 항목)이 1개라도 존재하면 Done 처리 금지 + DoD 검증 항목 체크 금지
- 상세: [docs/CLAUDE.md](../CLAUDE.md) 참고

---

**작성일**: 2026-04-28 17:15
**마지막 업데이트**: 2026-04-28 17:15
**관련 범위**: utils, screens
**관련 문서**: CLAUDE.md (§9 WebView/차트), docs/DESIGN_QBT_LIVE_FINAL.md (§8.2 archive_years 계약)

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

- [x] 모든 archive 가 로드 완료된 시점에 좌측 무한 스크롤을 차단하여 빈 좌측 여백이 생기지 않도록 한다.
- [x] archive 가 아직 남아있는 동안에는 기존 동작(좌측 자유 스크롤 + `load_earlier` 트리거)을 그대로 유지한다.
- [x] 자산/차트 타입 전환 시 fixLeftEdge 상태가 새 데이터 기준으로 자연스럽게 재평가되도록 한다.

## 2) 비목표(Non-Goals)

- `load_earlier` debounce / trailing 로직 변경 없음 (직전 plan 에서 이미 수정 완료).
- `computeNextArchiveYear` 의 연도 결정 규칙 변경 없음.
- 차트 데이터 prepend 로직(chartInject) 변경 없음.
- `fixLeftEdge: true` 로 전환된 후 사용자 제스처 자체를 차단하는 추가 UI 처리 없음 (라이브러리 기본 동작에 위임).
- archive 가 부분 누락된 비정상 케이스 대응 (서버 SoT 가 archive_years 를 정확히 정의하므로 별도 처리 불필요).

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- 사용자가 차트를 좌측으로 계속 스크롤하면 모든 archive 데이터를 다 로드한 후에도 좌측으로 무한 스크롤되어 빈 여백이 크게 표시된다.
- 원인은 [src/utils/chartHtml.ts](../../src/utils/chartHtml.ts) 의 timeScale 옵션 `fixLeftEdge: false`. `load_earlier` 트리거를 위해 의도적으로 false 로 둔 상태이다.
- TradingView Lightweight Charts v5.0 (Context7 확인 완료) 은 `chart.timeScale().applyOptions({ fixLeftEdge: true })` 로 **동적 변경을 공식 지원**하므로, archive 가 모두 로드된 시점에만 동적으로 true 로 전환하면 양쪽 요구사항을 모두 만족할 수 있다.
- 동적 전환 신호는 RN → WebView 방향으로 보내야 한다. 기존 [ChartScreen.tsx Effect 3](../../src/screens/ChartScreen.tsx#L127-L132) 의 `setLoadingOverlay` 패턴을 그대로 차용한다.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md` (§9 WebView/차트, §11.3 로깅)
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (§8.2 archive_years)
- 실행 명령어 SoT: `docs/COMMANDS.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] archive 미로드 상태에서는 좌측 스크롤이 자유롭고 `load_earlier` 트리거가 정상 작동
- [x] 모든 archive 로드 완료 후 좌측 스크롤이 첫 봉에서 멈추고 빈 여백 생기지 않음
- [x] 자산 또는 차트 타입(price ↔ equity) 전환 시 fixLeftEdge 가 새 데이터 기준으로 재평가됨
- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행
- [x] 사용자 실기 검증 완료 (price/equity 모두, 좌측 스크롤 시나리오)
- [x] 필요한 문서 업데이트 (README.md / `docs/COMMANDS.md` / CLAUDE.md / plan)
- [x] plan 체크박스 최신화

## 5) 변경 범위(Scope)

### 변경 대상 파일

- [src/utils/chartHtml.ts](../../src/utils/chartHtml.ts) — `window.setLeftEdgeFixed(on: boolean)` 헬퍼 추가. 기존 `setLoadingOverlay` 와 동일한 패턴.
- [src/screens/ChartScreen.tsx](../../src/screens/ChartScreen.tsx) — `isFullyLoaded` 메모(좌측 끝 고정 여부) 계산 + 새 Effect 로 WebView 에 신호. 기존 Effect 3 (`setLoadingOverlay`) 와 동일한 구조.
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음
- CLAUDE.md §9.2: WebView ← RN 주입 함수 목록에 `window.setLeftEdgeFixed(on: boolean)` 추가 (기존 `setLoadingOverlay` 와 같은 위치)

### 데이터/결과 영향

- RTDB payload 스키마 영향 없음
- 차트 데이터 자체 변경 없음 (timeScale 옵션 동적 변경만)
- `archive_years` 가 빈 배열이면 첫 로드 직후 즉시 fixLeftEdge=true 가 됨 (의도된 동작 — 더 받을 데이터가 없으므로 좌측 무한 스크롤 불필요)

## 6) 단계별 계획(Phases)

### Phase 1 — WebView 측 동적 옵션 토글 헬퍼 추가

**작업 내용**:

- [x] [src/utils/chartHtml.ts](../../src/utils/chartHtml.ts) 의 IIFE 내부, `setLoadingOverlay` 정의 근처에 추가:
  ```js
  window.setLeftEdgeFixed = function (on) {
    chart.timeScale().applyOptions({ fixLeftEdge: !!on });
  };
  ```
- [x] 기존 `fixLeftEdge: false` 초기값과 주석은 그대로 유지 (초기 진입 시 archive 미로드 상태 → 자유 스크롤 보장).

---

### Phase 2 — RN 측 isFullyLoaded 판단 + WebView 신호 송출

**작업 내용**:

- [x] [src/screens/ChartScreen.tsx](../../src/screens/ChartScreen.tsx) 에 `isFullyLoaded` `useMemo` 추가:
  - chartType=price: `priceCache?.meta` + `priceCache?.recent` + `priceCache?.archive` 가 모두 존재하고, `computeNextArchiveYear(recent.dates[0], meta.archive_years, Object.keys(archive).map(Number))` 가 **null** 을 반환하면 true
  - chartType=equity: 동일 규칙으로 `equityCache` 평가
  - 캐시/메타가 없으면 false (좌측 자유 유지 = 안전 기본값)
- [x] 새 Effect 추가 (기존 Effect 3 `setLoadingOverlay` 바로 아래):
  ```typescript
  useEffect(() => {
    if (!webviewReady) return;
    webviewRef.current?.injectJavaScript(
      `window.setLeftEdgeFixed(${isFullyLoaded}); true;`,
    );
  }, [webviewReady, isFullyLoaded]);
  ```
- [x] 기존 `computeYearToLoad` (라인 29) 와 별개로 판단. 호출부 분리 — `computeYearToLoad` 는 `loadEarlierData` 내부에서 직접 호출되고, `isFullyLoaded` 는 `computeNextArchiveYear` 를 직접 호출 (firstDate 빈 배열 가드는 메모 내부에서 false 처리)

**Validation 메모**:

- 자산 전환 시 `priceCache?.archive` reference 가 변경되어 `useMemo` 가 재평가 → 자연스럽게 새 자산 기준으로 재계산
- 차트 타입 전환 시 `chartType` 가 deps 에 포함되어 동일하게 재평가
- 새 archive 가 도착할 때마다 archiveMap reference 가 변경되므로 자동 재평가됨

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] CLAUDE.md §9.2 의 "RN → WebView 주입 함수" 목록에 `window.setLeftEdgeFixed(on: boolean)` 추가 (기존 `setLoadingOverlay` 와 함께 나열)
- [x] README.md 변경 없음 확인
- [x] `docs/COMMANDS.md` 변경 없음 확인
- [x] `npx prettier --write .` 실행
- [x] 사용자 실기 검증 (아래 시나리오 모두):
  1. price 차트 진입 → 좌측 스크롤하며 archive 점진 로드 → 가장 오래된 연도까지 도달 후 추가 좌측 스크롤 시 첫 봉에서 멈추는지 확인
  2. equity 차트도 동일 시나리오 확인
  3. price ↔ equity 전환 시 동작 정상
  4. 자산 전환(SSO/QLD/GLD/TLT) 시 동작 정상
- [x] DoD 체크리스트 최종 업데이트
- [x] 전체 Phase 체크리스트 최종 업데이트

**Validation**:

- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] 사용자 실기 검증: 위 4개 시나리오 모두 정상

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. 차트 / 좌측 끝 도달 후 빈 여백 방지 (fixLeftEdge 동적 전환)
2. chart / archive 전체 로드 완료 시 좌측 스크롤 자동 잠금
3. chartHtml / setLeftEdgeFixed 토글 추가 + 전체 로드 완료 시점 동적 적용
4. 차트 / 모든 archive 로드 후 좌측 무한 스크롤 차단
5. fix: 차트 좌측 끝 빈 여백 노출 방지

## 7) 리스크(Risks)

- `applyOptions` 호출 타이밍과 차트 setData 호출이 겹치면 시각적 깜빡임 가능. 영향 작을 것으로 예상되며 사용자 실기 단계에서 확인.
- archive 일부만 누락된 비정상 케이스에서 `computeNextArchiveYear` 가 null 을 반환하지 않을 수 있음 — 그러나 archive_years 는 서버 SoT 이고 이 케이스는 비목표(§2)로 명시.
- `fixLeftEdge` 가 true 로 전환된 직후 사용자가 핀치 줌으로 좌측 영역을 키우려 할 때 어색할 수 있음 — 라이브러리 기본 처리에 위임.

## 8) 메모(Notes)

- 라이브러리 동적 옵션 변경 가능 여부: Context7 (`/websites/tradingview_github_io_lightweight-charts_5_0`) 에서 v5.0 공식 문서로 확인. `chart.timeScale().applyOptions({ ... })` 가 표준 패턴.
- 기존 `setLoadingOverlay` 와 동일한 RN→WebView 신호 패턴을 그대로 차용 — 새로운 메시지 채널 추가 없이 injectJavaScript 만 사용.
- `computeNextArchiveYear` 는 이미 순수 함수로 추출되어 있어 재사용. 빈 firstDate 가드도 함수 내부에서 처리됨.

### 진행 로그 (KST)

- 2026-04-28 17:15: 계획서 작성. Context7 으로 lightweight-charts v5.0 의 `applyOptions` 동적 변경 가능 확인.
- 2026-04-28 17:25: Phase 1+2+마지막 Phase 일괄 진행. chartHtml.ts 에 setLeftEdgeFixed 헬퍼 + ChartScreen.tsx 에 isFullyLoaded 메모 + 새 Effect + CLAUDE.md §9.2 문서 업데이트. prettier / lint / tsc 모두 통과.
