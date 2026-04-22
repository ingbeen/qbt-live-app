# AUDIT_APP.md — 앱 코드/문서 감사 리포트

> **작성일**: 2026-04-22
> **최종 업데이트**: 2026-04-22 — 재검증 결과 3건 철회, 서버 확인 대기 3건 표시, PLAN_AUDIT_01 / 02 / 03 반영
> **범위**: `qbt-live-app` 프로젝트의 앱 측 (`src/`, `CLAUDE.md`, `README.md`, `docs/COMMANDS.md`)
> **관련 리포**: 서버 측 확인·조치 필요 항목은 [AUDIT_SERVER.md](AUDIT_SERVER.md) 참조
> **계획서**: [PLAN_AUDIT_01_CONSTANTS.md](PLAN_AUDIT_01_CONSTANTS.md) / [PLAN_AUDIT_02_HELPERS.md](PLAN_AUDIT_02_HELPERS.md) / [PLAN_AUDIT_03_DOCS_CLEANUP.md](PLAN_AUDIT_03_DOCS_CLEANUP.md) 모두 완료
> **우선순위 표기**: High / Mid / Low
> **상태 표기**: ✅ 완료 / ⏳ 예정 / ⏸ 서버 대기 / ✗ 철회

---

## 처리 상태 요약

| 상태 | 의미 | 건수 |
|---|---|---|
| ✅ | PLAN_AUDIT_01 / 02 / 03 로 처리 완료 | 11 (원본 7 + 재검증 추가 3 + CLAUDE.md:648) |
| ⏸ | 서버 확인 결과 나온 뒤 별도 처리 | 3 |
| ✗ | 재검증 결과 유효하지 않아 철회 | 3 |
| — | 유지 판정 (리팩토링 불필요) / 당분간 Low 보류 | 2 |

**원본 감사 당시 21건** → 재검증·수용으로 **철회 3건 제외 실질 18건**. 이 중 3건은 서버 답 대기.

---

## 카테고리별 요약

| 카테고리 | 건수 (철회 후) | High | Mid | Low |
|---|---|---|---|---|
| 1. 비즈니스 로직 오류 | 0 | 0 | 0 | 0 |
| 2. 버그 | 1 (서버 대기) | 0 | 1 | 0 |
| 3. 상수화 필요 | 6 | 1 | 2 | 3 |
| 4. 리팩토링 | 5 | 0 | 2 | 3 |
| 5. 구조개선 | 0 | 0 | 0 | 0 |
| 6. 불필요한 fallback | 1 | 0 | 0 | 1 |
| 7. 문서/주석/코드 3자 불일치 | 2 (서버 대기) | 0 | 1 | 1 |
| 8. 가변 수치 본문 하드코딩 | 4 | 0 | 3 | 1 |
| 9. 과거/변경이력/계획 잔존 | 0 | 0 | 0 | 0 |
| **합계** | **18** | **1** | **9** | **8** |

---

## 재검증으로 철회된 항목 (3건)

과거 리포트에 있던 다음 항목들은 재검증 결과 **유효하지 않음** 으로 판명되어 삭제되었습니다.

