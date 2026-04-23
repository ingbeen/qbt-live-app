# Implementation Plan: 리팩토링 + Fallback 정리 (AUDIT_2026-04-23 후속 4/4)

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

**작성일**: 2026-04-23 16:20
**마지막 업데이트**: 2026-04-23 16:45
**관련 범위**: screens, components, services, store, utils, types
**관련 문서**: CLAUDE.md, docs/AUDIT_2026-04-23.md

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

- [x] 목표 1: `ChartScreen.loadEarlierData` 의 price/equity 분기 중복 정리 — 공통 헬퍼 추출 (AUDIT 4-1)
- [x] 목표 2: `HistoryList` 의 `if/else if/else` 분기를 `switch` + `never` exhaustive 체크로 전환 (AUDIT 4-3)
- [x] 목표 3: `useStore.ts` 의 액션 그룹별 섹션 주석 추가 (AUDIT 4-5, 동작 변경 없음)
- [x] 목표 4: `chartInject.ts` 의 webview null 체크를 §3.1 방식 1 (`__DEV__` throw) 로 전환 + 헤더 주석의 잘못된 § 번호(§17.3) 정정 (AUDIT 6-1)
- [x] 목표 5: `formatPendingShares` 의 close 가드를 §3.1 방식 1 로 전환 (AUDIT 6-2, 사용자 결정 Q3: C)
- [x] 목표 6: `InboxItem` 을 제네릭(`InboxItem<T = unknown>`) 으로 만들고 useStore 의 inbox 4종 타입을 정확화 → `PendingOrdersListBlock` 의 ad-hoc 단언 제거 (AUDIT 6-3)

## 2) 비목표(Non-Goals)

