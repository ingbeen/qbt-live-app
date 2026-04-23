# PLAN 02 — 코드 로직 정리 (BUG + FB 일괄)

> **선행 감사**: [docs/AUDIT_20260422.md](AUDIT_20260422.md) BUG-01~03, FB-01~03
> **작업 순서**: 4개 계획서 중 2번
> **승인 방식**: 사전 승인 완료 — 작성 후 즉시 실행 → 완료 시 commit → 다음 계획서로

---

## 1. 목표

서버 측 설계 계약을 믿고 **불필요한 방어 코드 제거** + **UI 가독성 영향 주는 버그 수정**:

- 설계서 §8.2.1: `Portfolio.assets` 는 항상 4자산 전체 포함 보장
- 설계서 §8.2.2: `signals` 는 매 실행마다 전체 덮어쓰기
- 위 두 보장에 의존하는 코드의 옵셔널 체이닝 / `?? 0` / 과도한 fallback 제거
- `formatPendingShares` 의 빈 문자열 반환으로 인한 UI 손상 해결

---

## 2. 영향 파일 및 변경 내역

| 항목 | 파일 | 변경 내용 |
|---|---|---|
| BUG-01 / FB-01 | `src/screens/HomeScreen.tsx` | `signals` null 체크를 부모에서 하고 컴포넌트엔 non-null 전달 |
| BUG-01 / FB-01 | `src/components/ReminderBlock.tsx` | `signals` prop 타입을 non-null 로, 옵셔널 체이닝 제거 |
| BUG-01 / FB-01 | `src/components/SignalNextFillBlock.tsx` | 동일 |
| FB-01 | `src/components/MAProximityCard.tsx` | `signals` prop non-null, `?? 0` 제거 |
| BUG-02 | `src/screens/ChartScreen.tsx` | `dates.length` 체크 후 직접 접근으로 `parseInt` 가독성 개선 |
| BUG-03 / FB-02 | `src/components/AdjustForm.tsx` | `isAsset` 을 type guard 함수로 전환, `currentShares ?? 0` 제거 |
| FB-03 | `src/utils/validation.ts` | `portfolio.assets[p.asset_id]?.actual_shares ?? 0` 의 옵셔널/fallback 제거, `as AssetId` 캐스트 제거 |

---

## 3. 세부 작업

### 3.1 signals non-null 전파 (BUG-01 / FB-01 통합)

**패턴**: HomeScreen 에서 `signals === null` 이면 ReminderBlock / SignalNextFillBlock / MAProximityCard 자체를 렌더하지 않도록 차단. 세 컴포넌트의 `signals` prop 은 `Record<AssetId, Signal>` non-null 로 변경.

- ReminderBlock/SignalNextFillBlock 내부: `signals?.[p.asset_id]?.close` → `signals[p.asset_id].close`
- MAProximityCard 내부: `signals?.[id]?.ma_distance_pct ?? 0` → `signals[id].ma_distance_pct`

### 3.2 formatPendingShares 호출부 정합화 (BUG-01)

호출부에서 signals non-null 보장 후 `close` 항상 양수라는 설계 계약대로 `formatPendingShares` 의 `if (close == null || close <= 0)` 가드 제거 가능. 단, `close: number` 로 받는 시그니처로 변경하여 호출 측 책임 분명히.

### 3.3 ChartScreen dates 가드 명확화 (BUG-02)

```ts
// 현재
const recentEarliestYear = parseInt(
  (recent.dates[0] ?? '').slice(0, 4),
  10,
);
if (!Number.isFinite(recentEarliestYear)) return;
```
```ts
// 변경 후
const firstDate = recent.dates[0];
if (!firstDate) return;
const recentEarliestYear = parseInt(firstDate.slice(0, 4), 10);
```

`recent.dates.length === 0` 체크는 이미 존재하므로 그 직후 `dates[0]` 은 `undefined` 가 아니지만, `noUncheckedIndexedAccess` 때문에 `undefined` 타입 포함. `firstDate` 를 변수로 받아 단일 null 가드.

### 3.4 AdjustForm target type guard (BUG-03 / FB-02)

```ts
// 추가
const isAssetTarget = (t: Target | undefined): t is AssetId =>
  t !== undefined && t !== 'cash';
```

`isAsset` boolean 변수를 type guard 함수 호출로 교체:
- `{isAsset ? ...}` → `{isAssetTarget(target) ? ...}`
- 블록 내부에서 `target` 이 `AssetId` 로 자동 좁혀짐 → `portfolio.assets[target].actual_shares` 직접 접근
- `currentShares ?? 0` 제거

### 3.5 validation.ts 옵셔널/캐스트 제거 (FB-03)

```ts
// validateFill (현재)
const owned = portfolio.assets[p.asset_id]?.actual_shares ?? 0;
// 변경 후 (p.asset_id truthy 체크 후이므로 AssetId 로 좁혀짐)
const owned = portfolio.assets[p.asset_id].actual_shares;
```

```ts
// validateBalanceAdjust (현재)
const owned = portfolio.assets[p.asset_id as AssetId]?.actual_shares ?? 0;
// 변경 후 (p.asset_id truthy 체크 후 AssetId 로 좁혀짐, 캐스트 불필요)
const owned = portfolio.assets[p.asset_id].actual_shares;
```

---

## 4. DoD

- [x] HomeScreen 에서 signals null 시 관련 카드 차단 렌더
- [x] ReminderBlock / SignalNextFillBlock / MAProximityCard signals non-null prop 적용
- [ ] ~~formatPendingShares 시그니처 정합화~~ — SyncDialog 가 여전히 optional signals 를 사용하므로 현상 유지 (범위 밖)
- [x] ChartScreen dates 가드 2곳 명확화
- [x] AdjustForm type guard 도입 + `currentShares ?? 0` 제거
- [x] validation.ts 2곳 옵셔널/캐스트/fallback 제거
- [x] TypeScript 컴파일 통과
- [x] AUDIT BUG-01~03, FB-01~03 완료 표시
- [ ] git commit

---

## 5. CLAUDE.md 준수

- §5.5: 변경 이력/과거 상태 주석 금지
- §17.1 YAGNI: 설계 계약 밖 방어 코드 제거
- §17.2 간결성: 명시적 타입 좁히기
- §17.4 사용자 중심: BUG-01 은 UI 가독성 개선
