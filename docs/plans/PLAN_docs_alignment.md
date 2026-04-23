# Implementation Plan: 문서/주석 정합성 정비 (AUDIT_2026-04-23 후속 1/4)

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

**작성일**: 2026-04-23 15:00
**마지막 업데이트**: 2026-04-23 15:30
**관련 범위**: docs (루트 + docs/), src/utils/chartHtml.ts (헤더 주석만)
**관련 문서**: CLAUDE.md, README.md, docs/COMMANDS.md, docs/DESIGN_QBT_LIVE_FINAL.md, docs/AUDIT_2026-04-23.md

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

- [x] 목표 1: 문서/주석/코드 3자 불일치 5건 (AUDIT 7-1 ~ 7-5) 해소
- [x] 목표 2: 문서 내 "변경 가능성 높은 수치/리스트 직접 기재" 4건 (AUDIT 8-1 ~ 8-4) 정비
- [x] 목표 3: 모든 변경이 §7.6 (문서 내구성 원칙) 을 강화하는 방향으로 수렴

## 2) 비목표(Non-Goals)

- 코드 동작 변경 (이 PLAN 은 문서/주석만 다룸)
- 상수화 / 리팩토링 / 컴포넌트 추출 (각각 PLAN 2/3/4 범위)
- DESIGN 문서의 데이터 계약(필드 정의, 스키마) 변경 — 표기 정리만

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- AUDIT_2026-04-23 §7, §8 에 정리된 9건의 문서/주석 정합성 이슈가 누적되어 있다.
- 가장 높은 심각도(7-1)는 CLAUDE.md §15.3 의 상수 목록이 실제 `src/utils/constants.ts` 와 7개 차이가 나는 상태로, **CLAUDE.md 자체가 §7.6 (문서 내구성 원칙) 을 위반**하는 모순.
- `docs/COMMANDS.md` 의 `npm test` 는 실재하지 않는 명령으로, 사용자 혼동 유발.
- `chartHtml.ts:1-4` 헤더 주석이 잘못된 § 번호(§7, §3.3) 를 인용하여 후속 코드 리뷰 시 참조 혼란.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md` (특히 §7.5 주석 작성 원칙, §7.6 문서 내구성 원칙, §15 환경/빌드/상수, §18 변경 관리)
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 SoT — 단, 본 PLAN 은 표기 정리에 한정, 데이터 계약 자체는 변경 금지)
- 실행 명령어 SoT: `docs/COMMANDS.md`
- docs 운영 규칙: `docs/CLAUDE.md`
- AUDIT 보고서: `docs/AUDIT_2026-04-23.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] AUDIT 7-1 ~ 7-5 모두 처리 (각 항목별 체크박스 충족)
- [x] AUDIT 8-1 ~ 8-4 모두 처리 (각 항목별 체크박스 충족)
- [x] `npm run lint` 통과 (0 errors / 8 warnings — 모두 본 PLAN 무관 기존 워닝)
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행 (변경 파일 7개 자동 포맷 적용)
- [x] 사용자 실기 검증 완료 — 문서 변경뿐이라 앱 동작 영향 없음, commit 후 git diff 시각 검토로 갈음
- [x] 필요한 문서 업데이트 완료 (CLAUDE.md, README.md, docs/COMMANDS.md, docs/DESIGN_QBT_LIVE_FINAL.md)
- [x] plan 체크박스 최신화 (Phase/DoD/Validation 모두 반영)

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `CLAUDE.md` — §0 라이브러리 나열 정리(7-5), §7.5 RN 버전 예시 일반화(8-3), §15.1 applicationId 괄호 제거(8-1), §15.3 상수 목록 → 코드 참조(7-1)
- `README.md` — 폴더 구조 다이어그램 파일 목록 → 폴더 참조(7-4)
- `docs/COMMANDS.md` — `npm test` 라인 제거(7-2)
- `docs/DESIGN_QBT_LIVE_FINAL.md` — `recent_months` 행의 값 표기 정리(8-2), 예제 JSON 날짜에 의미 주석 추가(8-4)
- `src/utils/chartHtml.ts` — 헤더 주석의 § 번호 수정(7-3, 1-4 라인만)
- `README.md`: **변경 있음** (7-4)
- `docs/COMMANDS.md`: **변경 있음** (7-2)

### 데이터/결과 영향

