# Implementation Plan: 차트 핀치 줌아웃 한계를 현재 로드된 데이터 길이로 확장

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

**작성일**: 2026-04-29 05:38
**마지막 업데이트**: 2026-04-29 05:42
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

- [x] 차트 핀치 줌아웃 한계가 **현재 로드된 데이터 길이** 까지 도달할 수 있도록 한다 (라이브러리 기본 한계 제거).
- [ ] 차트 진입 직후 1년 슬라이스만 로드된 상태에서도, 좌측 스와이프로 추가 슬라이스를 prepend 한 직후엔 곧바로 그만큼 더 줌아웃이 가능해야 한다.
- [ ] 사용자가 줌아웃을 통해 archive 자동 prepend 가 트리거되지 않는다는 기존 동작은 유지한다 (기존 `range.from < 30` 트리거는 좌측 스와이프 전용으로 유지).

## 2) 비목표(Non-Goals)

- 줌아웃 시 archive 슬라이스를 자동 prepend 하지 않는다 (사용자 명시적 의사).
- `fitContent` 같은 별도 "전체 보기" 제스처/버튼 도입하지 않는다.
- 진입 시 archive 전체 prefetch 도입하지 않는다.
- `applyInitialZoomLastYear` (진입 시 마지막 252봉 표시) 의 동작은 유지한다.
- `fixRightEdge: true` / `fixLeftEdge` 동적 전환 로직은 변경하지 않는다.

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- 현재 차트 진입 직후 핀치 줌아웃을 시도하면, 좌측에 더 받을 archive 슬라이스가 남아 있더라도 줌아웃이 일정 지점에서 멈춘다. 사용자는 좌측 끝까지 스와이프로 데이터를 모두 받은 뒤에야 핀치로 전체 기간을 볼 수 있다.
- 사용자 관찰: "2015년까지 데이터를 로드 후 줌아웃하면 약 2년 6개월치만 보이고, 2006년까지 전체 데이터를 로드 후 줌아웃하면 전체가 보인다."
- 원인 가설: Lightweight Charts 의 `timeScale.minBarSpacing` 옵션 기본값(약 0.5px) 으로 인해 핀치 줌아웃 시 `barSpacing` 이 더 줄어들지 못한다. 화면 너비 ÷ minBarSpacing 으로 산출되는 봉 수가 핀치 줌아웃의 상한이 되어, 데이터를 더 많이 가지고 있어도 핀치만으로는 그 전체를 보지 못한다. 좌측 스와이프는 별개 메커니즘이라 한계가 다르며, 데이터를 충분히 prepend 한 뒤에는 핀치 한계 봉 수와 데이터 길이의 차이가 시각적으로 잘 드러나지 않아 "전체가 보인다" 고 인식된다.
- 의도된 사용자 경험: 2015년이든 2006년이든 **현재 로드된 데이터 기준으로 핀치 줌아웃이 최대치까지 풀리는 것**.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md`
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 SoT, 변경 금지)
- 실행 명령어 SoT: `docs/COMMANDS.md`
- docs 운영 규칙 SoT: `docs/CLAUDE.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] `chartHtml.ts` 의 timeScale 옵션에 `minBarSpacing` 명시 적용 (라이브러리 기본 한계 제거).
- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행 (마지막 Phase 에서 자동 포맷 적용)
- [ ] 사용자 실기 검증 완료 (차트 탭, 진입 직후 / 1~2회 좌측 스와이프 후 / 전체 archive 로드 후 각각 핀치 줌아웃 동작)
- [x] 필요한 문서 업데이트(README.md 변경 없음 / `docs/COMMANDS.md` 변경 없음 / CLAUDE.md 변경 없음 / plan 본 문서 갱신 중)
- [ ] plan 체크박스 최신화(Phase/DoD/Validation 모두 반영)

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/utils/chartHtml.ts` — `LightweightCharts.createChart` 호출의 `timeScale` 옵션에 `minBarSpacing` 추가. 의도/근거 1줄 주석 동반.
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음 (실행 명령어/CLI 옵션 변경 없음)

### 데이터/결과 영향

- RTDB payload 스키마 영향 없음 (서버 계약 무관, 표시 측 옵션만 변경).
- UI 표시 포맷 / 상태 저장 구조 변경 없음.
- 차트 핀치 줌아웃 한계만 확장. 줌인 / 좌측 스와이프 / archive 로드 / 크로스헤어 / 마커 등 다른 동작은 모두 그대로 유지.

## 6) 단계별 계획(Phases)

### Phase 1 — `minBarSpacing` 명시 적용 (그린 유지)

**작업 내용**:

- [x] `src/utils/chartHtml.ts` 의 `LightweightCharts.createChart(...)` 옵션 내 `timeScale: { ... }` 블록에 `minBarSpacing` 을 명시한다. 값은 핀치 줌아웃이 라이브러리 기본 한계 없이 현재 로드된 데이터 길이까지 도달할 수 있도록 충분히 작게 설정한다 (예: `0.001`).
- [x] 해당 옵션 위에 1줄 주석으로 의도(라이브러리 기본 한계로 핀치 줌아웃이 데이터 전체에 못 미치는 문제 해소) 와 줌인 동작에는 영향 없음을 명시한다. CLAUDE.md §7.5 주석 작성 원칙 준수 (현재 코드 상태/동작만 설명, 변경 이력/Phase 표현 금지).

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
- [ ] 사용자 실기 검증: 차트 탭에서 다음 3가지 시나리오 확인
  - 진입 직후 (1년 슬라이스만 로드) 핀치 줌아웃 → 약 1년 범위까지 자연스럽게 풀리고, 그 이상 줌아웃 시 좌측 스와이프 트리거 (`load_earlier`) 가 그대로 작동하지 않는 것을 확인 (의도된 동작)
  - 좌측 스와이프로 1~2개 슬라이스 prepend 후 핀치 줌아웃 → 그만큼 늘어난 데이터 범위까지 핀치만으로 도달
  - 좌측 스와이프로 모든 archive 를 로드한 뒤 핀치 줌아웃 → 전체 기간 표시
  - 위 3 케이스 모두에서 줌인 동작 / 크로스헤어 / 마커 / Equity 차트 모드 / 자산 전환 / PTR 회귀 없음 확인

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. 차트 / 핀치 줌아웃 한계를 로드된 데이터 길이까지 확장 (minBarSpacing 명시)
2. 차트 / 줌아웃 시 데이터 전체 가시 가능하도록 minBarSpacing 설정
3. utils / chartHtml minBarSpacing 명시로 핀치 줌아웃 제약 제거
4. 차트 / 줌아웃 한계 라이브러리 기본값 의존 제거
5. 차트 / 핀치 줌아웃이 현재 시리즈 길이까지 자유롭게 풀리도록 수정

## 7) 리스크(Risks)

- 매우 작은 `minBarSpacing` 값에서 봉이 픽셀 단위로 겹쳐 시각적으로 가독성이 떨어질 수 있음. 다만 사용자가 의도해서 줌아웃한 결과이므로 의도 부합. 줌인하면 다시 정상 봉 크기로 돌아옴.
- Lightweight Charts 의 핀치 줌 내부 구현이 향후 버전에서 변경되어 옵션 효과가 달라질 수 있음. 현재 버전은 `src/utils/constants.ts::CHART_LIB_VERSION` 으로 핀 고정되어 있어 단기 리스크는 낮음.
- 기존 `subscribeVisibleLogicalRangeChange` 의 `range.from < 30` 트리거는 좌측 스와이프 시점의 from 값에 의존. 줌아웃 동작 자체로도 from 이 30 미만으로 떨어질 수 있어 자동 prepend 트리거가 늘어날 가능성이 있다. 본 plan §2 비목표(줌아웃 시 자동 prepend 도입 금지) 와 충돌 여부를 실기 검증에서 반드시 확인한다. 만약 트리거가 의도치 않게 발화하면, 후속 plan 으로 트리거 조건을 "사용자 좌측 이동 시점에만" 한정하도록 분리한다.

## 8) 메모(Notes)

- 라이브러리 옵션 근거: Lightweight Charts v5 `TimeScaleOptions.minBarSpacing` (한 봉의 최소 픽셀 너비). 핀치 줌은 `barSpacing` 을 줄이는 방식인데, 이 옵션 미만으로는 줄지 못해 가시 봉 수의 상한을 만든다.
- 본 plan 은 진단(가설) 검증 이전에 변경을 적용한다. 사용자 실기 확인 시 가설 부합/부적합을 함께 판정한다.
- §7 Risks 의 자동 prepend 회귀 우려는 별도 후속 plan 후보로 메모.

### 진행 로그 (KST)

- 2026-04-29 05:38: plan 작성 (Draft)
- 2026-04-29 05:42: Phase 1 적용 — `src/utils/chartHtml.ts` timeScale 옵션에 `minBarSpacing: 0.001` 추가. 마지막 Phase — prettier/lint/tsc 모두 통과. 사용자 실기 검증 대기로 In Progress 유지.

---
