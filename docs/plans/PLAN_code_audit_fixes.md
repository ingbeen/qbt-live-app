# Implementation Plan: 전수 분석 발견 항목 정리

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

**작성일**: 2026-05-10 21:40
**마지막 업데이트**: 2026-05-11 09:27
**관련 범위**: components, docs
**관련 문서**: CLAUDE.md, docs/CLAUDE.md, docs/DESIGN_QBT_LIVE_FINAL.md

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

- [x] HistoryList 의 시그널 렌더에서 `as Direction` 단언을 제거하고 타입 시스템으로 'none' 도달 불가를 선차단한다.
- [x] FillForm 의 pending hint 에서 raw 인라인 계산식을 `formatPendingShares` 호출로 통일하여 SyncDialog / PendingOrdersListBlock 과 출력 형식·§5.1 폴백을 일치시킨다.
- [x] CLAUDE.md §14.3 의 가변 마이너 버전 예시("예: 0.85 → 0.86")를 일반화 표현으로 바꾼다.

## 2) 비목표(Non-Goals)

- ChartScreen 의 `?? undefined` 4 라인은 의도된 일관성으로 유지하므로 변경하지 않는다.
- 1차 분석에서 부정확하다고 재검증된 항목들(PendingOrdersListBlock close 검증 / AssetSummaryCard hasPrice / App.tsx AppState / portfolio.assets[id] 직접 인덱싱 4종 / ChartScreen refreshChart 무한 스피너)은 손대지 않는다.
- 색상 / 포맷 / 라이브러리 추가 등 §3·§4 분류 외 항목은 다루지 않는다.
- README.md / docs/COMMANDS.md 는 갱신 대상이 아니다.

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- [HistoryList.tsx:122](../../src/components/HistoryList.tsx#L122) 가 `e.signal.state as Direction` 단언으로 'none' 을 우회한다. 동작상 안전하지만 컴파일 타임 보장이 약하고, CLAUDE.md §5.1 방식 2(타입 시스템 선차단) 모범에서 벗어난다.
- [FillForm.tsx:120-128](../../src/components/FillForm.tsx#L120-L128) 가 `signals[pending.asset_id].close` 를 3회 인덱싱하고 raw 계산식으로 주수를 산출한다. 같은 값을 SyncDialog / PendingOrdersListBlock 은 이미 `formatPendingShares` 헬퍼로 산출하고 있어 §3 상수화 / §5.1 폴백 적용에서 누락된 한 곳이다.
- [CLAUDE.md:874](../../CLAUDE.md#L874) 의 "예: 0.85 → 0.86" 은 가변 마이너 버전 예시라 시간이 지나면 어색해진다. §9.6 "구체적 수치 / 가변 정보 직접 기재 금지" 의 정신과 충돌한다. 같은 섹션의 "RN 0.82+/0.84+" 류는 §9.5 가 외부 제약 시점 표현으로 직접 허용하므로 손대지 않는다.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md`
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 SoT, 변경 금지)
- 실행 명령어 SoT: `docs/COMMANDS.md`
- 계획서 운영 SoT: `docs/CLAUDE.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] HistoryList 에서 `as Direction` 단언이 제거되어 있다.
- [x] FillForm pending hint 가 `formatPendingShares` 호출 경로로 통일되어 있다.
- [x] CLAUDE.md §14.3 의 마이너 버전 예시가 일반화되어 있다.
- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행 (마지막 Phase 에서 자동 포맷 적용)
- [ ] 사용자 실기 검증 완료 (대상 화면/플로우 기록)
- [x] 필요한 문서 업데이트(README.md / `docs/COMMANDS.md` / CLAUDE.md / plan 등 — 각각 변경 여부 명시) — README.md 변경 없음 / `docs/COMMANDS.md` 변경 없음 / CLAUDE.md §14.3 변경 / plan 변경
- [x] plan 체크박스 최신화(Phase/DoD/Validation 모두 반영)

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/components/HistoryList.tsx` — `HistoryEvent` 의 `signal` 변형 타입을 좁혀 단언 제거 + `signalsToEvents` 반환 형식 정합화
- `src/components/FillForm.tsx` — pending hint 의 raw 계산식을 `formatPendingShares` 호출로 통일
- `CLAUDE.md` — §14.3 의 "예: 0.85 → 0.86" 표현 일반화
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음

### 데이터/결과 영향

- RTDB payload 스키마 영향 없음 (서버 계약 변경 없음).
- UI 출력 변화: FillForm pending hint 의 텍스트가 `"⚡ {TICKER} N 주 매수 pending"` → `"⚡ {TICKER} N주 매수 pending"` 으로 미세 변경 ("주" 앞 공백 1칸 제거 + "주" 뒤 공백 1칸 추가). SyncDialog / PendingOrdersListBlock 과 동일 형식이 됨.
- 히스토리 화면 시그널 라벨은 동작 / 표시 변화 없음 (타입만 강화).

## 6) 단계별 계획(Phases)

### Phase 1 — HistoryList 시그널 타입 narrowing (그린 유지)

**작업 내용**:

- [x] `HistoryEvent` 의 `kind: 'signal'` 변형에서 `signal: SignalHistoryEntry['signal']` 타입을 좁힌 형태(state 가 'buy'|'sell' 만 허용)로 정의한다.
- [x] `signalsToEvents` 가 'none' 필터 통과 후 반환할 때 좁혀진 타입에 맞도록 명시적으로 변환한다 (`as`-단언이 아닌 객체 재구성으로 좁힘).
- [x] `renderSignalContent` 에서 `e.signal.state as Direction` 단언을 제거한다.

**Validation**:

- [ ] 차트/거래 외 히스토리 진입 시 시그널 항목이 기존과 동일하게 "{TICKER} 매수 시그널" / "{TICKER} 매도 시그널" 로 표시되는지 사용자 실기 확인.

---

### Phase 2 — FillForm pending hint 통일 (그린 유지)

**작업 내용**:

- [x] [FillForm.tsx:120-128](../../src/components/FillForm.tsx#L120-L128) 의 조건문에서 `signals?.[pending.asset_id]?.close` 를 한 번만 꺼내 const 로 보관한다.
- [x] 본문의 raw 계산식 `Math.round(Math.abs(...) / signals[...].close)` 를 제거하고 `formatPendingShares(pending.delta_amount, close)` 호출로 대체한다.
- [x] `formatPendingShares` 의 반환이 `"N주 "` (뒤 공백) 이므로, 표현이 SyncDialog / PendingOrdersListBlock 과 동일한 형식으로 정렬되었는지 확인한다.

**Validation**:

- [ ] 거래 탭 진입 후 pending 이 있는 자산이 선택될 때 hint 박스가 `"⚡ {TICKER} N주 매수 pending"` (또는 매도) 형식으로 표시되는지 사용자 실기 확인.
- [ ] pending 이 없는 자산을 선택했을 때 hint 박스가 표시되지 않는지 확인.

---

### Phase 3 — CLAUDE.md §14.3 마이너 버전 예시 일반화 (그린 유지)

**작업 내용**:

- [x] [CLAUDE.md:874](../../CLAUDE.md#L874) 의 "예: 0.85 → 0.86" 표현을 가변 수치가 박히지 않는 일반화 표현으로 교체한다.

**Validation**:

- [x] 변경된 문장이 §9.6 "구체적 수치 / 가변 정보 직접 기재 금지" 와 충돌하지 않고, 같은 §14.3 의 다른 항목(외부 라이브러리 메이저 업그레이드 예시 형식)과 톤이 일치하는지 시각 검토.

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] 필요한 문서 업데이트 (README.md / `docs/COMMANDS.md` 포함 여부 명시) — 본 plan 은 둘 다 변경 없음.
- [x] `npx prettier --write .` 실행(자동 포맷 적용)
- [ ] 변경 기능 및 전체 플로우 최종 검증 (사용자 실기 확인)
- [x] DoD 체크리스트 최종 업데이트 및 체크 완료
- [x] 전체 Phase 체크리스트 최종 업데이트 및 상태 확정

**Validation**:

- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [ ] 사용자 실기 검증: 거래 탭 pending hint / 히스토리 시그널 표시 / 앱 전체 회귀 없음 확인.

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. components / 전수 분석 후속 — HistoryList 시그널 타입 narrowing + FillForm pending hint 통일
2. 리팩토링 / pending hint formatPendingShares 통일 + signal as 단언 제거
3. 코드 정리 / 단언 제거 및 pending 출력 일관화 + 문서 마이너 버전 예시 일반화
4. components / 단언 제거 + pending 출력 통일 + CLAUDE.md 가변 예시 정리
5. 정합성 / 시그널 state 타입 좁힘 + pending 헬퍼 통일 + 문서 표현 정리

## 7) 리스크(Risks)

- FillForm pending hint 의 출력 형식 미세 변경("N 주" → "N주") 으로 사용자 위화감 가능성. SyncDialog / PendingOrdersListBlock 의 기존 형식과 일치시키는 방향이라 일관성은 향상.
- `signalsToEvents` 반환 형식 변경 시 다른 호출부에 영향이 있는지 확인 필요. (현재는 HistoryList 내부 한정 사용으로 보이나 검색 단계에서 재확인.)
- 문서 표현 변경은 기능 영향 없음.

## 8) 메모(Notes)

- 본 plan 은 사용자 요청으로 수행한 전수 분석(2026-05-10) 의 검증된 잔여 항목만 반영한다. 부정확하다고 판정된 1차 보고 항목과 의도된 일관성으로 결론 난 항목(ChartScreen `?? undefined` 4 라인 등)은 비목표에 명시.
- Q4 답변에 따라 CLAUDE.md L25 / L590 / L933 의 "RN 0.82+/0.84+" 표현은 §9.5 가 직접 허용하는 외부 제약 시점 마커이므로 변경 대상 아님.

### 진행 로그 (KST)

- 2026-05-10 21:40: plan 초안 작성
- 2026-05-11 09:27: Phase 1~3 코드/문서 변경 완료(HistoryList 단언 제거 + signalsToEvents flatMap narrowing / FillForm pendingClose 추출 + formatPendingShares 적용 / CLAUDE.md §14.3 마이너 예시 일반화). `npx prettier --write .` 적용, `npm run lint` / `npx tsc --noEmit` 통과. 사용자 실기 검증 대기.

---
