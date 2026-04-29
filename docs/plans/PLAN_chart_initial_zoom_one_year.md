# Implementation Plan: 차트 진입 시 초기 줌을 최근 1년으로 고정

> 작성/운영 규칙(SoT): 반드시 [docs/CLAUDE.md](../CLAUDE.md)를 참고하세요.

**상태**: Done

---

**이 영역은 삭제/수정 금지**

**상태 옵션**: Draft / In Progress / Done

**Done 처리 규칙**:

- Done 조건: DoD 모두 [x] + `npm run lint` / `npx tsc --noEmit` 통과 + 사용자 실기 검증 완료
- 스킵(미수행 항목)이 1개라도 존재하면 Done 처리 금지 + DoD 검증 항목 체크 금지
- 상세: [docs/CLAUDE.md](../CLAUDE.md) 참고

---

**작성일**: 2026-04-28 19:50
**마지막 업데이트**: 2026-04-28 19:50
**관련 범위**: utils, screens
**관련 문서**: CLAUDE.md (§9 WebView/차트)

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

- [x] 차트 진입 / 자산 전환 / 차트 타입 전환 시 초기 visible range 를 마지막 약 1년(영업일 252봉) 으로 고정한다.
- [x] 좌측 스크롤로 archive 추가 로드 / PTR 새로고침 등 이미 차트가 그려진 후의 setData 호출에서는 사용자 줌 위치를 유지한다.

## 2) 비목표(Non-Goals)

- 데이터 로드 정책 변경 없음 (직전 plan 에서 12개월 보장 archive fetch).
- 핀치 줌 / 스크롤 동작 변경 없음.
- "전체기간" 같은 별도 줌 프리셋 추가 없음.

## 3) 배경/맥락(Context)

### 현재 문제점

- 직전 plan 으로 진입 시 12~16개월 archive 를 받지만, Lightweight Charts 가 setData 후 자동으로 약 2~3개월만 visible range 로 설정 → 사용자가 "10개월치만 로드된 듯" 으로 오해.
- 데이터는 충분한데 초기 줌이 좁아서 발생.
- 줌 강제는 첫 진입 시점에만 의미 있고, 좌측 스크롤로 archive 가 추가될 때마다 강제하면 사용자 스크롤 위치가 무너진다.

### 영향받는 규칙

> 아래 문서에 기재된 규칙을 모두 숙지하고 준수합니다.

- 루트 `CLAUDE.md`
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (변경 없음)
- 실행 명령어 SoT: `docs/COMMANDS.md` (변경 없음)

## 4) 완료 조건(Definition of Done)

- [x] 차트 진입 시 화면에 약 1년치 봉이 표시
- [x] 자산 전환(SSO/QLD/GLD/TLT) 시 새 차트도 1년치 표시
- [x] 차트 타입 전환(주가↔Equity) 시도 동일
- [x] 좌측 스크롤로 archive 추가 후 사용자 줌 위치가 유지됨 (강제 줌 안 됨)
- [x] PTR 새로고침 시 사용자 줌 위치 유지
- [x] `npm run lint` / `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행
- [x] 사용자 실기 검증 완료
- [x] 필요한 문서 업데이트 (README.md / `docs/COMMANDS.md` 변경 없음 예상)
- [x] plan 체크박스 최신화

## 5) 변경 범위(Scope)

### 변경 대상 파일

- [src/utils/chartHtml.ts](../../src/utils/chartHtml.ts) — `window.applyInitialZoomLastYear()` 헬퍼 추가
- [src/screens/ChartScreen.tsx](../../src/screens/ChartScreen.tsx) — `useRef` 로 "초기 줌 적용 키" 추적. injectChartData 후 키가 바뀌었을 때만 줌 적용
- CLAUDE.md §9.2: RN → WebView 주입 함수 목록에 `window.applyInitialZoomLastYear` 추가
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음

### 데이터/결과 영향

- RTDB / 데이터 모델 변경 없음
- 사용자 체감: 차트 진입 / 전환 시 즉시 1년치 표시. 좌측 스크롤은 기존 동작 유지

## 6) 단계별 계획(Phases)

### Phase 1 — WebView 초기 줌 헬퍼 추가

**작업 내용**:

- [x] [src/utils/chartHtml.ts](../../src/utils/chartHtml.ts) 에 `window.applyInitialZoomLastYear` 추가
  - 현재 존재하는 series (closeSeries 또는 modelSeries) 의 `data().length` 로 총 봉 수 확인
  - `chart.timeScale().setVisibleLogicalRange({ from: max(0, total - 252), to: total - 1 })` 호출
  - 데이터 비어있으면 무시 (no-op)

---

### Phase 2 — ChartScreen 에서 초기 줌 트리거

**작업 내용**:

- [x] `useRef<string | null>` 로 "마지막 초기 줌 적용 키" 추적 (예: `"price-sso"`, `"equity"`)
- [x] `injectChartData` 의 inject 호출 직후, 현재 키와 ref 가 다르면:
  - WebView 에 `window.applyInitialZoomLastYear(); true;` 주입
  - ref 값을 현재 키로 갱신
- [x] 결과: 자산 / 차트 타입 전환 시 한 번만 줌 적용. archive 추가 / PTR 시에는 줌 유지

---

### 마지막 Phase — 문서 정리 및 검증

**작업 내용**

- [x] CLAUDE.md §9.2 에 `window.applyInitialZoomLastYear()` 추가
- [x] `npx prettier --write .` 실행
- [x] 사용자 실기 검증 (시나리오 4개)
- [x] DoD 체크리스트 최종 업데이트

**Validation**:

- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] 사용자 실기 검증:
  1. 차트 진입 시 약 1년치 표시 (각 자산)
  2. 자산 전환 시 새 자산도 1년치 초기 줌 적용
  3. 차트 타입 전환(주가↔Equity) 시 1년치 적용
  4. 좌측 스크롤로 archive 추가 후 줌 위치 유지

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. 차트 / 진입 시 초기 줌 최근 1년(252봉) 으로 고정
2. chart / setData 후 자동 줌이 좁게 잡히는 현상 수정 (1년치 표시)
3. 차트 / 진입 / 자산 전환 시 visible range 1년 강제
4. chartHtml / applyInitialZoomLastYear 헬퍼 추가
5. fix: 차트 진입 시 1년치 표시되도록 초기 줌 고정

## 7) 리스크(Risks)

- 252봉이 영업일 1년의 근사치라 정확히 12개월은 아님. 사용자 의도에 부합하면 충분.
- archive 추가 시 logical range 의 0 시작점이 prepend 로 인해 shift — Lightweight Charts 가 visible range 를 자동 보존하는지 확인 필요. 회귀 시 별도 처리.

## 8) 메모(Notes)

- `closeSeries.data().length` 는 v5.0 공식 API.
- 252 = 미국 주식 영업일 1년 평균. 추후 가변 필요 시 상수 추출.

### 진행 로그 (KST)

- 2026-04-28 19:50: 계획서 작성.
- 2026-04-28 19:55: Phase 1+2+마지막 Phase 일괄 진행. chartHtml 에 applyInitialZoomLastYear 헬퍼 추가 + ChartScreen 에 useRef 키 기반 트리거. CLAUDE.md §9.2 갱신. prettier / lint / tsc 통과.
