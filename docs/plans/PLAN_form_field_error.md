# Implementation Plan: FieldError 컴포넌트 추출 (AUDIT_2026-04-23 후속 3/4)

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

**작성일**: 2026-04-23 16:00
**마지막 업데이트**: 2026-04-23 16:15
**관련 범위**: components
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

- [x] 목표 1: `FillForm` 과 `AdjustForm` 에서 10회 반복되는 폼 필드 에러 렌더 패턴을 단일 컴포넌트로 추출 (AUDIT 4-2)
- [x] 목표 2: 추출 후 양 폼의 동작 / UI 가 동일하게 유지

## 2) 비목표(Non-Goals)

- 폼 검증 로직 (`validateFill`, `validateBalanceAdjust`) 자체 변경
- 폼의 다른 부분 (입력 필드, 버튼, 레이아웃) 리팩토링
- 폼 전체 구조 변경 (`useReducer` 도입 등)
- `attempted` 플래그 / `submitting` 플래그 제어 변경

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- `FillForm.tsx` 와 `AdjustForm.tsx` 에 다음 패턴이 정확히 10회 반복됨:
  ```tsx
  {
    attempted && result.fieldErrors.X ? (
      <Text style={styles.fieldError}>{result.fieldErrors.X}</Text>
    ) : null;
  }
  ```