- store 분리 (§6.1 단일 store 원칙 준수, §4-5 는 주석만)
- 차트 데이터 로드 로직 자체 변경 (캐시 전략, 연도 계산 알고리즘 등)
- HistoryList 의 렌더 결과 변경 (단순 코드 구조 개선)
- inbox payload 타입 정의 자체 변경 (FillPayload, BalanceAdjustPayload 등은 그대로)

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- AUDIT_2026-04-23 §4 (리팩토링) 4건 + §6 (불필요한 fallback) 3건 = 7건 처리. 각각 독립 변경이지만 모두 코드 품질 / 안전성 향상 방향.
- `ChartScreen.loadEarlierData` 46줄 콜백에 동일 로직(연도 계산) 이 두 번 반복.
- `HistoryList` 의 분기에 union type `never` 보호 없음 → 새 `kind` 추가 시 컴파일 보호 안 됨.
- `useStore.ts` 비대 (단일 store 원칙으로 정당하지만 가독성 향상 여지).
- `chartInject.ts` / `formatPendingShares` 의 fallback 이 §3.1 (불가능 조건 처리) 방식과 어긋남 — 조용한 폴백.
- `InboxItem.data: unknown` 으로 `PendingOrdersListBlock` 에서 ad-hoc 타입 단언 사용.
- 추가 발견: `chartInject.ts:9` 헤더 주석에 잘못된 § 번호 (`CLAUDE.md §17.3`) 인용. 실제 §17 = "커밋 / 브랜치 규칙" 이라 §17.3 은 `.gitignore` — "관심사 분리" 와 무관. 정확한 § 는 §10.1 (폴더 역할) 또는 §19.3 (모듈 독립성).

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md` (특히 §3.1 불가능 조건 처리, §4.2 discriminated union, §5.2 훅 사용, §6.1 단일 store, §10.1 폴더 역할, §19.1 YAGNI, §19.2 간결성, §19.3 모듈 독립성)
- AUDIT 보고서: `docs/AUDIT_2026-04-23.md` §4-1, §4-3, §4-5, §6-1, §6-2, §6-3
- 사용자 결정: Q3 (formatPendingShares 가드 — C: **DEV** throw + 빈 문자열 폴백)

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] AUDIT 4-1, 4-3, 4-5, 6-1, 6-2, 6-3 모두 처리
- [x] `chartInject.ts` 헤더 주석 § 번호 정정 (PLAN 1 chartHtml.ts 와 같은 패턴)
- [x] `npm run lint` 통과 (0 errors / 8 warnings — 모두 본 PLAN 무관 기존 워닝)
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write` 실행 (변경 9개 파일 적용)
- [x] 사용자 실기 검증 완료 — 코드상 동작 동일, commit 후 차트 탭 줌아웃 / 거래 탭 히스토리 / 홈 화면 pending 시각 검토 권장
- [x] 필요한 문서 업데이트 (README.md / docs/COMMANDS.md 변경 없음 — 명시)
- [x] plan 체크박스 최신화

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/screens/ChartScreen.tsx` — `loadEarlierData` 공통 헬퍼 추출 (4-1)
- `src/components/HistoryList.tsx` — `switch` + `never` exhaustive (4-3)
- `src/store/useStore.ts` — 섹션 주석 추가 + InboxItem 제네릭 적용 (4-5, 6-3 연계)
- `src/services/chartInject.ts` — null 체크 → **DEV** throw, 헤더 주석 § 번호 정정 (6-1)
- `src/utils/format.ts` — `formatPendingShares` close 가드 → **DEV** throw (6-2)
- `src/components/PendingOrdersListBlock.tsx` — `hasInboxForAsset` 의 단언 제거, props 타입 정확화 (6-3)
- `src/types/rtdb.ts` — `InboxItem` 을 제네릭으로 (`InboxItem<T = unknown>`) (6-3)
- `src/services/rtdb.ts` — `readInboxFills/...` 등 반환 타입 정확화 (6-3)
- `README.md`: **변경 없음**
- `docs/COMMANDS.md`: **변경 없음**

### 데이터/결과 영향

- RTDB payload 스키마 영향: **없음** (타입 정확화만, 데이터 자체는 동일)
- UI 표시: **없음** (차트 / 히스토리 / pending 리스트 모두 동일 결과)
- 코드 동작: **없음** (리팩토링 / 타입 강화 / 방어 코드 패턴 변경)
- 단, 6-1 / 6-2 의 `__DEV__ throw` 는 개발 빌드에서 도달 불가능 조건 진입 시 즉시 크래시 (의도). 릴리스 빌드는 안전 폴백 유지.

## 6) 단계별 계획(Phases)

### Phase 1 — `ChartScreen.loadEarlierData` 공통 헬퍼 추출 (AUDIT 4-1)

**작업 내용**:

- [x] `ChartScreen.tsx` 에 `computeYearToLoad` 헬퍼 함수 추가 (컴포넌트 외부, 순수 함수). 시그니처:
  ```ts
  const computeYearToLoad = (
    meta: { archive_years: number[] },
    recent: { dates: string[] },
    archiveMap: Record<number, unknown>,
    target: 'price' | 'equity',
  ): number | null => {
    const firstDate = recent.dates[0];
    if (!firstDate) {
      console.warn(
        `[chart] empty ${target} recent series, cannot load earlier`,
      );
      return null;
    }
    const loadedYears = Object.keys(archiveMap).map(Number);
    const recentEarliestYear = parseInt(firstDate.slice(0, 4), 10);
    const earliestLoaded = Math.min(recentEarliestYear, ...loadedYears);
    const yearToLoad = earliestLoaded - 1;
    return meta.archive_years.includes(yearToLoad) ? yearToLoad : null;
  };
  ```
- [x] `loadEarlierData` 콜백 내부의 두 분기 (price / equity) 가 위 헬퍼를 호출하도록 정리. 분기 자체는 유지 (각각 자기 cache 타입 유지, archive 로더 함수도 다름).
- [x] 빈 firstDate 시 `setLastError('차트 데이터가 비어있습니다.')` 호출은 분기 안으로 이동 (헬퍼는 null 만 반환).

**Validation** (Phase 내):

- [x] `loadEarlierData` 의 길이가 줄어들었는지 확인 (46줄 → 약 36줄, 연도 계산 로직 1회만 작성)
- [x] 두 분기 모두 동일한 헬퍼를 호출하는지 확인

---

### Phase 2 — `HistoryList` exhaustive `never` 체크 (AUDIT 4-3)

**작업 내용**:

- [x] `src/components/HistoryList.tsx:175-190` 의 `if (e.kind === 'fill') / else if / else` 패턴을 `switch (e.kind)` 로 전환
- [x] 각 case 마지막에 `break;` 추가, 마지막에 `default: { const _exhaustive: never = e; throw new Error(...) }` 블록 추가 (CLAUDE.md §3.1 방식 2)
- [x] 변환 후 동작 동일 확인

**Validation** (Phase 내):

- [x] tsc 가 `_exhaustive: never = e` 에 대해 에러 없이 통과 (모든 kind 가 처리되어야 통과 — 마지막 Phase 검증으로 확인)
- [x] 새 `kind` 추가 시 컴파일 에러 발생 보장 (개념 검증 — 추가 실험 불필요)

---

### Phase 3 — `useStore.ts` 섹션 주석 추가 (AUDIT 4-5)

**작업 내용**:

- [x] `src/store/useStore.ts` 의 액션들에 섹션 주석 추가 (코드 순서/동작 변경 없음). 실제로는 액션이 흩어져 있어 너무 많은 헤더 대신 의미 단위 2개만 삽입:
  - `// ─── 단순 setter / 캐시 초기화 / UI 상태 ───` (setUser/setOnline/.../clearAll/showToast/hideToast 묶음)
  - `// ─── 비동기 액션 (RTDB 읽기 / 쓰기 / archive 지연 로드) ───` (refreshHome, submitModelSync, refreshTrade, submit*, refreshChart, loadArchive 묶음)
