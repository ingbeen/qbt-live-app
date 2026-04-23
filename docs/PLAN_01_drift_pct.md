# PLAN 01 — BL-01 drift_pct 처리

> **선행 감사**: [docs/AUDIT_20260422.md](AUDIT_20260422.md) BL-01
> **선행 정책 확정**: 서버 측 `quant` 리포 `PLAN_remove_drift_chart_series.md` 완료 상태
> **작업 순서**: 4개 계획서 중 1번 (최우선)
> **승인 방식**: 사용자 사전 승인 완료 — 작성 후 즉시 실행 → 완료 시 commit → 다음 계획서로

---

## 1. 목표

서버 측 정책 확정에 따라 앱 코드를 두 방향으로 정합화:

1. **Portfolio.drift_pct 스칼라 표시 추가** — `ModelCompareCard` 헤더 + 토글 본문에 drift 값만 표시 (상태 라벨 금지)
2. **EquityChartSeries.drift_pct 배열 코드 전면 제거** — 타입/병합/전달 슬림화

---

## 2. 선행 조건 / 확정 사항

| 항목 | 상태 |
|---|---|
| 서버 RTDB 정책 | `/latest/portfolio.drift_pct` 유지, `/charts/equity/*.drift_pct` 제거됨 |
| DESIGN 문서 §8.2.4 | 제목 "drift 스칼라 — `/latest/portfolio` 에 통합" 으로 정리 완료 (과거 상태 서술 없음) |
| DESIGN 문서 §8.2.6 | equity 차트 스키마가 `dates` / `model_equity` / `actual_equity` 3 배열로 확정 |
| UI 정책 | drift 값만 표시. "정상 / 주의 / 보정 필요" 상태 라벨 **금지** |
| 앱 테스트 | CLAUDE.md §14 준수 — 단위 테스트 없음, 사용자 실기 확인 |

---

## 3. 영향 파일

### 3.1 코드 변경

| 파일 | 변경 내용 |
|---|---|
| [src/types/rtdb.ts](../src/types/rtdb.ts) | `EquityChartSeries` 에서 `drift_pct: number[]` 필드 제거 (라인 114) |
| [src/services/chart.ts](../src/services/chart.ts) | `EquityPoint` 타입에서 `drift_pct` 제거, `equityLength` 의 길이 체크 제거, `mergeEquitySeries` 의 병합/리턴 제거 |
| [src/utils/format.ts](../src/utils/format.ts) | drift 표시용 헬퍼 `formatDriftPct(ratio)` 추가 (부호 없음, 소수점 2자리) |
| [src/components/ModelCompareCard.tsx](../src/components/ModelCompareCard.tsx) | 헤더 배지 + 토글 본문에 drift 값 표시 추가 |

### 3.2 문서 변경

| 파일 | 변경 내용 |
|---|---|
| [docs/AUDIT_20260422.md](AUDIT_20260422.md) | BL-01 완료 처리, HIST-01 자동 해결 처리 |

### 3.3 변경 없음 (확인만)

- `src/store/useStore.ts` — `Portfolio.drift_pct` 읽기는 `readPortfolio` 가 객체 통째로 돌려주므로 추가 변경 불필요
- `src/services/rtdb.ts` — `readEquityChartRecent/Archive` 가 타입에 의존하므로 타입 제거 후 자동 반영
- `src/utils/chartHtml.ts` — `setEquityChart` 는 이미 drift_pct 를 사용하지 않으므로 변경 없음
- `docs/DESIGN_QBT_LIVE_FINAL.md` — 서버 측에서 이미 최신화 완료, 추가 변경 없음

---

## 4. 작업 단계

### Step 1 — 타입 제거 (기준점)
- `src/types/rtdb.ts`: `EquityChartSeries.drift_pct` 제거
- 이 시점부터 TypeScript 컴파일 에러 발생 (chart.ts, ChartScreen 등) → Step 2~3 에서 해결

### Step 2 — 병합 로직 제거
- `src/services/chart.ts`:
  - `EquityPoint` 타입에서 `drift_pct` 제거
  - `equityLength` 에서 `drift_pct.length` 체크 제거
  - `mergeEquitySeries` 에서 drift 병합 / undefined 체크 / 리턴 배열 제거

