# Implementation Plan: computeInitialYears 의 lastDate 파싱 실패 §5.1 처리

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

**작성일**: 2026-05-27 06:26
**마지막 업데이트**: 2026-05-27 06:32
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

- [x] 목표 1: `computeInitialYears` 의 `lastDate` 파싱 실패(`Number.isNaN`) 분기를 silent `[]` 반환에서 내부 불변조건 위반 처리로 교체한다 (CLAUDE.md §5.1)
- [x] 목표 2: 개발 빌드에서는 `throw` 로 즉시 표면화, 릴리스 빌드에서는 `console.error` 로 로그 + `[]` 안전 폴백을 유지한다

## 2) 비목표(Non-Goals)

- `computeNextYear` 의 `firstDate` 파싱 실패 분기는 범위 밖이다. 현재도 silent `null` 반환이지만 좌측 스크롤 로드용이고 정상 흐름에서 `firstDate === undefined` 가 가능(첫 진입 직후) 하여 별도 판단이 필요하다. 본 계획서에서는 건드리지 않는다.
- `refreshChart` 의 호출처 처리(`initialYears.length === 0` 시 사용자 토스트 표시 등)는 범위 밖이다. 본 계획서는 `chartYears.ts` 1개 파일만 다룬다. 릴리스 빌드 사용자 메시지 일관성(항목 A 와 동등 처리) 이 필요해지면 후속 plan 으로 다룬다 — Notes 참고.
- `docs/DESIGN_QBT_LIVE_FINAL.md`(서버 데이터 계약)는 변경하지 않는다.
- 프로젝트 전체 분석 재검증 리포트의 다른 항목(A 완료 / B 완료 / C / E / F)은 범위 밖이며 각각 별도 계획서로 다룬다.

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- [src/utils/chartYears.ts](../../src/utils/chartYears.ts) 의 `computeInitialYears` 는 `lastDate` 의 연/월/일을 `parseInt` 로 파싱한 뒤 `Number.isNaN` 분기에서 silent `[]` 를 반환한다.
- 서버 데이터 계약(`docs/DESIGN_QBT_LIVE_FINAL.md §8.2`)상 `meta.last_date` 는 ISO-8601 `YYYY-MM-DD` 형식으로 항상 채워지는 정본 필드다. 파싱 실패 = 서버 SoT 위반 = **로직상 발생할 수 없는 내부 불변조건 위반**이다.
- 현재 동작에서는 파싱 실패 시 호출처(`refreshChart`)가 빈 `initialYears` 를 받아 빈 캐시(`{ meta, years: {} }`)를 set 하고 종료한다. 결과적으로:
  - 사용자: 차트는 빈 채로 표시되고 원인 불명
  - 개발자: 에러 로그가 없어 서버 이상을 인지 불가
- CLAUDE.md §5.1 은 "로직상 절대 발생할 수 없는 조건" 을 조용히 기본값으로 넘기지 말 것을 규정한다.

### 처리 방식 결정 (핵심 인바리언트)

- `lastDate` 파싱 실패 = 내부 불변조건 위반 → CLAUDE.md §5.1 방식 1(`__DEV__` throw + 릴리스 `console.error` + 안전 폴백)을 적용한다.
- 안전 폴백은 기존과 동일하게 `[]` 반환 — 호출처의 흐름(빈 캐시 set)을 그대로 유지한다.
- 호출처(`useStore.refreshChart`)는 항목 A 에서 이미 `catch` 블록이 `내부 불변조건 위반` 메시지 패턴 에러를 re-throw 하도록 처리되어 있다. 개발 빌드에서 `chartYears.ts` 가 throw 하면:
  1. `Promise.all(initialYears.map(...))` 이전, 즉시 throw 전파
  2. `refreshChart` 의 `catch` 가 잡고 메시지 패턴 매칭 → re-throw
  3. `ChartScreen` 의 `useEffect` 가 `refreshChart(...)` 를 await 없이 호출 → unhandled rejection → RN dev redbox/경고로 즉시 표면화
