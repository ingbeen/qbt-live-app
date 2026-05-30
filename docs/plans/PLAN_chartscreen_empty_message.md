# Implementation Plan: ChartScreen '차트 데이터가 비어있습니다.' 문자열 중복 제거

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

**작성일**: 2026-05-28 02:34
**마지막 업데이트**: 2026-05-28 02:40
**관련 범위**: screens
**관련 문서**: CLAUDE.md, docs/COMMANDS.md

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

- [x] 목표 1: [src/screens/ChartScreen.tsx](../../src/screens/ChartScreen.tsx) 의 `loadEarlierData` 안에서 동일 함수 내 2회 반복되는 `'차트 데이터가 비어있습니다.'` 문자열을 파일 모듈 스코프 로컬 상수로 추출한다

## 2) 비목표(Non-Goals)

- 메시지 문구 자체는 변경하지 않는다 (런타임 동작 동일).
- `src/utils/constants.ts` 의 `ERROR_MESSAGES` 같은 글로벌 상수 객체를 신설하지 않는다. ChartScreen 외 사용처가 없으므로 파일 로컬 상수가 적합하다 (CLAUDE.md §1.1 YAGNI, `constants.ts` 의 "1 회성 수치는 인라인 유지" 정책과 동일 취지).
- `loadEarlierData` 의 호출 흐름이나 `setLastError` 사용 방식은 변경하지 않는다.
- 프로젝트 전체 분석 재검증 리포트의 다른 항목(A·B·C·D 완료 / F)은 범위 밖이며 각각 별도 계획서로 다룬다.

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- `loadEarlierData` 의 price 분기와 equity 분기에서 동일 문자열 `'차트 데이터가 비어있습니다.'` 가 2회 인라인되어 있다.
- 동일 문자열이 같은 함수 내에서 반복되면 향후 문구 변경 시 한 곳만 고치고 다른 곳을 놓칠 위험이 있다 — 단일 출처(SoT) 위반.
- 사용처가 ChartScreen 1개 파일에 국한되므로 `src/utils/constants.ts` 가 아닌 **파일 로컬 모듈 스코프 상수**로 추출하는 것이 적합하다 (CLAUDE.md §1.1 YAGNI / `constants.ts` 의 "1 회성 수치는 인라인 유지" 정책과 같은 결).

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md`
- 실행 명령어 SoT: `docs/COMMANDS.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] `ChartScreen.tsx` 파일 상단(import 아래, 컴포넌트 정의 위)에 로컬 상수 정의 (예: `const EMPTY_CHART_MESSAGE = '차트 데이터가 비어있습니다.';`)
- [x] `loadEarlierData` 의 price / equity 두 분기에서 인라인 문자열을 상수 참조로 교체
- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행 (마지막 Phase 에서 자동 포맷 적용)
- [ ] 사용자 실기 검증 완료 (대상 화면/플로우 기록)
- [x] 필요한 문서 업데이트: `README.md` 변경 없음 / `docs/COMMANDS.md` 변경 없음 / `CLAUDE.md` 변경 없음
- [x] plan 체크박스 최신화(Phase/DoD/Validation 모두 반영)

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/screens/ChartScreen.tsx` — 파일 상단 로컬 상수 추가 + `loadEarlierData` 의 2개 분기에서 상수 참조
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음 (실행 명령어/CLI 옵션 변경 없음)

### 데이터/결과 영향

- RTDB payload 스키마 영향 없음.
- 사용자 화면 동작·표시 문구 변화 없음 (산출 메시지 동일).
- 변경 효과는 유지보수성 — 문구 변경 시 단일 출처에서만 수정.

## 6) 단계별 계획(Phases)

### Phase 1 — `ChartScreen.tsx` 상수 추출 (그린 유지)

> 본 변경은 인바리언트/정책/에러 처리 정책 변경이 아닌 단순 상수 추출 리팩토링이므로 Phase 0(정책 고정)은 두지 않는다.

**작업 내용**:

- [x] `ChartScreen.tsx` 의 import 블록 아래, 모듈 스코프에 상수 정의: `const EMPTY_CHART_MESSAGE = '차트 데이터가 비어있습니다.';`
- [x] `loadEarlierData` 의 price 분기 `setLastError('차트 데이터가 비어있습니다.')` 호출을 `setLastError(EMPTY_CHART_MESSAGE)` 로 교체
- [x] `loadEarlierData` 의 equity 분기 `setLastError('차트 데이터가 비어있습니다.')` 호출을 `setLastError(EMPTY_CHART_MESSAGE)` 로 교체

**Validation**:

- [x] `ChartScreen.tsx` 내 `'차트 데이터가 비어있습니다.'` 인라인 리터럴이 상수 정의 1곳에만 남아있음 (호출처는 상수 참조)
- [x] 상수가 ChartScreen 외부에서 export 되지 않음 (파일 로컬 SoT)

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
  - (메시지 자체는 비정상 케이스에서만 노출되어 인위적 재현이 곤란하므로 정상 케이스 회귀 확인 위주)

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. 차트 / 비어있음 메시지 파일 로컬 상수로 추출
2. screens / ChartScreen 의 '차트 데이터가 비어있습니다.' 중복 제거
3. refactor: ChartScreen empty 메시지 SoT 단일화
4. 차트 / loadEarlierData 의 토스트 문구 중복 정리
5. screens / 차트 비어있음 메시지 로컬 상수화

## 7) 리스크(Risks)

- 순수 리터럴 추출 리팩토링이라 회귀 가능성은 매우 낮음.
- 상수명을 `constants.ts` 의 다른 네이밍 컨벤션과 굳이 일치시키지 않는다 — 파일 로컬 단일 SoT 라 충돌 없음.

## 8) 메모(Notes)

- 본 계획서는 "프로젝트 전체 분석 재검증" 결과의 항목 E 만 다룬다. 항목 A·B·C·D 는 각각 별도 계획서로 완료, 항목 F 는 별도 계획서 대상이다.
- 상수 위치 결정: ChartScreen 외부에 export 가능한 곳(`src/utils/constants.ts`) 으로 옮기지 않는다. `constants.ts` 정책("1 회성 수치는 인라인 유지") 과 같은 결로 사용처가 1개 파일에 국한된 메시지는 로컬 상수가 적합하다.

### 진행 로그 (KST)

- 2026-05-28 02:34: 계획서 작성 (Draft)
- 2026-05-28 02:40: Phase 1 구현 완료 (`ChartScreen.tsx`). `npm run lint` / `npx tsc --noEmit` / `npx prettier --write .` 통과. 사용자 실기 검증 대기 (In Progress)

---
