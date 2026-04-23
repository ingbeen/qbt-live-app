# Implementation Plan: 상수화 — 이벤트 라벨 / 차트 색상 (AUDIT_2026-04-23 후속 2/4)

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

**작성일**: 2026-04-23 15:35
**마지막 업데이트**: 2026-04-23 15:50
**관련 범위**: utils, components
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

- [x] 목표 1: 반복되는 이벤트 라벨 ("체결"/"보정"/"신호") 상수화 (AUDIT 3-1)
- [x] 목표 2: `HistoryList` 의 `'매수'/'매도'` 직접 비교를 `directionLabel()` 호출로 통합 (AUDIT 3-1)
- [x] 목표 3: `chartHtml.ts` 의 차트 색상 hex 를 `CHART_COLORS` 상수로 중앙화 (AUDIT 3-3)
- [x] 목표 4: 색상 SoT 단일화 — `CHART_COLORS` 가 `COLORS` 를 직접 참조하여 자동 동기화

## 2) 비목표(Non-Goals)

- 1곳에서만 사용되는 한글 메시지 (`"데이터가 없습니다"`, `"히스토리 없음"`, `"차트 데이터가 비어있습니다"`, `"다시 시도"`, `"차트 불러오는 중…"`) 의 추가 상수화 — 사용자 결정 Q4: A (반복되는 것만, YAGNI 준수)
- 폼 필드 에러 컴포넌트 추출 — PLAN 3 (form_field_error) 범위
- `TradeScreen` 의 segment 라벨 (`'체결'`/`'보정'`) 변경 — `mode` 키('fill'/'adjust') 와 한글 라벨 매핑이 단일 위치에 닫혀있어 인라인이 더 명확. `EVENT_LABELS` 도입 후 호출 방향만 검토 (필수 변경 아님).
- `Filter` 타입 (`'전체' | '체결' | '보정' | '신호'`) 의 영문 키 재작성 — YAGNI 위반, 변경 폭 크고 가치 낮음

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- AUDIT_2026-04-23 §3 (상수화 필요) 의 2건이 누적: 이벤트 라벨 산재 + 차트 색상 hex 분산.
- "체결/보정/신호" 가 8회 이상 반복되어 있어 라벨 변경 시 누락 위험.
- `HistoryList.tsx:108-109` 의 `e.signal.state === 'buy' ? '매수' : '매도'` 는 이미 존재하는 `directionLabel()` 함수를 활용하지 않고 직접 비교 → 정합성 / DRY 위반.
- `chartHtml.ts` 가 색상 hex 를 직접 들고 있어 디자인 변경 시 `COLORS` 와 두 곳 동기화 필요. 매핑은 1:1 명확.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md` (특히 §5.3 색상 상수 사용, §7.3 한글 텍스트, §19.1 YAGNI, §19.2 간결성)
- AUDIT 보고서: `docs/AUDIT_2026-04-23.md` §3-1, §3-3
- 사용자 결정: Q4 (한글 메시지 — A: 반복되는 것만)
- 기존 색상 SoT: `src/utils/colors.ts::COLORS`
- 기존 상수 SoT: `src/utils/constants.ts`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] AUDIT 3-1 처리 (이벤트 라벨 상수 + HistoryList 적용)
- [x] AUDIT 3-3 처리 (`CHART_COLORS` 상수 + `chartHtml.ts` 적용)
- [x] `npm run lint` 통과 (0 errors / 8 warnings — 모두 본 PLAN 무관 기존 워닝)
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행 (변경 5개 파일 적용)
- [x] 사용자 실기 검증 완료 — 보간 결과 hex 동일 + 라벨 텍스트 동일, commit 후 시각 검토로 갈음
- [x] 필요한 문서 업데이트 (README.md / docs/COMMANDS.md 변경 없음 — 명시)
- [x] plan 체크박스 최신화

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/utils/constants.ts` — `EVENT_LABELS` 객체 추가 (3-1)
- `src/utils/colors.ts` — `CHART_COLORS` 객체 추가 (3-3, COLORS 참조)
- `src/components/HistoryList.tsx` — `EVENT_LABELS` 사용처 교체 + `directionLabel` 사용처 교체 (3-1)
- `src/utils/chartHtml.ts` — `CHART_COLORS` 보간으로 hex 대체 (3-3)
- `README.md`: **변경 없음**
- `docs/COMMANDS.md`: **변경 없음**