### Step 3 — drift 표시 헬퍼 추가
- `src/utils/format.ts` 에 `formatDriftPct(ratio: number): string` 추가
  - 동작: `(ratio * 100).toFixed(2) + '%'` (부호 없음, 절대값)
  - 설계서 §12 기준: drift_pct 는 `|model − actual| / model` 로 항상 양수
  - 예: `0.0037` → `"0.37%"`

### Step 4 — ModelCompareCard 에 drift 표시
- 헤더 (`headerRow`) 에 drift 배지 추가:
  - 레이아웃: `[Model 비교]                 [Drift 0.37%]`
  - 배지 스타일: 단색 (상태 색상 금지), 작은 padding, `COLORS.sub` 톤
  - 항상 보임 (카드 접혀도 표시). 카드 전체 영역이 Pressable 이므로 별도 펼침 화살표는 두지 않는다.
- 토글 열렸을 때 본문 상단에 drift 수치 라인 추가:
  - 레이아웃: `Model $X,XXX   Actual $X,XXX   Drift 0.37%` 3열 구성
  - 스타일: 기존 `totalsLabel` / `totalsValue` 톤 재사용

### Step 5 — AUDIT 문서 업데이트
- `docs/AUDIT_20260422.md`:
  - BL-01 항목에 "완료 (PLAN_01)" 추가
  - HIST-01 항목에 "자동 해결 (서버 측 §8.2.4 정리 반영)" 추가
  - 최종 요약 테이블 갱신

### Step 6 — 동작 확인 포인트 (사용자 실기)
- [ ] TypeScript 컴파일 통과 (에뮬레이터 빌드 확인)
- [ ] 홈 화면 → `ModelCompareCard` 헤더에 `[Drift 0.37%]` 형태 배지 표시
- [ ] 카드 토글 열면 본문에 `Drift: 0.37%` 한 줄 표시
- [ ] 상태 라벨 ("정상" / "주의" / "보정 필요") 없음 확인
- [ ] equity 차트가 model + actual 2 라인만 표시 (drift 라인 없음, 기존과 동일)

### Step 7 — Commit
- 커밋 메시지 예시:
  ```
  feat: drift_pct 표시 추가 + equity 차트 drift 배열 제거

  - ModelCompareCard 헤더/토글에 drift_pct 값 표시 (값만, 상태 라벨 없음)
  - EquityChartSeries.drift_pct 배열 관련 코드 제거 (타입/병합 정합화)
  - AUDIT BL-01 완료, HIST-01 자동 해결
  ```

---

## 5. DoD (Definition of Done)

- [x] `EquityChartSeries` 타입에서 `drift_pct` 제거 확인
- [x] `services/chart.ts` 에서 drift 관련 로직 제거 확인
- [x] `ModelCompareCard` 에 drift 값 표시 (값만, 라벨 없음) 확인
- [x] `formatDriftPct` 헬퍼 추가 확인
- [x] `AUDIT_20260422.md` 반영
- [x] 빌드 통과 (TypeScript 에러 없음)
- [ ] git commit 완료

---

## 6. CLAUDE.md 준수 사항

- **§5.5 주석 원칙**: drift 배열 제거 코드 주석/docstring 에 "과거에는 drift 배열을 받았으나" 등 변경 이력 서술 **금지**. 현재 상태만 기술.
- **§3.3 하드코딩 색상 금지**: 헤더 배지 색상은 `COLORS` 상수 사용
- **§3.1 함수형 컴포넌트**: 기존 `ModelCompareCard` 유지
- **§17.1 YAGNI**: "상태 라벨" 은 당장 불필요하므로 구현하지 않음 (사용자 요구 반영)
- **§17.2 간결성**: 새 카드 추가 대신 기존 카드 확장

---

## 7. 리스크 / 롤백

| 리스크 | 완화책 |
|---|---|
| 구버전 서버에서 아직 drift_pct 배열을 보낼 수 있음 | 타입 제거해도 JS 런타임상 잉여 키는 무시되므로 안전. 다만 서버 측 "다음 run-daily 부터" 라 시차 가능 |
| `mergeEquitySeries` 병합 로직 변경으로 차트 렌더 영향 | `setEquityChart` 이 이미 model/actual 만 사용 → 영향 없음 |

롤백: 이 commit 을 `git revert` 하면 drift 표시 제거 + 타입 복원으로 원복 가능.
