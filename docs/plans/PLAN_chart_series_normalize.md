# Implementation Plan: 차트 시리즈 정규화 (RTDB null-only 배열 부재 방어)

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

**작성일**: 2026-04-24 19:40
**마지막 업데이트**: 2026-04-24 19:55
**관련 범위**: services (rtdb), utils (신규 chartNormalize)
**관련 문서**: CLAUDE.md §8.2 (RTDB 읽기 규칙), docs/DESIGN_QBT_LIVE_FINAL.md

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

- [x] 목표 1: Firebase RTDB 가 "모든 원소가 null 인 배열" 을 저장하지 않는 관습으로 인해 `ma_value` / `upper_band` / `lower_band` 필드가 통째로 부재한 archive payload 가 왔을 때 차트 병합 로직에서 `TypeError: Cannot read property 'length' of undefined` 가 발생하던 crash 를 제거
- [x] 목표 2: 서비스 계층(`src/services/rtdb.ts`) 에서 RTDB 읽기 직후 정규화하여 **"앱 내부에서는 PriceChartSeries 의 필수 필드가 항상 존재한다"** 는 단일 불변조건 확립
- [x] 목표 3: 내부 로직 (`chart.ts` 병합 / `ChartScreen.tsx` 접근 등) 은 현재 코드 그대로 유지 (optional chaining 확산 방지)

## 2) 비목표(Non-Goals)