- RTDB payload 스키마 영향: **없음** (DESIGN 변경은 표기 정리만, 데이터 계약 자체는 보존)
- UI 표시 / 상태 저장 구조 변경: **없음**
- 코드 동작 영향: **없음** (chartHtml.ts 변경은 주석 4줄만)

## 6) 단계별 계획(Phases)

### Phase 1 — 루트 문서 정합화 (CLAUDE.md, README.md)

**작업 내용**:

- [x] **[7-5]** `CLAUDE.md:29-37` 의 "주요 라이브러리" 11개 카테고리 직접 나열 → "주요 라이브러리는 `package.json` 참조 + 사용 정책은 §6/§8/§9/§12" 한 줄로 대체 (사용자 결정 Q1: C)
- [x] **[8-1]** `CLAUDE.md:790` 의 `` (`com.ingbeen.qbtlive`) `` 괄호 제거 — `applicationId` / `namespace` 는 `android/app/build.gradle` 참조 문구만 유지
- [x] **[8-3]** `CLAUDE.md:452` 의 `"RN 0.85"` → `"RN 0.82+"` 로 일반화 (RN 0.82+ New Architecture 강제 라는 의미 보존)
- [x] **[7-1]** `CLAUDE.md:797-801` (§15.3) 의 상수 목록 13개 직접 나열 → 주요 카테고리(식별자/네트워크/UI/RTDB 경로/자산/기호/토스트) 의 존재만 한 줄 언급 + `` 전체 목록은 [`src/utils/constants.ts`](src/utils/constants.ts) 참조 `` 로 위임
- [x] **[7-4]** `README.md:45-52` 폴더 구조 다이어그램의 `screens/components/services/utils` 줄에서 파일명 직접 나열 제거 → `- 자세한 목록은 src/<폴더>/ 참조` 형식으로 통일

**Validation** (Phase 내):

- [x] CLAUDE.md / README.md markdown preview 가시성 확인 (들여쓰기, 링크 깨짐 없음)
- [x] CLAUDE.md §7.6 (문서 내구성 원칙) 자체와 모순 없는지 셀프 검토

---

### Phase 2 — docs 폴더 문서 정합화 (COMMANDS.md, DESIGN_QBT_LIVE_FINAL.md)

**작업 내용**:

- [x] **[7-2]** `docs/COMMANDS.md:42` 의 `npm test  # Jest` 라인 삭제. CLAUDE.md §16 ("단위 테스트 파일 없음") 정책과 일치시킴
- [x] **[8-2]** `docs/DESIGN_QBT_LIVE_FINAL.md` 의 표 셀 2곳 (line 463 `charts/prices/meta`, line 554 `charts/equity/meta`) 의 `` 상수 `CHART_RECENT_MONTHS = 6``` 표기를  ``상수 `CHART_RECENT_MONTHS` 참조``로 변경 (값`= 6`제거). 본문 line 194 의`recent_months = 6` 은 정책 진술 문장이라 보존 (상수명 명시되어 있어 §7.6 위반 정도가 가벼움).
- [x] **[8-4]** `docs/DESIGN_QBT_LIVE_FINAL.md` §8.2 도입부에 "예제 JSON 표기 주의" 한 줄 추가 — 예제 JSON 의 날짜/연도/가격 등 구체값은 시점 의존 예시이며 필드 의미/타입만 계약 SoT 로 본다는 주의 문장 명시. 개별 예제 JSON 은 그대로 유지 (가독성 보존).

**Validation** (Phase 내):

- [x] DESIGN 문서의 데이터 계약(필드 정의, 스키마, 타입) 자체가 변경되지 않았는지 확인 — 표기 정리만 수행했음을 확인
- [x] `docs/COMMANDS.md` 가 `package.json::scripts` (`android`/`lint`/`start`) 와 일치하는지 확인

---

### Phase 3 — 코드 주석 정합화 (chartHtml.ts)

**작업 내용**:

- [x] **[7-3]** `src/utils/chartHtml.ts:1-4` 헤더 주석에서 잘못된 § 번호 수정:
  - 변경 전: `"CLAUDE.md §7 WebView 범주 — §3.3 RN 컴포넌트 하드코딩 금지 규칙의 예외"`
  - 변경 후: `"CLAUDE.md §5.3 스타일링 / §5.4 절대 금지 목록 — 하드코딩 색상 hex 금지 규칙의 예외"`

**Validation** (Phase 내):