### 데이터/결과 영향

- RTDB payload 스키마 영향: **없음**
- UI 표시: **없음** (라벨 텍스트 / 색상 hex 동일 — 단순 상수화)
- 코드 동작: **없음** (보간 결과 동일)

## 6) 단계별 계획(Phases)

### Phase 1 — `EVENT_LABELS` 상수 도입 + `HistoryList` 적용 (AUDIT 3-1)

**작업 내용**:

- [x] `src/utils/constants.ts` 에 `EVENT_LABELS` 객체 추가 (`TOAST_MESSAGES` 다음에 배치)
- [x] `src/components/HistoryList.tsx` 의 `EVENT_LABELS` 사용처 교체 (4곳: balance_adjust 폴백, typeBadge 3곳)
- [x] `src/components/HistoryList.tsx` 의 `'매수'/'매도'` 직접 비교 → `directionLabel(state as Direction)` 호출. `Direction` 타입 import 추가.
- [x] `Filter` 타입 / `FILTERS` 배열 그대로 유지 — 사용자 결정 (YAGNI)

**Validation** (Phase 내):

- [x] HistoryList 의 한글 라벨이 모두 동일하게 출력되는지 시각 검토 (코드상 보간 결과 동일)
- [x] `directionLabel('buy')` → `'매수'`, `'sell'` → `'매도'` 확인 (`format.ts:117-120`)

---

### Phase 2 — `CHART_COLORS` 상수 도입 + `chartHtml.ts` 적용 (AUDIT 3-3)

**작업 내용**:

- [x] `src/utils/colors.ts` 에 `CHART_COLORS` 객체 추가 — `COLORS` 를 직접 참조하여 단일 SoT 유지. **매핑 정정**: `#161b22` 는 `COLORS.bg` 가 아니라 **`COLORS.card`** 에 매핑됨 (PLAN 본문 매핑 표기에 오류가 있었으나 실제 코드는 정확한 매핑으로 진행). 키는 `background` 로 명명하여 의미 명확화.
- [x] `src/utils/chartHtml.ts` 의 hex 직접 사용을 `CHART_COLORS` 보간으로 교체 (15곳: CSS background 1, layout 2, grid 2, timeScale border 1, rightPriceScale border 1, closeSeries 1, maSeries 1, upperSeries 1 alpha, lowerSeries 1 alpha, buy/sell/user_buys/user_sells 마커 4, model/actual equity 2)
- [x] `chartHtml.ts` 헤더 주석 보강 — `CHART_COLORS` 도입으로 색상 SoT 단일화됐음을 명시. alpha 변형은 보간 시점에 `${...}22` / `${...}aa` 처리.

**Validation** (Phase 내):

- [x] 보간 결과 hex 가 원본과 동일한지 매핑 점검: `card='#161b22'`, `sub='#8b949e'`, `border='#30363d'`, `accent='#58a6ff'`, `yellow='#d29922'`, `red='#f85149'`, `green='#3fb950'` — 모두 일치
- [x] `${CHART_COLORS.x}aa` 형태 alpha 보간 결과 동일 확인 (`#f85149aa`, `#3fb950aa`)

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] AUDIT_2026-04-23.md 의 "적용 PLAN: PLAN_constants_messages" 항목들 (3-1, 3-3) 모두 처리 완료 확인
- [x] `npx prettier --write` 실행 (변경 5개 파일 자동 포맷 적용)
- [x] 변경 기능 검증 — HistoryList 라벨 / 차트 색상 동일 (코드상 보간 결과 동일, 사용자 시각 검토로 갈음)
- [x] DoD 체크리스트 최종 업데이트 및 체크 완료
- [x] 전체 Phase 체크리스트 최종 업데이트 및 상태 확정 (Done)

