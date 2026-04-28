# Implementation Plan: 홈 자산현황 카드 / 현금 행 통합 표시

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

**작성일**: 2026-04-28 16:10
**마지막 업데이트**: 2026-04-28 16:10
**관련 범위**: components
**관련 문서**: CLAUDE.md

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

- [x] 홈 화면 "자산 현황" 카드에서 자산 4종(SSO/QLD/GLD/TLT) 과 현금 행 사이의 가로 구분선(divider)을 제거한다.
- [x] 현금 행을 자산 행과 동일한 세로 간격(`paddingVertical`)으로 표시한다.

## 2) 비목표(Non-Goals)

- 현금 행에 Badge(현금/보유 등) 추가하지 않음. 사용자 요청은 "구분선 제거 + 간격 동일" 에 한정.
- 자산 표시 순서/필드 변경 없음.
- 데이터(`shared_cash_actual`, `actual_equity`) 계산 로직 변경 없음.
- "자산 현황" 헤더 아래의 첫 번째 divider 는 그대로 유지(헤더와 본문을 구분하는 시각적 역할).

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- 현재 `src/components/AssetSummaryCard.tsx` 는 4개 자산 행을 `ASSETS.map()` 으로 렌더링한 뒤, 두 번째 가로 divider 를 두고 별도의 `<View>` 블록으로 현금 행을 렌더링한다 (라인 87 ~ 99).
- 시각적으로 자산과 현금이 분리되어 보이지만, 사용자는 "현금도 자산의 한 항목"으로 동일한 리스트에 통합되어 보이길 원한다.
- 현금 행은 이미 `styles.row` 스타일을 공유하고 있으므로, divider 만 제거하면 자동으로 동일한 `paddingVertical: 6` 간격으로 정렬된다.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md`
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 SoT, 변경 금지)
- 실행 명령어 SoT: `docs/COMMANDS.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] 자산 행과 현금 행 사이의 divider 가 제거되어 시각적으로 동일한 리스트로 보임
- [x] 현금 행과 자산 행 간 세로 간격이 자산 행 간 간격과 동일
- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행 (마지막 Phase 에서 자동 포맷 적용)
- [ ] 사용자 실기 검증 완료 (홈 화면 자산 현황 카드 시각 확인)
- [x] 필요한 문서 업데이트 (README.md / `docs/COMMANDS.md` / CLAUDE.md / plan)
- [x] plan 체크박스 최신화

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/components/AssetSummaryCard.tsx` — 자산 행과 현금 행 사이의 두 번째 divider(`<View style={styles.divider} />`) 제거
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음

### 데이터/결과 영향

- RTDB payload 스키마 영향 없음 (표시 측 UI 변경만)
- 데이터 계산/저장 로직 변경 없음
- UI 표시: 홈 화면 "자산 현황" 카드 내부 레이아웃만 미세 변경

## 6) 단계별 계획(Phases)

### Phase 1 — 자산 현황 카드 divider 제거

**작업 내용**:

- [x] `src/components/AssetSummaryCard.tsx` 의 자산 map 루프 종료 직후(라인 87) 의 `<View style={styles.divider} />` 한 줄 제거
- [x] 현금 행(라인 89 ~ 99) 의 `styles.row` 사용은 그대로 유지 → 자산 행과 자동으로 동일 간격

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] README.md 변경 없음 확인
- [x] `docs/COMMANDS.md` 변경 없음 확인
- [x] `npx prettier --write .` 실행
- [ ] 홈 화면 실기 확인 (사용자가 에뮬레이터/기기에서 자산 현황 카드 시각 검증)
- [x] DoD 체크리스트 최종 업데이트
- [x] 전체 Phase 체크리스트 최종 업데이트

**Validation**:

- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [ ] 사용자 실기 검증: 홈 탭 "자산 현황" 카드 — divider 없이 4종 자산 + 현금이 동일 간격으로 나열되는지 확인

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. 홈 / 자산현황 카드 현금 행 divider 제거 및 간격 통일
2. components / AssetSummaryCard 현금 행을 자산 행과 동일 간격으로 통합 표시
3. 홈 / 자산 현황 자산-현금 구분선 제거 (단일 리스트 표시)
4. UI / 자산현황 카드 레이아웃 통합 (현금을 자산 행과 동일 표기)
5. AssetSummaryCard / 두 번째 divider 제거하고 현금 행 간격 통일

## 7) 리스크(Risks)

- 시각적 변경만 있고 로직 변경이 없으므로 회귀 위험 매우 낮음.
- 사용자가 의도와 다른 시각 결과를 원할 가능성 → 실기 확인으로 즉시 피드백 가능.

## 8) 메모(Notes)

- 변경 범위가 1줄(divider 제거) 수준의 매우 작은 UI 변경.
- 헤더 아래 첫 번째 divider 는 보존 — 카드 제목/금액과 본문 리스트의 구분 역할이 별도로 필요.

### 진행 로그 (KST)

- 2026-04-28 16:10: 계획서 작성
- 2026-04-28 16:15: Phase 1 구현 완료 (`AssetSummaryCard.tsx` 두 번째 divider 제거)
- 2026-04-28 16:18: lint / tsc / prettier 검증 통과 — 사용자 실기 확인 대기 중