- [x] 코드 동작 영향 없음 (주석 4줄만 변경) — 컴파일 에러 없는지 시각 확인 (마지막 Phase 의 `npx tsc --noEmit` 통과로 확인됨)

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] AUDIT_2026-04-23.md 의 "적용 PLAN: PLAN_docs_alignment" 항목들 모두 처리 완료 확인 (7-1, 7-2, 7-3, 7-4, 7-5, 8-1, 8-2, 8-3, 8-4 — 9건)
- [x] `docs/COMMANDS.md` 변경 반영 (Phase 2 의 7-2 — `npm test` 라인 삭제 완료)
- [x] `README.md` 변경 반영 (Phase 1 의 7-4 — 폴더 구조 다이어그램 파일명 → 폴더 참조)
- [x] `npx prettier --write .` 실행 (변경 파일 7개 자동 포맷 적용)
- [x] 변경 기능 및 전체 플로우 최종 검증 — 문서 변경뿐이라 앱 빌드/실행 영향 없음을 셀프 검토. 사용자 시각 확인은 commit 후 git diff 로 갈음.
- [x] DoD 체크리스트 최종 업데이트 및 체크 완료
- [x] 전체 Phase 체크리스트 최종 업데이트 및 상태 확정 (Done)

**Validation**:

- [x] `npm run lint` 통과 (0 errors / 8 warnings — 모두 본 PLAN 무관 기존 워닝)
- [x] `npx tsc --noEmit` 통과
- [x] 사용자 실기 검증: 문서 변경뿐 (chartHtml.ts 주석 4줄 외 코드 영향 없음). 사용자 시각 검토로 갈음.

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. `docs / 문서·주석 정합성 정비 (AUDIT 7-1~7-5, 8-1~8-4 일괄)`
2. `docs / CLAUDE.md / README.md / DESIGN / COMMANDS 정합성 보정 + chartHtml 주석 § 번호 수정`
3. `문서 / 변경 내구성 강화 (상수 목록·폴더 트리·라이브러리 목록 → 코드 참조로 위임)`
4. `docs / npm test 제거 + CLAUDE.md 상수·라이브러리 목록 정리 + DESIGN 표기 정비`
5. `문서 / AUDIT 후속 1/4: 문서 정합성 9건 일괄 정리`

## 7) 리스크(Risks)

- **DESIGN 문서 표기 정리 시 데이터 계약 의미 훼손 위험** → 완화: 값/필드 정의 자체는 절대 변경 금지, 표기(`= 6` 제거, 의미 주석 추가) 만 손댐. Phase 2 Validation 에서 셀프 점검.
- **CLAUDE.md §15.3 상수 목록 제거로 신규 개발자 onboarding 혼란 가능** → 완화: 카테고리(네트워크/UI/RTDB/자산 등) 의 존재만 한 줄 언급하고 상세는 코드 참조로 위임. 코드 파일 자체에 한글 카테고리 주석이 이미 잘 정리되어 있어 정보 손실 없음.
- **README.md 폴더 트리에서 파일명 제거 시 폴더 책임이 불명확해질 위험** → 완화: 폴더 한 줄 책임 설명은 유지 (CLAUDE.md §10.1 과 일관).

## 8) 메모(Notes)

- 본 PLAN 은 AUDIT_2026-04-23.md 의 후속 조치 1/4 (문서/주석 정합성 단일 묶음).
- 사용자 결정 사항 (Q1: C, Q2: A → 8-5 폐기, Q3~5 는 다른 PLAN 범위) 를 AUDIT 0-2 에 반영 완료.
- 사용자 명시 지시: "사용자 승인없이 바로 진행" + "계획서마다 완료되면 commit". 따라서 각 Phase 완료 후 사용자 대기 없이 다음 Phase 진행, PLAN Done 후 자동 commit.
- 본 PLAN 의 변경은 코드 동작에 영향 없음 (chartHtml.ts 4줄 주석 제외) → 실기 검증은 시각 검토로 갈음 가능.

### 진행 로그 (KST)

- 2026-04-23 15:00: PLAN 작성 시작
- 2026-04-23 15:00: 사용자 결정 5개 모두 수령 후 작성 완료, 즉시 진행 개시
- 2026-04-23 15:15: Phase 1 (CLAUDE.md + README.md) 완료
- 2026-04-23 15:20: Phase 2 (COMMANDS.md + DESIGN) 완료
- 2026-04-23 15:25: Phase 3 (chartHtml.ts 주석) 완료
- 2026-04-23 15:30: 마지막 Phase — lint/tsc 통과, prettier 적용, DoD 갱신, 상태 Done

---
