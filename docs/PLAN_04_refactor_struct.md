# PLAN 04 — 구조/리팩토링 + 문서 수정

> **선행 감사**: [docs/AUDIT_20260422.md](AUDIT_20260422.md) ST-01~04, RF-01~04, DV-01, HIST-02, CONST-04
> **작업 순서**: 4개 계획서 중 4번 (마지막)
> **승인 방식**: 사전 승인 완료 — 작성 후 즉시 실행 → 완료 시 commit

---

## 1. 목표

아키텍처 정합화 + 중복 컴포넌트 통합 + 문서 정리:

- **ST-01** (High): services → store 의존 역전 해결
- **ST-02~04**: 타입 분산 / loading key 조합 / 유사 카드 구조
- **RF-01~04**: 컴포넌트 중복 제거 / 대형 파일 정리
- **CONST-04**: 토스트 메시지 상수화
- **DV-01 / HIST-02**: DESIGN 문서의 "향후 추가", "MVP 범위 밖" 표현 정리

---

## 2. 세부 작업

### 2.1 [ST-01] services → store 의존 역전 (High)

**현상**: `auth.ts`, `fcm.ts`, `network.ts` 가 `useStore.getState()` 를 직접 호출 → CLAUDE.md §17.3 "services 는 순수 I/O" 원칙 위반.

**해결**:
- **auth.ts**: `signOut` 이 store 를 건드리지 않고 Firebase signOut 만 수행. store 업데이트는 호출부(App.tsx/LoginScreen) 또는 `subscribeAuthState` 콜백에서 처리.
- **fcm.ts**: `ensureFcmToken` 이 `{ deviceId, registered }` 결과만 반환. store 업데이트는 호출부(App.tsx) 에서 처리.
- **network.ts**: `setupNetworkListener` 가 `(online: boolean) => void` 콜백을 인자로 받음. store 업데이트는 App.tsx 가 콜백 내부에서 직접 수행.

**영향 파일**: `src/services/auth.ts`, `src/services/fcm.ts`, `src/services/network.ts`, `App.tsx`, `src/screens/LoginScreen.tsx` (auth 호출부)

### 2.2 [ST-02] 타입 정의 집중

`src/services/rtdb.ts` 에 있는 `InboxItem`, `SignalHistoryEntry` 타입을 `src/types/rtdb.ts` 로 이동. services 는 import 만.

### 2.3 [ST-03] loading key 조합 헬퍼

`useStore.ts` 의 문자열 조합 (`chart_${target}`, `chart_archive_${assetId}_${year}`, `chart_archive_equity_${year}`) 을 `src/utils/loadingKeys.ts` (신규) 의 헬퍼 함수로 격리.

### 2.4 [ST-04] ModelCompareCard / AssetSummaryCard 구조 유사

AUDIT 에서 이미 "YAGNI 허용 범위" 로 Low 판정. 이번 PLAN 에서는 **건드리지 않음** (추상화가 오히려 불이익).

### 2.5 [RF-01] ReminderBlock / SignalNextFillBlock 통합

두 컴포넌트가 거의 동일하지만 다음 차이:
- `ReminderBlock`: inbox filter 있음 + 오렌지 경고 톤 + "(signal_date 시그널)" 접미
- `SignalNextFillBlock`: 필터 없음 + accent 톤 + 접미 없음

**해결**: `PendingOrdersListBlock` 공통 컴포넌트로 추출 + `mode: 'remind' | 'next'` prop 으로 분기. 각 컴포넌트는 wrapper 로 유지 (호출부 변경 최소화) 하거나 아예 제거 후 HomeScreen 에서 직접 렌더.

**결정**: 두 파일 제거 + HomeScreen 에서 `PendingOrdersListBlock` 두 번 렌더.

### 2.6 [RF-02] SegmentControl 공통 컴포넌트

`TradeScreen` 의 fill/adjust 토글 + `ChartTypeToggle` 이 동일 패턴. 공통 `SegmentControl<T>` 컴포넌트로 추출.

**결정 유보**: 정확한 API 통일은 두 컴포넌트 디테일이 꽤 달라서 (ChartTypeToggle 은 `ChartType` 타입 export, TradeScreen 은 Mode 인라인) 과한 일반화 위험. **이번 PLAN 에서는 건드리지 않음** (YAGNI).

### 2.7 [RF-03] ChartScreen 로직 분리

`injectChartData` 60줄 이상 → `src/utils/chartInject.ts` (신규) 의 순수 함수로 추출. ChartScreen 은 WebView ref + 순수 함수 조합.

### 2.8 [RF-04] FillForm / AdjustForm DatePicker 공통 훅

`useDatePicker()` 신규 훅으로 `showPicker` 상태 + `onOpenPicker` + `onPickerChange` 를 묶음. 두 폼에서 동일하게 재사용.

### 2.9 [CONST-04] 토스트 메시지 상수화

`useStore.ts` 의 4개 토스트 메시지 (동기화/체결/보정/스킵) 를 `src/utils/constants.ts` 의 `TOAST_MESSAGES` 객체로 이동.

### 2.10 [DV-01] / [HIST-02] DESIGN 문서 "향후 추가" 표현 정리

DESIGN §1.3 의 `"현재 MVP 범위 밖이다. 향후 추가 시 자산별 currency / market 필드 도입..."` 부분. 서버 SoT 영역이지만 앱 쪽에서 수정 가능(사용자 허용).

**해결**: "MVP", "향후 추가" 표현 제거하고 현재 상태만 서술. 예: "자산은 USD 단위 4종 (SSO/QLD/GLD/TLT) 으로 고정. 다른 통화 / 시장의 자산은 현재 스키마에서 지원되지 않는다."

---

## 3. 작업 순서

1. **ST-02**: 타입 이동 (가장 의존성 적음, 빠른 baseline)
2. **ST-03**: loading key 헬퍼
3. **CONST-04**: 토스트 메시지 상수
4. **ST-01**: services → store 분리 (App.tsx 까지 영향)
5. **RF-01**: PendingOrdersListBlock 통합
6. **RF-03**: ChartScreen injectChartData 분리
7. **RF-04**: useDatePicker 훅
8. **DV-01 / HIST-02**: DESIGN 문서 정리
9. TypeScript 컴파일 + AUDIT 업데이트 + commit

---

## 4. 제외 (YAGNI / 과한 일반화)

- **ST-04** (ModelCompareCard / AssetSummaryCard 구조 유사): 유지
- **RF-02** (SegmentControl): 유지 — API 통일 과한 일반화

---

## 5. DoD

- [x] ST-01 services → store 의존 제거
- [x] ST-02 타입 이동
- [x] ST-03 loading key 헬퍼
- [x] RF-01 PendingOrdersListBlock 통합 (ReminderBlock/SignalNextFillBlock 삭제)
- [x] RF-03 chartInject 분리
- [x] RF-04 useDatePicker 훅
- [x] CONST-04 TOAST_MESSAGES
- [x] DV-01 / HIST-02 DESIGN 문서 정리
- [x] TypeScript 컴파일 통과
- [x] AUDIT 완료 표시
- [ ] git commit