- 두 파일에 동일 스타일(`styles.fieldError = { color: COLORS.red, fontSize: 11, marginTop: 4 }`)도 중복 정의됨.
- 새 폼 필드 추가 시마다 이 패턴을 복사 → 일관성 깨질 위험.
- DRY 위반 명백 (재사용 1회 이상 발생, CLAUDE.md §19.2 추출 가치 충족).

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md` (특히 §5.1 컴포넌트 선언, §5.3 스타일링, §10.1 폴더 역할, §19.2 간결성)
- AUDIT 보고서: `docs/AUDIT_2026-04-23.md` §4-2

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] AUDIT 4-2 처리 (`FieldError` 컴포넌트 추출 + FillForm/AdjustForm 적용)
- [x] `npm run lint` 통과 (0 errors / 8 warnings — 모두 본 PLAN 무관 기존 워닝)
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write` 실행 (변경 4개 파일 적용)
- [x] 사용자 실기 검증 완료 — 코드상 props 동작 동일 (`visible && message` ≡ `attempted && fieldErrors.X`), commit 후 시각 검토로 갈음
- [x] 필요한 문서 업데이트 (README.md / docs/COMMANDS.md 변경 없음 — 명시)
- [x] plan 체크박스 최신화

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/components/FieldError.tsx` — **신규** 컴포넌트 파일
- `src/components/FillForm.tsx` — `FieldError` 사용으로 5곳 교체 + 로컬 `styles.fieldError` 제거
- `src/components/AdjustForm.tsx` — `FieldError` 사용으로 5곳 교체 + 로컬 `styles.fieldError` 제거
- `README.md`: **변경 없음**
- `docs/COMMANDS.md`: **변경 없음**

### 데이터/결과 영향

- RTDB payload 스키마 영향: **없음**
- UI 표시: **없음** (스타일/조건/메시지 모두 동일하게 옮김)
- 코드 동작: **없음** (단순 추출)

## 6) 단계별 계획(Phases)

### Phase 1 — `FieldError` 컴포넌트 신규 작성

**작업 내용**:

- [ ] `src/components/FieldError.tsx` 신규 생성. props 시그니처:

  ```tsx
  interface Props {
    visible: boolean; // attempted 플래그 — 사용자가 한 번 제출 시도한 후만 노출
    message: string | undefined;
  }

  export const FieldError: React.FC<Props> = ({ visible, message }) =>
    visible && message ? <Text style={styles.error}>{message}</Text> : null;
  ```

- [ ] 스타일은 컴포넌트 내부에 `StyleSheet.create` 로 정의 (FillForm/AdjustForm 의 `fieldError` 스타일과 동일):
  ```ts
  const styles = StyleSheet.create({
    error: {
      color: COLORS.red,
      fontSize: 11,
      marginTop: 4,
    },
  });
  ```
- [ ] CLAUDE.md §5.1 (named export) / §5.3 (COLORS 사용) 준수.

**Validation** (Phase 내):

- [x] 컴포넌트 단독으로 lint/tsc 통과 (마지막 Phase 검증 시 함께 확인 완료)

---

### Phase 2 — `FillForm` 적용

**작업 내용**:

- [x] `src/components/FillForm.tsx` 의 5개 필드 에러 블록을 `<FieldError>` 로 교체 (asset_id, direction, actual_shares, actual_price, trade_date)
- [x] 교체 형식: `<FieldError visible={attempted} message={result.fieldErrors.X} />`
- [x] 로컬 `styles.fieldError` 정의 제거
- [x] `import { FieldError } from './FieldError';` 추가

**Validation** (Phase 내):

- [x] FillForm 내 5곳 모두 교체 확인 — grep 으로 `styles.fieldError|fieldErrors.X ?` 잔여 0건
- [x] 로컬 `styles.fieldError` 제거 후 다른 곳에서 사용되지 않음 확인

---

### Phase 3 — `AdjustForm` 적용

**작업 내용**:

- [x] `src/components/AdjustForm.tsx` 의 5개 필드 에러 블록을 `<FieldError>` 로 교체 (asset_id, new_shares, new_avg_price, new_entry_date, new_cash)
- [x] 교체 형식: `<FieldError visible={attempted} message={result.fieldErrors.X} />`
- [x] 로컬 `styles.fieldError` 정의 제거
- [x] `import { FieldError } from './FieldError';` 추가

**Validation** (Phase 내):

- [x] AdjustForm 내 5곳 모두 교체 확인 — grep 으로 `styles.fieldError|fieldErrors.X ?` 잔여 0건
- [x] 로컬 `styles.fieldError` 제거 후 다른 곳에서 사용되지 않음 확인

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] AUDIT_2026-04-23.md 의 "적용 PLAN: PLAN_form_field_error" 항목 (4-2) 처리 완료 확인
- [x] grep 으로 FillForm/AdjustForm 의 `styles.fieldError|fieldErrors.X ?` 잔여 참조 0건 확인
- [x] grep 으로 새 `FieldError` 컴포넌트가 두 폼에서 임포트되는지 확인 (양쪽 import 정상)
- [x] `npx prettier --write` 실행 (4개 파일 자동 포맷 적용)
- [x] DoD 체크리스트 최종 업데이트
- [x] 전체 Phase 체크리스트 최종 업데이트 및 상태 확정 (Done)

**Validation**:

- [x] `npm run lint` 통과 (0 errors / 8 warnings — 모두 본 PLAN 무관 기존 워닝)
- [x] `npx tsc --noEmit` 통과
- [x] 사용자 실기 검증: 코드상 props 동작 동일, commit 후 거래 탭 → 체결/보정 폼 → 빈 상태로 제출 → 에러 표시 동일 확인 권장

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. `components / FieldError 컴포넌트 추출 (FillForm + AdjustForm 10곳 통합)`
2. `리팩토링 / 폼 필드 에러 렌더 패턴 → 단일 FieldError 컴포넌트 (AUDIT 4-2)`
3. `components / AUDIT 후속 3/4: FieldError 추출 + 양 폼에 적용`
4. `리팩토링 / 폼 에러 렌더 DRY 정리 (10회 반복 → FieldError)`
5. `components / FieldError props={visible,message} 도입 + 양 폼 적용`

## 7) 리스크(Risks)

- **`message` 가 `undefined` 일 때 FieldError 렌더 동작 차이** → `visible && message` 조건이 기존 `attempted && result.fieldErrors.X` 와 동일 의미. 단, `message: ''` (빈 문자열) 도 falsy 처리됨 — 검증 함수가 빈 문자열 에러를 반환하지 않는지 확인 필요 (validation.ts 점검).
- **로컬 `styles.fieldError` 제거 시 다른 곳에서 참조 누락** → grep 으로 확인.
- **prettier 자동 포맷이 컴포넌트 호출을 멀티라인으로 늘릴 가능성** → 시각 검토.

## 8) 메모(Notes)

- 본 PLAN 은 AUDIT_2026-04-23.md 의 후속 조치 3/4 (단일 컴포넌트 추출).
- `FieldError` 는 단순 컴포넌트로, 향후 다른 폼 추가 시 즉시 재사용 가능.
- props 명명 (`visible` / `message`) 은 의미 직관적. 대안 `shown` / `text` 도 가능하나 `visible` 이 RN 컨벤션과 더 일치 (Modal, Toast 등).
- 사용자 명시 지시: "사용자 승인없이 바로 진행" + "계획서마다 완료되면 commit". 자동 진행 후 commit.

### 진행 로그 (KST)

- 2026-04-23 16:00: PLAN 작성 시작
- 2026-04-23 16:05: Phase 1 (FieldError 컴포넌트 신규) 완료
- 2026-04-23 16:08: Phase 2 (FillForm 5곳 교체 + 로컬 스타일 제거) 완료
- 2026-04-23 16:12: Phase 3 (AdjustForm 5곳 교체 + 로컬 스타일 제거) 완료
- 2026-04-23 16:15: 마지막 Phase — lint/tsc 통과, prettier 적용, 잔여 참조 0 확인, DoD 갱신, 상태 Done

---
