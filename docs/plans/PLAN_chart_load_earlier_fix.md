# Implementation Plan: 차트 좌측 스와이프 archive 로딩 누락 수정

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

**작성일**: 2026-04-28 16:35
**마지막 업데이트**: 2026-04-28 16:35
**관련 범위**: utils, components, screens, store
**관련 문서**: CLAUDE.md (§9.2 WebView 메시지 프로토콜, §11.3 로깅)

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

- [x] 차트를 좌측으로 빠르게 스와이프해도 추가 archive 가 누락되지 않고 따라오도록 수정한다.
- [x] 사용자가 스와이프를 멈춘 후 손을 떼더라도, 마지막으로 차단된 요청이 자동 재발사되어 화면이 자연스럽게 채워지게 한다.
- [x] 진단 로그(`[DEBUG-TEMP]`)로 수정 후 동작을 재검증한 뒤 제거한다.

## 2) 비목표(Non-Goals)

- RTDB 호출/응답 로직 변경 없음 (현재 응답 100~150ms 로 충분히 빠름).
- `computeNextArchiveYear` 의 연도 결정 규칙 변경 없음.
- prefetchNext 자동 선제 로드 로직 변경 없음.
- archive 데이터 prepend 후 차트 setData 호출부(chartInject) 변경 없음.
- `subscribeVisibleLogicalRangeChange` 의 threshold(30) 변경 없음 — 트리거 조건은 그대로.

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- 사용자가 차트를 빠르게 좌측으로 스와이프하면 추가 archive 가 안 들어와 화면 좌측이 비어있는 상태로 멈춘다 (재현 스크린샷: 2015-02-09 근처에서 차트 한 줄만 표시).
- 진단 로그 분석 결과, [src/utils/chartHtml.ts](../../src/utils/chartHtml.ts) 의 `subscribeVisibleLogicalRangeChange` 콜백 안에 다음 두 가지 문제가 있다:
  1. **debounce 1500ms 가 RTDB 응답(약 150ms)에 비해 과도하게 김** — 빠른 연속 스와이프 시 첫 호출 외 대부분 무음 차단
  2. **trailing 재시도 부재** — debounce 차단 중 사용자가 손을 떼면 콜백이 더 이상 호출되지 않아, 1500ms 만료 후에도 자동 재발사 트리거가 없음 → 마지막 차단된 요청이 영구 누락
- 정상 흐름(yearToLoad 계산, RTDB 호출, archive 저장, prefetchNext) 은 모두 정상 작동 확인됨. 병목은 WebView 측 디바운싱에만 있음.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md` (§9 WebView/차트, §11.3 로깅, §19 개발 원칙)
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 SoT, 변경 금지)
- 실행 명령어 SoT: `docs/COMMANDS.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] 빠른 좌측 스와이프 후 화면이 정상적으로 prepend 되어 채워진다 (사용자 실기 확인)
- [x] 사용자가 스와이프를 멈춘 후 손을 떼도 마지막 차단된 요청이 자동 재발사되어 archive 가 따라온다
- [x] 진단 로그(`[DEBUG-TEMP]`) 모두 제거됨
- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행 (마지막 Phase 에서 자동 포맷 적용)
- [x] 사용자 실기 검증 완료 (차트 화면, 빠른 좌측 스와이프 / 멈춤 / 재스와이프 시나리오)
- [x] 필요한 문서 업데이트 (README.md / `docs/COMMANDS.md` / CLAUDE.md / plan)
- [x] plan 체크박스 최신화

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- [src/utils/chartHtml.ts](../../src/utils/chartHtml.ts) — `subscribeVisibleLogicalRangeChange` 콜백 내 debounce 시간 단축 + trailing 재시도 추가
- [src/components/ChartWebView.tsx](../../src/components/ChartWebView.tsx) — 진단 로그 제거 (마지막 Phase)
- [src/screens/ChartScreen.tsx](../../src/screens/ChartScreen.tsx) — 진단 로그 제거 (마지막 Phase)
- [src/store/useStore.ts](../../src/store/useStore.ts) — 진단 로그 제거 (마지막 Phase)
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음

### 데이터/결과 영향

- RTDB payload 스키마 영향 없음 (WebView 내부 타이밍 로직만 수정)
- archive 저장 구조 영향 없음
- 사용자 체감: 빠른 스와이프 시 추가 archive 가 따라오는 빈도 증가 (현재 1.5초당 최대 1회 → 약 0.4초당 1회 + trailing)

## 6) 단계별 계획(Phases)

### Phase 1 — WebView debounce 단축 + trailing 재시도 구현

**작업 내용**:

- [x] [src/utils/chartHtml.ts](../../src/utils/chartHtml.ts) 의 `subscribeVisibleLogicalRangeChange` 콜백 수정:
  - `EARLIER_DEBOUNCE_MS` 를 1500 → **400** 으로 단축
  - 모듈 scope 변수 `pendingEarlierTimer` 추가 (예약된 trailing 재시도 핸들)
  - debounce 차단 시: 기존 timer 가 없으면 `setTimeout(fn, 남은 ms)` 으로 trailing 재시도 예약
  - trailing 재시도 함수: 현재 `chart.timeScale().getVisibleLogicalRange()` 재확인하여 여전히 `from < 30` 이면 emit, 아니면 무시
  - 정상 emit 시: 예약된 timer 취소 (중복 발사 방지)
