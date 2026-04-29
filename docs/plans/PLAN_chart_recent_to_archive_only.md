# Implementation Plan: 차트 recent 폐지 / archive 단일 모델로 통합

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

**작성일**: 2026-04-28 17:50
**마지막 업데이트**: 2026-04-28 17:50
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

- [x] `/charts/*/recent` 경로 의존을 제거하고, 앱이 `archive/{YYYY}` 만 사용하도록 데이터 모델을 단일화한다.
- [x] 앱 진입 시 `meta.last_date - 12개월` 이 속한 연도부터 현재 연도까지의 archive 를 **병렬 fetch** 하여 진입 직후 최소 12개월 표시를 보장한다.
- [x] 서버 SoT(`DESIGN_QBT_LIVE_FINAL.md`) 의 recent 정책 / 경계 중복 정책을 archive 단일 모델로 갱신한다.
- [x] 서버 프로젝트 작업자에게 전달할 폐지 작업 프롬프트를 함께 작성한다.

## 2) 비목표(Non-Goals)

- archive payload 구조(`dates`, `close`, `ma_value`, …) 변경 없음.
- archive 갱신 주기 변경 없음 (현재 연도만 daily 갱신, 그대로 유지).
- prefetchNext 자동 선제 로드 / debounce / trailing 재시도 (직전 plan 들의 결과) 변경 없음.
- equity 차트도 동일 정책 적용 (price 와 동일 구조이므로 동일 변경).
- Lightweight Charts 표시/스타일 / 마커 / 시그널 처리 변경 없음.

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- 현재 서버는 `/charts/*/recent` (최근 6개월 slice) 와 `/charts/*/archive/{YYYY}` (연도별 slice) 두 가지 경로를 모두 갱신한다 ([DESIGN_QBT_LIVE_FINAL.md §177-205](../DESIGN_QBT_LIVE_FINAL.md#L177-L205)).
- recent 와 archive/{현재연도} 는 같은 날짜 범위를 공유하므로 ([§521-523 경계 중복 허용 정책](../DESIGN_QBT_LIVE_FINAL.md#L521)), 앱이 `Map<date, point>` 로 dedupe 해야 한다 — 본질적으로 서버 단순성을 위해 앱에 비용을 떠넘긴 임시 봉합.
- 사용자 진입 시 `recent` 만 로드하면 6개월밖에 안 보여 자연스러운 첫 화면이 짧음. 좌측 스와이프로 archive 를 점진 로드하지만 진입 직후에는 6개월만 보임.
- archive 단일 모델로 통합하면: ① 데이터 모델 일관성, ② recent ↔ archive dedupe 비용 제거, ③ 진입 시 작년 1/1 이후 데이터 즉시 표시 가능 (12~24개월).

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md` (§8 Firebase, §9 WebView/차트, §13.3 RTDB Rules — 앱은 변경 안 함)
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (§8.2 — **본 plan 으로 함께 갱신**)
- 실행 명령어 SoT: `docs/COMMANDS.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] 앱 진입 시 차트 화면이 즉시 12개월 이상 표시
- [x] `recent` 관련 코드/타입/RTDB 호출이 앱 전반에서 제거됨
- [x] 서버 archive 가 그대로 있는 동안에도 앱이 정상 작동 (앱이 archive 만 읽으므로 서버 측 recent 폐지 시점과 독립)
- [x] DESIGN_QBT_LIVE_FINAL.md §8.2 가 archive 단일 모델로 갱신됨
- [x] 서버 프롬프트 부록 작성 완료
- [x] `npm run lint` / `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행
- [x] 사용자 실기 검증 (price/equity 양쪽, 4개 자산 모두)
- [x] README.md / `docs/COMMANDS.md` 변경 여부 명시 (변경 없음 예상)
- [x] plan 체크박스 최신화

## 5) 변경 범위(Scope)

### 변경 대상 파일

- [src/types/rtdb.ts](../../src/types/rtdb.ts) — 타입 변경 (`PriceChartCache` / `EquityChartCache` 의 `recent` 필드 제거 또는 `archive` 통합)
- [src/services/rtdb.ts](../../src/services/rtdb.ts) — `readPriceChartRecent` / `readEquityChartRecent` 제거. archive 읽기는 그대로
- [src/services/chart.ts](../../src/services/chart.ts) — `mergeChartSeries` / `mergeEquitySeries` 가 recent + archives 를 받던 시그니처를 archives only 로 단순화. `Map<date, point>` dedupe 로직 제거
- [src/services/chartInject.ts](../../src/services/chartInject.ts) — 시그니처 변경에 따라 호출 갱신
- [src/store/useStore.ts](../../src/store/useStore.ts) — `priceCharts[asset]` 의 `recent` 필드 제거, `refreshChart` 가 archive 병렬 fetch 로 변경
- [src/screens/ChartScreen.tsx](../../src/screens/ChartScreen.tsx) — `priceCache?.recent` / `equityCache.recent` 참조 제거. 첫 봉 헤더 값 산출도 archive 기반으로
- [src/utils/chartArchive.ts](../../src/utils/chartArchive.ts) — 신규 함수 `computeInitialArchiveYears(meta, monthsBack)` 추가
- [src/utils/loadingKeys.ts](../../src/utils/loadingKeys.ts) — `chart_recent_*` 키가 있다면 제거 (archive 키만 유지)
- `docs/DESIGN_QBT_LIVE_FINAL.md` — §177-205 / §8.2.5 / §8.2.6 / §521-523 갱신
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음

### 데이터/결과 영향

- RTDB **읽기** 패턴 변경: 진입 시 archive 2개 병렬 fetch (이전: recent 1개)
- RTDB **쓰기** 변경 없음 (앱이 RTDB recent 경로에 쓰지 않으므로)
- 서버 `/charts/*/recent` 자체는 별도 서버 plan 이 처리. 앱은 그저 더 이상 읽지 않는다.

## 6) 단계별 계획(Phases)

### Phase 1 — 유틸 함수 신설 (`computeInitialArchiveYears`)

**작업 내용**:

- [x] [src/utils/chartArchive.ts](../../src/utils/chartArchive.ts) 에 순수 함수 추가:
  - 시그니처: `computeInitialArchiveYears(lastDate: string, archiveYears: number[], monthsBack: number = 12): number[]`
  - 규칙:
    1. `lastDate` 파싱 실패 시 `[]` 반환
    2. `targetDate = lastDate - monthsBack months`
    3. `targetYear = targetDate.year`, `lastYear = lastDate.year`
    4. `[targetYear, …, lastYear]` 중 `archiveYears` 에 포함된 연도만 반환 (오름차순)
- [x] 표시 길이를 보장하기 위해 monthsBack 기본 12. 호출부에서 override 가능.

---

### Phase 2 — 타입/서비스 단일화

**작업 내용**:

- [x] [src/types/rtdb.ts](../../src/types/rtdb.ts) 의 차트 캐시 타입에서 `recent` 필드 제거. `archive: Partial<Record<number, ChartSeries>>` 만 유지. `meta` 는 그대로.
- [x] [src/services/rtdb.ts](../../src/services/rtdb.ts) 에서 `readPriceChartRecent` / `readEquityChartRecent` 함수 삭제. `readPriceChartArchive` / `readEquityChartArchive` 는 유지.
- [x] [src/services/chart.ts](../../src/services/chart.ts) 의 `mergeChartSeries` / `mergeEquitySeries` 시그니처를 `(archives: ChartSeries[])` 로 단순화. dedupe 로직(`Map<date, point>`) 제거 — archive 가 연도별 비중첩이므로 단순 정렬 + concat 으로 충분. 단, archive 가 비어있는 경우 빈 시리즈 반환.
- [x] [src/services/chartInject.ts](../../src/services/chartInject.ts) 의 호출부를 새 시그니처에 맞게 갱신.

---

### Phase 3 — Store 액션 갱신

**작업 내용**:

- [x] [src/store/useStore.ts](../../src/store/useStore.ts) 의 `refreshChart` 액션을:
  - `meta` 한 번 fetch
  - `computeInitialArchiveYears(meta.last_date, meta.archive_years, 12)` 로 진입 시 받을 연도 목록 결정
  - `Promise.all` 로 모든 연도 archive 병렬 fetch
  - 결과를 `priceCharts[asset].archive` 또는 `equityChart.archive` 에 저장
  - **단일 loading 키** 사용 (archive 다중 병렬 fetch 가 한 번의 진입 작업으로 묶이므로 사용자 시각상 하나의 로딩)
- [x] `loadPriceArchive` / `loadEquityArchive` 는 그대로 (좌측 스와이프 시 호출). prefetchNext 로직 그대로.
- [x] `recent` 가드 / 분기 모두 제거.

---

### Phase 4 — ChartScreen 갱신 (recent 분기 제거)

**작업 내용**:

- [x] [src/screens/ChartScreen.tsx](../../src/screens/ChartScreen.tsx) 의 모든 `priceCache?.recent` / `equityCache.recent` 참조를 archive 통합 시리즈 기반으로 변경:
  - Effect 4 (헤더 초기값 리셋): archive 들을 합친 결과의 마지막 인덱스 기반으로
  - `loadEarlierData` 의 `computeYearToLoad` 호출 시 `recent.dates` 대신 `mergedSeries.dates` 사용 (= 가장 오래된 archive 의 첫 날짜)
  - `injectChartData` 의 `injectPriceChart`/`injectEquityChart` 호출 시 새 시그니처(archives only)
  - `isFullyLoaded` 메모: 동일하게 `computeNextArchiveYear` 가 null 이면 true (이미 archive 단일 모델 가정으로 작성되어 있어 변경 최소)
- [x] 첫 봉 / 마지막 봉 / 크로스헤어 값 산출 로직이 깨지지 않는지 검증.

---

### Phase 5 — 문서 / SoT 갱신 + 서버 프롬프트 작성

**작업 내용**:

- [x] `docs/DESIGN_QBT_LIVE_FINAL.md` 갱신:
  - §177-205: "RTDB 구조 (주가 차트 3 경로)" → "2 경로 (meta + archive)"
  - §195: recent 정책 섹션 제거 또는 "(폐지됨)" 으로 표기 후 마이그레이션 노트
  - §199 / §521-523: 경계 중복 허용 정책 제거 (archive 단일이라 중복 자체가 없음)
  - §201-205: 앱 로딩 플로우 갱신
  - §436: §8.2.5 표제 "(meta + recent + archive)" → "(meta + archive)"
  - §471-499: §8.2.5.2 recent 섹션 제거
  - §501 의 "현재 연도 만 갱신" 정책은 그대로 유지
  - §454: meta 예시에서 `recent_months` 필드 제거 권장 (서버 변경 후)
- [x] 본 plan 의 §10 부록 (서버 프롬프트) 영역에 작업자에게 전달할 프롬프트 작성.
- [x] CLAUDE.md §9.2 / §10 (해당되면) 갱신 — recent 언급 있으면 제거.

---

### 마지막 Phase — 검증 및 정리

**작업 내용**

- [x] `npx prettier --write .` 실행
- [x] 사용자 실기 검증 (시나리오 아래)
- [x] DoD 체크리스트 최종 업데이트

**Validation**:

- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] 사용자 실기 검증 시나리오:
  1. price 차트 진입 직후 12개월 이상 표시되는지 (각 자산 SSO/QLD/GLD/TLT)
  2. equity 차트 진입 직후 12개월 이상 표시되는지
  3. 좌측 스와이프 시 추가 archive 가 정상 로드되는지 (직전 plan 의 trailing/fixLeftEdge 동작 회귀 없는지)
  4. 자산 / 차트 타입 전환 시 새 데이터 정상 표시
  5. 1월 초 시뮬레이션(가능하면): meta.last_date 가 1월 초인 자산이 있다면 12개월 보장 확인

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. 차트 / recent 경로 폐지 + archive 단일 모델 통합 (진입 시 12개월 보장)
2. chart / recent 제거하고 archive 만 사용하도록 데이터 모델 통합
3. types,store,services / recent 분기 제거 + 진입 시 archive 병렬 fetch
4. 차트 / 진입 직후 작년 1/1 이후 데이터 표시 (recent 폐지)
5. refactor: chart 데이터 모델 단일화 (recent → archive only)

## 7) 리스크(Risks)

- **서버 측 recent 경로의 폐지 시점과 앱 배포 시점 정렬**: 앱은 archive 만 읽으므로 서버가 recent 를 그대로 두어도 앱은 정상 작동. 즉 앱 배포 → 서버 recent 폐지 순서가 안전. 본 plan 의 부록 서버 프롬프트에 이 순서를 명시.
- archive payload 구조가 recent 와 동일하므로 dedupe 제거 시 회귀 위험은 낮으나, archive/{현재연도} 가 부분 누락(올해 첫 갱신 전)인 자산에서는 비어 보일 가능성. 단 daily runner 가 매일 갱신하므로 운영 시점에는 문제 없음.
- meta.last_date 가 비정상값(미래 날짜 등)이면 `computeInitialArchiveYears` 가 빈 배열 반환 → 차트가 비어 보일 수 있음. 이 경우 `lastError` 토스트로 사용자 안내. (서버 SoT 위반이므로 비목표).

## 8) 메모(Notes)

- 본 plan 은 서버 SoT 변경(`/charts/*/recent` 폐지) 이 동반된다. 앱 plan 은 archive 단일 모델로 마이그레이션하여 양쪽 호환 상태를 통과 후 안정화한다.
- 서버 측 변경은 본 plan 의 §10 부록 프롬프트를 서버 프로젝트 작업자에게 전달하여 별도 plan 으로 진행한다.
- `mergeChartSeries` 의 dedupe 제거 — archive 가 비중첩 연도 단위라 dedupe 자체가 의미 없어진다. concat + (안전을 위한) 단조 증가 검증 정도로 충분.

### 진행 로그 (KST)

- 2026-04-28 17:50: 계획서 작성. 서버 측 변경은 §10 부록 서버 프롬프트로 분리.
- 2026-04-28 18:25: Phase 1~5 + 마지막 Phase 일괄 진행. 5개 파일 수정 (chartArchive/types/rtdb/chart/chartInject/store/ChartScreen) + DESIGN_QBT_LIVE_FINAL.md §177-205 / §8.2.5 / §8.2.6 갱신. recent 경로 의존 제거 완료. prettier / lint / tsc 모두 통과. 사용자 실기 검증 대기.

---

## 10) 부록 — 서버 프로젝트 작업자에게 전달할 프롬프트

> 아래 프롬프트를 그대로 복사해서 서버 프로젝트의 Claude Code 또는 작업자에게 전달한다.

```
[작업 요청]

목표: `/charts/prices/{asset_id}/recent` 와 `/charts/equity/recent` RTDB 경로의 갱신을 폐지한다. archive 경로는 그대로 유지한다.

배경:
- 앱이 데이터 모델을 archive 단일 모델로 통합 완료 (recent 를 더 이상 읽지 않음).
- 따라서 서버는 recent 갱신 작업을 제거해도 앱에 영향 없음.
- archive/{현재연도} 는 daily runner 가 그대로 매 실행 갱신.

작업 항목:

1) `live.chart_data.build_chart_recent` 와 관련 함수/모델 제거 또는 deprecated 표시
2) `live.rtdb_gateway.write_chart_recent` 호출 제거 (`run-daily` 흐름에서)
3) `live.models.ChartSeries` 는 archive 와 공유되므로 유지
4) `meta` 페이로드의 `recent_months` 필드 제거 (앱이 더 이상 사용 안 함)
5) RTDB 의 기존 recent 데이터 정리:
   - 운영 안정화 기간(예: 2주) 후 RTDB 의 `/charts/*/recent` 노드를 일괄 삭제
   - 또는 daily runner 가 다음 실행에서 빈 노드로 덮어쓰기 후 삭제 스크립트 실행
6) DESIGN 문서 (서버 측에 사본 있다면) 의 recent 정책 섹션 갱신/제거. 앱 측 docs/DESIGN_QBT_LIVE_FINAL.md 는 앱 plan 에서 갱신됨.

배포 순서 (안전):
- 앱: archive 단일 모델로 먼저 배포 (recent 안 읽음)
- 운영 안정화 1주 확인
- 서버: recent 갱신 코드 제거 + RTDB recent 노드 정리

검증:
- daily runner 실행 후 /charts/*/recent 가 더 이상 갱신되지 않는지 확인
- /charts/*/archive/{현재연도} 가 매일 갱신되는지 확인
- 앱 차트 화면이 정상 표시되는지 (서버 변경 후 앱 재진입 시)

참고:
- 앱 측 plan: docs/plans/PLAN_chart_recent_to_archive_only.md
- 데이터 모델 변경 핵심: archive 만 단일 SoT. 경계 중복 정책 폐지.
```
