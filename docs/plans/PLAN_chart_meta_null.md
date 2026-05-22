# Implementation Plan: 차트 meta null 내부 불변조건 처리

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

**작성일**: 2026-05-22 01:46
**마지막 업데이트**: 2026-05-22 01:52
**관련 범위**: store
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

- [x] 목표 1: `refreshChart` 에서 equity / price chart `meta` 가 `null` 인 경우를 내부 불변조건 위반으로 처리한다 (CLAUDE.md §5.1)
- [x] 목표 2: 개발 빌드에서는 즉시 인지 가능하도록 `throw`, 릴리스 빌드에서는 `console.error` + 사용자 한글 에러 메시지로 안전 폴백한다
- [x] 목표 3: `meta` null 위반이 `refreshChart` 의 `catch` 블록에 흡수되어 silent 처리되지 않도록 한다

## 2) 비목표(Non-Goals)

- price/equity chart meta 외 다른 RTDB 읽기(`portfolio` / `signals` / `pendingOrders` / inbox / history)의 null 처리는 범위 밖이다.
- 연도 슬라이스 지연 로드(`loadPriceYear` / `loadEquityYear`)의 `slice` null 처리는 범위 밖이다.
- 프로젝트 전체 분석 재검증 리포트의 다른 항목(B `validateFill` / C `formatPendingShares` / D `computeInitialYears` / E 문자열 중복 / F 주석)은 범위 밖이며 별도 계획서로 다룬다.
- `docs/DESIGN_QBT_LIVE_FINAL.md`(서버 데이터 계약)는 변경하지 않는다.

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- `refreshChart` ([src/store/useStore.ts](../../src/store/useStore.ts) 의 `refreshChart` 액션)에서 `readEquityChartMeta()` / `readPriceChartMeta()` 결과가 `null` 이면, 빈 캐시(`{ meta: null, years: {} }`)를 set 하고 `lastError: null` 로 **silent 종료**한다.
- 서버 데이터 계약(`docs/DESIGN_QBT_LIVE_FINAL.md §8.2`)상 `/charts/equity/meta` 와 `/charts/prices/{asset}/meta` 는 서버가 항상 채우는 정본 필드다. 운영 중 `meta` 가 `null` = 서버 SoT 위반 = **로직상 발생할 수 없는 내부 불변조건 위반**이다.
- 현재 동작에서는:
  - 사용자: 빈 차트만 보이고 원인을 알 수 없어 재시작/재로그인을 헛되이 시도한다.
  - 개발자: 에러 로그가 없어 서버 이상이 발생했는지 인지할 수 없다.
- CLAUDE.md §5.1 은 "로직상 절대 발생할 수 없는 조건" 을 조용히 기본값으로 넘기지 말고, 명시적으로 throw 하거나 `console.error` + 안전 폴백으로 개발자가 즉시 인지하게 할 것을 규정한다.

### 처리 방식 결정 (핵심 인바리언트)