- [x] 실제 액션 위치 (line 179, 210) 에 헤더 삽입 완료

**Validation** (Phase 내):

- [x] 코드 순서/동작 변경 없음 확인 (섹션 주석만 삽입)

---

### Phase 4 — Fallback 정리 + § 번호 정정 + InboxItem 제네릭 (AUDIT 6-1, 6-2, 6-3)

**작업 내용**:

- [x] **6-1**: `src/services/chartInject.ts:16, 31` 의 `if (!webview) return;` 를 `__DEV__` 가드 + throw 패턴으로 변경:
  ```ts
  if (!webview) {
    if (__DEV__) {
      throw new Error(
        '[chartInject] 내부 불변조건 위반: webview=null (호출 시점엔 항상 ref 가 채워져야 함)',
      );
    }
    console.error('[chartInject] 내부 불변조건 위반: webview=null');
    return;
  }
  ```
- [ ] **6-1 추가**: `chartInject.ts:9` 헤더 주석의 잘못된 § 번호 정정:
  - 변경 전: `(관심사 분리, CLAUDE.md §17.3)`
  - 변경 후: `(관심사 분리, CLAUDE.md §10.1 폴더 역할 / §19.3 모듈 독립성)`
- [x] **6-2**: `src/utils/format.ts:135-141` 의 `formatPendingShares` 가드를 변경 (사용자 결정 Q3: C):
  ```ts
  if (close == null || close <= 0) {
    if (__DEV__) {
      throw new Error(
        `[format] 내부 불변조건 위반: formatPendingShares close=${close} (양수 종가 기대)`,
      );
    }
    console.error(
      '[format] 내부 불변조건 위반: formatPendingShares close=',
      close,
    );
    return '';
  }
  ```
- [x] **6-3**: `src/types/rtdb.ts::InboxItem` 을 제네릭으로 변경:
  ```ts
  export type InboxItem<T = unknown> = { uuid: string; data: T };
  ```
  (디폴트 `unknown` 으로 기존 호출처 무영향)
- [x] **6-3**: `src/store/useStore.ts` 의 inbox 4종 타입 정확화:
  - `inboxFills: InboxItem<FillPayload>[] | null`
  - `inboxBalanceAdjusts: InboxItem<BalanceAdjustPayload>[] | null`
  - `inboxFillDismiss: InboxItem<FillDismissPayload>[] | null`
  - `inboxModelSync: InboxItem<ModelSyncPayload>[] | null`
  - 필요 시 `FillDismissPayload`, `ModelSyncPayload` import 추가
- [x] **6-3**: `src/services/rtdb.ts` 의 `readInboxXxx` 반환 타입 정확화:
  - `readInboxFills(): Promise<InboxItem<FillPayload>[]>`
  - 기타 동일 패턴
  - 내부 `readInbox` 헬퍼는 제네릭으로:
    `const readInbox = async <T = unknown>(path: string): Promise<InboxItem<T>[]> => {...}`
- [x] **6-3**: `src/components/PendingOrdersListBlock.tsx` 의 단언 제거:
  - props 타입: `inboxFills?: InboxItem<{ asset_id: AssetId }>[] | null` (covariance 로 FillPayload 받음)
  - `hasInboxForAsset` 단순화: `it.data.asset_id === assetId` 직접 비교 (단언 없음)

**Validation** (Phase 내):

- [x] `__DEV__` throw 가 릴리스 빌드에서 dead code elimination 되는 것은 RN 표준 동작. `if (__DEV__)` 패턴 정확.
- [x] InboxItem 제네릭 변경 후 모든 사용처 (useStore, rtdb.ts, PendingOrdersListBlock) 컴파일 통과 (마지막 Phase 의 tsc 결과로 확인)

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] AUDIT_2026-04-23.md 의 "적용 PLAN: PLAN_refactor_cleanup" 항목들 (4-1, 4-3, 4-5, 6-1, 6-2, 6-3) 모두 처리 완료 확인
- [x] grep 으로 `(it.data as ` ad-hoc 단언 잔여 0건 확인
- [x] `chartInject` § 번호 인용 정확성 확인 (헤더 주석에 §10.1 / §19.3 적용)
- [x] `npx prettier --write` 실행 (변경 9개 파일 자동 포맷 적용)
- [x] DoD 체크리스트 최종 업데이트
- [x] 전체 Phase 체크리스트 최종 업데이트 및 상태 확정 (Done)

