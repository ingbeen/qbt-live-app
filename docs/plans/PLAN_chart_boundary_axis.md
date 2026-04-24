# Implementation Plan: 차트 경계/축 정리 (edge pin, 라벨/수평선 제거, 천단위 콤마, EMA 실선)

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

**작성일**: 2026-04-24 09:40
**마지막 업데이트**: 2026-04-24 09:40
**관련 범위**: utils (chartHtml)
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

- [x] 차트 좌/우 경계를 데이터 끝선에 정확히 맞춘다 (margin/offset 0).
- [x] 우측 가격축의 "마지막 값 강조 라벨" 과 "수평 가격선" 을 제거한다 (주가/Equity 공통).
- [x] 우측 가격축 숫자에 천단위 콤마 포맷을 적용한다 (주가/Equity 공통).
- [x] 주가 차트의 EMA-200 시리즈를 실선으로 변경한다.

## 2) 비목표(Non-Goals)

- 상/하단 밴드 선 스타일 변경 (점선 유지).
- Equity 차트의 Actual 시리즈 선 스타일 변경 (점선 유지 — Model/Actual 시각 구분 보존).
- 크로스헤어 모드 변경, 차트 색상/범례(ChartLegend) 수정.
- 축 값 소수점 자리수 정책 변경 (현재 2자리 유지).
- RTDB/서버 계약, 데이터 처리 로직 변경.

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- 우측에 60봉, 좌측에도 60봉 여유가 있어 "차트 끝" 이 축과 떨어져 있음. 사용자 요청: 경계에 정확히 맞춤.
- 우측에 각 시리즈 마지막 값이 색상 라벨로 강조되고 그 위치에 점선 수평선이 그려짐. 사용자는 이 강조/수평선 표시를 원치 않음.
- 축 값이 기본 포맷(콤마 없음)으로 표시됨. 대형 Equity 수치 가독성 저하.
- EMA 가 점선으로 표시됨 → 사용자 요청: 실선.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md` (특히 §9 WebView + TradingView Charts 규칙, §12 의존성 관리, §5.3 스타일링)
- `docs/CLAUDE.md` (plan 운영 규칙)

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] 주가 차트: 좌/우 경계가 데이터 끝선에 정확히 맞음 (좌/우 여유 0).
- [x] Equity 차트: 좌/우 경계가 데이터 끝선에 정확히 맞음.
- [x] 주가 차트: close/EMA/상단/하단 시리즈 모두 우측 강조 라벨 없음, 수평 가격선 없음.
- [x] Equity 차트: model/actual 시리즈 모두 우측 강조 라벨 없음, 수평 가격선 없음.
- [x] 우측 축 값에 천단위 콤마 적용 (예: `1,234.56`).
- [x] EMA-200 시리즈가 실선으로 표시됨.
- [x] `npm run lint` 통과.
- [x] `npx tsc --noEmit` 통과.
- [x] `npx prettier --write .` 실행 (마지막 Phase 에서 자동 포맷 적용).
- [ ] 사용자 실기 검증 완료 (차트 탭: 주가 4종 자산 + Equity 전환).
- [x] 필요한 문서 업데이트 (README.md 변경 없음 / `docs/COMMANDS.md` 변경 없음).
- [x] plan 체크박스 최신화(Phase/DoD/Validation 모두 반영).

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/utils/chartHtml.ts` — 차트 HTML/JS 단일 수정 지점.
- `README.md`: 변경 없음.
- `docs/COMMANDS.md`: 변경 없음 (실행 명령어/CLI 옵션 변경 없음).

### 데이터/결과 영향

- RTDB 스키마/페이로드 영향 없음 (읽기/표시 측만 수정).
- 차트 외 UI (헤더 `ChartValueHeader`, 범례 `ChartLegend`) 영향 없음 — 헤더 값 포맷은 기존 format 유틸 사용, 범례 선 스타일은 EMA 만 점선→실선 아이콘 대응 여부 별도 검토 필요하지만 본 plan 은 차트 라이브러리 옵션만 변경 (범례 SVG 는 사용자 확인 후 별도 처리 가능).

