# PLAN_AUDIT_04 — 서버 회신 반영 (옵션 A 선택)

> **작성일**: 2026-04-22
> **기반 문서**: [AUDIT_APP_ACTIONS.md](AUDIT_APP_ACTIONS.md) (서버 회신)
> **결정 사항**: §1.3 에 대해 **옵션 A** (dead code 제거) 채택
> **범위**: 타입 분리 + dead code 제거 + reason 타입 엄격화 + 문서 상태 업데이트 + 서버 회신 기록
> **원칙**: 동작 변경 없음. 현재 UI 에서 이미 나타나지 않는 배지를 제거하고, 타입만 실제 서버 계약과 1:1 맞춤.
> **완료 후**: 커밋 대기 → AUDIT 시리즈 종료

---

## 수정 항목 (총 5 섹션)

### 1. `ChartMeta` 타입 분리 (서버 §3.1 → 앱 측 후속)

**근거**: 서버 실제 dataclass 가 price/equity 로 이미 분리되어 있음. 앱도 1:1 대응.

#### 1.1 `src/types/rtdb.ts` — 타입 정의 교체

**전**:
```ts
export interface ChartMeta {
  first_date: string;
  last_date: string;
  ma_window?: number;
  recent_months: number;
  archive_years: number[];
}
```

**후**:
```ts
// 주가 차트 메타 — ma_window 필수 (이동평균 기간)
export interface PriceChartMeta {
  first_date: string;
  last_date: string;
  ma_window: number;
  recent_months: number;
  archive_years: number[];
}

// equity 차트 메타 — ma_window 개념 없음
export interface EquityChartMeta {
  first_date: string;
  last_date: string;
  recent_months: number;
  archive_years: number[];
}
```

#### 1.2 `src/services/rtdb.ts` — import / 리턴 타입 교체

- `ChartMeta` import → `PriceChartMeta, EquityChartMeta` 로 교체
- `readPriceChartMeta` 리턴 타입: `Promise<PriceChartMeta | null>`
- `readOnce<ChartMeta>` 제네릭: 각각 `<PriceChartMeta>` / `<EquityChartMeta>` 로
- `readEquityChartMeta` 리턴 타입: `Promise<EquityChartMeta | null>`

#### 1.3 `src/store/useStore.ts` — 캐시 인터페이스 타입 교체

- `ChartMeta` import → `PriceChartMeta, EquityChartMeta`
- `PriceChartCache.meta: PriceChartMeta | null`
- `EquityChartCache.meta: EquityChartMeta | null`

#### 1.4 영향 없는 consumer 확인
- `ChartScreen.tsx` 는 store 에서 `priceCharts[asset].meta` 를 받아 쓰므로 타입만 따라감 (코드 변경 없음)

---

### 2. `HistoryList` dead code 제거 (서버 §1.3 → 옵션 A)

**근거**: 현재 `reason` 값이 항상 `""` 이라 `fillTagBadge` 는 언제나 `null` 리턴. 배지가 **한 번도 렌더되지 않는 dead code**.

#### 2.1 `src/components/HistoryList.tsx` 수정

- **제거**: `fillTagBadge` 함수 (lines 113-117 전체)
- **제거**: 렌더 루프 내부의 `tagBadge` 변수 선언 및 할당 (`let tagBadge`, `tagBadge = fillTagBadge(e.fill)`)
- **제거**: 조건부 렌더 블록 `{tagBadge ? <Badge ... /> : null}`
- **유지**: 메인 "체결" / "보정" / "신호" 타입 배지는 그대로

**결과**: 렌더 결과 동일 (이전에도 배지가 안 뜨고 있었으므로).

---

### 3. `FillPayload.reason` 타입 엄격화 (서버 §3.4)

**근거**: 설계서 `§8.2.7` 에 `reason: str (default "")` 로 필수 표기. 서버가 빈 문자열 허용. 앱 타입을 optional 에서 필수로 전환하면 TS 계약과 설계서가 일치.

#### 3.1 `src/types/rtdb.ts` 수정

```ts
// 전
memo?: string | null;
reason?: string;

// 후
memo?: string | null;
// 사용자가 입력한 체결 사유 (자유 텍스트). 서버는 변환하지 않고
// 그대로 /history/fills/.../reason 에 저장. 현재 앱은 사유 입력 UI 가
// 없어 항상 빈 문자열을 전송.
reason: string;
```

#### 3.2 `src/components/FillForm.tsx` 수정

payload 객체에 `reason: ''` 명시 추가 (line 62-72 의 `useMemo`):

```ts
const payload = useMemo<Partial<FillPayload>>(
  () => ({
    asset_id: assetId,
    direction,
    actual_shares: parseIntOrUndefined(sharesText),
    actual_price: parseFloatOrUndefined(priceText),
    trade_date: tradeDate,
    memo: memo || null,
    reason: '',  // 추가 — 현재 앱은 사유 입력 UI 없음 (설계서 §8.2.7 기본값)
  }),
  // ...
);
```

