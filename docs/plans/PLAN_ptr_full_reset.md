# Implementation Plan: PTR 전체 화면 리셋 (브라우저 새로고침 동작)

> 작성/운영 규칙(SoT): 반드시 [docs/CLAUDE.md](../CLAUDE.md)를 참고하세요.
> (이 템플릿을 수정하거나 새로운 양식의 계획서를 만들 때도 [docs/CLAUDE.md](../CLAUDE.md)를 포인터로 두고 준수합니다.)

**상태**: In Progress (사용자 실기 검증 대기)

---

**이 영역은 삭제/수정 금지**

**상태 옵션**: Draft / In Progress / Done

**Done 처리 규칙**:

- Done 조건: DoD 모두 [x] + `npm run lint` / `npx tsc --noEmit` 통과 + 사용자 실기 검증 완료
- 스킵(미수행 항목)이 1개라도 존재하면 Done 처리 금지 + DoD 검증 항목 체크 금지
- 상세: [docs/CLAUDE.md](../CLAUDE.md) 참고

---

**작성일**: 2026-04-29 14:00
**마지막 업데이트**: 2026-04-29 14:30
**관련 범위**: screens, store
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

- [x] 모든 PTR(홈/차트/거래/설정) 이 "브라우저 새로고침" 처럼 동작: 화면 본체가 unmount → mount 되어 모든 로컬 `useState` / `useRef` 가 첫 진입 상태로 리셋된다.
- [x] PTR 시 해당 화면 도메인의 store 캐시를 비우고 재로드하여, 첫 진입과 동일한 네트워크 fetch 가 발생한다.
- [x] 차트 탭은 PTR 후 자산 `sso`, 차트 타입 `price`, 줌 마지막 1년 으로 복귀한다.
- [x] 거래 탭은 PTR 후 모드 `fill`, FillForm/AdjustForm 의 모든 입력값이 비어 있는 상태로 복귀한다.

## 2) 비목표(Non-Goals)

- 차트 탭에서 모든 자산(SSO/QLD/GLD/TLT) + Equity 를 PTR 시 즉시 병렬 fetch 하지 않는다. 첫 진입과 동일하게 현재 보이는 자산만 lazy 로 로드되고, 다른 자산은 사용자가 전환할 때 로드된다.
- store 의 세션/네트워크 상태(`user`, `isOnline`, `deviceId`, `fcmRegistered`) 는 PTR 로 영향받지 않는다.
- React Navigation 의 탭 자체를 unmount 하지 않는다(탭 헤더/탭바 유지).
- WebView HTML 자체를 변경하지 않는다 (차트 라이브러리 / 메시지 프로토콜 유지).

## 3) 배경/맥락(Context)

### 현재 문제점 / 동기

- 사용자 요구: PTR 은 "브라우저 새로고침"처럼 모든 화면 상태가 첫 진입처럼 리셋되어야 한다.
- 현재 동작:
  - **홈**: `refreshHome()` 만 호출. `dialogVisible` 등 로컬 state 유지.
  - **차트**: 현재 보이는 1개 차트만 `refreshChart()`. `chartType`/`assetId`/줌은 보존.
  - **거래**: `refreshHome + refreshTrade` 만 호출. `mode` 와 FillForm/AdjustForm 의 입력값 모두 보존(다음 PTR 까지 사용자가 입력하던 값이 그대로 남음).
  - **설정**: `refreshHome()` 호출. `signingOut` 보존.
- React Native 의 `RefreshControl.onRefresh` 는 콜백만 호출할 뿐 컴포넌트를 unmount 하지 않으므로, 브라우저 F5 와 달리 `useState` 가 유지된다. "브라우저처럼" 동작시키려면 명시적 리마운트가 필요하다.

### 영향받는 규칙(반드시 읽고 전체 숙지)

> 아래 문서에 기재된 규칙을 **모두 숙지**하고 준수합니다.

