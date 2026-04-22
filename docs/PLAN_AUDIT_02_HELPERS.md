# PLAN_AUDIT_02 — 헬퍼 추출 및 포맷 통합

> **작성일**: 2026-04-22
> **기반 리포**: [AUDIT_APP.md](AUDIT_APP.md) §4.1, §4.2, §4.3, §6.1
> **범위**: `src/utils/format.ts` 에 3개 헬퍼 추가 + 4개 컴포넌트에서 중복 제거
> **원칙**: 동작 완전 동일. 순수 리팩토링.
> **완료 후**: 커밋 대기 → PLAN_AUDIT_03 진행

---

## 수정 항목

### 1. [Mid] `formatPendingShares` 헬퍼 추가 (§4.1 + §6.1 병합)

**배경**: pending 주문의 `delta_amount` 를 signal `close` 로 나눠 정수 주식수 문자열을 만드는 로직이 3곳에서 동일하게 반복됨. `close && close > 0` 패턴도 이 참에 `close != null && close > 0` 로 명시화.

**신규 함수**: [src/utils/format.ts](../src/utils/format.ts)
```typescript
// pending 주문의 delta_amount 를 주가로 나눠 정수 주식수 문자열로 포맷.
// 주가가 없거나 0 이하면 빈 문자열. 반환 끝에 공백 1 칸 포함 (호출부의 뒤따르는 라벨과 간격).
export const formatPendingShares = (
  deltaAmount: number,
  close: number | undefined,
): string => {
  if (close == null || close <= 0) return '';
  return `${Math.round(Math.abs(deltaAmount) / close)}주 `;
};
```

