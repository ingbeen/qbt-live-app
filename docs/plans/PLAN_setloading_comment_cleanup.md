# Implementation Plan: useStore.ts `setLoading` 헬퍼 주석 §9.5 정리

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

**작성일**: 2026-05-30 02:26
**마지막 업데이트**: 2026-05-30 02:30
**관련 범위**: store
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

- [x] 목표 1: [src/store/useStore.ts](../../src/store/useStore.ts) 의 `setLoading` 헬퍼 정의 직전 주석에서 §9.5 "과거 상태/변경 이력" 표현(`기존 … 반복 제거용`)을 현재 코드 동작 설명으로 교체한다

## 2) 비목표(Non-Goals)

- 코드(로직 / 시그니처 / 동작) 변경 없음. 주석 1줄만 수정한다.
- `useStore.ts` 내 다른 주석은 본 계획서 범위 밖이다.
- 프로젝트 전체 분석 재검증 리포트의 다른 항목(A·B·C·D·E 완료)은 범위 밖이다.

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- `useStore.ts` 의 `setLoading` 헬퍼 정의 직전 주석은 현재 다음과 같다:
  - `// loading 플래그 토글 헬퍼. 기존 \`set({ loading: { ...get().loading, key: bool } })\` 반복 제거용.`
- `기존 … 반복 제거용` 표현은 "헬퍼가 도입되기 이전에 반복 패턴이 있었다" 는 변경 이력 뉘앙스를 포함한다.
- CLAUDE.md §9.5 는 "과거 상태 기록 금지(`이전에는 X 였다`, `예전 코드는 …`)" 와 "변경 이력 기록 금지" 를 규정한다. 본 표현은 그 경계선에 해당한다.
- 프로젝트 전체 분석 재검증에서 §9.5 위반 후보로 식별된 유일한 잔존 케이스다 — 정리해 일관성을 맞춘다.

### 처리 방식

- 주석을 "현재 코드의 동작과 의도" 만 남기는 표현으로 교체한다 — `// loading 플래그 토글 헬퍼. spread 반복을 함수로 추상화.`
- 의미 손실 없음: "spread 반복을 함수로 추상화" 는 헬퍼의 현재 목적을 그대로 설명한다.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md`
- 실행 명령어 SoT: `docs/COMMANDS.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] `useStore.ts` 의 `setLoading` 정의 직전 주석을 `// loading 플래그 토글 헬퍼. spread 반복을 함수로 추상화.` 로 교체
- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행 (마지막 Phase 에서 자동 포맷 적용)
- [ ] 사용자 실기 검증 완료 (대상 화면/플로우 기록)
- [x] 필요한 문서 업데이트: `README.md` 변경 없음 / `docs/COMMANDS.md` 변경 없음 / `CLAUDE.md` 변경 없음
- [x] plan 체크박스 최신화(Phase/DoD/Validation 모두 반영)

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/store/useStore.ts` — `setLoading` 정의 직전 주석 1줄
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음 (실행 명령어/CLI 옵션 변경 없음)

### 데이터/결과 영향

- 코드 동작 영향 없음 (주석만 변경).
- 런타임 / RTDB / UI 영향 없음.

## 6) 단계별 계획(Phases)

### Phase 1 — `useStore.ts` 주석 교체 (그린 유지)

> 본 변경은 주석 1줄만 변경하므로 Phase 0(정책 고정) 불필요.

**작업 내용**:

- [x] `useStore.ts` 의 `setLoading` 헬퍼 정의 직전 주석을 다음으로 교체:
  - 변경 전: `// loading 플래그 토글 헬퍼. 기존 \`set({ loading: { ...get().loading, key: bool } })\` 반복 제거용.`
  - 변경 후: `// loading 플래그 토글 헬퍼. spread 반복을 함수로 추상화.`

**Validation**:

- [x] `useStore.ts` 내에 `기존` / `이전에는` 같은 변경 이력 뉘앙스 표현이 남아있지 않음 (본 주석 1곳 한정 확인)
- [x] `setLoading` 헬퍼 코드 자체는 변경되지 않음

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
  - 코드 동작 변경 없음 (주석 변경만). 회귀 위험 없음.
  - 홈/거래/차트 탭 진입 / Pull-to-Refresh 기본 동작이 기존과 동일하게 작동하는지 1회 확인.

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. store / setLoading 주석 §9.5 정리 (과거 표현 제거)
2. store / setLoading 헬퍼 주석 현재 동작 기준으로 교체
3. docs / useStore setLoading 주석 변경 이력 표현 제거
4. refactor: setLoading 주석 §9.5 부합 표현으로 변경
5. store / 주석 정리 — "기존 반복 제거용" → "spread 반복을 함수로 추상화"

## 7) 리스크(Risks)

- 주석 1줄 교체이므로 회귀 가능성 없음.

## 8) 메모(Notes)

- 본 계획서는 "프로젝트 전체 분석 재검증" 결과의 항목 F 만 다룬다. 항목 A·B·C·D·E 는 각각 별도 계획서로 완료. 항목 F 완료 시 재검증 결과의 모든 유효 항목이 처리된다.

### 진행 로그 (KST)

- 2026-05-30 02:26: 계획서 작성 (Draft)
- 2026-05-30 02:30: Phase 1 구현 완료 (`useStore.ts` 주석 1줄). `npm run lint` / `npx tsc --noEmit` / `npx prettier --write .` 통과. 사용자 실기 검증 대기 (In Progress)

---