- 서버(QBT 본체) 계약 변경 없음 (서버 SoT)
- 타입 정의 시그니처 변경 없음 — `PriceChartSeries` 의 `ma_value` / `upper_band` / `lower_band` 는 `(number | null)[]` 필수 상태 유지
- `EquityChartSeries` 는 `model_equity` / `actual_equity` 가 설계상 항상 값 보유이므로 이번 스코프 제외 (YAGNI)
- 마커(`buy_signals` / `sell_signals` / `user_buys` / `user_sells`) 정규화 없음 — 이미 optional 이고 호출부가 `?? []` 폴백
- 차트 UI / 로직 변경 없음 (crash 수정 전용)

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- 사용자가 축소 조작으로 차트를 `first_date: 2006-06-21` 근방까지 스크롤 → `archive/2006` 로드
- 2006 archive 는 약 130 거래일 → `ma_window: 200` 기준 **전 구간 MA 워밍업** → `ma_value` / `upper_band` / `lower_band` 전체 null
- Firebase RTDB 는 전부 null 인 배열을 저장하지 않음 (JS SDK 관습) → payload 에 해당 필드가 아예 부재
- [src/services/chart.ts:24-37](../../src/services/chart.ts#L24-L37) `priceLength` 가 `s.upper_band.length` 접근 → `TypeError`
- 이 결함은 이전부터 잠재되어 있었으며, 최근 선제 로드(PLAN_chart_ux_improvements) 로 먼 과거 archive 도달 빈도가 증가해 조기 노출됨

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md`
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 SoT, 변경 금지)
- 실행 명령어 SoT: `docs/COMMANDS.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [ ] SSO 차트를 `first_date` 근방(2006 archive) 까지 축소/스크롤해도 Render Error 미발생 — 사용자 실기 검증 대기
- [ ] QLD / GLD / TLT 동일 확인 — 사용자 실기 검증 대기
- [ ] 정규화 후 워밍업 구간(ma_value === null) 이 차트에서 기존과 동일하게 MA 선 생략 형태로 렌더됨 (이전 동작 회귀 없음) — 사용자 실기 검증 대기
- [x] `npm run lint` 통과 (0 errors, 기존 warnings 8개)
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행
- [ ] 사용자 실기 검증 완료
- [x] 필요한 문서 업데이트 (README.md 변경 없음 / `docs/COMMANDS.md` 변경 없음)
- [x] plan 체크박스 최신화

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/utils/chartNormalize.ts` (신규) — `RawPriceChartSeries` 타입 + `normalizePriceSeries` 순수 함수
- `src/services/rtdb.ts` — `readPriceChartRecent` / `readPriceChartArchive` 반환 경로에 정규화 적용. 함수 시그니처는 불변 (반환 타입 유지).
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음

### 데이터/결과 영향

- RTDB payload 스키마 변경 없음
- 내부 타입 시그니처 변경 없음
- 메모리: 1년치 archive 읽을 때마다 null 배열 3개 × ~250 원소 = 약 6 KB 추가 (일회성, 캐시에 저장된 후로는 영향 없음)
- CPU: 정규화는 O(n). 1년치 250 원소 기준 무시할 수준

## 6) 단계별 계획(Phases)

### Phase 0 — 인터페이스 / 위치 고정 (레드 허용)

> 코드 변경 없이 정규화 유틸의 위치, 시그니처, 타입 경계를 확정.

**작업 내용**:

- [x] 파일 위치: `src/utils/chartNormalize.ts`
  - 근거: [CLAUDE.md §10.1](../../CLAUDE.md) — `src/utils/` 는 순수 함수 전용. 본 유틸은 입력→출력 결정적. 서비스/컴포넌트 의존 없음.
- [x] 입력 타입 `RawPriceChartSeries` (이 유틸 내부 export):
  ```typescript
  export type RawPriceChartSeries = {
    dates?: string[];
    close?: number[];
    ma_value?: (number | null)[];
    upper_band?: (number | null)[];
    lower_band?: (number | null)[];
    buy_signals?: string[];
    sell_signals?: string[];
    user_buys?: string[];
    user_sells?: string[];
  };
  ```
  - 설계 근거: RTDB 원시 payload 는 `PriceChartSeries` 의 필수 필드도 관습상 부재 가능. 타입 레벨에서 이를 구분해 `normalizePriceSeries` 의 입력/출력 경계를 명확히 함.
- [x] 출력 타입 `PriceChartSeries` (기존, `src/types/rtdb.ts`) — 시그니처 불변
- [x] 정규화 규칙:
  - `dates ?? []` / `close ?? []` — 없을 경우 빈 배열
  - `ma_value / upper_band / lower_band` 부재 시 `new Array(dates.length).fill(null)` 로 생성
  - 마커 필드 (`buy_signals` 등) 는 optional 유지. 앱의 기존 `?? []` 폴백 그대로 활용. 이 유틸이 손대지 않음.
- [x] 적용 지점: `src/services/rtdb.ts` 의 2개 함수 (`readPriceChartRecent`, `readPriceChartArchive`) 반환 직전.
  - Equity 관련 함수는 본 스코프 제외. 필요 시 후속 plan.

---

### Phase 1 — 정규화 유틸 생성 + rtdb.ts 적용 (그린 유지)

**작업 내용**:

- [x] `src/utils/chartNormalize.ts` 신규 생성:
  - `RawPriceChartSeries` 타입 export
  - `normalizePriceSeries(s: RawPriceChartSeries): PriceChartSeries` 구현 (Phase 0 규칙 1:1 이식)
  - JSDoc: Firebase RTDB 의 "null-only 배열 부재" 관습과 본 유틸의 목적을 설명
- [x] `src/services/rtdb.ts`:
  - `readPriceChartRecent` / `readPriceChartArchive` 를 `async` 로 바꾸고 `readOnce<RawPriceChartSeries>` 로 원시 수신 → null 이면 null, 있으면 `normalizePriceSeries` 통과 후 반환
  - 반환 타입은 `Promise<PriceChartSeries | null>` 유지 → 호출부 무변경
- [x] 기타 호출부 불변: `useStore` / `ChartScreen` / `chart.ts` / `chartInject.ts` 손대지 않음

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] `README.md` / `docs/COMMANDS.md` 변경 없음 확인
- [x] `npx prettier --write .` 실행
- [ ] 변경 기능 및 전체 플로우 최종 검증 (사용자 실기 확인) — 대기
- [x] DoD 체크리스트 최종 업데이트 및 체크 완료 (실기 검증 항목 제외)
- [x] 전체 Phase 체크리스트 최종 업데이트 및 상태 확정

**Validation**:

- [x] `npm run lint` 통과 — 0 errors, 기존 warnings 8개 (이번 변경과 무관)
- [x] `npx tsc --noEmit` 통과 — 출력 없음
- [ ] 사용자 실기 검증:
  - SSO 차트 좌측 끝까지 축소/스크롤 → 2006 archive 로드 후 Render Error 미발생
  - QLD / GLD / TLT 동일 확인
  - MA / 밴드 라인이 워밍업 구간에서 자연스럽게 생략된 상태로 표시 (기존과 동일)
  - 크로스헤어 상단 헤더의 EMA / 상단 / 하단 값이 워밍업 구간에서 `--` 로 표시

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. rtdb / 차트 시리즈 정규화 (null-only 배열 부재 방어)
2. fix: 차트 archive 워밍업 구간 Render Error 수정
3. utils / chartNormalize 추가 및 rtdb 읽기 경로 정규화
4. 차트 / 2006 archive 같은 전 워밍업 구간 crash 수정
5. rtdb / 읽기 시점 정규화로 내부 불변조건 확립

## 7) 리스크(Risks)

- **리스크 1 — 정규화 누락 지점**: 향후 새 RTDB 읽기 함수 추가 시 정규화 적용을 빠뜨리면 재발 가능. 완화: [CLAUDE.md §8.2](../../CLAUDE.md) "모든 RTDB 읽기는 `src/services/rtdb.ts` 를 거친다" 규칙 + `rtdb.ts` 내부에 정규화 통과가 관례로 자리잡음 + 본 plan 의 JSDoc 이 규칙을 명시.
- **리스크 2 — 타입 경계 불일치**: `RawPriceChartSeries` 와 `PriceChartSeries` 의 선택/필수 차이로 tsc 오류 가능. 완화: normalize 출력에서 모든 필수 필드를 채우도록 보장. 실패하면 tsc 가 빨간불을 보임 → 즉시 수정.
- **리스크 3 — 마커 필드 처리 불일치**: 본 plan 은 마커 필드를 손대지 않음. 호출부가 `?? []` 로 폴백 중이라 문제 없지만, 만약 future 코드가 non-optional 로 가정하면 별도 crash. 완화: 타입이 이미 optional 이라 tsc 가 강제로 폴백을 요구.

## 8) 메모(Notes)

### 정규화 규칙 확정 (Phase 0 결과물)

입력: `RawPriceChartSeries` (모든 필드 optional)
출력: `PriceChartSeries` (기존 타입, 모든 필수 필드 채움)

| 필드           | 부재 시 처리                         |
| -------------- | ------------------------------------ |
| `dates`        | `[]`                                 |
| `close`        | `[]`                                 |
| `ma_value`     | `new Array(dates.length).fill(null)` |
| `upper_band`   | `new Array(dates.length).fill(null)` |
| `lower_band`   | `new Array(dates.length).fill(null)` |
| `buy_signals`  | 유지 (optional, 호출부 `?? []` 폴백) |
| `sell_signals` | 유지                                 |
| `user_buys`    | 유지                                 |
| `user_sells`   | 유지                                 |

### 왜 서비스 계층 단일 지점인가

- [CLAUDE.md §8.2](../../CLAUDE.md) "모든 RTDB 읽기는 `src/services/rtdb.ts` 를 거친다" → 이미 단일 경유점이 강제됨
- 한 곳에서 정규화하면 이후 모든 내부 로직이 "필수 필드 항상 존재" 불변조건을 신뢰 가능
- [CLAUDE.md §19.1 YAGNI](../../CLAUDE.md) / §19.2 간결성 부합

### 진행 로그 (KST)

- 2026-04-24 19:40: Draft 작성. 사용자 지시 "B안, 연속 진행" 에 따라 Phase 0/1/마지막 Phase 연속 수행 예정.
- 2026-04-24 19:55: Phase 0/1/마지막 Phase 연속 완료. 결과:
  - 신규: `src/utils/chartNormalize.ts` (`RawPriceChartSeries` 타입 + `normalizePriceSeries`)
  - 수정: `src/services/rtdb.ts` (`readPriceChartRecent` / `readPriceChartArchive` 에 정규화 통과 추가, 반환 타입 불변)
  - Validation: `npm run lint` 0 errors · `npx tsc --noEmit` 무오류 · `npx prettier --write .` 적용
  - 남은 항목: 사용자 실기 검증 (2006 archive 까지 스크롤 후 Render Error 미발생 / 워밍업 구간 렌더 정상).

---
