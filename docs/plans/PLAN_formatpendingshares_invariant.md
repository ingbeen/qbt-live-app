# Implementation Plan: formatPendingShares close non-null화 + SyncDialog 가드

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

**작성일**: 2026-05-27 14:07
**마지막 업데이트**: 2026-05-27 14:15
**관련 범위**: utils, components
**관련 문서**: CLAUDE.md, docs/DESIGN_QBT_LIVE_FINAL.md, docs/COMMANDS.md

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

- [x] 목표 1: `formatPendingShares` 의 `close` 파라미터 타입을 `number | undefined` → `number` 로 좁힌다 (호출처가 양수 close 를 invariant 로 보장)
- [x] 목표 2: 함수 본문의 `close == null || close <= 0` 폴백 분기(`__DEV__` throw + 빈 문자열 반환)를 제거한다
- [x] 목표 3: `SyncDialog` 의 pending 경고 박스 렌더 조건에 `signals` 존재 가드를 추가하여, `signals` null 상태에서 `formatPendingShares` 가 호출되지 않도록 한다

## 2) 비목표(Non-Goals)

- `PendingOrdersListBlock` / `FillForm` 의 호출 코드는 변경하지 않는다. 이미 number 양수 전달이 보장되어 있다.
- `SyncDialog` 의 다이얼로그 본체(타이틀 / 본문 / 동기화·취소 버튼)는 `signals` null 상태에서도 그대로 표시한다. `submitModelSync` 페이로드(`input_time_kst`)는 `signals` 와 무관하므로 동기화 자체는 가능하다.
- `Signal.close` 가 0 또는 음수인 케이스(서버 SoT 위반) 처리는 본 계획서 비목표다. 호출처에서 양수임을 보장한다는 invariant 전제 위에 진행한다.
- 프로젝트 전체 분석 재검증 리포트의 다른 항목(A 완료 / B 완료 / D 완료 / E / F)은 범위 밖이며 각각 별도 계획서로 다룬다.
- `docs/DESIGN_QBT_LIVE_FINAL.md`(서버 데이터 계약)는 변경하지 않는다.

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- [src/utils/format.ts](../../src/utils/format.ts) 의 `formatPendingShares` 시그니처가 `close: number | undefined` 다. `close` 가 null/0 이하면 `__DEV__` throw + 릴리스 console.error + **빈 문자열 `''` 반환** 으로 폴백한다.
- 그러나 호출처 분석 결과 빈 문자열 폴백이 릴리스 빌드에서 노출되면 사용자 UI 가 깨진다:
  - [src/components/SyncDialog.tsx:48-52](../../src/components/SyncDialog.tsx) — `signals?.[p.asset_id]?.close` 전달. `signals` 가 null 이면 `close` 가 undefined → 폴백 → `"SSO  매수 (… 시그널)"` 처럼 수량이 빈 문자열로 표시.
  - [src/components/PendingOrdersListBlock.tsx:73-75](../../src/components/PendingOrdersListBlock.tsx) — `signals[p.asset_id].close` 전달. `signals` 가 non-null prop 이라 이미 number 보장.
  - [src/components/FillForm.tsx:122-126](../../src/components/FillForm.tsx) — `pendingClose != null && pendingClose > 0` 가드 후 호출. 이미 양수 number 보장.
- 따라서 폴백을 만드는 단일 호출처는 `SyncDialog` 뿐이다. `SyncDialog` 측에서 `signals` 존재를 가드하면 `formatPendingShares` 는 close 존재를 invariant 로 받을 수 있다. 폴백 코드 자체가 dead code 가 되어 제거 가능하다 (CLAUDE.md §1.1 YAGNI / §1.2 간결성).
- 결과: 함수 본문이 한 줄로 단순화되고, 릴리스 빌드 UI 깨짐 가능성이 원천 차단된다.

### 처리 방식 결정 (핵심 인바리언트)

- `formatPendingShares` 의 invariant: 호출 시점에 `close` 는 항상 양수 number 다. 시그니처를 `number` 로 좁혀 컴파일 타임에 강제한다.
- `SyncDialog` 의 pending 경고 박스 렌더 조건: 기존 `pendings.length > 0` → `pendings.length > 0 && signals !== null`. `signals` 가 null 인 상태에서 `pendings.length > 0` 인 케이스는 서버 SoT 위반(`/latest/signals` 와 `/latest/pending_orders` 는 항상 함께 채워짐)이므로 경고 박스만 생략하고 다이얼로그 본체는 표시한다.
- `formatPendingShares` 의 기존 주석 중 폴백 처리(`§5.1 / __DEV__ throw / 안전 폴백`) 설명은 폴백이 제거되므로 부정확해진다 → 주석을 현재 코드 동작 기준으로 정리한다 (§9.5 "현재 코드 상태" 만 설명).