## 6) 단계별 계획(Phases)

### Phase 1 — chartHtml.ts 수정 (그린 유지)

**작업 내용**:

- [x] `CHART_EDGE_MARGIN_BARS` 를 0 으로 변경.
- [x] `timeScale.rightOffset` 옵션 제거 (또는 0 설정). → `rightOffset: 0` (CHART_EDGE_MARGIN_BARS 상수 경유).
- [x] `subscribeVisibleLogicalRangeChange` 의 좌/우 경계 재조정 로직이 margin=0 에서도 정상 동작하는지 확인 (from<0 / to>currentBarCount-1 조건). → 기존 로직 그대로 동작 (좌: range.from < 0 → snap to [0, span] / 우: range.to > currentBarCount-1 → snap to [maxTo-span, maxTo]).
- [x] `localization.priceFormatter` 추가: `p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.
- [x] `setPriceChart`: closeSeries / maSeries / upperSeries / lowerSeries 에 `lastValueVisible: false`, `priceLineVisible: false` 추가.
- [x] `setPriceChart`: `maSeries` 의 `lineStyle: 2` 제거 (실선 기본값).
- [x] `setEquityChart`: modelSeries / actualSeries 에 `lastValueVisible: false`, `priceLineVisible: false` 추가.

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] 필요한 문서 업데이트 (README.md / `docs/COMMANDS.md` 변경 없음 확인).
- [x] `npx prettier --write .` 실행(자동 포맷 적용).
- [ ] 변경 기능 및 전체 플로우 최종 검증 (사용자 실기 확인).
- [x] DoD 체크리스트 최종 업데이트 및 체크 완료 (사용자 실기 제외).
- [x] 전체 Phase 체크리스트 최종 업데이트 및 상태 확정.

**Validation**:

- [x] `npm run lint` 통과 (0 errors, 기존 8 warnings — 이번 변경과 무관).
- [x] `npx tsc --noEmit` 통과.
- [ ] 사용자 실기 검증: 차트 탭 → 주가(SSO/QLD/GLD/TLT) + Equity 전환, 좌측 archive 로드, 크로스헤어 이동, 좌/우 경계 스크롤.

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. 차트 / 경계 pin + 우측 라벨·수평선 제거 + 축 콤마 + EMA 실선
2. 차트 / 좌우 경계 0 + 가격축 정리 (라벨/수평선 off, 천단위 콤마, EMA 실선)
3. 차트 / 우측 강조 제거 및 EMA 실선 전환, 축 포맷 콤마 적용
4. 차트 / chartHtml 옵션 정리 (edge pin, lastValue off, priceLine off, EMA solid)
5. 차트 / 주가·Equity 공통 가독성 개선 (경계/축/EMA)

## 7) 리스크(Risks)

- 경계 margin=0 에서 관성 스크롤이나 핀치 줌 시 `subscribeVisibleLogicalRangeChange` 의 span 재조정이 깜빡임을 유발할 수 있음 → 실기 검증 시 확인, 문제 시 최소 margin (예: 2) 로 조정 고려.
- Android WebView 가 `Number.prototype.toLocaleString` 을 기대대로 지원하지 않는 구형 기기 가능성 (Chromium 기반 WebView 는 지원됨) → 실기 검증 필수.
- `lastValueVisible: false` 는 크로스헤어 가격축 표시에는 영향 없음 (별도 옵션). 검증 필요.

## 8) 메모(Notes)

- 사용자 결정: 선택지 A — EMA 만 실선 전환, 상/하단 밴드 및 Equity Actual 은 점선 유지.
- 사용자 지시: 계획서 작성 후 승인 없이 바로 진행.

### 진행 로그 (KST)

- 2026-04-24 09:40: 계획서 작성 및 실행 시작.
- 2026-04-24 09:55: Phase 1 구현 완료 (chartHtml.ts 단일 파일). lint/tsc/prettier 통과. 사용자 실기 검증 대기.

---
