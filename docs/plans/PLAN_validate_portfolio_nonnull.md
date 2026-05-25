# Implementation Plan: validation 함수의 portfolio 파라미터 non-null화

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

**작성일**: 2026-05-22 09:33
**마지막 업데이트**: 2026-05-22 09:40
**관련 범위**: utils
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

- [x] 목표 1: `validateFill` 의 `portfolio` 파라미터 타입을 `Portfolio | null` → `Portfolio` 로 좁힌다
- [x] 목표 2: `validateBalanceAdjust` 의 `portfolio` 파라미터 타입을 `Portfolio | null` → `Portfolio` 로 좁힌다
- [x] 목표 3: 두 함수 내부에서 불필요해진 `portfolio` null 가드를 제거한다

## 2) 비목표(Non-Goals)

- 검증 규칙(매도 수량 초과 / 보유 0 자산 평균가 설정 등)의 **판정 로직 자체는 변경하지 않는다**. 타입 시그니처와 그에 따른 null 가드만 정리한다.
- `validateIsoDateNotFuture` 등 `portfolio` 를 받지 않는 검증 함수는 범위 밖이다.
- 호출처(`FillForm` / `AdjustForm`)의 `portfolio` prop 타입은 이미 non-null 이므로 변경하지 않는다.
- 프로젝트 전체 분석 재검증 리포트의 다른 항목(A / C / D / E / F)은 범위 밖이며 각각 별도 계획서로 다룬다.
- `docs/DESIGN_QBT_LIVE_FINAL.md`(서버 데이터 계약)는 변경하지 않는다.

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- [src/utils/validation.ts](../../src/utils/validation.ts) 의 `validateFill` / `validateBalanceAdjust` 는 `portfolio` 를 `Portfolio | null` 로 받는다.
- `validateFill` 의 매도 수량 검증은 조건절에 `&& portfolio` 가 포함되어 있어, `portfolio` 가 `null` 이면 **보유 주수 초과 매도 검증이 통째로 스킵**된다. 즉 보유량을 초과한 매도가 `valid` 로 통과될 수 있다.
- 그러나 실제 호출처는 두 곳 모두 `portfolio` 를 non-null 로 보장한다:
  - `FillForm` (`Props.portfolio: Portfolio`) — `TradeScreen` 이 `portfolio === null` 이면 폼 자체를 마운트하지 않음
  - `AdjustForm` (`Props.portfolio: Portfolio`) — 동일
- 따라서 시그니처의 `| null` 은 실제로는 도달하지 않는 경로를 열어두고 있으며, 타입이 함수의 실제 계약(호출처가 항상 non-null 전달)과 어긋난다.
- 시그니처를 `Portfolio` 로 좁히면 타입 시스템이 "검증 시점에 portfolio 는 항상 존재한다" 는 인바리언트를 컴파일 타임에 강제하고, 내부의 무의미한 null 가드를 제거할 수 있다 (CLAUDE.md §1.2 간결성 / §6.1 명시적 타입).

### 동작 변화 여부