### 동작 변화 여부

- 정상 케이스(서버 SoT 정상, `signals` non-null): 산출 문자열 동일, 런타임 동작 불변.
- 비정상 케이스(`signals` null + pendings 존재): 본 변경 전 → `SyncDialog` 가 `"SSO  매수"` 같이 깨진 메시지 표시. 본 변경 후 → 경고 박스 자체가 생략되어 깨진 메시지가 노출되지 않음.
- `formatPendingShares` 의 `__DEV__` throw 는 제거된다. 시그니처 변경으로 컴파일 타임에 close 존재가 강제되므로 `__DEV__` throw 가 필요 없어진다.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md`
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 SoT, 변경 금지)
- 실행 명령어 SoT: `docs/COMMANDS.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] `formatPendingShares` 시그니처 `close: number` 로 변경 + 본문에서 `close == null || close <= 0` 폴백 분기 제거 + 주석 정리
- [x] `SyncDialog` pending 경고 박스 렌더 조건에 `signals !== null` 가드 추가 + 본문의 `signals?.[...]?.close` 를 `signals[...].close` 로 변경 (non-null 보장)
- [x] 호출처(`PendingOrdersListBlock` / `FillForm`)에서 타입 에러가 발생하지 않음 (이미 number 양수 전달)
- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행 (마지막 Phase 에서 자동 포맷 적용)
- [ ] 사용자 실기 검증 완료 (대상 화면/플로우 기록)
- [x] 필요한 문서 업데이트: `README.md` 변경 없음 / `docs/COMMANDS.md` 변경 없음 / `CLAUDE.md` 변경 없음
- [x] plan 체크박스 최신화(Phase/DoD/Validation 모두 반영)

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/utils/format.ts` — `formatPendingShares` 시그니처 / 본문 / 주석
- `src/components/SyncDialog.tsx` — pending 경고 박스 렌더 조건 + `signals` non-null 접근
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음 (실행 명령어/CLI 옵션 변경 없음)

### 데이터/결과 영향

- RTDB payload 스키마 영향 없음 (서버 계약 미변경).
- 정상 케이스: 산출 UI 동일.
- 비정상 케이스(`signals` null + pendings 존재): 깨진 메시지(`"SSO  매수"`) 대신 경고 박스 자체가 생략된다 — 사용자 노출 품질 개선.
- 타입 시스템: 호출처가 number 양수 invariant 를 컴파일 타임에 강제받는다.

## 6) 단계별 계획(Phases)

### Phase 0 — invariant / 가드 방식 고정 (레드 허용, 코드 변경 없음)

> 본 변경은 함수 시그니처 invariant 강화 + 호출처 렌더 정책 변경에 해당하므로 정책을 먼저 고정한다.

**작업 내용**:

- [x] `formatPendingShares` invariant 확정: `close` 는 호출 시점에 항상 양수 number. 시그니처 `close: number` 로 좁혀 컴파일 타임에 강제.
- [x] `SyncDialog` 가드 방식 확정: pending 경고 박스의 렌더 조건을 `pendings.length > 0 && signals !== null` 로 강화. `signals` null 인 비정상 상태에서 경고 박스 생략, 다이얼로그 본체와 동기화 동작은 유지.
- [x] 주석 정리 정책 확정: `formatPendingShares` 의 기존 주석 중 §5.1 폴백 설명(`__DEV__ throw + 안전 폴백`)은 폴백이 제거되므로 삭제하고, "호출처가 양수 close 를 보장한다" 는 현재 동작 설명만 남긴다 (§9.5).

---

### Phase 1 — `format.ts` / `SyncDialog.tsx` 수정 (그린 유지)

**작업 내용**:

- [x] `src/utils/format.ts`:
  - `formatPendingShares` 시그니처: `close: number | undefined` → `close: number`
  - 본문의 `if (close == null || close <= 0) { ... return ''; }` 폴백 분기 통째 제거
  - 함수 본문을 단순한 한 줄 표현식(`return \`${Math.round(Math.abs(deltaAmount) / close)}주 \`;` 또는 화살표 함수 한 줄)으로 정리
  - 주석을 현재 동작 기준으로 정리 (§9.5 — `§3.1 / 방식 1` 같은 폴백 설명 제거)