- 릴리스 빌드(`__DEV__ === false`): `throw` 분기를 건너뛰고 `console.error` + `[]` 반환 → 호출처는 현재와 동일 흐름(빈 캐시 set, `lastError: null`). 사용자에게 빈 차트가 표시되는 것은 본 계획서 변경 전과 동일.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md`
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 SoT, 변경 금지)
- 실행 명령어 SoT: `docs/COMMANDS.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] `computeInitialYears` 의 NaN 분기: 개발 빌드 `throw`, 릴리스 빌드 `console.error` + `[]` 반환
- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행 (마지막 Phase 에서 자동 포맷 적용)
- [ ] 사용자 실기 검증 완료 (대상 화면/플로우 기록)
- [x] 필요한 문서 업데이트: `README.md` 변경 없음 / `docs/COMMANDS.md` 변경 없음 / `CLAUDE.md` 변경 없음
- [x] plan 체크박스 최신화(Phase/DoD/Validation 모두 반영)

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/utils/chartYears.ts` — `computeInitialYears` 의 NaN 분기
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음 (실행 명령어/CLI 옵션 변경 없음)

### 데이터/결과 영향

- RTDB payload 스키마 영향 없음 (서버 계약 미변경, 읽기·표시 측 처리만 변경).
- 정상 케이스(`lastDate` 가 ISO 형식): 산출되는 `initialYears` 동일, 동작 불변.
- 비정상 케이스(`lastDate` 파싱 실패) 개발 빌드: throw 가 호출 체인을 따라 표면화되어 redbox/경고로 표시.
- 비정상 케이스 릴리스 빌드: `console.error` 로그 추가. 사용자 화면(빈 차트)은 본 변경 전과 동일.

## 6) 단계별 계획(Phases)

### Phase 0 — 에러 처리 정책 고정 (레드 허용, 코드 변경 없음)

> 본 변경은 "에러 처리 정책 변경(중단 조건/실패 규칙 변경)" 에 해당하므로 정책을 먼저 고정한다.

**작업 내용**:

- [x] `lastDate` 파싱 실패를 "내부 불변조건 위반" 으로 분류 확정 (CLAUDE.md §5.1 방식 1)
- [x] 메시지 문구 확정:
  - 개발 빌드 throw / 릴리스 `console.error`: `[chartYears] 내부 불변조건 위반: lastDate 파싱 실패 (lastDate=${lastDate})`
- [x] 폴백 정책 확정: 릴리스 빌드는 `console.error` 후 기존과 동일하게 `[]` 반환. 호출처 흐름은 손대지 않음 (§2 수술적 변경).

---

### Phase 1 — `chartYears.ts` 수정 (그린 유지)

**작업 내용**:

- [x] `computeInitialYears` 의 `if (Number.isNaN(...))` 분기를 다음으로 교체:
  - `__DEV__` true → `throw new Error('[chartYears] 내부 불변조건 위반: lastDate 파싱 실패 (lastDate=${lastDate})')`
  - 그 외 → `console.error('[chartYears] 내부 불변조건 위반: lastDate 파싱 실패 (lastDate=', lastDate, ')')` 후 `return [];`

**Validation**:

- [x] NaN 분기 외에는 코드 변경 없음 (정상 흐름 산출값 동일)
- [x] 메시지 패턴이 `useStore.refreshChart` 의 `catch` re-throw 가드(`message.includes('내부 불변조건 위반')`)와 일치

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
  - (정상 케이스 회귀 확인이 주 목적 — `lastDate` 파싱 실패는 서버 측 비정상이라 앱에서 인위적 재현이 곤란)

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. utils / chartYears lastDate 파싱 실패 내부 불변조건 위반 처리 (§5.1)
2. utils / computeInitialYears NaN 분기 silent 폴백 제거
3. utils / 차트 lastDate 파싱 실패 시 `__DEV__` throw + 릴리스 폴백 적용
4. fix: 차트 lastDate 파싱 실패가 silent `[]` 로 흡수되던 문제 수정
5. utils / chartYears 에러 처리 정책 §5.1 정합

## 7) 리스크(Risks)

- 개발 빌드에서 throw 가 `refreshChart` catch → re-throw → `ChartScreen useEffect` 의 unhandled rejection 으로 이어진다 — 의도된 동작이며 항목 A 의 catch 가드와 동일 메커니즘이다. 정상 네트워크/권한 에러는 메시지 패턴이 달라 영향받지 않는다.
- 릴리스 빌드 사용자 경험은 본 변경 전후 동일(빈 차트). 사용자 토스트 표시까지 원하면 후속 plan 에서 `refreshChart` 측에 처리 추가가 필요하다(본 계획서 비목표).
- 실기 검증에서 `lastDate` 파싱 실패 비정상 케이스를 인위적으로 재현하기 어렵다 → 정상 케이스 회귀 확인 위주로 검증한다.

## 8) 메모(Notes)

- 본 계획서는 "프로젝트 전체 분석 재검증" 결과의 항목 D 만 다룬다. 항목 A 는 `PLAN_chart_meta_null.md`(완료), 항목 B 는 `PLAN_validate_portfolio_nonnull.md`(완료), 항목 C / E / F 는 별도 계획서 대상이다.
- 호출처 영향 확인: `computeInitialYears` 는 `useStore.refreshChart` 의 equity / price 두 분기에서 호출된다. 두 분기 모두 동일하게 처리된다(별도 호출처 분기 불필요).
- 항목 A 와의 일관성: 항목 A 는 store 내부에서 `__DEV__` throw 와 함께 `lastError` 한글 메시지 설정을 함께 했다. 항목 D 는 `utils/chartYears.ts` 이라 store 상태(`lastError`)에 직접 접근할 수 없다(§1.3 모듈 독립성). 따라서 본 계획서는 chartYears 측 처리만 다루고, 릴리스 빌드 사용자 메시지 정합은 별도 후속 결정 대상이다.

### 진행 로그 (KST)

- 2026-05-27 06:26: 계획서 작성 (Draft)
- 2026-05-27 06:32: Phase 0~1 구현 완료 (`chartYears.ts`). `npm run lint` / `npx tsc --noEmit` / `npx prettier --write .` 통과. 사용자 실기 검증 대기 (In Progress)

---
