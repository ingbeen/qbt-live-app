# PLAN_02 — CONSTANTS & HELPERS (상수화 및 공통 헬퍼 추가)

> **목적**: 흩어져 있는 매직 넘버 / 버전 문자열 / 중복 유틸을 `src/utils/` 하부로 일원화한다. PLAN_03 / PLAN_04 에서 바로 활용되는 "빌딩 블록" 단계.
> **관련 감사 항목**: §3.1, §3.3, §3.4, §3.5, §3.6, §3.9, §3.10, §3.12, §4.1, §4.6, §4.7, §1.6 (정밀도 포매터)

---

## 범위

### A. `src/utils/constants.ts` 확장

추가할 상수 (기존 구조 유지, 의미별로 묶음):

```ts
// 네트워크/타임아웃
export const RTDB_TIMEOUT_MS = 10_000;

// UI 수치
export const TOAST_AUTO_HIDE_MS = 3_000;
export const STALE_WARNING_DAYS = 4;         // UpdateStatusBadge 경고 임계 (거래일 아님, 달력일 기준)
export const CASH_DIFF_THRESHOLD_USD = 1;    // ModelCompareCard 현금 diff 색상 임계

// 외부 라이브러리 버전
export const CHART_LIB_VERSION = '4.2.0';    // TradingView Lightweight Charts

// 자산 확장
export const ASSET_TARGETS: readonly (AssetId | 'cash')[] = [...ASSETS, 'cash']; // §3.12
```

### B. `src/utils/colors.ts` 확장 — alpha 헬퍼

```ts
// 6자리 hex 색상에 2자리 alpha 를 붙여 #rrggbbaa 형식 리턴.
// alphaHex 는 '00'~'ff' 범위의 2자리 문자열.
export const withAlpha = (color: string, alphaHex: string): string =>
  `${color}${alphaHex}`;

// 자주 쓰는 프리셋
export const COLOR_PRESETS = {
  accentMuted: withAlpha(COLORS.accent, '22'),
  accentBorder: withAlpha(COLORS.accent, '55'),
  greenMuted: withAlpha(COLORS.green, '22'),
  redMuted: withAlpha(COLORS.red, '22'),
  orangeBg: withAlpha(COLORS.orange, '22'),
  orangeBorder: withAlpha(COLORS.orange, '70'),
} as const;
```

> 기존 코드의 `COLORS.orange + '22'` 같은 문자열 결합은 **PLAN_03 / PLAN_04** 에서 점진적으로 치환한다. PLAN_02 에서는 헬퍼만 추가.

### C. `src/utils/parse.ts` (신규) — 폼 파싱 헬퍼

FillForm / AdjustForm 에 복붙된 헬퍼를 한 파일로 이관.

```ts
// Date → 'YYYY-MM-DD'
export const toIsoDate = (d: Date): string => { ... };

// '' or 유효하지 않으면 undefined, 유효하면 정수
export const parseIntOrUndefined = (s: string): number | undefined => { ... };

// '' or 유효하지 않으면 undefined, 유효하면 실수
export const parseFloatOrUndefined = (s: string): number | undefined => { ... };
```

### D. `src/utils/format.ts` 확장

1. **`formatUSDPrice`** (신규) — 주가 소수점 정밀도용 (감사 §1.6)
   ```ts
   // 체결가/주가 등 6자리 정밀도까지 유지. 소수점 4자리로 표기하여
   // HistoryList 에서 actual_price 정보 손실 방지.
   export const formatUSDPrice = (amount: number): string => { ... };
   ```

2. **`formatSignedUSD`** (신규) — 부호 + $ 조합 포매터 (감사 §4.6)
   ```ts
   // +$123 / -$45 형태로 음수/양수 부호 포함
   export const formatSignedUSD = (amount: number): string => { ... };
   ```

### E. `src/utils/validation.ts` 확장

**`validateIsoDateNotFuture`** (신규, 감사 §4.1)

```ts
// 'YYYY-MM-DD' 형식 + 미래 날짜 아님 검증. 에러면 한글 메시지 리턴, 통과면 null.
export const validateIsoDateNotFuture = (value: string): string | null => { ... };
```

기존 `validateFill` / `validateBalanceAdjust` 내부에서 이 헬퍼 호출로 치환.

### F. `src/store/useStore.ts` — setLoading 헬퍼 (감사 §4.7)

액션 내부의 `set({ loading: { ...get().loading, key: bool } })` 패턴을 헬퍼로 추출.

```ts
// Store 내부 비공개 헬퍼. create 의 set/get 에 접근 가능한 스코프에 정의.
const setLoading = (key: string, value: boolean) =>
  set((state) => ({ loading: { ...state.loading, [key]: value } }));
```

> Zustand 의 `set` 이 함수형 업데이트를 지원하므로 `get()` 호출 회수가 줄어 가독성 개선.

---

## 작업 순서

1. `constants.ts` 상수 추가 (ASSET_TARGETS 는 ASSETS import 위치 주의)
2. `colors.ts` 헬퍼 + 프리셋 추가
3. `parse.ts` 신규 파일 생성
4. `format.ts` 에 `formatUSDPrice`, `formatSignedUSD` 추가
5. `validation.ts` 에 `validateIsoDateNotFuture` 추가 + 기존 호출부 2곳 치환
6. `useStore.ts` 에 `setLoading` 헬퍼 적용 (기존 `loading: { ... }` 패턴 전부 치환)
7. 기존 파일의 중복 헬퍼 제거 / 신규 헬퍼 참조로 교체:
   - `FillForm.tsx`: `toIsoDate`, `parseIntOrUndefined`, `parseFloatOrUndefined` 제거 → `parse` 모듈 import
   - `AdjustForm.tsx`: 동일

---

## 주의사항

- **행동 변화가 있는 것**: `formatUSDPrice` 는 PLAN_02 에서 **추가만** 하고, `HistoryList.tsx` 의 실제 치환은 PLAN_03 (§1.6) 에서 수행.
- **행동 변화가 없는 것**: 상수화 / 헬퍼 추가 / 중복 제거는 같은 동작을 유지.
- ASSET_TARGETS 는 아직 `AdjustForm` 이 사용하지 않지만 PLAN_03 에서 쓸 예정.

---

## 검증 절차

1. `npm run lint` — 통과 (기존 경고 9개는 유지, 새 에러 없음)
2. `git diff --stat` 으로 예상 파일 범위 확인
3. 동작 회귀: `useStore` 의 `loading` 키 설정이 기존과 동일하게 동작하는지 (타입 체크)

---

## 커밋 메시지 (예정)

```
refactor: 상수화 및 공통 헬퍼 도입 (PLAN_02)

- constants.ts: RTDB_TIMEOUT_MS, TOAST_AUTO_HIDE_MS, STALE_WARNING_DAYS,
  CASH_DIFF_THRESHOLD_USD, CHART_LIB_VERSION, ASSET_TARGETS 추가
- colors.ts: withAlpha 헬퍼 + COLOR_PRESETS 프리셋
- utils/parse.ts 신설 (toIsoDate, parseIntOrUndefined, parseFloatOrUndefined)
- format.ts: formatUSDPrice (정밀도 4자리), formatSignedUSD 추가
- validation.ts: validateIsoDateNotFuture 추출
- useStore.ts: setLoading 헬퍼로 loading 업데이트 패턴 축약
- FillForm / AdjustForm: 로컬 parse 헬퍼 제거, 공통 모듈 참조
```

---

**문서 끝**