**교체 대상 3곳**:
- [src/components/ReminderBlock.tsx:46-50](../src/components/ReminderBlock.tsx#L46-L50)
- [src/components/SignalNextFillBlock.tsx:30-34](../src/components/SignalNextFillBlock.tsx#L30-L34)
- [src/components/SyncDialog.tsx:48-52](../src/components/SyncDialog.tsx#L48-L52)

**교체 패턴** (전):
```typescript
const close = signals?.[p.asset_id]?.close;
const sharesText =
  close && close > 0
    ? `${Math.round(Math.abs(p.delta_amount) / close)}주 `
    : '';
```

**교체 패턴** (후):
```typescript
const sharesText = formatPendingShares(
  p.delta_amount,
  signals?.[p.asset_id]?.close,
);
```

---

### 2. [Mid] `listPendingOrders` 헬퍼 추가 (§4.2)

**배경**: `ASSETS.flatMap((id) => { const p = pendingOrders?.[id]; return p ? [p] : []; })` 가 2곳에서 동일. ReminderBlock 은 이 위에 inbox 필터를 추가한 변형.

**신규 함수**: [src/utils/format.ts](../src/utils/format.ts)
```typescript
// pendingOrders 객체에서 ASSETS 순서대로 실제 주문만 배열로 수집.
export const listPendingOrders = (
  pendingOrders: Partial<Record<AssetId, PendingOrder>> | null,
): PendingOrder[] =>
  ASSETS.flatMap((id) => {
    const p = pendingOrders?.[id];
    return p ? [p] : [];
  });
```

**Import 추가**: `format.ts` 에 `PendingOrder` 타입과 `ASSETS` 상수 import. 의존 방향 위반 없음 (`utils → utils`, `utils → types`).

**교체 대상 2곳** (동일 패턴 그대로 치환):
- [src/components/SignalNextFillBlock.tsx:17-20](../src/components/SignalNextFillBlock.tsx#L17-L20) → `const pendings = listPendingOrders(pendingOrders);`
- [src/components/SyncDialog.tsx:23-26](../src/components/SyncDialog.tsx#L23-L26) → `const pendings = listPendingOrders(pendingOrders);`

**교체 대상 1곳** (변형 — `.filter()` 체인):
- [src/components/ReminderBlock.tsx:30-36](../src/components/ReminderBlock.tsx#L30-L36)

**교체 패턴** (전):
```typescript
const pendingsToRemind = ASSETS.flatMap((id) => {
  const p = pendingOrders?.[id];
  if (!p) return [];
  if (hasInboxForAsset(inboxFills, id)) return [];
  if (hasInboxForAsset(inboxFillDismiss, id)) return [];
  return [p];
});
```

**교체 패턴** (후):
```typescript
const pendingsToRemind = listPendingOrders(pendingOrders).filter(
  (p) =>
    !hasInboxForAsset(inboxFills, p.asset_id) &&
    !hasInboxForAsset(inboxFillDismiss, p.asset_id),
);
```

---

### 3. [Low] `formatSignedInt` 신설 + `ModelCompareCard.formatDiff` 제거 (§4.3)

**배경**: ModelCompareCard 에 로컬 `formatDiff` 가 있고, 현금 diff 는 별도로 `formatUSDInt(...).replace('$', '')` 인라인 조작. 실제로는 둘 다 **동일한 `(+N)` / `(-N)` / `""` 포맷** 이므로 공용 함수로 통일 가능.

**신규 함수**: [src/utils/format.ts](../src/utils/format.ts)
```typescript
// 정수 차이값에 부호 + 괄호를 붙여 표시. 0 이면 빈 문자열.
// 예: 3 → "(+3)", -3 → "(-3)", 0 → ""
export const formatSignedInt = (diff: number): string => {
  if (diff > 0) return `(+${diff})`;
  if (diff < 0) return `(${diff})`;
  return '';
};
```

**교체**: [src/components/ModelCompareCard.tsx](../src/components/ModelCompareCard.tsx)

1. 로컬 `formatDiff` 정의 제거 (lines 13-17)
2. 주식수 diff 렌더: `formatDiff(diff)` → `formatSignedInt(diff)` (line 77)
3. 현금 diff 렌더 (lines 90-95):

**전**:
```typescript
{cashDiff !== 0 ? ' ' : ''}
<Text style={{ color: cashDiffColor }}>
  {cashDiff !== 0
    ? `(${cashDiff > 0 ? '+' : ''}${formatUSDInt(cashDiff).replace('$', '')})`
    : ''}
</Text>
```

**후**:
```typescript
{cashDiff !== 0 ? ' ' : ''}
<Text style={{ color: cashDiffColor }}>
  {formatSignedInt(Math.round(cashDiff))}
</Text>
```

**사유**: `cashDiff` 는 float 가능 (서버 precision 6자리). 기존 `formatUSDInt` 가 내부에서 `Math.round` 를 해주므로 행동 일치를 위해 명시적 `Math.round(cashDiff)` 필요.

**검증**:
- cashDiff = 123.4 → 기존 `formatUSDInt(123.4).replace('$','')` = `"123"` → `(+123)` / 신규 `formatSignedInt(Math.round(123.4))` = `(+123)` ✓
- cashDiff = -123.4 → 기존 `formatUSDInt(-123.4).replace('$','')` = `"-123"` → `(-123)` / 신규 `formatSignedInt(-123)` = `(-123)` ✓
- cashDiff = 0 → 기존 `""` / 신규 `""` ✓

---

### 4. AUDIT_APP.md 상태 업데이트
- §4.1, §4.2, §4.3, §6.1 항목을 ✅ 완료로 변경
- 다음 단계 섹션을 PLAN_AUDIT_03 만 남도록 정리

---

## 실행 순서

1. [src/utils/format.ts](../src/utils/format.ts) — `PendingOrder` 타입 import + `ASSETS` import + 3개 헬퍼 함수 추가
2. [src/components/ReminderBlock.tsx](../src/components/ReminderBlock.tsx) — import 갱신 + `pendingsToRemind` / `sharesText` 교체
3. [src/components/SignalNextFillBlock.tsx](../src/components/SignalNextFillBlock.tsx) — import 갱신 + `pendings` / `sharesText` 교체
4. [src/components/SyncDialog.tsx](../src/components/SyncDialog.tsx) — import 갱신 + `pendings` / `sharesText` 교체
5. [src/components/ModelCompareCard.tsx](../src/components/ModelCompareCard.tsx) — `formatDiff` 제거 + `formatSignedInt` 사용 (import 갱신)
6. [AUDIT_APP.md](AUDIT_APP.md) 상태 업데이트

---

## 검증

모든 교체가 **동등 리팩토링** (동일 출력). 수동 실행 불요.

체크 포인트:
- 각 컴포넌트의 미사용 import 정리 (`ASSETS`, `formatUSDInt` 등 필요시)
- `formatUSDInt` 은 ModelCompareCard 에서 M/A 금액 표시에 여전히 쓰이므로 유지

---

## 완료 후 커밋 메시지 제안

```
refactor: pending 주식수 / 주문 수집 / 부호 정수 포맷 공용화 (PLAN_AUDIT_02)

- formatPendingShares / listPendingOrders / formatSignedInt 를 format.ts 에 추가
- ReminderBlock / SignalNextFillBlock / SyncDialog 의 중복 계산 제거
- ModelCompareCard 의 로컬 formatDiff 제거 (formatSignedInt 로 통일)
- close != null && close > 0 표현으로 명시화
```

---

**계획 끝**
