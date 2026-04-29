# Implementation Plan: 차트 RTDB 경로 archive → years 명명 변경

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

**작성일**: 2026-04-28 19:00
**마지막 업데이트**: 2026-04-28 19:00
**관련 범위**: types, services, store, screens, utils, docs
**관련 문서**: CLAUDE.md, docs/DESIGN_QBT_LIVE_FINAL.md (서버 SoT — 서버 측 동기 변경 필요)

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

- [x] 직전 plan(`PLAN_chart_recent_to_archive_only.md`) 으로 recent 가 폐지되어 더 이상 "archive(보관)" 의미가 정확하지 않다. 명명을 `years` 로 통일하여 의미와 코드 일치.
- [x] RTDB 경로 / meta 필드 / 앱 함수 / 캐시 필드 / loading 키 / 문서 모두 일괄 rename.
- [x] 별도 서버 작업자용 프롬프트 문서를 신규 폴더 `docs/server_prompts/` 에 작성한다.

## 2) 비목표(Non-Goals)

- archive payload 구조 변경 없음 (`dates`, `close`, `ma_value`, …).
- daily 갱신 정책 변경 없음 (현재 연도만 매 실행 갱신).
- prefetchNext / debounce / trailing / fixLeftEdge 등 기존 동작 변경 없음.

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- 직전 plan 에서 `recent` 가 폐지되어 차트 시계열 경로는 `archive/{YYYY}` 만 남았다.
- "archive" 는 본래 "recent 와 대비되는 보관 데이터" 의 의미였으나, 현재 연도(daily 갱신 중) 도 archive 에 들어가게 되어 명칭이 의미와 어긋난다.
- 의미 일치성 + 향후 합류 개발자 혼란 방지를 위해 `archive` → `years` 로 일괄 rename.
- 개발 단계라 RTDB 데이터 폐기/재생성에 부담이 없다.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md`
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (§8.2 — 본 plan 으로 함께 갱신)
- 실행 명령어 SoT: `docs/COMMANDS.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] 앱 코드의 모든 `archive` 식별자가 `years` (또는 의미상 적절한 이름) 로 rename
- [x] RTDB 경로가 `/charts/*/years/{YYYY}` 로 변경
- [x] meta 필드 `archive_years` → `years`
- [x] 별도 서버 프롬프트 문서 `docs/server_prompts/PROMPT_chart_archive_rename_to_years.md` 작성
- [x] DESIGN_QBT_LIVE_FINAL.md 갱신 완료
- [x] `npm run lint` / `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행
- [x] 사용자 실기 검증 완료
- [x] README.md / `docs/COMMANDS.md` 변경 여부 명시 (변경 없음 예상)
- [x] plan 체크박스 최신화

## 5) 변경 범위(Scope)

### 변경 대상 파일

- [src/utils/chartArchive.ts](../../src/utils/chartArchive.ts) → `src/utils/chartYears.ts` 로 파일명 변경
  - `computeNextArchiveYear` → `computeNextYear`
  - `computeInitialArchiveYears` → `computeInitialYears`
- [src/utils/loadingKeys.ts](../../src/utils/loadingKeys.ts):
  - `priceArchiveLoadingKey` → `priceYearLoadingKey`
  - `equityArchiveLoadingKey` → `equityYearLoadingKey`
  - 키 prefix: `chart_archive_` → `chart_year_`
- [src/types/rtdb.ts](../../src/types/rtdb.ts):
  - `PriceChartMeta.archive_years` → `years`
  - `EquityChartMeta.archive_years` → `years`
  - 주석 경로: `/archive/{YYYY}` → `/years/{YYYY}`
- [src/services/rtdb.ts](../../src/services/rtdb.ts):
  - `readPriceChartArchive` → `readPriceChartYear`
  - `readEquityChartArchive` → `readEquityChartYear`
  - 경로: `/archive/${year}` → `/years/${year}`
- [src/services/chart.ts](../../src/services/chart.ts) — 매개변수명 / 주석 정리
- [src/services/chartInject.ts](../../src/services/chartInject.ts) — `archiveMap` → `yearsMap`
- [src/store/useStore.ts](../../src/store/useStore.ts):
  - 캐시 필드 `archive` → `years` (PriceChartCache, EquityChartCache)
  - 액션명 `loadPriceArchive` → `loadPriceYear`, `loadEquityArchive` → `loadEquityYear`
  - 모든 `meta.archive_years` 참조 → `meta.years`
- [src/screens/ChartScreen.tsx](../../src/screens/ChartScreen.tsx) — 전체 archive 참조 → years
  - 헬퍼 변수 `PRICE_ARCHIVE_PREFIX` / `EQUITY_ARCHIVE_PREFIX` rename + prefix 값 변경
- [src/utils/chartHtml.ts](../../src/utils/chartHtml.ts) — 주석 안의 archive 표기 통일
- [src/utils/chartNormalize.ts](../../src/utils/chartNormalize.ts) — 주석 통일
- `docs/DESIGN_QBT_LIVE_FINAL.md` — archive 모든 표기 → years
- `docs/server_prompts/PROMPT_chart_archive_rename_to_years.md` — **신규** (서버 프롬프트 별도 문서)
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음

### 데이터/결과 영향

- RTDB 경로 변경 — 서버가 새 경로로 쓰고 앱이 새 경로로 읽어야 함. 개발 단계라 기존 데이터 폐기 가능 (안정화 기간 없음).
- 서버 변경이 먼저 배포되거나, RTDB 가 먼저 새 경로로 채워진 후 앱이 진입해야 차트 정상 표시.

## 6) 단계별 계획(Phases)

### Phase 1 — utils 함수 rename + 파일명 변경

**작업 내용**:

- [x] `src/utils/chartArchive.ts` 의 내용을 새 함수명으로 변경하면서 `src/utils/chartYears.ts` 로 파일 rename
  - `computeNextArchiveYear` → `computeNextYear`
  - `computeInitialArchiveYears` → `computeInitialYears`
- [x] `src/utils/loadingKeys.ts`:
  - `priceArchiveLoadingKey` → `priceYearLoadingKey` + prefix `chart_year_`
  - `equityArchiveLoadingKey` → `equityYearLoadingKey` + prefix `chart_year_equity_`

---

### Phase 2 — 타입 / 서비스 일괄 rename

**작업 내용**:

- [x] `src/types/rtdb.ts` — `archive_years` → `years`, 주석 경로 갱신
- [x] `src/services/rtdb.ts` — 함수명 + RTDB 경로 변경
- [x] `src/services/chart.ts` — 매개변수명 정리
- [x] `src/services/chartInject.ts` — `archiveMap` → `yearsMap`

---

### Phase 3 — Store / Screen 일괄 갱신

**작업 내용**:

- [x] `src/store/useStore.ts` — 캐시 필드 / 액션명 / meta 참조 모두 변경. import 경로 (chartArchive → chartYears) 갱신
- [x] `src/screens/ChartScreen.tsx` — 모든 archive 참조 → years. 헬퍼 변수 / prefix 값 변경. import 경로 갱신

---

### Phase 4 — chartHtml / chartNormalize 주석 통일

**작업 내용**:

- [x] `src/utils/chartHtml.ts` — 주석 안의 archive 일반명사 표기를 years 로 통일 (의미 일관성)
- [x] `src/utils/chartNormalize.ts` — 주석 통일

---

### Phase 5 — 문서 갱신

**작업 내용**:

- [x] `docs/DESIGN_QBT_LIVE_FINAL.md` 갱신:
  - 경로 표기 archive → years 일괄 rename
  - meta 필드 `archive_years` → `years`
  - §8.2.5.2 / §8.2.6.2 표제 갱신
- [x] `docs/server_prompts/PROMPT_chart_archive_rename_to_years.md` 신규 작성 (서버 작업자용 프롬프트)

---

### 마지막 Phase — 검증 및 정리

**작업 내용**

- [x] `npx prettier --write .` 실행
- [x] 사용자 실기 검증 (서버에서 새 경로로 데이터 채워진 후)
- [x] DoD 체크리스트 최종 업데이트

**Validation**:

- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] 사용자 실기 검증: 차트 화면 정상 표시 (price/equity, 4개 자산)

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. 차트 / RTDB archive → years 명명 변경 (의미 일치)
2. chart / archive 키를 years 로 rename 하여 데이터 모델 명명 정합성 확보
3. refactor: chart RTDB 경로 archive → years 일괄 rename
4. types,services,store,screens / archive → years 명명 통일
5. 차트 / archive 식별자를 years 로 rename + 서버 프롬프트 분리

## 7) 리스크(Risks)

- 서버 변경 전에 앱이 배포되면 새 경로(`/charts/*/years/{YYYY}`) 가 비어 차트 표시 안 됨. 배포 순서 명시 필요.
- 개발 단계라 RTDB 데이터 폐기 가능 — 서버 변경 후 backfill CLI 로 재생성하면 정상 진입.

## 8) 메모(Notes)

- 본 plan 은 직전 `PLAN_chart_recent_to_archive_only.md` 의 후속.
- 서버 프롬프트는 사용자 지시에 따라 plan 부록이 아닌 **별도 문서** (`docs/server_prompts/PROMPT_chart_archive_rename_to_years.md`) 에 작성.
- `archive_years` 메타 필드와 RTDB 경로의 중간 키 `archive` 둘 다 `years` 로 통일하여, 메타 필드명과 자식 노드명이 일치하도록 한다.

### 진행 로그 (KST)

- 2026-04-28 19:00: 계획서 작성. 서버 프롬프트는 별도 문서로 분리.
- 2026-04-28 19:30: Phase 1~5 + 마지막 Phase 일괄 진행. 파일 rename (chartArchive.ts → chartYears.ts) + 모든 archive 식별자/경로/필드를 years 로 일괄 변경. 별도 서버 프롬프트 `docs/server_prompts/PROMPT_chart_archive_rename_to_years.md` 작성. prettier / lint / tsc 모두 통과.