- 루트 `CLAUDE.md`
- 서버 데이터 계약: `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 SoT, 변경 금지)
- 실행 명령어 SoT: `docs/COMMANDS.md`

## 4) 완료 조건(Definition of Done)

> Done 은 "서술" 이 아니라 "체크리스트 상태" 로만 판단합니다. (정의/예외는 docs/CLAUDE.md)

- [x] 4개 탭 모두 PTR 시 "첫 진입과 동일한 화면 상태 + 데이터 재로드" 로 복귀한다. (구현 완료, 사용자 실기 검증 대기)
- [x] 거래 탭에서 입력값을 채운 뒤 PTR → 모든 입력 필드가 빈 상태로 리셋된다. (구현 완료, 사용자 실기 검증 대기)
- [x] 차트 탭에서 `qld` 자산으로 전환·줌 변경 후 PTR → `sso` `price` 마지막 1년 줌으로 복귀한다. (구현 완료, 사용자 실기 검증 대기)
- [x] 홈 탭에서 SyncDialog 가 열린 상태로 PTR → 다이얼로그 닫히고 데이터 재로드. (구현 완료, 사용자 실기 검증 대기)
- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [x] `npx prettier --write .` 실행 (마지막 Phase 에서 자동 포맷 적용)
- [ ] 사용자 실기 검증 완료 (대상 화면/플로우 기록)
- [x] 필요한 문서 업데이트 (이 plan 의 범위로는 README.md 변경 없음, `docs/COMMANDS.md` 변경 없음)
- [x] plan 체크박스 최신화(Phase/DoD/Validation 모두 반영)

## 5) 변경 범위(Scope)

### 변경 대상 파일(예상)

- `src/store/useStore.ts` — 도메인별 캐시 클리어 액션 추가 (`clearHomeCache`, `clearChartCache`, `clearTradeCache`).
- `src/screens/HomeScreen.tsx` — Outer/Content 분리, PTR 핸들러에서 `clearHomeCache + setRefreshKey`.
- `src/screens/ChartScreen.tsx` — Outer/Content 분리, PTR 핸들러에서 `clearChartCache + setRefreshKey`.
- `src/screens/TradeScreen.tsx` — Outer/Content 분리, PTR 핸들러에서 `clearTradeCache + setRefreshKey`.
- `src/screens/SettingsScreen.tsx` — Outer/Content 분리, PTR 핸들러에서 `clearHomeCache + setRefreshKey`.
- `README.md`: 변경 없음
- `docs/COMMANDS.md`: 변경 없음

### 데이터/결과 영향

- RTDB payload 스키마 영향 없음 (서버 계약 변경 없음, 읽기/표시 측만 수정).
- store 구조 변경 없음 (액션만 추가). 기존 `clearAll()` 은 유지(로그아웃/AppState.active 복귀 경로에서 사용).
- 네트워크 영향: PTR 시 첫 진입과 동일한 fetch 수만 발생 (홈 7개 read / 거래 history 3개 + 홈 7개 / 차트 meta + 12개월 슬라이스). 다른 자산 캐시는 비워지지만 즉시 fetch 하지 않음.

## 6) 단계별 계획(Phases)

### Phase 1 — store 도메인별 캐시 클리어 액션 추가

**작업 내용**:

- [x] `Store` 인터페이스에 다음 액션 추가
  - `clearHomeCache: () => void` — `portfolio`, `signals`, `pendingOrders`, `inboxFills`, `inboxBalanceAdjusts`, `inboxFillDismiss`, `inboxModelSync`, `lastError` 를 null/초기값으로.
  - `clearChartCache: () => void` — `priceCharts: {}`, `equityChart: emptyEquityCache()`, 차트 관련 loading 키 정리, `lastError: null`.
  - `clearTradeCache: () => void` — `historyFills`, `historyBalanceAdjusts`, `historySignals` 를 null 로. (Trade 화면은 portfolio 도 표시하므로 호출부에서 `clearHomeCache` 와 함께 호출.)
- [x] 차트 loading 키는 `chart_*` prefix 로 식별 (loadingKeys.ts 의 `chartLoadingKey` / `priceYearLoadingKey` / `equityYearLoadingKey` 모두 `chart_` 로 시작) → 객체 필터링으로 제거.
- [x] 기존 `clearAll()` 은 유지(범위 변경 없음).

---

### Phase 2 — 4개 화면에 Outer/Content 패턴 적용

각 Screen 파일에서 다음 구조로 리팩토링:

```tsx
const ScreenContent: React.FC<{ onPullRefresh: () => void }> = ({
  onPullRefresh,
}) => {
  // 기존 화면 구현 전체 (useState/useEffect/렌더링)
  // PullToRefreshScrollView 의 onRefresh 에 onPullRefresh 사용
};