- [x] 진단 로그 추가: `trailing emit load_earlier from=<value>` (어떤 케이스에 trailing 이 작동했는지 로그로 확인 가능하도록)
- [x] 사용자 실기 재현으로 동작 검증 (logcat 으로 `trailing emit` 이 찍히는지 + 화면이 채워지는지)

---

### Phase 2 — 진단 로그 제거 (검증 완료 후)

**작업 내용**:

- [x] [src/utils/chartHtml.ts](../../src/utils/chartHtml.ts) 의 `[DEBUG-TEMP]` 마커 영역 제거:
  - `rnLog` 헬퍼 함수
  - `emit load_earlier`, `debounce blocked`, `trailing emit` 호출
- [x] [src/components/ChartWebView.tsx](../../src/components/ChartWebView.tsx) 의 `[DEBUG-TEMP]` 마커 영역 제거:
  - `IncomingMessage` 타입의 `'log'` 변형
  - `isIncomingMessage` 의 `'log'` 분기
  - `parsed.type === 'log'` 핸들러 분기
  - `console.debug('[chart] load_earlier received from WebView')` (기능 검증용 로그였으므로 함께 제거)
- [x] [src/screens/ChartScreen.tsx](../../src/screens/ChartScreen.tsx) 의 `loadEarlierData` 내 `[DEBUG-TEMP]` 영역 제거 (모든 console.debug 호출)
- [x] [src/store/useStore.ts](../../src/store/useStore.ts) 의 `loadPriceArchive` / `loadEquityArchive` 내 `[DEBUG-TEMP]` 영역 제거

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] README.md 변경 없음 확인
- [x] `docs/COMMANDS.md` 변경 없음 확인
- [x] `npx prettier --write .` 실행
- [x] 차트 화면 실기 재검증 (사용자가 에뮬레이터/기기에서 빠른 좌측 스와이프 / 멈춤 / 재스와이프 모두 확인)
- [x] DoD 체크리스트 최종 업데이트
- [x] 전체 Phase 체크리스트 최종 업데이트

**Validation**:

- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] 사용자 실기 검증: 차트 탭 — 빠른 좌측 스와이프 후 화면이 정상 채워지는지, 손 떼고 멈춘 시점에서도 archive 가 trailing 으로 따라오는지 (Phase 1 단계에서 logcat trailing emit 4회 + skip 1회 정상 작동 확인)

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. 차트 / 좌측 스와이프 archive 로딩 누락 수정 (debounce 단축 + trailing 재시도)
2. chart / WebView debounce 1500ms → 400ms 단축 및 trailing 재시도 추가
3. 차트 / 빠른 좌측 스와이프 시 archive prepend 누락 버그 수정
4. chartHtml / load_earlier debounce 개선 (trailing edge fire 추가)
5. fix: 차트 좌측 스와이프 후 데이터 안 들어오는 현상 수정

## 7) 리스크(Risks)

- debounce 단축으로 RTDB 호출 빈도 증가. 단, prefetchNext + archive 캐시 가드(`existing?.archive[year]`) 가 이미 있어 실제 호출은 연도별 1회로 자연스럽게 수렴. 같은 연도 동시 in-flight 가능성은 매우 짧은 윈도우(<400ms) 내로 제한됨.
- trailing 재시도가 중복 발사하지 않도록 `pendingEarlierTimer` 가 있을 때만 재예약하지 않는 가드 필요. 정상 emit 시점에 timer 취소도 필수.
- `getVisibleLogicalRange()` 가 trailing 시점에 null/undefined 반환 가능 — null 가드 필수.

## 8) 메모(Notes)

- debounce 시간 400ms 결정 근거: 진단 로그에서 RTDB 응답 평균 ~143ms, prefetch 자동 발생 시 ~138ms. 응답 시간의 약 3배 마진을 두어 안정적이면서도 사용자 체감 반응성 확보.
- Phase 2 (진단 로그 제거) 는 Phase 1 검증 완료 후에 진행. 사용자 실기 확인 단계에서 같은 로그로 재검증해야 trailing 동작 검증 가능.
- 진단 로그 자체가 [DEBUG-TEMP] 마커로 표기되어 있어 grep 으로 일괄 제거 검증 가능.

### 진행 로그 (KST)

- 2026-04-28 16:35: 계획서 작성. 진단 로그 분석 결과 WebView debounce 1500ms 와 trailing 부재가 원인으로 확정.
- 2026-04-28 16:42: Phase 1 코드 변경 완료 — `chartHtml.ts` 의 debounce 400ms 단축 + `scheduleTrailingEmit` 추가. 사용자 실기 검증 대기.
- 2026-04-28 16:55: Phase 1 실기 검증 완료. logcat 에서 trailing emit 4회 + trailing skip 1회 정상 작동 확인. 빠른 스와이프 후 손 뗀 시점에서도 archive 가 trailing 으로 회수되어 2008/2007 까지 자연스럽게 prepend 됨.
- 2026-04-28 17:05: Phase 2 진단 로그 4개 파일에서 일괄 제거. grep `[DEBUG-TEMP]` 0건 확인. prettier / lint / tsc 모두 통과. plan 종료.
