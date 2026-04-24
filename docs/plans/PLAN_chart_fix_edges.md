# Implementation Plan: 차트 좌/우 경계 하드 고정 (fixLeftEdge / fixRightEdge)

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

**작성일**: 2026-04-24 22:15
**마지막 업데이트**: 2026-04-24 22:15
**관련 범위**: utils (chartHtml)
**관련 문서**: CLAUDE.md, docs/CLAUDE.md

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

- [x] 차트 좌/우 경계 너머로 제스처 자체가 진행되지 않도록 하드 고정 (lightweight-charts `fixLeftEdge` / `fixRightEdge`).
- [x] 기존 "경계 넘어간 후 되돌리기" 방식의 튕김/깜빡임 제거.
- [x] 좌측 아카이브 선제 로드(load_earlier) 트리거는 기존 동작 유지.

## 2) 비목표(Non-Goals)

- 핀치 줌 / 관성 스크롤의 민감도 조정.
- Y축 동작, 크로스헤어, 시리즈 스타일 변경.
- 아카이브 로드 로직 자체 변경 (트리거 임계값 30 유지).

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- `PLAN_chart_boundary_axis.md` 에서 `CHART_EDGE_MARGIN_BARS: 60 → 0` 으로 변경했으나, 좌/우 경계 처리는 여전히 `subscribeVisibleLogicalRangeChange` 콜백 안에서 `setVisibleLogicalRange` 로 되돌리는 사후 보정 방식이었다.
- 사용자 실기 검증 결과, 우측 경계에서 "넘어갔다가 되돌아오는" 튕김이 관찰됨 (이전 plan 의 Risks 섹션에 기록된 리스크가 실제로 발생).
- lightweight-charts v5 의 `timeScale.fixLeftEdge` / `fixRightEdge` 옵션은 사용자 제스처 단계에서 경계 너머 스크롤을 원천적으로 막아주므로 되돌림 과정 자체가 없다.
- 기존 코드 주석에 기록된 "fixRightEdge 는 rightOffset 을 무효화하는 공식 이슈로 미사용" 은 `rightOffset > 0` 상황의 제약이다. 현재 `rightOffset: 0` 이므로 제약과 무관.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md` (특히 §9 WebView + TradingView Charts 규칙)
- `docs/CLAUDE.md` (plan 운영 규칙)
- 참고 plan: `docs/plans/PLAN_chart_boundary_axis.md` (직전 Phase 결과물이 본 plan 의 전제)

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] 우측 경계: 마지막 봉보다 오른쪽으로 드래그/플릭 해도 화면이 움직이지 않음 (튕김 없음). (코드 반영)
- [x] 좌측 경계: 첫 봉보다 왼쪽으로 드래그/플릭 해도 화면이 움직이지 않음 (단, 아카이브 로드 후 첫 봉이 더 과거로 이동하는 것은 정상). (코드 반영)
- [x] 좌측 아카이브 로드(load_earlier) 가 기존대로 동작 (좌측 근접 시 전년도 로드). (코드 반영)
- [x] 주가/Equity 두 모드 모두 동일하게 동작. (공통 timeScale 옵션이라 자동 적용)
- [x] `npm run lint` 통과 (0 errors, 기존 8 warnings — 이번 변경 무관).
- [x] `npx tsc --noEmit` 통과.
- [x] `npx prettier --write .` 실행 (변경 파일에 적용 완료).
- [ ] 사용자 실기 검증 완료.
- [x] 필요한 문서 업데이트 (README.md 변경 없음 / `docs/COMMANDS.md` 변경 없음).
- [x] plan 체크박스 최신화(Phase/DoD/Validation 모두 반영).

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/utils/chartHtml.ts` — 단일 수정 지점.
- `README.md`: 변경 없음.
- `docs/COMMANDS.md`: 변경 없음 (실행 명령어/CLI 옵션 변경 없음).

### 데이터/결과 영향

- RTDB/서버 계약 영향 없음.
- 화면 표시 영향: 경계 제스처 튕김 제거. 그 외 시각 동일.

## 6) 단계별 계획(Phases)

### Phase 1 — chartHtml.ts 수정 (그린 유지)

**작업 내용**:

- [x] `timeScale` 옵션에 `fixLeftEdge: true`, `fixRightEdge: true` 추가 (`rightOffset: 0` 명시 포함).
- [x] `subscribeVisibleLogicalRangeChange` 콜백에서 좌/우 경계 `setVisibleLogicalRange` 되돌림 로직 제거. load_earlier 트리거만 유지.
- [x] 사용하지 않게 된 `CHART_EDGE_MARGIN_BARS` 상수 / `currentBarCount` 변수 완전 제거 (`setPriceChart` / `setEquityChart` 말미의 봉 수 대입도 삭제).
- [x] 주석 갱신: 신규 경계 처리 방식(fix\*Edge) 설명으로 교체.

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] 필요한 문서 업데이트 (README.md / `docs/COMMANDS.md` 변경 없음 확인).
- [x] `npx prettier --write .` 실행(자동 포맷 적용) — 변경 파일 한정.
- [ ] 변경 기능 및 전체 플로우 최종 검증 (사용자 실기 확인).
- [x] DoD 체크리스트 최종 업데이트 및 체크 완료 (사용자 실기 제외).
- [x] 전체 Phase 체크리스트 최종 업데이트 및 상태 확정.

**Validation**:

- [x] `npm run lint` 통과 (0 errors, 기존 8 warnings — 이번 변경 무관).
- [x] `npx tsc --noEmit` 통과.
- [ ] 사용자 실기 검증: 차트 탭 → 주가(SSO/QLD/GLD/TLT) + Equity 전환, 좌/우 경계 드래그/플릭, 좌측 archive 로드 트리거, 크로스헤어 이동.

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. 차트 / 좌우 경계 하드 고정 (fixLeftEdge/fixRightEdge) + 튕김 제거
2. 차트 / 경계 스크롤 튕김 제거 — lightweight-charts 공식 옵션 적용
3. 차트 / 경계 재조정 로직 제거하고 fix\*Edge 로 대체
4. 차트 / 경계 스크롤 차단 (rightOffset=0 기반 fix\*Edge 활성화)
5. 차트 / 우측 넘어가는 튕김 제거 — timeScale fix\*Edge 옵션 적용

## 7) 리스크(Risks)

- `fixLeftEdge: true` 와 아카이브 prepend(`setData` 로 새 데이터 교체) 의 상호작용: 아카이브 로드 후 새 첫 봉이 좌측 edge 로 재계산되어야 함 → setData 호출로 자동 재계산됨 (확인 필요).
- `fixRightEdge: true` 가 `rightOffset` 이 음수/양수가 아닌 0 환경에서 기대대로 동작하는지 → rightOffset=0 은 공식 권장 사용 환경.
- 핀치 줌 시 한쪽 경계에 닿으면 반대쪽도 함께 제약될 수 있음 → 실기 확인.

## 8) 메모(Notes)

- 사용자 지시: 계획서 작성 후 승인 없이 바로 진행 (직전 plan 과 동일 워크플로우).
- 직전 plan (`PLAN_chart_boundary_axis.md`) 이 실기 검증 대기 상태였는데, 본 plan 적용 시 경계 동작이 더 명확히 개선되므로 통합 검증으로 처리 가능.

### 진행 로그 (KST)

- 2026-04-24 22:15: 계획서 작성 및 실행 시작.
- 2026-04-24 22:25: Phase 1 구현 완료 (chartHtml.ts). lint/tsc/prettier 통과. 사용자 실기 검증 대기.

---