export const Screen: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const onPullRefresh = useCallback(() => {
    // 도메인 캐시 비움
    useStore.getState().clearXxxCache();
    // Content 를 리마운트하여 모든 로컬 state 자동 리셋
    setRefreshKey(k => k + 1);
  }, []);
  return <ScreenContent key={refreshKey} onPullRefresh={onPullRefresh} />;
};
```

**작업 내용**:

- [x] `HomeScreen.tsx`: Outer 가 `clearHomeCache` 호출 후 `setRefreshKey`. Content 의 `useEffect(() => { refreshHome(); }, [...])` 가 mount 시 자동으로 데이터 fetch (기존과 동일 동작).
- [x] `ChartScreen.tsx`: Outer 가 `clearChartCache` 호출 후 `setRefreshKey`. Content 가 새로 mount 되며 기본값 `chartType='price'`, `assetId='sso'`, `initialZoomKey=null` 로 시작 → meta useEffect 가 `refreshChart('sso')` 호출 → 12개월 슬라이스 fetch → 마지막 1년 초기 줌 적용.
- [x] `TradeScreen.tsx`: Outer 가 `clearHomeCache + clearTradeCache` 호출 후 `setRefreshKey`. Content 가 새로 mount 되며 `mode='fill'` 기본값으로 시작 → useEffect 가 `refreshHome + refreshTrade` 호출. FillForm/AdjustForm 도 함께 새로 mount 되어 모든 입력 필드가 빈 상태.
- [x] `SettingsScreen.tsx`: Outer 가 `clearHomeCache` 호출 후 `setRefreshKey`. Content mount useEffect 에서 `portfolio === null` 이면 즉시 `refreshHome()` 호출하여 RTDB 배지가 "오류" 로 잠시 표시되는 시간 최소화.

**Validation (수동 확인)**:

- 차트 탭: SSO → QLD 전환 → 핀치 줌 변경 → PTR → 화면이 SSO + 마지막 1년 줌 + price 모드로 복귀.
- 거래 탭: 자산/방향 선택 + 수량/체결가 입력 → PTR → 모든 필드 빈 상태 + 모드 `fill`.
- 홈 탭: SyncDialog 열고 PTR → 다이얼로그 닫히고 데이터 재로드.
- 설정 탭: PTR → RTDB 배지가 잠시 "오류" 후 "정상" 으로 (재로드 시각 변동).

---

### 마지막 Phase — 문서 정리 및 최종 검증

**작업 내용**

- [x] README.md 변경 없음 — 동작 변경뿐, 문서 업데이트 불필요.
- [x] `docs/COMMANDS.md` 변경 없음.
- [x] `npx prettier --write .` 실행(자동 포맷 적용)
- [x] DoD 체크리스트 최종 업데이트 및 체크 완료
- [x] 전체 Phase 체크리스트 최종 업데이트 및 상태 확정

**Validation**:

- [x] `npm run lint` 통과
- [x] `npx tsc --noEmit` 통과
- [ ] 사용자 실기 검증: 4개 탭(홈/차트/거래/설정) PTR 동작 확인

#### Commit Messages (Final candidates) — 5개 중 1개 선택

1. PTR / 모든 탭에서 화면 첫 진입처럼 리셋되도록 동작 변경
2. screens / PTR 시 화면 본체 리마운트로 로컬 상태 초기화
3. PTR / 브라우저 새로고침과 동일하게 캐시 비움 + 화면 리마운트
4. screens / PullToRefresh 가 모든 탭에서 입력/줌/모드 리셋하도록 통일
5. store / 도메인별 캐시 클리어 액션 추가 + PTR 화면 리마운트 적용

## 7) 리스크(Risks)

- WebView 리마운트 비용: 차트 PTR 시 WebView HTML/JS 가 다시 로드된다. 첫 진입과 동일하므로 사용자 의도에 부합하지만, 핀치/스크롤 중에 PTR 이 트리거될 일은 없으므로 UX 위험은 작음.
- 깜빡임: 캐시를 비우는 순간 portfolio/signals 가 null 로 잠시 표시 → 로딩 스피너 또는 ErrorState 의 짧은 노출 가능. 첫 진입과 동일하므로 일관됨.
- Settings 의 portfolio 의존: SettingsScreen 은 portfolio 의 `execution_date` / 존재 여부로 배지를 그리므로, 캐시 비운 후 `refreshHome` 이 끝나기 전 짧은 "오류" 표시 가능. mount useEffect 에서 즉시 호출하여 최소화.
- 다른 자산 차트 캐시 손실: 사용자가 미리 본 QLD/GLD/TLT 차트가 PTR 후 전환 시 다시 로드됨 → 사용자가 명시적으로 요구한 동작이므로 의도된 결과.

## 8) 메모(Notes)

- 초기 검토에서 "PTR 시 모든 자산을 즉시 병렬 fetch" 안도 검토했으나, 사용자가 "처음 탭을 클릭한 것처럼" 으로 명확히 정의 → lazy 로딩 유지가 원래 의도.
- 거래 탭 입력 초기화는 별도 reset 함수 작성 없이 `key` 변경 1줄로 자동 처리됨 (`useState`/`useRef` 모두 새 인스턴스로 시작).

### 진행 로그 (KST)

- 2026-04-29 14:00: Draft 작성. 사용자 확인 대기.
- 2026-04-29 14:15: 사용자 승인 (모든 PTR = 브라우저 새로고침, 차트탭은 SSO+price 로 리셋, 4개 탭 모두 도메인 캐시 비움).
- 2026-04-29 14:20: Phase 1 완료 — store 에 `clearHomeCache` / `clearChartCache` / `clearTradeCache` 추가.
- 2026-04-29 14:28: Phase 2 완료 — 4개 Screen 모두 Outer/Content 패턴으로 리팩토링. PTR 시 도메인 캐시 비움 + Content 리마운트.
- 2026-04-29 14:30: 마지막 Phase — `npx tsc --noEmit` 통과, `npm run lint` 통과, `npx prettier --write .` 적용. 사용자 실기 검증 대기.

---
