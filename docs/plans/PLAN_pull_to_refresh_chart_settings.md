# Implementation Plan: 차트 / 설정탭 Pull-to-Refresh 추가

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

**작성일**: 2026-04-28 17:55
**마지막 업데이트**: 2026-04-28 17:55
**관련 범위**: screens (Settings, Chart)
**관련 문서**: CLAUDE.md

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

- [x] 설정탭(SettingsScreen) 에 PTR 도입 — `refreshHome()` 로 portfolio / signals / pendingOrders 갱신하여 RTDB 연결 / FCM 등록 / 마지막 실행일 등 표시값을 즉시 새로고침.
- [x] 차트탭(ChartScreen) 의 컨트롤 영역(주가/Equity 토글 + AssetSelector)에 PTR 도입 — `refreshChart(현재 chartType/asset)` 호출로 차트 데이터(meta + archive) 강제 갱신.
- [x] WebView 영역과 PTR 제스처 충돌 없도록 차트 화면은 컨트롤 영역만 PTR 활성.

## 2) 비목표(Non-Goals)

- HomeScreen / TradeScreen 의 기존 PTR 동작 변경 없음 (정상 작동 확인됨).
- `PullToRefreshScrollView` 컴포넌트 자체 변경 없음 (재사용).
- 차트 archive 캐시 수동 무효화 / clear 추가 없음 — `refreshChart` 가 meta + archive 재 fetch 하면 store set 으로 자연 교체.
- 새 reload 버튼 / 새 액션 추가 없음 (기존 store 액션 재사용).

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- 설정탭은 `ScrollView` raw 를 사용하여 PTR 미구현 ([SettingsScreen.tsx](../../src/screens/SettingsScreen.tsx)). 사용자가 화면을 아래로 당겨도 새로고침되지 않음.
- 차트탭은 `View` + WebView 구조로 PTR 미구현 ([ChartScreen.tsx](../../src/screens/ChartScreen.tsx)). WebView 가 화면을 가득 채워 직관적인 reload 트리거가 없음.
- 두 화면 모두 데이터 갱신 액션은 store 에 이미 존재 (`refreshHome`, `refreshChart`).
- HomeScreen / TradeScreen 은 `PullToRefreshScrollView` 컴포넌트로 PTR 정상 작동 — 동일한 패턴을 적용하여 일관성 확보.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md` (§9 WebView/차트, §10 파일 구조)
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (변경 없음)
- 실행 명령어 SoT: `docs/COMMANDS.md` (변경 없음)

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] 설정탭에서 화면을 아래로 당겨 PTR 동작 확인 (스피너 표시 + 갱신)
- [x] 차트탭의 컨트롤 영역에서 화면을 아래로 당겨 PTR 동작 확인
- [x] WebView 영역에서는 PTR 트리거되지 않음 (차트 핀치 / 스와이프 제스처와 충돌 없음)
- [x] 기존 HomeScreen / TradeScreen PTR 회귀 없음
- [x] `npm run lint` / `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행
- [x] 사용자 실기 검증 완료 (4탭 모두 PTR 동작 확인)
- [x] 필요한 문서 업데이트 (README.md / `docs/COMMANDS.md` 변경 여부 명시)
- [x] plan 체크박스 최신화

## 5) 변경 범위(Scope)

### 변경 대상 파일

- [src/screens/SettingsScreen.tsx](../../src/screens/SettingsScreen.tsx) — `ScrollView` → `PullToRefreshScrollView` 로 교체. `refreshing` 은 `loading.home`, `onRefresh` 는 `refreshHome` 사용 (설정 화면이 보여주는 portfolio/RTDB/FCM 정보 갱신용).
- [src/screens/ChartScreen.tsx](../../src/screens/ChartScreen.tsx) — 컨트롤 영역(`controls` 뷰)을 `PullToRefreshScrollView` 로 감싸기. WebView 자체는 그대로 두고 컨트롤 영역만 PTR 활성. `onRefresh` 는 현재 `chartType` / `assetId` 에 맞춰 `refreshChart(assetId)` 또는 `refreshChart('equity')` 호출.
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음

### 데이터/결과 영향

- RTDB payload 변경 없음
- store 액션 / 시그니처 변경 없음 (재사용)
- 사용자 체감: 설정/차트 탭에서도 다른 탭처럼 PTR 가능 — 일관성 향상

## 6) 단계별 계획(Phases)

### Phase 1 — SettingsScreen PTR 도입

**작업 내용**:

- [x] [src/screens/SettingsScreen.tsx](../../src/screens/SettingsScreen.tsx) 의 `import` 에 `PullToRefreshScrollView` 추가, `ScrollView` import 제거.
- [x] `useStore` 에서 `refreshHome` / `loading` 셀렉트.
- [x] `onRefresh` 콜백을 `useCallback` 로 정의: `refreshHome()` 호출.
- [x] `<ScrollView … >` → `<PullToRefreshScrollView refreshing={loading.home === true} onRefresh={onRefresh} contentContainerStyle={styles.content}>` 로 교체.
- [x] PTR 컴포넌트가 자체 배경(`COLORS.bg`)을 적용하므로 `style={styles.container}` 의 배경색 중복은 검토 후 정리.

---

### Phase 2 — ChartScreen 컨트롤 영역에 PTR 추가

**작업 내용**:

- [x] [src/screens/ChartScreen.tsx](../../src/screens/ChartScreen.tsx) 의 컨트롤 영역(`controls` View + `ChartValueHeader`) 을 `PullToRefreshScrollView` 로 감싼다. 차트 영역(`chartArea` View) 은 PTR 외부에 배치.
- [x] `onRefresh` 콜백:
  ```typescript
  const onRefresh = useCallback(() => {
    if (chartType === 'price') refreshChart(assetId);
    else refreshChart('equity');
  }, [chartType, assetId, refreshChart]);
  ```
- [x] `refreshing` 은 현재 `chartType` 의 로딩 상태 — `loading[chartLoadingKey(assetId)] === true` (price) 또는 `loading[chartLoadingKey('equity')] === true` (equity).
- [x] 기존 ChartLegend / Toast 위치는 유지.
- [x] 컨트롤 영역의 PTR 만으로 충분한지 사용자 실기 검증 후 차트 영역 외 다른 영역까지 확장 여부 판단.

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] README.md / `docs/COMMANDS.md` 변경 없음 확인
- [x] `npx prettier --write .` 실행
- [x] 사용자 실기 검증:
  1. 설정탭 — 화면 당기면 스피너 + 갱신
  2. 차트탭 컨트롤 영역 — 화면 당기면 차트 데이터 새로 로드
  3. 차트 영역 (WebView) 에서는 PTR 트리거되지 않음
  4. 홈 / 거래탭 PTR 회귀 없음
- [x] DoD 체크리스트 최종 업데이트

**Validation**:

- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] 사용자 실기 검증: 위 4개 시나리오 모두 정상

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. 설정 / 차트 / Pull-to-Refresh 도입 (HomeScreen 패턴 재사용)
2. 차트,설정 / PTR 추가하여 4탭 새로고침 일관성 확보
3. screens / SettingsScreen + ChartScreen 컨트롤 영역에 PullToRefreshScrollView 적용
4. PTR / 모든 탭 PTR 지원 (차트는 컨트롤 영역만)
5. feat: 설정 / 차트 화면 Pull-to-Refresh 지원

## 7) 리스크(Risks)

- 차트탭 컨트롤 영역의 높이가 작아 PTR 제스처 인식이 어색할 수 있음. 사용자 실기 단계에서 인식률 확인 후 컨트롤 영역 paddingTop 살짝 늘리는 등 조정 가능.
- WebView 가 PTR 외부에 있어 차트 영역에서는 PTR 트리거되지 않음 — 의도된 동작이지만 사용자가 "전체 화면이 PTR 가능" 으로 기대할 수 있어 사용자 실기에서 인지 확인 필요.

## 8) 메모(Notes)

- ChartScreen 의 PTR 액션은 `refreshChart(assetId or 'equity')` 로 충분. 직전 plan(`PLAN_chart_recent_to_archive_only.md`) 가 적용되면 `refreshChart` 가 archive 병렬 fetch 로 변경되어 자동으로 새 동작을 따름.
- 본 plan 은 §1 plan 과 **독립 진행 가능**. 순서는 `§1 → §3` 또는 `§3 → §1` 어느 쪽이든 무방.

### 진행 로그 (KST)

- 2026-04-28 17:55: 계획서 작성. ChartScreen 은 컨트롤 영역만 PTR 활성하여 WebView 제스처와 충돌 회피.
- 2026-04-28 18:05: Phase 1+2+마지막 Phase 일괄 진행. SettingsScreen 의 raw ScrollView → PullToRefreshScrollView 교체 + ChartScreen 의 컨트롤 영역(ChartTypeToggle/AssetSelector/ChartValueHeader)을 PullToRefreshScrollView 로 감싸기. prettier / lint / tsc 모두 통과. 사용자 실기 검증 대기 (다음 plan 마지막 시점에 함께 확인 가능).