| 구 번호 | 주제 | 철회 사유 |
|---|---|---|
| 2.2 | `Toast` useEffect `onClose` 의존성 | `onClose` 는 zustand action 이라 참조 안정. effect 재실행 안 일어남. Toast.tsx:17-18 주석에도 명시. |
| 2.3 | `AppState` 복귀 시 `refreshHome` 경쟁 | RN `AppState` 는 동일 state 연속 발생 안 함. 실무 재현 불가. |
| 3.6 | 차트 HTML 내 색상 중복 | [src/utils/chartHtml.ts:1-4](../src/utils/chartHtml.ts#L1-L4) 주석 및 [CLAUDE.md §7.4](../CLAUDE.md) 에서 **허용된 예외**. 리팩토링하면 오히려 규칙 위반. |

---

## 1. 비즈니스 로직 오류

해당 없음.

---

## 2. 버그

### 2.1 [Mid] ⏸ `portfolio.assets[id]` 런타임 undefined 가능성
- **파일**: [src/components/AssetSummaryCard.tsx:60](../src/components/AssetSummaryCard.tsx#L60), [src/components/ModelCompareCard.tsx:68](../src/components/ModelCompareCard.tsx#L68)
- **현재**: `const snap = portfolio.assets[id];` — 이후 `snap.model_shares` 등 무방비 접근
- **문제**: 타입상 `Record<AssetId, AssetSnapshot>` 이지만, RTDB 에서 특정 자산 키가 누락되면 `undefined`.
- **권장**: 서버 확인 결과에 따라 앱 타입을 `Partial<Record<...>>` 로 변경 + 가드 추가, 또는 현상 유지.
- **서버 확인**: [AUDIT_SERVER.md §3.2](AUDIT_SERVER.md) — 서버가 4자산 모두 항상 채우는지 계약 확인 필요.

---

## 3. 상수화 필요

### 3.1 [High] ✅ `CASH_DIFF_THRESHOLD_USD` 상수 사용 — PLAN_AUDIT_01
- **파일**: [src/components/ModelCompareCard.tsx:30-31](../src/components/ModelCompareCard.tsx#L30-L31)
- **처리**: `Math.abs(cashDiff) >= 1` → `Math.abs(cashDiff) >= CASH_DIFF_THRESHOLD_USD`

### 3.2 [Mid] ✅ `MS_PER_DAY` 상수 신설 — PLAN_AUDIT_01
- **파일**: [src/utils/constants.ts](../src/utils/constants.ts) (신설), [src/components/UpdateStatusBadge.tsx:17](../src/components/UpdateStatusBadge.tsx#L17) (사용)
- **처리**: `86_400_000` literal → `MS_PER_DAY` 상수

### 3.3 [Mid] ✅ 모달 오버레이 색상 프리셋 — PLAN_AUDIT_01
- **파일**: [src/utils/colors.ts](../src/utils/colors.ts) (신설), [src/components/SyncDialog.tsx:98](../src/components/SyncDialog.tsx#L98) (사용)
- **처리**: `'rgba(0, 0, 0, 0.75)'` → `COLOR_PRESETS.modalOverlay`

### 3.4 [Low] ⏳ `HistoryList.FILTERS` 로컬 상수
- **파일**: [src/components/HistoryList.tsx:26-28](../src/components/HistoryList.tsx#L26-L28)
- **권장**: 현 위치 유지. 다른 컴포넌트에서 같은 분류가 등장하는 시점에 이전.
- **상태**: Low 라 당장 이동 불필요. 향후 재발견 시 고려.

### 3.5 [Low] ⏳ WebView 메시지 타입 화이트리스트
- **파일**: [src/components/ChartWebView.tsx:14](../src/components/ChartWebView.tsx#L14), [src/utils/chartHtml.ts:109-113](../src/utils/chartHtml.ts#L109-L113)
- **권장**: `WEBVIEW_MSG = { READY, LOAD_EARLIER }` 상수화. chartHtml.ts 는 템플릿 리터럴로 주입.
- **상태**: 가치 제한적 (문자열 2개뿐). 계획서 편성 시 재평가.

---

## 4. 리팩토링

### 4.1 [Mid] ✅ pending 주식수 계산 3중 중복 — PLAN_AUDIT_02
- **처리**: `formatPendingShares(deltaAmount, close)` 를 `src/utils/format.ts` 에 추출. ReminderBlock / SignalNextFillBlock / SyncDialog 에서 공용 사용.

### 4.2 [Mid] ✅ `ASSETS.flatMap` pending 수집 패턴 중복 — PLAN_AUDIT_02
- **처리**: `listPendingOrders(pendingOrders)` 를 `src/utils/format.ts` 에 추출. SignalNextFillBlock / SyncDialog 는 직접 사용, ReminderBlock 은 `.filter()` 체인으로 변형 적용.

### 4.3 [Low] ✅ `ModelCompareCard.formatDiff` → `formatSignedInt` 통합 — PLAN_AUDIT_02
- **처리**: `formatSignedInt` 을 `format.ts` 에 신설. 주식수 diff / 현금 diff 양쪽에서 공용 사용 (현금 diff 는 `Math.round` 선행). 로컬 `formatDiff` 제거.

### 4.4 [Low] 유지 `HistoryList` 의 3종 `toEvents` 변환 유사 구조
- **파일**: [src/components/HistoryList.tsx:46-71](../src/components/HistoryList.tsx#L46-L71)
- **판정**: 각 함수가 단일 책임 + 8줄 미만. 억지 추상화 위험.
- **상태**: 현상 유지. `kind` 추가 시 재검토.

### 4.5 [Low] 유지 `FillForm` / `AdjustForm` 제출 패턴 유사
- **파일**: [src/components/FillForm.tsx](../src/components/FillForm.tsx), [src/components/AdjustForm.tsx](../src/components/AdjustForm.tsx)
- **판정**: 필드 구성이 매우 달라 억지 추상화 위험이 더 큼.
- **상태**: 현상 유지. 세 번째 폼 등장 시 재평가.

---

## 5. 구조개선

해당 없음. `screens → components → services → utils` 의존 방향 및 store 단일성, default-export 규칙이 모두 준수되어 있음.

---

## 6. 불필요한 fallback

### 6.1 [Low] ✅ `close && close > 0` 표현 정비 — PLAN_AUDIT_02 (§4.1 과 병합)
- **처리**: `formatPendingShares` 내부에서 `close == null || close <= 0` 로 명시. 기존 3곳 표현은 헬퍼 호출로 대체되어 삭제됨.

---

## 7. 문서/주석/코드 3자 불일치

### 7.1 [Mid] ⏸ `ChartMeta.ma_window` 필수성 불일치
- **위치**: [docs/DESIGN_QBT_LIVE_FINAL.md §8.2.5.1](DESIGN_QBT_LIVE_FINAL.md), [src/types/rtdb.ts:72](../src/types/rtdb.ts#L72)
- **불일치**: price chart meta 필수 vs equity chart meta 부재 vs 앱 타입 optional.
- **서버 확인**: [AUDIT_SERVER.md §3.1](AUDIT_SERVER.md) — 결과에 따라 타입 분리 방향 결정.

### 7.2 [Low] ⏸ `FillPayload.reason` 선택성 불일치
- **위치**: [docs/DESIGN_QBT_LIVE_FINAL.md §8.2.7](DESIGN_QBT_LIVE_FINAL.md), [src/types/rtdb.ts:116](../src/types/rtdb.ts#L116), [src/services/rtdb.ts:101](../src/services/rtdb.ts#L101)
- **불일치**: 설계상 필수(기본값 있음) vs 타입상 optional.
- **서버 확인**: [AUDIT_SERVER.md §3.4](AUDIT_SERVER.md) — 결과에 따라 타입 엄격화 또는 설계서 변경.

---

## 8. 가변 수치/리스트가 문서 본문에 박혀있는 곳

### 8.1 [Mid] ✅ `README.md:16` Node 버전 동작 확인 값 — PLAN_AUDIT_03
- **처리**: "≥ 22.11 (동작 확인: 22.22.2)" → "`package.json` 의 `engines` 참조"

### 8.2 [Mid] ✅ `README.md:18` Android SDK 숫자 중복 — PLAN_AUDIT_03
- **처리**: "compileSdk 36 / targetSdk 36 / minSdk 24" → "`android/build.gradle` 참조"

### 8.3 [Mid] ✅ `CLAUDE.md:647` RN/React 버전 하드코딩 — PLAN_AUDIT_03
- **처리**: "각각 `0.85.1`, `19.2.3`" → "현재 고정된 버전은 `package.json` 참조"

### 8.4 [Low] ✅ `CLAUDE.md:24` Node 버전 괄호 예시 — PLAN_AUDIT_03
- **처리**: "(22.11 이상)" 제거.

---

### 8.5 [Mid] ✅ `README.md:6` RN 버전 하드코딩 — 재검증 추가 발견
- **전**: "React Native 0.85.1 CLI (Expo 아님)"
- **후**: "React Native CLI (정확 핀, Expo 아님). 버전은 `package.json` 참조"

### 8.6 [Mid] ✅ `README.md:7` TypeScript 버전 하드코딩 — 재검증 추가 발견
- **전**: "TypeScript 5.8.x"
- **후**: "TypeScript (버전은 `package.json` 참조)"

### 8.7 [Mid] ✅ `CLAUDE.md:648` `@react-native/*` 버전 하드코딩 — 재검증 추가 발견
- **전**: "도 `0.85.1` 로 고정"
- **후**: "도 `react-native` 와 동일한 정확 버전으로 고정"

---

## 9. 과거 상태 / 변경 이력 / 계획 단계 잔존

해당 없음. 재검증 시에도 위반 사례 발견되지 않음.

---

## 10. 다음 단계

- **서버 답변 후 별도 작업** (예정): §2.1, §7.1, §7.2 — [AUDIT_SERVER.md](AUDIT_SERVER.md) 결과 반영
- **미분류 잔여** (Low, 선택): §3.4 HistoryList.FILTERS, §3.5 WebView 메시지 타입 — 필요성 재판단 후 결정

PLAN_AUDIT 시리즈는 모두 완료. 앱 측에서 즉시 조치 가능한 항목은 전부 반영되었고, 잔여는 서버 답변과 Low 우선순위 선택 항목뿐.

---

**문서 끝**
