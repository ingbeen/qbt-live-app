# Implementation Plan: 차트 archive 갭 수정 (recent 첫 연도 커버)

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

**작성일**: 2026-04-24 16:30
**마지막 업데이트**: 2026-04-24 17:20
**관련 범위**: screens (ChartScreen), store (useStore)
**관련 문서**: CLAUDE.md, docs/DESIGN_QBT_LIVE_FINAL.md

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

- [x] 목표 1: 차트 진입 직후(초기 로드) `recent` 와 `archive/{recent 첫 연도}` 사이에 날짜 갭이 없도록 수정
- [x] 목표 2: 좌측 끝 스크롤로 이전 연도 archive 를 로드할 때 `recent` 첫 연도가 누락되지 않도록 `computeYearToLoad` 로직 정교화
- [x] 목표 3: price 차트와 equity 차트에 동일한 불변조건을 일관되게 적용 (회귀 방지)

## 2) 비목표(Non-Goals)

- 서버(QBT 본체) 의 RTDB 계약 변경 없음. `archive_years`, `recent`, `archive/{YYYY}` 구조는 그대로.
- 차트 WebView HTML / TradingView 차트 옵션 변경 없음.
- 마커(buy/sell/user_buys/user_sells) 처리 로직 변경 없음.
- 성능 튜닝(병렬화 재설계, 캐싱 구조 개편) 없음. 기존 `Promise.all` 패턴만 유지.
- `recent_months` / archive 보관 연수 등 서버 쪽 파라미터 논의 없음.

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- **증상**: SSO 차트에서 `2024-12-31` 다음 날짜가 `2025-11-23` 으로 점프 (2025-01 ~ 2025-11-22 구간 통째로 누락).
- **원인 1 — 초기 로드**: [src/store/useStore.ts](../../src/store/useStore.ts) `refreshChart` 는 `meta + recent` 만 로드. `recent` 가 "최근 N 개월" 만 담도록 설계됐으므로, `recent.dates[0]` 이 보통 해당 연도 1월 1일이 아님 → 그 연도 이전 구간을 채울 archive 가 초기에 하나도 없음.
- **원인 2 — 좌측 스크롤 로드**: [src/screens/ChartScreen.tsx:18-34](../../src/screens/ChartScreen.tsx#L18-L34) `computeYearToLoad` 는 `recentEarliestYear` 를 "이미 완전히 커버됨" 으로 가정하고 `earliestLoaded - 1` 을 반환. 따라서 `recent` 첫 연도의 archive 는 **영구히 요청되지 않음**.
- **데이터 확인**: Firebase Console `/charts/prices/sso/meta/archive_years` 에 2006~2026 모두 존재. 서버 쪽 누락이 아님 → 앱 버그 확정.
- **영향**: 차트 전 구간 시각화 불일치. EMA-200 / 밴드 / 마커가 갭 구간에서 끊겨 보임.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md`
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 SoT, 변경 금지)
- 실행 명령어 SoT: `docs/COMMANDS.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [ ] SSO 차트 진입 직후 2025 년 전체 구간이 끊김 없이 표시됨 (`recent` 와 `archive/2025` 자동 병합) — 사용자 실기 검증 대기
- [ ] QLD / GLD / TLT 차트도 동일 동작 확인 — 사용자 실기 검증 대기
- [ ] equity 차트 진입 직후 `recent` 이전 구간 갭 없음 — 사용자 실기 검증 대기
- [ ] 좌측 끝 스크롤 시 `recent` 첫 연도가 누락되지 않고 순차 과거 연도 로드됨 (SSO 로 과거 5년치 로드 테스트) — 사용자 실기 검증 대기
- [x] `npm run lint` 통과 (0 errors, 기존 warnings 8개 유지)
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행 (마지막 Phase 에서 자동 포맷 적용)
- [ ] 사용자 실기 검증 완료 (차트 탭 진입 / 좌측 스크롤 / 자산 전환 / equity 전환)
- [x] 필요한 문서 업데이트 (README.md 변경 없음 / `docs/COMMANDS.md` 변경 없음 — 실행 명령어 변경 없음)
- [x] plan 체크박스 최신화(Phase/DoD/Validation 모두 반영)

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/utils/chartArchive.ts` (신규) — `computeNextArchiveYear` 공통 헬퍼. price/equity 및 초기 로드/스크롤 로드 양쪽에서 동일 규칙으로 호출
- `src/store/useStore.ts` — `refreshChart` 에서 recent 로드 직후 `computeNextArchiveYear` 로 "첫 연도 archive 필요 여부" 판정하여 조건부 병렬 추가 로드 (price / equity 양쪽)
- `src/screens/ChartScreen.tsx` — 기존 `computeYearToLoad` 내부 로직을 `computeNextArchiveYear` 호출로 치환 (함수 시그니처 유지)
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음 (실행 명령어/CLI 옵션 변경 없음)

### 데이터/결과 영향

- RTDB payload 스키마 변경 없음 (읽기 전용 동작만 수정)
- UI 표시: 차트 초기 진입 시 표시 연도 범위가 넓어짐 (기존에는 `recent` 만 = 최근 N 개월, 수정 후에는 `recent` + `archive/{recent 첫 연도}` 병합)
- 상태 저장 구조 변경 없음 (`priceCharts[assetId].archive` Map / `equityChart.archive` Map 그대로 사용)
- 네트워크: 초기 진입 시 RTDB 호출 최대 1회 증가 (price 차트 1개, equity 차트 1개 각각). `recent` 첫 날짜가 `{YYYY}-01-01` 이면 추가 호출 스킵. 기존 `Promise.all` 로 병렬 호출하여 체감 지연 없음.

## 6) 단계별 계획(Phases)

### Phase 0 — 판정 규칙 고정 (레드 허용)

> 핵심 불변조건(어떤 경우에 `archive/{recent 첫 연도}` 가 필요한가) 을 먼저 명확히 고정한다. 이 Phase 에서는 코드 미변경. 규칙만 문서화 후 사용자 승인을 거친다.

**판정 규칙 초안**:

1. `recentFirstDate` = `recent.dates[0]` (빈 배열이면 판정 불가 → `null` 반환하여 호출부에서 사용자 에러 토스트)
2. `recentFirstYear` = `recentFirstDate.slice(0, 4)` 의 숫자 변환
3. `coversFullYear` = `recentFirstDate === "${recentFirstYear}-01-01"` — recent 가 해당 연도 1월 1일부터 시작하면 archive 불필요
4. `needsFirstYearArchive` = `!coversFullYear && !loadedYears.includes(recentFirstYear) && meta.archive_years.includes(recentFirstYear)`
5. 위 조건 만족 시 로드 대상 연도 = `recentFirstYear`. 그 외에는 기존대로 `Math.min(recentFirstYear, ...loadedYears) - 1` 이 `meta.archive_years` 에 포함될 때만 반환.

**작업 내용**:

- [x] 위 판정 규칙을 plan Notes 에 확정 기록 (구현 Phase 들은 이 규칙을 1:1 이식)
- [x] price 와 equity 가 동일 규칙을 공유하도록 설계 — **결정: `src/utils/chartArchive.ts::computeNextArchiveYear` 공통 헬퍼로 추출**. 시그니처는 Notes §Phase 0 결정 사항 참조.

---

### Phase 1 — 공통 헬퍼 생성 + 초기 로드에서 첫 연도 archive 자동 병합 (그린 유지)

**작업 내용**:

- [x] `src/utils/chartArchive.ts` 신규 생성 — `computeNextArchiveYear(firstDate, archiveYears, loadedYears)` 순수 함수 구현. Notes §Phase 0 규칙 1)~4) 1:1 이식.
- [x] `src/store/useStore.ts::refreshChart` — price 분기에서 `meta + recent` 로드 후 `computeNextArchiveYear` 호출. 반환값이 number 면 `readPriceChartArchive(assetId, year)` 를 2차 호출하여 `archive` Map 에 `{ [year]: archive }` 로 병합 set. meta/recent/첫 archive 를 single `set` 으로 묶어 중간 상태 노출 방지. 추가 archive 로드는 내부 try/catch 로 실패 격리.
- [x] 동일 로직을 equity 분기에도 적용 (`readEquityChartArchive(year)`).
- [x] 추가 archive 로드 실패 시: `recent` 는 세팅하되 `console.error` 로 기록 후 Map 에 넣지 않음 (좌측 스크롤이 나중에 재시도 가능). 최상위 `lastError` 는 recent/meta 로드 성공 시 `null` 유지하여 진입 UX 깨지지 않게 함.
- [x] 기존 `loadPriceArchive` / `loadEquityArchive` 시그니처 / 동작 불변 유지 (회귀 방지).

---

### Phase 2 — `computeYearToLoad` 를 공통 헬퍼 호출로 치환 (그린 유지)

**작업 내용**:

- [x] `src/screens/ChartScreen.tsx::computeYearToLoad` — 내부 로직을 `computeNextArchiveYear(firstDate, meta.archive_years, Object.keys(archiveMap).map(Number))` 호출로 치환.
- [x] 빈 `recent.dates` 분기는 기존처럼 `console.warn` + `null` 반환 유지 (호출부 `loadEarlierData` 가 `setLastError` 로 처리).
- [x] 함수 시그니처 변경 없음 (호출부 `loadEarlierData` 불변).
- [x] price / equity 공통 헬퍼이므로 한 번만 수정하면 양쪽에 적용됨.

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] README.md / `docs/COMMANDS.md` 변경 없음 확인 (명령어/구동 방식 무관)
- [x] `npx prettier --write .` 실행 (자동 포맷 적용)
- [ ] 변경 기능 및 전체 플로우 최종 검증 (사용자 실기 확인) — 대기
- [x] DoD 체크리스트 최종 업데이트 및 체크 완료 (실기 검증 항목 제외)
- [x] 전체 Phase 체크리스트 최종 업데이트 및 상태 확정

**Validation**:

- [x] `npm run lint` 통과 — 0 errors, 기존 warnings 8개 (이번 변경과 무관)
- [x] `npx tsc --noEmit` 통과 — 출력 없음
- [ ] 사용자 실기 검증:
  - [ ] 차트 탭 진입 → SSO 차트 전 구간(2006~현재) 에 갭이 없는지 확인 (특히 2024-12-31 ↔ 2025-11-23 경계)
  - [ ] QLD / GLD / TLT 자산 전환 후 동일 확인
  - [ ] equity 차트 전환 후 전 구간 확인
  - [ ] 차트 좌측 끝까지 스크롤하여 이전 연도 archive 가 누락 없이 순차 로드되는지 확인 (`first_date: 2006-06-21` 까지 스크롤 가능)

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. 차트 / recent 첫 연도 archive 자동 병합 및 `computeYearToLoad` 정교화
2. fix: 차트 recent 와 archive 경계 갭 수정 (첫 연도 누락 방지)
3. 차트 / 초기 로드 시 recent 첫 연도 archive 함께 로드 + 스크롤 로더 보강
4. store / refreshChart 와 computeYearToLoad 의 1/1 가정 제거
5. 차트 / 2025 구간 누락 수정 (price/equity 공통 규칙 적용)

## 7) 리스크(Risks)

- **리스크 1 — 초기 로드 지연 증가**: 추가 RTDB 호출 1회 (price/equity 각각). 완화책: `Promise.all` 로 병렬화하여 지연은 가장 느린 1회의 응답 시간으로 수렴. 1년치 price archive ≈ 30~60 KB 수준이므로 체감 영향 미미.
- **리스크 2 — 서버가 `archive_years` 에 recent 첫 연도를 누락한 경우**: `meta.archive_years.includes(recentFirstYear)` 가드로 해당 상황을 안전하게 스킵. 기존 동작(갭 허용)과 동일하게 폴백 → 신규 회귀 없음.
- **리스크 3 — `recent.dates[0]` 이 `{YYYY}-01-01` 정확히 일치하는 연초 에지 케이스**: `coversFullYear === true` 로 판정되어 추가 로드 스킵. 정상 동작.
- **리스크 4 — 좌측 스크롤 로드 로직 변경으로 기존 사용 플로우 회귀**: Phase 2 는 조건 추가형이라 `recentFirstYear` 가 이미 `loadedYears` 에 들어간 상태(= Phase 1 이 초기에 로드한 후)의 후속 호출은 기존 `earliestLoaded - 1` 경로를 타므로 동작 불변.

## 8) 메모(Notes)

### 판정 규칙 확정 (Phase 0 결과물)

- `recentFirstDate = recent.dates[0]`
- `recentFirstYear = parseInt(recentFirstDate.slice(0, 4), 10)`
- `coversFullYear = recentFirstDate === '${recentFirstYear}-01-01'`
- `needsFirstYearArchive = !coversFullYear && !loadedYears.includes(recentFirstYear) && meta.archive_years.includes(recentFirstYear)`

### 외부 근거

- Firebase Console `/charts/prices/sso/meta/archive_years` = [2006..2026] (사용자 확인 2026-04-24): 서버는 2025/2026 archive 를 모두 보유. 버그 범위는 앱 전용.
- `docs/DESIGN_QBT_LIVE_FINAL.md` §8.2 (서버↔앱 RTDB 데이터 계약): `recent` 는 "최근 N 개월", `archive/{YYYY}` 는 연도별 저장. `archive_years` 는 보유 연도 목록. `first_date` / `last_date` 는 전체 범위.

### Phase 0 결정 사항 (2026-04-24 16:45)

- **공통 헬퍼 위치**: `src/utils/chartArchive.ts` (신규). `utils` 는 순수 함수 전용이므로 CLAUDE.md §10.1 / §19.3 에 부합.
- **함수 시그니처**:
  ```typescript
  export const computeNextArchiveYear = (
    firstDate: string | undefined,
    archiveYears: number[],
    loadedYears: number[],
  ): number | null;
  ```
- **로직 요약** (4 규칙):
  1. `firstDate` 가 falsy → `null` (호출부에서 `console.warn` + 사용자 에러 토스트)
  2. `recentFirstYear ∉ loadedYears` 이고 `firstDate !== '${recentFirstYear}-01-01'` 이고 `archiveYears.includes(recentFirstYear)` → `recentFirstYear`
  3. 그 외 `candidate = Math.min(recentFirstYear, ...loadedYears) - 1` 이 `archiveYears` 에 포함되면 → `candidate`
  4. 어느 조건도 해당 안 되면 → `null`
- **Phase 1 호출부**: `refreshChart` 에서 `loadedYears = []` 로 호출. 규칙 2) 또는 1)/null.
- **Phase 2 호출부**: `ChartScreen.computeYearToLoad` 에서 현재 `Object.keys(archiveMap).map(Number)` 를 `loadedYears` 로 전달. 규칙 2) 또는 3) 또는 null.

### 진행 로그 (KST)

- 2026-04-24 16:30: Draft 작성. 사용자에게 Phase 0/1/2/마지막 Phase 구성 승인 요청.
- 2026-04-24 16:45: Phase 0 완료 — 판정 규칙 확정 + 공통 헬퍼 `computeNextArchiveYear` 를 `src/utils/chartArchive.ts` 로 추출하는 설계 결정. 상태 In Progress 전환. Phase 1 진행 전 사용자 커밋 대기.
- 2026-04-24 17:20: 사용자 지시 "마지막 Phase 까지 승인/커밋 없이 전부 진행" 에 따라 Phase 1/2/마지막 Phase 를 연속 수행. `src/utils/chartArchive.ts` 신규 생성, `src/store/useStore.ts::refreshChart` 에 초기 archive 병합 로직 추가 (price/equity 양쪽), `src/screens/ChartScreen.tsx::computeYearToLoad` 내부를 공통 헬퍼 호출로 치환. `npm run lint` 0 errors, `npx tsc --noEmit` 무오류, `npx prettier --write .` 적용 완료. 남은 항목: 사용자 실기 검증.

---
