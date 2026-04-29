# Implementation Plan: Equity 차트 우측 가격축의 series title 라벨 제거

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

**작성일**: 2026-04-29 06:04
**마지막 업데이트**: 2026-04-29 06:05
**관련 범위**: utils (chart WebView HTML)
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

- [ ] Equity 차트 우측 가격축에 표시되는 `Model` / `Actual` 라벨(스티커) 을 제거한다.
- [ ] 라벨 제거 외 동작(가격축 숫자, 마지막 값 위치, 자동 스케일, 크로스헤어 추적, 가격선) 에 회귀가 없다.

## 2) 비목표(Non-Goals)

- 주가 차트(`setPriceChart`) 의 시리즈 옵션은 변경하지 않는다 (해당 시리즈는 본래 `title` 옵션이 없음).
- 우측 가격축 자체의 표시/숫자 포맷은 변경하지 않는다.
- ChartLegend(하단 범례) 영역은 변경하지 않는다 — 이 영역이 이미 Model/Actual 색상/실선·점선 가이드를 표시하므로 우측 라벨이 중복이라는 판단 근거가 됨.

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- Equity 차트에서 우측 가격축의 마지막 값 옆에 `Model` / `Actual` 라벨이 표시된다 ([chartHtml.ts:160-161](../../src/utils/chartHtml.ts#L160-L161) 의 `addSeries` 옵션 `title`).
- `lastValueVisible: false` 로 마지막 값 라벨 자체는 숨겼지만, Lightweight Charts v5 에서 `title` 이 설정된 시리즈는 여전히 우측 가격축에 시리즈 이름 라벨을 띄운다.
- 사용자가 두 시리즈 식별은 하단 ChartLegend 영역으로 이미 충분히 하고 있어, 우측 라벨이 시각적 잡음으로 인식된다.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md`
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 SoT, 변경 금지)
- 실행 명령어 SoT: `docs/COMMANDS.md`
- docs 운영 규칙 SoT: `docs/CLAUDE.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] `setEquityChart` 의 `modelSeries` / `actualSeries` 옵션에서 `title` 키 제거.
- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행 (마지막 Phase 에서 자동 포맷 적용)
- [ ] 사용자 실기 검증 완료 (Equity 차트 우측 가격축에서 Model/Actual 라벨 사라짐, 다른 동작 회귀 없음)
- [x] 필요한 문서 업데이트(README.md 변경 없음 / `docs/COMMANDS.md` 변경 없음 / CLAUDE.md 변경 없음 / plan 본 문서 갱신)
- [ ] plan 체크박스 최신화(Phase/DoD/Validation 모두 반영)

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/utils/chartHtml.ts` — `setEquityChart` 함수 내 `addSeries` 호출 두 곳에서 `title` 옵션 제거.
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음 (실행 명령어/CLI 옵션 변경 없음)

### 데이터/결과 영향

- RTDB payload 스키마 영향 없음.
- UI 표시 변경: Equity 차트 우측 가격축에서 Model / Actual 라벨이 사라짐. 그 외 표시 변경 없음.
- 상태 저장 구조 변경 없음.

## 6) 단계별 계획(Phases)

### Phase 1 — `title` 옵션 제거 (그린 유지)

**작업 내용**:

- [x] `src/utils/chartHtml.ts::setEquityChart` 의 `modelSeries = chart.addSeries(...)` 옵션에서 `title: 'Model'` 키 제거.
- [x] 같은 함수의 `actualSeries = chart.addSeries(...)` 옵션에서 `title: 'Actual'` 키 제거.

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] 필요한 문서 업데이트 (README.md / `docs/COMMANDS.md` 모두 변경 없음 — 본 plan Scope 에 명시됨)
- [x] `npx prettier --write .` 실행(자동 포맷 적용)
- [ ] 변경 기능 및 전체 플로우 최종 검증 (사용자 실기 확인)
- [ ] DoD 체크리스트 최종 업데이트 및 체크 완료
- [ ] 전체 Phase 체크리스트 최종 업데이트 및 상태 확정

**Validation**:

- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [ ] 사용자 실기 검증: 차트 탭 → Equity 모드에서 우측 가격축에 Model / Actual 라벨이 표시되지 않음. 가격축 숫자 / 자동 스케일 / 크로스헤어 추적 / 하단 ChartLegend / 주가 모드 / 자산 전환 모두 회귀 없음.

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. 차트 / Equity 우측 축의 Model·Actual 라벨 제거 (ChartLegend 와 중복)
2. 차트 / Equity 시리즈 title 옵션 제거로 가격축 라벨 숨김
3. 차트 / Equity 차트 우측 스티커 제거
4. utils / chartHtml setEquityChart title 옵션 정리
5. 차트 / Equity 가격축 라벨 노이즈 제거

## 7) 리스크(Risks)

- `title` 제거가 다른 표시(가격축 숫자, 마지막 값, 가격선) 에 영향을 줄 가능성은 낮음 — `lastValueVisible: false`, `priceLineVisible: false` 가 이미 설정되어 있어 `title` 만 라벨 표시를 책임지고 있다.
- `subscribeCrosshairMove` 콜백에서 시리즈 식별은 `param.seriesData.get(modelSeries)` 처럼 시리즈 인스턴스 참조로 수행하므로 `title` 과 무관 — 회귀 없음.

## 8) 메모(Notes)

- 라이브러리 동작 근거: Lightweight Charts v5 에서 `LineSeries.options.title` 은 우측 가격축에 시리즈 이름 라벨을 표시하는 옵션. `lastValueVisible: false` 와는 별개로 동작.

### 진행 로그 (KST)

- 2026-04-29 06:04: plan 작성, 즉시 실행 모드 진입.
- 2026-04-29 06:05: Phase 1 적용 — `setEquityChart` 의 `modelSeries`/`actualSeries` 옵션에서 `title` 키 제거 + 1줄 의도 주석 추가. 마지막 Phase — prettier/lint/tsc 모두 통과. 사용자 실기 검증 대기로 In Progress 유지.

---
