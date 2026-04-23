# PLAN 03 — 상수화 + 스타일 헬퍼

> **선행 감사**: [docs/AUDIT_20260422.md](AUDIT_20260422.md) CONST-01~04, RF-05
> **작업 순서**: 4개 계획서 중 3번
> **승인 방식**: 사전 승인 완료 — 작성 후 즉시 실행 → 완료 시 commit → 다음 계획서로

---

## 1. 목표

스타일 매직 넘버 제거 + `pressed && opacity` 중복 패턴 헬퍼화:

- `borderRadius: 8` (23회) → 단일 상수
- `padding: 12/14` (11회) → 단일 상수 셋
- `marginBottom: 12/8` (14회) → 단일 상수 셋
- `pressed && { opacity: 0.7 }` (23회) → 스타일 헬퍼 함수

---

## 2. 설계 결정

### 2.1 상수 배치

- 새 파일 대신 기존 `src/utils/constants.ts` 에 `UI` 섹션 추가 (§13.3 의 방향성 유지)
- 네이밍: 의도 중심 (`RADIUS_MD`, `PADDING_CARD_SM`, `GAP_MD`) 보다는 수치 단순 표현으로 하여 가독성 우선. `SPACING_*` prefix 사용.

### 2.2 상수 명

```ts
export const RADIUS_MD = 8;
export const PADDING_SM = 12;
export const PADDING_MD = 14;
export const MARGIN_SM = 8;
export const MARGIN_MD = 12;
```

### 2.3 pressed opacity 헬퍼

- 위치: `src/utils/colors.ts` 근처가 아닌 `src/utils/pressable.ts` 신규 파일 (스타일 헬퍼 단독)
- 네이밍: `pressedOpacity`
- 시그니처: `(pressed: boolean) => ViewStyle | null`
- 재사용 단일 값: `0.7`

```ts
import type { ViewStyle } from 'react-native';
export const PRESSED_OPACITY = 0.7;
export const pressedOpacity = (pressed: boolean): ViewStyle | null =>
  pressed ? { opacity: PRESSED_OPACITY } : null;
```

사용부 예시:
```tsx
<Pressable style={({ pressed }) => [styles.btn, pressedOpacity(pressed)]} />
```

### 2.4 제외 대상

- 1회만 등장하는 수치 (`64`, `gap: 6` 등) — YAGNI
- `pressed && !submitting && { opacity: 0.7 }` 같이 조건이 붙은 특수 케이스 — 헬퍼 적용 안 하고 유지

---

## 3. 영향 파일

### 3.1 상수 정의
- `src/utils/constants.ts` — UI 상수 섹션 추가

### 3.2 스타일 헬퍼
- `src/utils/pressable.ts` (신규)

### 3.3 상수 적용 대상 (borderRadius 8, padding 12/14, marginBottom 12/8)
- `src/components/Toast.tsx`
- `src/components/ReminderBlock.tsx`
- `src/components/SignalNextFillBlock.tsx`
- `src/components/MAProximityCard.tsx`
- `src/components/SyncDialog.tsx`
- `src/components/AssetSummaryCard.tsx`
- `src/components/ModelCompareCard.tsx`
- `src/components/ChartTypeToggle.tsx`
- `src/components/ErrorState.tsx`
- `src/components/HistoryList.tsx`
- `src/components/AdjustForm.tsx`
- `src/components/FillForm.tsx`
- `src/components/OfflineScreen.tsx`
- `src/screens/LoginScreen.tsx`
- `src/screens/HomeScreen.tsx`

### 3.4 pressedOpacity 적용 대상
- `src/components/ModelCompareCard.tsx`
- `src/components/SyncDialog.tsx`
- `src/components/ChartTypeToggle.tsx`
- `src/components/AssetSelector.tsx`
- `src/components/FillForm.tsx`
- `src/components/AdjustForm.tsx` (submitting 조건 있는 케이스는 유지)
- `src/components/HistoryList.tsx`
- `src/components/ErrorState.tsx`
- `src/screens/LoginScreen.tsx`
- `src/screens/TradeScreen.tsx`
- `src/screens/SettingsScreen.tsx`

### 3.5 AUDIT 문서
- `docs/AUDIT_20260422.md` — CONST-01~04, RF-05 완료 처리

---

## 4. 작업 순서

1. `src/utils/constants.ts` UI 상수 추가
2. `src/utils/pressable.ts` 신규 생성
3. 상수 적용 (파일별 순차 수정)
4. pressedOpacity 적용 (파일별 순차 수정)
5. TypeScript 컴파일 확인
6. AUDIT 업데이트
7. git commit

---

## 5. DoD

- [x] `constants.ts` 에 `RADIUS_MD / PADDING_SM/MD / MARGIN_SM/MD` 추가
- [x] `pressable.ts` 생성 + `pressedOpacity` / `PRESSED_OPACITY` export
- [x] 모든 대상 파일의 매직 넘버 → 상수 import
- [x] 모든 대상 파일의 `pressed && { opacity: 0.7 }` → `pressedOpacity(pressed)` 교체 (조건부 케이스 제외)
- [x] TypeScript 컴파일 통과
- [x] AUDIT CONST-01~03, RF-05 완료 표시 (CONST-04 는 PLAN_04 로 이관)
- [ ] git commit

---

## 6. CLAUDE.md 준수

- §3.3 하드코딩 색상 금지 원칙을 수치에도 적용
- §17.1 YAGNI: 1회 등장 수치는 상수화 안 함
- §17.2 간결성: 반복 패턴은 헬퍼로
- §5.5: 변경 이력 주석 금지