#### 3.3 `src/services/rtdb.ts::submitFill` 단순화

`reason` 이 이제 필수이므로 `?? ''` 폴백 불필요:

**전**:
```ts
export const submitFill = async (p: FillPayload): Promise<void> => {
  const key = uuid.v4() as string;
  const payload: FillPayload = {
    ...p,
    reason: p.reason ?? '',
  };
  await withTimeout(
    set(dbRef(`${RTDB_PATHS.FILLS_INBOX}/${key}`), payload),
    RTDB_TIMEOUT_MS,
  );
};
```

**후**:
```ts
export const submitFill = async (p: FillPayload): Promise<void> => {
  const key = uuid.v4() as string;
  await withTimeout(
    set(dbRef(`${RTDB_PATHS.FILLS_INBOX}/${key}`), p),
    RTDB_TIMEOUT_MS,
  );
};
```

(위 주석 95-96 "reason 은 설계서 기본값 … 폴백만 유지" 도 삭제 — 더 이상 유효하지 않음)

---

### 4. `AUDIT_APP.md` 상태 업데이트

서버 답변으로 해제된 ⏸ 3건을 ✅ 로 전환:

- **§2.1** `portfolio.assets[id]` → **결정: 현 타입 유지** (서버가 항상 4자산 보장 확약). 코드 변경 없음
- **§7.1** `ChartMeta.ma_window` → 본 플랜에서 처리 완료
- **§7.2** `FillPayload.reason` → 본 플랜에서 처리 완료

요약 표 / 처리 상태 표 / 다음 단계 섹션의 숫자 재계산.

---

### 5. `AUDIT_SERVER.md` 에 앱 측 답변 기록

서버가 회신을 요청한 양식에 따라 해당 섹션 하단에 한 줄씩 추가:

- **§1.3** (reason 불일치): `**앱 측 답변**: 옵션 A 채택. HistoryList fillTagBadge 제거 완료 (PLAN_AUDIT_04). 서버 측 §8.2.11 reason 설명을 "사용자 자유 텍스트" 로 명확화 요청.`
- **§3.1** (ChartMeta): `**앱 측 답변**: 타입 분리 완료 — PriceChartMeta / EquityChartMeta (PLAN_AUDIT_04).`
- **§3.2** (Portfolio.assets): `**앱 측 답변**: 현 타입 유지 결정 (서버 4자산 보장 확약 기반). 코드 변경 없음.`
- **§3.4** (FillPayload.reason): `**앱 측 답변**: 타입 필수 전환 완료 (PLAN_AUDIT_04). FillForm 에서 `reason: ''` 명시 전송.`

---

## 실행 순서

1. [src/types/rtdb.ts](../src/types/rtdb.ts) — `ChartMeta` 분리 + `FillPayload.reason` 필수화
2. [src/services/rtdb.ts](../src/services/rtdb.ts) — import / 리턴 타입 / `submitFill` 단순화
3. [src/store/useStore.ts](../src/store/useStore.ts) — import / 캐시 타입
4. [src/components/FillForm.tsx](../src/components/FillForm.tsx) — payload 에 `reason: ''` 추가
5. [src/components/HistoryList.tsx](../src/components/HistoryList.tsx) — `fillTagBadge` 및 관련 로직 제거
6. [docs/AUDIT_APP.md](AUDIT_APP.md) — 3건 ⏸ → ✅ 상태 전환, 요약 업데이트
7. [docs/AUDIT_SERVER.md](AUDIT_SERVER.md) — 4개 섹션에 앱 측 답변 추가

---

## 검증

- 모든 변경은 **타입 계약을 서버 실제 동작과 일치** 시키는 것. 런타임 동작 변경 없음.
- `HistoryList` 배지 제거는 현재도 안 뜨던 배지이므로 시각적 차이 없음
- `reason: ''` 는 기존 `?? ''` 폴백과 동일 wire format
- TypeScript 타입 체크로 모든 call site 정합성 자동 검증됨

---

## 완료 후 커밋 메시지 제안

```
refactor: ChartMeta 분리 + reason dead code 제거 (PLAN_AUDIT_04)

- ChartMeta 를 PriceChartMeta / EquityChartMeta 로 분리 (서버 실제 dataclass 와 1:1)
- HistoryList.fillTagBadge 제거 (서버가 reason 을 변환하지 않아 배지 미렌더였음)
- FillPayload.reason 을 optional → 필수(string) 로 엄격화
- FillForm 에서 reason: '' 명시 전송, submitFill 의 ?? '' 폴백 제거
- AUDIT_APP.md: ⏸ 3건(§2.1/§7.1/§7.2) ✅ 로 전환
- AUDIT_SERVER.md: 4개 섹션에 앱 측 답변 기록
```

---

**계획 끝**
