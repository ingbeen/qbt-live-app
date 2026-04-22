# PLAN_03 — BUGS & FIXES (버그/동작 수정)

> **목적**: 감사에서 식별된 비즈니스 로직 오류, 버그, 불필요한 fallback 을 일괄 정리한다. PLAN_02 에서 준비한 상수/헬퍼를 실제 치환에 사용.
> **관련 감사 항목**: §1.2 ~ §1.10, §2.1, §2.3, §2.4, §2.6, §2.7, §2.8, §2.9, §6.1, §6.2, §6.3, §6.4, §5.7, §4.2, §4.4, §4.5, §4.9
> **주의**: §1.1 (processed) 는 Q1 답변에 따라 **설계서만** 수정 (PLAN_04 에서 다룸 — 문서 단독 작업).

---

## 범위 (파일별 그룹)

### A. `src/components/UpdateStatusBadge.tsx` (§1.2, §1.3, §3.3)
- `07:30 KST` 문자열 제거 → `업데이트: {executionDate}` 형식 (Q2 사용자 요청)
- `diff > 4` 매직 넘버 → `STALE_WARNING_DAYS` 상수 사용

### B. `src/screens/SettingsScreen.tsx` (§1.2, §1.4)
- `'${portfolio.execution_date} 07:30 KST'` → `portfolio.execution_date` 만 표시
- `rtdbOk = portfolio != null && !lastError` → `portfolio != null` 로 단순화 (체결 저장 실패 시 오탐 방지)

### C. `src/components/HistoryList.tsx` (§1.6)
- `formatUSD(f.actual_price)` → `formatUSDPrice(f.actual_price)` 로 정밀도 유지 (PLAN_02 에서 추가)

### D. `src/screens/TradeScreen.tsx` (§1.7, §1.9)
- portfolio null + loading false 상태에서 `ErrorState` 분기 추가 (HomeScreen 과 유사)
- `useEffect` 를 2개로 분리:
  - 마운트 시 `refreshTrade()` 실행
  - `needsHomeData` 변경 시 `refreshHome()` 실행

### E. `src/store/useStore.ts` (§1.8, §4.2)
- `toUserMessage` 의 `raw.includes('permission')` → `/PERMISSION_DENIED|RTDB.*denied/i` 정규식
- 사용자 메시지에서 "OWNER_UID 설정" 같은 내부 식별자 제거 → 일반 표현
- `refreshChart` 의 price/equity 분기 일부 공통화 (가능한 선에서)

### F. `src/components/FillForm.tsx` (§1.5, §2.7, §6.1)
- pending delta 계산 부분에 `close > 0` 가드 추가 (§1.5)
- `trade_date` 초기값이 첫 렌더에만 today() 라 날이 바뀌어도 리셋 안 됨 → 마운트/포커스 시점에 리셋 (react navigation focus 사용 가능)
  - 대안: submit 성공 시 `today()` 로 리셋, 그리고 pending 상태 변화 시 리셋
- `portfolio.assets[assetId ?? 'sso'] && assetId` 죽은 fallback → `assetId ? ...` 로 단순화 (§6.1)

### G. `src/components/AdjustForm.tsx` (§2.4)
- `new Date((entryDate || today()) + 'T00:00:00')` → `+'T00:00:00+09:00'` 로 TZ 명시

### H. `src/components/Toast.tsx` (§2.8, §3.6)
- `autoHideMs = 3000` → `TOAST_AUTO_HIDE_MS` 상수 사용
- 동일 message 두 번 set 시 autoHide 타이머 rearm — message 에 의존하지 않는 effect 구조로 변경
  - 해결책: 외부에서 매번 새 객체로 변경되도록 하거나, useEffect deps 에 `message` 포함 + 상위 `showToast` 호출 시 유니크 값 처리
  - 간단한 접근: 메시지가 null 이 아닐 때 무조건 setTimeout 재시작 + message 가 같더라도 hideToast 호출은 정상 동작

### I. `src/services/chart.ts` (§1.10, §6.2)
- `mergeChartSeries` 주석 "archives → recent 순서 ingest, Map.set 덮어쓰기로 recent 우선" 보강
- `close[i] as number` / `model_equity[i] as number` 타입 단언 제거 → 길이 불일치 가드 + 로그 추가

### J. `src/components/AssetSummaryCard.tsx` (§6.3)
- `signals?.[id]?.close ?? 0` → signals null 일 때 비중 "-" 로 표시 (0.0% 오탐 방지)