- [x] `src/components/SyncDialog.tsx`:
  - pending 경고 박스 렌더 조건을 `{pendings.length > 0 && (...)}` → `{pendings.length > 0 && signals !== null && (...)}` 로 변경
  - `formatPendingShares(p.delta_amount, signals?.[p.asset_id]?.close)` → `formatPendingShares(p.delta_amount, signals[p.asset_id].close)` (옵셔널 체이닝 제거, non-null 단언 없음 — 가드된 분기 내부라 타입 좁혀짐)

**Validation**:

- [x] `formatPendingShares` 본문에 폴백 분기가 남아있지 않음
- [x] `SyncDialog` 의 `formatPendingShares` 호출 부분이 옵셔널 체이닝 없이 `signals[p.asset_id].close` 로 단순화됨
- [x] 호출처 3곳(`SyncDialog` / `PendingOrdersListBlock` / `FillForm`) 모두 컴파일 에러 없이 통과 (마지막 Phase 의 `tsc` 로 최종 확인)

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] 문서 업데이트 확인: `README.md` 변경 없음 / `docs/COMMANDS.md` 변경 없음 / `CLAUDE.md` 변경 없음
- [x] `npx prettier --write .` 실행(자동 포맷 적용)
- [ ] 변경 기능 및 전체 플로우 최종 검증 (사용자 실기 확인)
- [x] DoD 체크리스트 최종 업데이트 및 체크 완료
- [x] 전체 Phase 체크리스트 최종 업데이트 및 상태 확정

**Validation**:

- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [ ] 사용자 실기 검증:
  - 홈 탭에서 pending 주문이 있는 상태로 `ModelCompareCard` 의 동기화 버튼을 눌러 `SyncDialog` 가 열리면, 경고 박스가 정상 표시되고 각 항목이 `SSO 12주 매수 (… 시그널)` 같이 수량 포함 문자열로 표시된다.
  - 홈 탭의 `PendingOrdersListBlock`(미입력 리마인더 / 다음 거래일 체결 예정) 두 블록이 기존과 동일하게 표시된다.
  - 거래 탭 체결 폼의 pending hint 영역(`pendingClose > 0` 가드된 분기)이 정상 표시된다.

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. utils / formatPendingShares close non-null 화 + SyncDialog signals 가드
2. components / SyncDialog signals null 가드 + format 폴백 제거
3. refactor: formatPendingShares 시그니처 정합 + 호출처 invariant 강화
4. utils / pending shares 포맷 함수 dead 폴백 제거 — 호출처 가드로 대체
5. format / formatPendingShares close 양수 invariant 강제 (타입 좁힘)

## 7) 리스크(Risks)

- `SyncDialog` 가 `signals === null` 상태에서 열릴 경우 경고 박스가 사라진다 — 의도된 동작이며, 이 상태는 서버 SoT 위반에 해당해 정상 케이스에서는 발생하지 않는다.
- 시그니처 변경으로 `close` 가 undefined/null 가능한 위치에서 `formatPendingShares` 를 호출하면 컴파일 에러가 발생한다 — 의도된 동작(타입으로 invariant 강제). 현재 호출처는 모두 보장된 상태.
- 회귀 가능성: 함수 본문이 단순해지지만 산출 문자열 형식은 동일하므로 UI 변화 없음.

## 8) 메모(Notes)

- 본 계획서는 "프로젝트 전체 분석 재검증" 결과의 항목 C(추천안 4)만 다룬다. 항목 A·B·D 는 각각 완료된 별도 계획서, 항목 E·F 는 별도 계획서 대상이다.
- 호출처 분석 요약:
  - `SyncDialog` — `signals` 가 null 가능, 본 계획서에서 가드 추가
  - `PendingOrdersListBlock` — `signals: Record<AssetId, Signal>` non-null prop, 이미 안전
  - `FillForm` — `pendingClose != null && pendingClose > 0` 가드 후 호출, 이미 안전

### 진행 로그 (KST)

- 2026-05-27 14:07: 계획서 작성 (Draft)
- 2026-05-27 14:15: Phase 0~1 구현 완료 (`format.ts` / `SyncDialog.tsx`). `npm run lint` / `npx tsc --noEmit` / `npx prettier --write .` 통과. 사용자 실기 검증 대기 (In Progress)

---