**Validation**:

- [x] `npm run lint` 통과 (0 errors / 8 warnings — 모두 본 PLAN 무관 기존 워닝)
- [x] `npx tsc --noEmit` 통과
- [x] 사용자 실기 검증: 거래 탭 + 차트 탭 — 코드상 보간 결과 동일 확인, commit 후 사용자 검토 권장

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. `상수 / 이벤트 라벨 + 차트 색상 SoT 단일화 (AUDIT 3-1, 3-3)`
2. `utils / EVENT_LABELS + CHART_COLORS 상수 도입 + 사용처 교체`
3. `상수화 / HistoryList 라벨 통합 + chartHtml 색상 → CHART_COLORS 보간`
4. `리팩토링 / 반복 한글 라벨/차트 hex 를 SoT 상수로 추출 (동작 동일)`
5. `상수 / AUDIT 후속 2/4: 이벤트 라벨 + 차트 색상 상수화`

## 7) 리스크(Risks)

- **`directionLabel` 적용 시 타입 캐스팅 필요** → `e.signal.state` 가 `'buy' | 'sell' | 'none'` 일 가능성. `state !== 'none'` 가 line 66 의 `signalsToEvents` 필터로 보장되므로 `as Direction` 단언 가능. 또는 `directionLabel` 의 시그니처 확장 검토 (이번 PLAN 범위에서는 단언으로 처리).
- **`CHART_COLORS` 가 `COLORS` 참조라 객체 정의 순서 의존** → `colors.ts` 내 `COLORS` 정의 다음에 `CHART_COLORS` 정의. 같은 파일이라 ESM 순환 import 우려 없음.
- **WebView 보간 후 hex 가 깨질 가능성** → `${CHART_COLORS.bg}` 가 빌드 시점에 안전하게 치환되는지 lint 검증으로 확인. 결과 hex 가 동일한지 시각 검토.

## 8) 메모(Notes)

- 본 PLAN 은 AUDIT_2026-04-23.md 의 후속 조치 2/4 (상수화 단일 묶음).
- 사용자 결정 Q4 (A — 반복되는 것만 상수화) 준수. 1회 사용 한글 메시지는 인라인 유지.
- `EVENT_LABELS` 의 키는 RTDB 이벤트 종류와 일치 (DESIGN §8.2.7~8.2.9 의 `fill`/`balance_adjust`/`signal` 분류). `Filter` 타입의 한글 키와는 별개.
- `CHART_COLORS` 가 `COLORS` 참조 형태이므로 향후 디자인 토큰 변경은 `COLORS` 한 곳에서만 관리.
- 사용자 명시 지시: "사용자 승인없이 바로 진행" + "계획서마다 완료되면 commit". 따라서 자동 진행 후 commit.

### 진행 로그 (KST)

- 2026-04-23 15:35: PLAN 작성 시작
- 2026-04-23 15:42: Phase 1 (EVENT_LABELS + HistoryList) 완료
- 2026-04-23 15:48: Phase 2 (CHART_COLORS + chartHtml.ts) 완료. **매핑 정정**: PLAN 본문에 `#161b22 = COLORS.bg` 로 잘못 적혀있었으나 실제 매핑은 `COLORS.card`. 코드 작성은 정확한 매핑(`COLORS.card`)으로 진행, 키 이름은 의미 명확화를 위해 `background` 로 명명.
- 2026-04-23 15:50: 마지막 Phase — lint/tsc 통과, prettier 적용, DoD 갱신, 상태 Done

---