- `meta` null = 내부 불변조건 위반 → CLAUDE.md §5.1 방식 1(`__DEV__` throw + 릴리스 `console.error` + 안전 폴백)을 적용한다.
- `refreshChart` 의 `try` 블록 안에서 `throw` 하면 같은 함수의 `catch` 가 흡수하여 §5.1 의 "개발 빌드 즉시 중단" 의도가 무력화된다.
- 따라서 `catch` 블록에서 메시지에 `내부 불변조건 위반` 이 포함된 에러는 흡수하지 않고 **re-throw** 한다. 일반 네트워크/권한 에러는 메시지 패턴이 다르므로 영향받지 않는다.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md`
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 SoT, 변경 금지)
- 실행 명령어 SoT: `docs/COMMANDS.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] equity `meta` null → 개발 빌드 `throw`, 릴리스 빌드 `console.error` + `lastError` 한글 메시지 + 빈 캐시 set
- [x] price `meta` null → 동일 처리 (메시지에 `assetId` 포함)
- [x] `refreshChart` 의 `catch` 블록이 `내부 불변조건 위반` 에러를 re-throw
- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행 (마지막 Phase 에서 자동 포맷 적용)
- [ ] 사용자 실기 검증 완료 (대상 화면/플로우 기록)
- [x] 필요한 문서 업데이트: `README.md` 변경 없음 / `docs/COMMANDS.md` 변경 없음 / `CLAUDE.md` 변경 없음
- [x] plan 체크박스 최신화(Phase/DoD/Validation 모두 반영)

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/store/useStore.ts` — `refreshChart` 액션 (equity meta 분기 / price meta 분기 / catch 블록)
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음 (실행 명령어/CLI 옵션 변경 없음)

### 데이터/결과 영향

- RTDB payload 스키마 영향 없음 (서버 계약 미변경, 읽기·표시 측 처리만 변경).
- `equityChart` / `priceCharts` 캐시 구조 변경 없음 (`meta` null 시 빈 캐시 set 은 유지).
- `lastError` 에 새 사용자 메시지(`차트 데이터를 불러올 수 없습니다.`)가 표시될 수 있다.
- 개발 빌드 한정: `meta` null 시 throw 가 표면화된다(의도된 동작).

## 6) 단계별 계획(Phases)

### Phase 0 — 에러 처리 정책 고정 (레드 허용, 코드 변경 없음)

> 본 변경은 "에러 처리 정책 변경(중단 조건/실패 규칙 변경)" 에 해당하므로 정책을 먼저 고정한다.

**작업 내용**:

- [x] `meta` null 을 "내부 불변조건 위반" 으로 분류 확정 (CLAUDE.md §5.1 방식 1)
- [x] 메시지 문구 확정:
  - 개발 빌드 throw / 릴리스 `console.error` (equity): `[store] 내부 불변조건 위반: equityChart meta=null`
  - 개발 빌드 throw / 릴리스 `console.error` (price): `[store] 내부 불변조건 위반: priceChart meta=null (assetId=${assetId})`
  - `lastError` (공통, 사용자 표시): `차트 데이터를 불러올 수 없습니다.`
- [x] `catch` 흡수 방지 정책 확정: `catch` 가 잡은 에러의 `message` 에 `내부 불변조건 위반` 이 포함되면 re-throw 한다 (일반 네트워크/권한 에러는 흡수 유지)

---

### Phase 1 — `refreshChart` 수정 (그린 유지)

**작업 내용**:

- [x] equity 분기: `if (!meta)` 처리를 `__DEV__` throw → 릴리스 `console.error` + `set({ equityChart: emptyEquityCache(), lastError: '차트 데이터를 불러올 수 없습니다.' })` 로 교체
- [x] price 분기: `if (!meta)` 처리를 `__DEV__` throw → 릴리스 `console.error` + 빈 priceCharts 캐시 set + `lastError` 한글 메시지로 교체 (기존 `{ meta: null, years: {} }` 인라인 캐시 형태 유지 — §2 수술적 변경)
- [x] `catch` 블록: 잡은 에러의 `message` 에 `내부 불변조건 위반` 포함 시 re-throw 하는 가드를 `console.error` / `set` 이전에 추가

**Validation**:

- [x] equity / price 두 분기 모두 `__DEV__` throw + 릴리스 폴백 형태가 일관됨
- [x] `catch` re-throw 가드가 일반 에러(`toUserMessage` 경로)를 막지 않음

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
  - 차트 탭 진입 시 price 차트(SSO/QLD/GLD/TLT)가 정상 표시된다.
  - `ChartTypeToggle` 로 equity 차트 전환 시 정상 표시된다.
  - Pull-to-Refresh 후 차트가 정상 재로드된다.
  - (정상 케이스 회귀 확인이 주 목적 — `meta` null 은 서버 측 비정상이라 앱에서 인위적 재현이 곤란)

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. store / 차트 meta null 내부 불변조건 위반 처리 (§5.1)
2. store / refreshChart meta 누락 silent 폴백 제거 + 사용자 에러 표시
3. store / 차트 meta null 시 `__DEV__` throw + 릴리스 폴백 적용
4. fix: 차트 meta 누락이 빈 화면으로 silent 처리되던 문제 수정
5. store / refreshChart 에러 처리 정책 §5.1 정합

## 7) 리스크(Risks)

- `catch` re-throw 로 개발 빌드에서 unhandled rejection 경고가 표면화될 수 있다 — 의도된 동작이며, 메시지 패턴(`내부 불변조건 위반`)으로 일반 네트워크/권한 에러와 구분되어 정상 에러 흐름은 영향받지 않는다.
- 릴리스 빌드에서 `meta` null 시 사용자에게 에러 토스트가 노출되지만, 복구 동작(Pull-to-Refresh)은 그대로 유지된다.
- 실기 검증에서 `meta` null 비정상 케이스를 인위적으로 재현하기 어렵다 → 정상 케이스 회귀 확인 위주로 검증한다.

## 8) 메모(Notes)

- 본 계획서는 "프로젝트 전체 분석 재검증" 결과의 항목 A(추천안 1)만 다룬다. 항목 B~F 는 별도 계획서 대상이다.
- `meta` null 처리 방식은 재검증 시 사용자가 "비정상 — 서버 SoT 위반" (질문 1 추천안 B)을 선택한 결정을 따른다.

### 진행 로그 (KST)

- 2026-05-22 01:46: 계획서 작성 (Draft)
- 2026-05-22 01:52: Phase 0~1 구현 완료 (`useStore.ts` `refreshChart`). `npm run lint` / `npx tsc --noEmit` / `npx prettier --write .` 통과. 사용자 실기 검증 대기 (In Progress)

---