### K. `src/services/rtdb.ts` (§6.4, §4.5)
- `submitFill` / `submitBalanceAdjust` 의 `p.input_time_kst || kstNow()` → 호출부(AdjustForm 등)가 kstNow() 직접 전달하도록 이동. 서비스 단 폴백은 공백 문자열 케이스가 의도적 입력이 아님을 명확히.
- `readHistoryFills` / `readHistoryBalanceAdjusts` 공통 로직 → `readNested2LevelTree` 제네릭 헬퍼로 추출

### L. `src/components/AdjustForm.tsx` + rtdb 연계 (§6.4 관련)
- `input_time_kst: ''` 보내는 부분 → `kstNow()` 직접 전달

### M. `src/services/fcm.ts` (§2.1)
- `onTokenRefresh` 의 unsubscribe 함수 저장 (module-level `tokenRefreshUnsub`)
- 재호출 시 이전 unsub → 새 subscribe

### N. `src/screens/ChartScreen.tsx` (§2.3, §2.9)
- `recent.dates.length === 0` 일 때 명확한 에러 상태 (toast) + 로드 실패 로그
- `WebView onError` 시 `setWebviewReady(false)` 호출

### O. `src/components/PullToRefreshScrollView.tsx` (§2.6)
- `keyboardShouldPersistTaps="handled"` prop 추가

### P. `src/components/HistoryList.tsx` (§4.4)
- `buildHistoryTimeline` 의 3 종 이벤트 빌더를 `fillsToEvents` / `adjustsToEvents` / `signalsToEvents` 어댑터로 분리

### Q. `src/services/auth.ts` (§4.9)
- `lastKey` 문자열 비교 → `lastUid: string | null` / `lastEmail: string | null` 분리 (가독성)

### R. `src/services/network.ts` (§5.7)
- `setupNetworkListener` 호출 직후 `NetInfo.fetch()` 병행하여 초기 상태 확정

---

## 작업 순서

단순 교체 → 복잡 변경 순:

1. (H) Toast 상수/autoHide 보강
2. (C) HistoryList formatUSDPrice 교체
3. (A) UpdateStatusBadge (§1.2, §1.3)
4. (B) SettingsScreen (§1.2, §1.4)
5. (F) FillForm (§1.5, §2.7, §6.1)
6. (G) AdjustForm TZ 명시
7. (L) AdjustForm + rtdb input_time_kst 흐름 정리
8. (J) AssetSummaryCard null 처리
9. (E) useStore toUserMessage / refreshChart 정리
10. (O) PullToRefreshScrollView keyboard
11. (M) fcm onTokenRefresh unsub
12. (N) ChartScreen 빈 recent / webview error
13. (I) chart.ts 주석/가드
14. (D) TradeScreen ErrorState + useEffect 분리
15. (P) HistoryList 어댑터 분리
16. (Q) auth lastUid/lastEmail
17. (R) network NetInfo.fetch
18. (K) rtdb readNested2LevelTree 제네릭

---

## 검증 절차

1. `npm run lint` — 에러 0, 경고는 기존 + 신규 허용 범위 내
2. `npm start` 로 Metro 기동
3. `git diff --stat` — 변경 범위 예상과 일치

---

## 커밋 메시지 (예정)

```
fix: 비즈니스 로직 / 버그 / fallback 정리 (PLAN_03)

- UpdateStatusBadge: "07:30 KST" 제거, STALE_WARNING_DAYS 상수 사용
- SettingsScreen: 시각 표기 제거, rtdbOk 판정을 portfolio 단독으로
- HistoryList: formatUSDPrice 로 actual_price 정밀도 유지
- FillForm: close > 0 가드, submit 성공 시 trade_date 리셋, 죽은 fallback 제거
- AdjustForm: DateTimePicker value 에 KST TZ 명시, input_time_kst 호출부 처리
- Toast: 상수 사용, 동일 message 재입력 시 타이머 rearm 처리
- AssetSummaryCard: signals null 일 때 "-" 표기
- useStore: toUserMessage 정규식 + 사용자 메시지 정리, refreshChart 부분 공통화
- PullToRefreshScrollView: keyboardShouldPersistTaps="handled"
- fcm: onTokenRefresh unsub 저장/해제로 리스너 누적 방지
- ChartScreen: 빈 recent 처리, onError 시 webviewReady 리셋
- chart.ts: 주석 보강, 타입 단언 제거 + 길이 가드
- TradeScreen: ErrorState 분기, useEffect 분리
- HistoryList: 빌더를 kind별 어댑터로 분리
- auth: lastKey → lastUid/lastEmail 분리
- network: setupNetworkListener 후 NetInfo.fetch 로 초기 상태 확정
- rtdb: readNested2LevelTree 제네릭으로 fills/adjusts 히스토리 공통화
```

---

**문서 끝**