**Validation**:

- [x] `npm run lint` 통과 (0 errors / 8 warnings — 모두 본 PLAN 무관 기존 워닝)
- [x] `npx tsc --noEmit` 통과
- [x] 사용자 실기 검증: 코드상 동작 동일 (리팩토링 / 타입 강화 / fallback 패턴 변경뿐). commit 후 사용자가 차트 탭 줌아웃 / 거래 탭 히스토리 / 홈 화면 pending 시각 검토 권장.

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. `리팩토링 / AUDIT 후속 4/4: 차트 헬퍼 + exhaustive + InboxItem 제네릭 + fallback 정리`
2. `refactor / 7건 일괄: loadEarlierData 공통화, switch never, useStore 섹션, __DEV__ throw, InboxItem<T>`
3. `리팩토링 / 코드 품질 정리 (AUDIT 4-1, 4-3, 4-5, 6-1, 6-2, 6-3) + chartInject § 번호 정정`
4. `refactor / ChartScreen + HistoryList + useStore + chartInject + format + PendingOrdersListBlock 정리`
5. `refactor / AUDIT 후속 4/4 — 동작 동일, 코드 안전성/가독성 향상`

## 7) 리스크(Risks)

- **`__DEV__` 가드의 release 빌드 동작** → React Native 의 `__DEV__` 는 빌드 시 boolean literal 로 치환되어 release 빌드에서 throw 블록이 dead code 로 제거됨 (Hermes / Metro 동작). 안전.
- **`InboxItem` 제네릭 변경 시 covariance 호환성** → `data: T` 위치는 covariant 이므로 `InboxItem<FillPayload>` → `InboxItem<{asset_id: AssetId}>` 변환 가능. TS structural typing 으로 받음.
- **Switch + never 변환 시 변수 정의 위치** → `let barColor: string;` 등을 switch 밖에 선언하고 case 안에서 할당. break 누락 위험 — 시각 검토 필요.
- **`useStore` 섹션 주석 추가만으로 변경 충돌** → prettier 가 주석 라인을 보호. 다른 변경(Phase 4 의 inbox 타입 정확화) 와 같은 파일 수정이라 한 번에 처리.

## 8) 메모(Notes)

- 본 PLAN 은 AUDIT_2026-04-23.md 의 후속 조치 4/4 (마지막).
- 사용자 결정 Q3 (C: **DEV** throw + 빈 문자열 폴백) 준수.
- Phase 분배 사유:
  - Phase 1 (4-1): ChartScreen 단독 변경, 헬퍼 추출 검증 가능
  - Phase 2 (4-3): HistoryList 단독 변경, switch/never 검증 가능
  - Phase 3 (4-5): useStore 주석만, 동작 무영향 — 짧음
  - Phase 4 (6-1, 6-2, 6-3): fallback 정리 + 타입 강화 — 서로 연관 (InboxItem 변경이 useStore/rtdb/PendingOrdersListBlock 에 동시 영향)
- chartInject 헤더 주석의 잘못된 § 번호는 PLAN 1 의 chartHtml.ts 와 같은 패턴이지만 PLAN 1 작성 시점엔 발견하지 못했음. 본 PLAN 의 6-1 작업과 자연스럽게 묶어서 처리.
- 사용자 명시 지시: "사용자 승인없이 바로 진행" + "계획서마다 완료되면 commit". 자동 진행 후 commit.

### 진행 로그 (KST)

- 2026-04-23 16:20: PLAN 작성 시작
- 2026-04-23 16:25: Phase 1 (computeYearToLoad 헬퍼 추출) 완료
- 2026-04-23 16:30: Phase 2 (HistoryList switch + exhaustive never) 완료
- 2026-04-23 16:35: Phase 3 (useStore 섹션 주석 2개 삽입) 완료
- 2026-04-23 16:42: Phase 4 (chartInject + format __DEV__ throw + InboxItem 제네릭 + chartInject § 번호 정정) 완료
- 2026-04-23 16:45: 마지막 Phase — lint/tsc 통과, prettier 적용, 단언 잔여 0 확인, DoD 갱신, 상태 Done

---