- 호출처가 이미 non-null `portfolio` 만 전달하므로 **런타임 동작(검증 결과)은 변하지 않는다**. 본 변경은 타입 시그니처 정합 + 불필요 가드 제거(리팩토링) 이며, 산출되는 `ValidationResult` 는 기존과 동일하다.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md`
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 SoT, 변경 금지)
- 실행 명령어 SoT: `docs/COMMANDS.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] `validateFill` 시그니처 `portfolio: Portfolio` 로 변경 + 매도 검증 조건절의 `&& portfolio` 가드 제거
- [x] `validateBalanceAdjust` 시그니처 `portfolio: Portfolio` 로 변경 + 보유 0 검증 조건절의 `portfolio &&` 가드 제거
- [x] 호출처(`FillForm` / `AdjustForm`)에서 타입 에러가 발생하지 않음 (이미 non-null 전달)
- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행 (마지막 Phase 에서 자동 포맷 적용)
- [ ] 사용자 실기 검증 완료 (대상 화면/플로우 기록)
- [x] 필요한 문서 업데이트: `README.md` 변경 없음 / `docs/COMMANDS.md` 변경 없음 / `CLAUDE.md` 변경 없음
- [x] plan 체크박스 최신화(Phase/DoD/Validation 모두 반영)

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/utils/validation.ts` — `validateFill` / `validateBalanceAdjust` 시그니처 및 내부 null 가드
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음 (실행 명령어/CLI 옵션 변경 없음)

### 데이터/결과 영향

- RTDB payload 스키마 영향 없음 (서버 계약 미변경).
- 검증 함수가 산출하는 `ValidationResult` 는 기존과 동일 (런타임 동작 불변).
- 변경 효과는 타입 안전성 — 향후 누군가 `portfolio` 에 `null` 가능 값을 넘기면 컴파일 에러로 즉시 차단된다.

## 6) 단계별 계획(Phases)

### Phase 1 — `validation.ts` 시그니처 정정 및 가드 제거 (그린 유지)

> 본 변경은 검증 로직의 판정 기준을 바꾸지 않고(런타임 동작 동일), 타입 시그니처 정합 + 불필요 가드 제거만 수행하므로 Phase 0(정책 고정)은 두지 않는다.

**작업 내용**:

- [ ] `validateFill` 시그니처: `portfolio: Portfolio | null` → `portfolio: Portfolio`
- [ ] `validateFill` 매도 검증 조건절에서 `&& portfolio` 제거 (`p.direction === 'sell' && p.asset_id && p.actual_shares != null`)
- [ ] `validateBalanceAdjust` 시그니처: `portfolio: Portfolio | null` → `portfolio: Portfolio`
- [ ] `validateBalanceAdjust` 보유 0 검증 조건절에서 `portfolio &&` 제거 (`p.asset_id && (p.new_avg_price != null || p.new_entry_date != null) && p.new_shares == null`)

**Validation**:

- [x] 두 함수 모두 `portfolio` 접근부에 불필요한 null 가드가 남아있지 않음
- [x] 호출처(`FillForm.tsx` / `AdjustForm.tsx`)가 컴파일 에러 없이 통과 (마지막 Phase 의 `tsc` 로 최종 확인)

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
  - 거래 탭 → 체결 폼: 매도 방향 선택 후 보유 주수보다 큰 수량 입력 시 `매도 수량이 보유 주수(N주)를 초과합니다` 에러가 표시된다.
  - 거래 탭 → 체결 폼: 보유량 이하 수량은 정상 통과되어 `체결 저장` 이 활성화된다.
  - 거래 탭 → 보정 폼: 보유 주수 0인 자산 선택 후 평균가/진입일만 입력 시 `보유 주수가 0인 자산의 평균가/진입일을 설정할 수 없습니다` 에러가 표시된다.
  - 거래 탭 → 보정 폼: 정상 입력은 `보정 저장` 이 활성화된다.

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. utils / validation 의 portfolio 파라미터 non-null 화 + 불필요 가드 제거
2. utils / validateFill·validateBalanceAdjust 시그니처를 Portfolio 로 정합
3. refactor: validation 함수 portfolio 타입 정정 (동작 동일)
4. utils / 검증 함수 portfolio null 가드 제거 — 타입으로 인바리언트 강제
5. utils / validation 시그니처 정합 및 린트/포맷 정리

## 7) 리스크(Risks)

- 호출처가 추후 `portfolio` 가 null 가능한 위치에서 검증 함수를 호출하려 하면 컴파일 에러가 발생한다 — 의도된 동작(타입으로 인바리언트 강제)이며, 현재 호출처는 모두 non-null 이라 즉각적 리스크 없음.
- 런타임 동작이 동일하므로 회귀 가능성은 낮으나, 조건절에서 항을 제거할 때 다른 항을 잘못 건드리지 않도록 주의한다.

## 8) 메모(Notes)

- 본 계획서는 "프로젝트 전체 분석 재검증" 결과의 항목 B(추천안 2)만 다룬다. 항목 A 는 `PLAN_chart_meta_null.md`, 항목 C~F 는 별도 계획서 대상이다.
- 호출처 확인 완료: `FillForm` `Props.portfolio: Portfolio`, `AdjustForm` `Props.portfolio: Portfolio`, `TradeScreen` 에서 `portfolio === null` 이면 두 폼 미마운트.

### 진행 로그 (KST)

- 2026-05-22 09:33: 계획서 작성 (Draft)
- 2026-05-22 09:40: Phase 1 구현 완료 (`validation.ts`). `npm run lint` / `npx tsc --noEmit` / `npx prettier --write .` 통과. 사용자 실기 검증 대기 (In Progress)

---
