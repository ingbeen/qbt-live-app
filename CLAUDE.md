# CLAUDE.md — QBT Live 앱 코딩 규칙

> **최종 위치**: `CLAUDE.md` (앱 프로젝트 루트 기준 상대경로)
> **역할**: `qbt-live-app` 프로젝트의 **코딩 규칙 / 스타일 가이드 / 금지 사항** 단일 정본 (SoT).
> **원칙**: Claude Code 는 작업 시작 전 본 문서를 반드시 읽는다. 본 문서와 충돌하는 코드는 거부.
> **관련 문서**:
>
> - `docs/DESIGN_QBT_LIVE_FINAL.md` — 서버↔앱 RTDB 데이터 계약 (서버 SoT, 변경 금지)
> - `docs/COMMANDS.md` — 프로젝트 관련 **모든 명령어** 단일 관리처
> - `README.md` — 프로젝트 개요 / 폴더 구조 / 개발 셋업

---

## 0. 프로젝트 개요

`qbt-live-app` 는 QBT Live 시스템의 **Android 앱 클라이언트**이다.

- **서버(별개 프로젝트)**: GitHub Actions 에서 매일 장 마감 후 실행되어 Firebase RTDB 를 갱신
- **앱(이 프로젝트)**: RTDB 를 읽어 포트폴리오/차트/시그널 표시, 체결/보정을 RTDB inbox 로 쓰기
- **플랫폼**: Android 전용 (iOS 지원 안 함)
- **언어**: TypeScript
- **프레임워크**: React Native CLI (정확히 핀, Expo 아님). 버전은 `package.json` 참조
- **New Architecture**: 기본 ON, 비활성 불가 (RN 0.82+ 강제)
- **Node**: `package.json engines` 참조 (22.11 이상)
- **Java**: Temurin 17
- **터미널**: 셋업/명령은 `docs/COMMANDS.md` 참조

**주요 라이브러리** (버전은 `package.json` 참조):

- 상태: `zustand`
- 네비게이션: `@react-navigation/native`, `@react-navigation/bottom-tabs`
- Firebase: `@react-native-firebase/{app,auth,database,messaging}`
- 네트워크 상태: `@react-native-community/netinfo`
- 날짜 입력: `@react-native-community/datetimepicker`
- WebView / 차트: `react-native-webview` + TradingView Lightweight Charts (CDN)
- 기타: `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens`, `react-native-svg`, `react-native-uuid`, `@react-native-async-storage/async-storage` (식별자 저장 전용 — §4.4 예외)

**엔트리포인트**: `index.js` → `App.tsx` → `AppNavigator` (4탭: 홈/차트/거래/설정)

**폴더 구조**: `src/{screens,components,services,store,utils,types,navigation}/` (§8.1 에서 역할 서술)

데이터 계약(서버 SoT)은 `docs/DESIGN_QBT_LIVE_FINAL.md §8.2` 를 참조. 그 외 앱 아키텍처/구현 규칙은 본 문서가 단일 SoT.

---

## 1. 확인 / 질문 정책

### 1.1 확인이 필요한 상황

Claude Code 가 작업 중 다음 상황이면 **추측 금지, 반드시 사용자에게 질문**:

- 라이브러리 / 의존성 버전이 불명확할 때
- 설계서에 명시되지 않은 UI 동작
- 서버 계약에 명시되지 않은 필드
- 성능 / 보안 영향이 큰 결정

### 1.2 질문 형식 (필수 강제)

```
현재 확인된 사실:
  - ...

가능한 선택지:
  A) ...
  B) ...
  C) ...

각 선택지의 영향:
  A) ... 장점 / 단점
  B) ...
  C) ...

추천안: A (이유: ...)
```

### 1.3 외부 정보 확보

- 라이브러리 최신 사용법 / 버전 차이 / 공식 스펙 필요 시 **Context7 우선** 학습
- 부족하거나 불명확한 부분은 **웹검색으로 근거 보완**
- 추측 금지

---

## 2. TypeScript 규칙

### 2.1 타입 힌트 필수

- 모든 함수 파라미터 / 반환값에 명시적 타입
- `any` 금지 (불가피하면 `unknown` + 타입 가드)
- 암묵적 `any` 금지 (`tsconfig.json` 에 `"noImplicitAny": true`)

```typescript
// ✗ 금지
const sum = (a, b) => a + b;
const fetchData = async () => {
  /* return any */
};

// ✓ 권장
const sum = (a: number, b: number): number => a + b;
const fetchData = async (): Promise<Portfolio | null> => {
  /* ... */
};
```

### 2.2 타입 vs 인터페이스

- **인터페이스**: 객체 구조 (RTDB payload, component props 등)
- **type alias**: 유니언, 제네릭, 튜플, 맵드 타입

```typescript
// 인터페이스
interface Portfolio {
  execution_date: string;
  model_equity: number;
}

// 유니언은 type alias
type AssetId = 'sso' | 'qld' | 'gld' | 'tlt';
type Direction = 'buy' | 'sell';
```

### 2.3 null / undefined

- RTDB 데이터는 `null` 로 부재 표현 (Firebase 관례)
- 함수 파라미터의 선택적 필드는 `T | null` 또는 `T | undefined` 를 **일관되게 선택** (RTDB payload 는 `null`, 일반 함수는 `undefined`)
- `null` 과 `undefined` 를 혼용하지 말 것

```typescript
// RTDB 타입
interface FillPayload {
  memo: string | null; // RTDB 관례
}

// 일반 함수
const greet = (name?: string) => {
  /* undefined 허용 */
};
```

### 2.4 `tsconfig.json` 권장 설정

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "lib": ["esnext"],
    "jsx": "react-native",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 2.5 타입 Import

```typescript
// ✓ type-only import 사용
import type { Portfolio, AssetId } from '../types/rtdb';

// 값과 타입 혼합 시
import { useStore, type Store } from '../store/useStore';
```

---

## 3. React / React Native 규칙

### 3.1 컴포넌트 선언

- **함수형 컴포넌트 only** (클래스 컴포넌트 금지)
- **default export 금지**. `App.tsx` 는 RN 엔트리 요구로 default export 를 유지하고, screens / components 는 전부 named export 사용.
- Props 타입은 **인터페이스**로 명시

```typescript
// ✓ 권장 (재사용 컴포넌트)
interface BadgeProps {
  text: string;
  color: string;
}

export const Badge: React.FC<BadgeProps> = ({ text, color }) => (
  <View>...</View>
);
```

### 3.2 훅 사용 규칙

- 훅은 컴포넌트 최상위에서만 호출 (조건부/반복문 안 금지)
- `useEffect` 의존성 배열 **반드시 정확히** 명시
- `useCallback` / `useMemo` 는 성능 이슈 측정 후 적용 (premature optimization 금지)

### 3.3 스타일링

- **`StyleSheet.create`** 사용 (인라인 객체 최소화)
- 한 컴포넌트 내 `styles` 객체는 컴포넌트 하단에 정의
- 색상은 **반드시 `COLORS` 상수 import** (하드코딩 hex 금지)

```typescript
// ✓ 권장
import { COLORS } from '../utils/colors';

export const Card: React.FC = () => <View style={styles.wrap}>...</View>;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
});

// ✗ 금지 (하드코딩)
<View style={{ backgroundColor: '#161b22' }} />;
```

### 3.4 절대 금지 목록

- **인라인 이벤트 핸들러** (렌더마다 재생성): `onPress={() => doSomething()}` 대신 `useCallback` 또는 외부 함수
  - 단, 단순 상태 토글 `onPress={() => setFoo(!foo)}` 는 허용
- **클래스 컴포넌트**
- **`any` 타입** (§2.1)
- **하드코딩 색상** (§3.3)
- **이모지** (§5.3)

### 3.5 조건부 렌더링

- JSX 내 복잡한 분기는 함수 추출
- `&&` 연산자 사용 시 `falsy` 값(0, "") 주의

```typescript
// ✗ 위험 (0이면 0이 렌더됨)
{
  items.length && <List items={items} />;
}

// ✓ 안전
{
  items.length > 0 && <List items={items} />;
}
```

---

## 4. Zustand 사용 규칙

### 4.1 Store 구조 원칙

- **RTDB 경로 트리와 동일한 구조** (근거 위치: `src/store/useStore.ts::Store`)
- **탭별 분리 금지**. 데이터별 캐시.
- **actions 플래그 금지** (RTDB inbox 자체가 액션 상태)
- Zustand 는 **단일 store**. 여러 개 만들지 말 것.
- 세션/UI 보조 상태 허용: `user`, `isOnline`, `deviceId`, `fcmRegistered`, `lastError`, `lastToast`, `loading` (RTDB 미러가 아닌 세션·네트워크·UI 상태는 예외로 store 에 둔다)

### 4.2 Selector 사용

```typescript
// ✓ 권장 (필요한 필드만 subscribe → 불필요 리렌더 방지)
const portfolio = useStore(s => s.portfolio);
const refreshHome = useStore(s => s.refreshHome);

// ✗ 금지 (전체 store subscribe → 모든 변경에 리렌더)
const store = useStore();
```

### 4.3 Action 내부에서 상태 읽기

```typescript
// Zustand v4+ 문법
export const useStore = create<Store>((set, get) => ({
  // ...
  refreshHome: async () => {
    const { user } = get();
    if (!user) return;
    set({ loading: { ...get().loading, portfolio: true } });
    try {
      const portfolio = await readPortfolio();
      set({ portfolio, loading: { ...get().loading, portfolio: false } });
    } catch (e) {
      set({
        lastError: String(e),
        loading: { ...get().loading, portfolio: false },
      });
    }
  },
}));
```

### 4.4 Persistence

- **Zustand persist middleware 사용 금지** (메모리 캐시만)
- 앱 재시작 시 모든 상태 초기화됨 (의도된 동작)
- **예외**: 설치 UUID(`device_id`) 1개에 한해 `AsyncStorage` 영구화 허용. RTDB 데이터·사용자 세션 캐싱 목적의 영구 저장은 계속 금지. 근거 위치: `src/services/fcm.ts::getDeviceId`

### 4.5 비동기 액션 에러 처리

- `try/catch` 필수
- 실패 시 `lastError` 에 저장, `loading` 해제
- 사용자 표시 에러는 **한글 메시지** (§5.3)

---

## 5. UI 텍스트 / 네이밍 규칙

### 5.1 네이밍 컨벤션

| 대상                 | 규칙             | 예시                                   |
| -------------------- | ---------------- | -------------------------------------- |
| 컴포넌트             | PascalCase       | `HomeScreen`, `AssetBadge`, `FillForm` |
| 함수 / 변수          | camelCase        | `formatUSD`, `refreshHome`, `assetId`  |
| 상수                 | UPPER_SNAKE_CASE | `OWNER_UID`, `RTDB_URL`, `COLORS`      |
| 타입 / 인터페이스    | PascalCase       | `Portfolio`, `AssetId`, `FillPayload`  |
| 파일명 (컴포넌트)    | PascalCase.tsx   | `HomeScreen.tsx`, `Badge.tsx`          |
| 파일명 (유틸/서비스) | camelCase.ts     | `format.ts`, `rtdb.ts`, `useStore.ts`  |
| 폴더명               | lowercase        | `screens/`, `components/`, `services/` |

### 5.2 자산 ID 규칙 (중요)

- **RTDB 경로 / 페이로드 / 저장 키**: 항상 소문자 (`sso`, `qld`, `gld`, `tlt`)
- **UI 표시**: 대문자 (`SSO`, `QLD`, `GLD`, `TLT`)
- 변환은 표시 시점에만: `id.toUpperCase()` 또는 `toUpperTicker(id)` 헬퍼

```typescript
// ✓ 권장
const AssetRow: React.FC<{ id: AssetId }> = ({ id }) => (
  <Text>{id.toUpperCase()}</Text> // 또는 toUpperTicker(id)
);
```

### 5.3 UI 텍스트 언어

- **모든 사용자 향 텍스트**: 한글
- **에러 메시지 (사용자 향)**: 한글, 예외 타입 명시 금지 ("TypeError" 등)
- **로그 메시지**: 개발자 편의상 영문/한글 혼용 가능
- **전문 용어** (Model, Actual, drift 등): 영문 그대로 사용
- **이모지 금지**: `😀👍❌✅` 등. 허용 기호 화이트리스트는 `src/utils/constants.ts::SYMBOLS` 상수를 SoT 로 한다.

### 5.4 숫자 / 날짜 포맷

- **금액 (USD)**: `$` + 천 단위 콤마 + 소수점 2자리 (`formatUSD`)
- **금액 (USD, 정수)**: 소수점 생략 — 차트 툴팁 등 좁은 공간용 (`formatUSDInt`)
- **수량**: 천 단위 콤마 + "주" (`formatShares`)
- **퍼센트 (부호)**: `+3.23%`, `-0.84%` (`formatSignedPct`, 비율 × 100)
- **비중**: `33.8%` (`formatWeight`, 소수점 1자리)
- **날짜 (표시)**: ISO 8601 `YYYY-MM-DD` 또는 짧은 표시 `4/15` (`formatShortDate`)
- **타임스탬프 (RTDB 쓰기)**: ISO 8601 KST `YYYY-MM-DDTHH:MM:SS+09:00` (`kstNow`)

근거 위치: `src/utils/format.ts`

**통화 기준**: 앱의 모든 금액 필드는 **USD (미국 달러)** 이다. 서버가 `actual_equity`, `shared_cash_*`, `close`, `actual_price` 등을 USD 로 저장한다 (`docs/DESIGN_QBT_LIVE_FINAL.md §1.3`). 앱은 환율 변환 없이 그대로 표시.

**표시 시 변환 원칙**: 서버 데이터는 **그대로 저장**, 표시 시점에만 포맷 함수 적용.

```typescript
// ✗ 금지 (데이터 변환)
const portfolio = await readPortfolio();
portfolio.model_equity = portfolio.model_equity * 100;  // 절대 금지

// ✓ 권장 (표시 시 변환)
<Text>{formatUSD(portfolio.model_equity)}</Text>         // 10424.5 → "$10,424.50"
<Text>{formatSignedPct(portfolio.drift_pct)}</Text>       // 0.0037 → "+0.37%"
```

### 5.5 주석 작성 원칙

**주석은 "현재 코드의 상태와 동작" 만 설명한다.**

**포함해야 할 것**:

- 왜 이렇게 구현했는지 (의도)
- 비직관적 로직의 이유 (예: "Firebase RTDB 는 빈 배열을 저장하지 않으므로 `?? []` 로 폴백")
- 외부 제약사항 (예: "RN 0.85 에서 New Architecture 강제, 끌 수 없음")

**금지 패턴**:

- **개발 단계 표현 금지**: `"Phase 0"`, `"Phase 3 에서 추가"`, `"레드"`, `"그린"`, `"MVP 1차"` 등
- **과거 상태 기록 금지**: `"이전에는 X 였다"`, `"예전 코드는..."`
- **변경 이력 기록 금지**: `"2026-04-18 수정"`, `"버그 수정 by yblee"`
- **계획 단계 표현 금지**: `"나중에 구현 예정"`, `"TODO: 다음 마일스톤"`

```typescript
// ✗ 금지
// Phase 3 에서 처음 추가. Phase 4 에서 수정.
const refreshHome = async () => { ... };

// Phase 5 에서 이 로직 개선 예정
const validateFill = (p) => { ... };

// ✓ 권장
// RTDB 에 pending 있는 자산만 키가 존재하므로 Partial 로 안전 접근
const pendingOrders: Partial<Record<AssetId, PendingOrder>> | null = ...;

// Firebase RTDB 는 빈 배열을 저장하지 않으므로 키 부재 시 [] 로 폴백
const buySignals = chartRecent.buy_signals ?? [];
```

**TODO 주석은 최소화**. 필요하면 GitHub Issue 로 관리, 주석에 `TODO` 남기지 말 것. 부득이한 경우:

```typescript
// TODO: iOS 지원 시 retest (현재 Android 전용이라 skip)
```

이 정도로 **미래 작업 의도가 명확하고 추적 가능** 해야 함.

---

## 6. Firebase SDK 사용 규칙

### 6.1 초기화

- `src/services/firebase.ts` 에서 **한 번만** 초기화
- **Persistence OFF** 필수 (깜빡임 방지)

```typescript
import database from '@react-native-firebase/database';

export const initFirebase = (): void => {
  database().setPersistenceEnabled(false);
};
```

### 6.2 RTDB 읽기 규칙

- **`once('value')` 만 사용**. `onValue` 금지.
- 모든 읽기는 `src/services/rtdb.ts` 를 거친다 (컴포넌트에서 직접 호출 금지)
- 에러 처리 필수 (타임아웃 10초, 권한 오류 메시지)

```typescript
// ✓ 권장
import { readPortfolio } from '../services/rtdb';
const portfolio = await readPortfolio();

// ✗ 금지 (컴포넌트 직접 호출)
import database from '@react-native-firebase/database';
const snap = await database().ref('/latest/portfolio').once('value'); // rtdb.ts 로 추상화

// ✗ 금지 (onValue 리스너)
database().ref('/latest/portfolio').on('value', handler);
```

### 6.3 RTDB 쓰기 규칙

- 앱이 쓸 수 있는 경로는 `src/utils/constants.ts::RTDB_PATHS` 의 **write** 섹션 (inbox 4종 + `/device_tokens`)
- UUID 는 `react-native-uuid` 로 생성
- `processed` 필드 **절대 쓰지 말 것** (서버 전용. 읽기는 허용 — `docs/DESIGN_QBT_LIVE_FINAL.md §8.3` 참고)
- `/latest/*`, `/charts/*`, `/history/*` 쓰기 금지

### 6.4 Auth

- Email/Password 방식 only
- `auth().onAuthStateChanged` 는 App.tsx 에서 **한 번만** subscribe
- 로그아웃 시 `useStore.clearAll()` + `setUser(null)` 순서

### 6.5 Messaging (FCM)

- 포그라운드 알림 **무시** (인앱 알림 UI 없음)
- 백그라운드/종료 상태에서만 시스템 알림 트레이 표시
- 알림 탭 → 항상 홈 탭 이동
- Data payload 처리 금지. `notification.body` 텍스트만 사용.
- Android 13+ (API 33+) 에서 `POST_NOTIFICATIONS` 는 runtime 권한이므로 `PermissionsAndroid` 로 직접 요청 (Firebase `messaging().requestPermission()` 은 Android 에서 다이얼로그를 띄우지 않음)
- `device_id` 는 설치 UUID. `AsyncStorage` 에 영구화(§4.4 예외). 근거 위치: `src/services/fcm.ts::getDeviceId`, `src/services/fcm.ts::requestNotificationPermission`

### 6.6 네트워크 / 오프라인 차단

- 네트워크 상태 구독: `@react-native-community/netinfo` (`setupNetworkListener`)
- 판정식: `!!state.isConnected && state.isInternetReachable !== false` — Android 에서 `isInternetReachable` 이 `null` 인 경우가 있어 `!== false` 로 비교
- 오프라인이면 **Login 화면·탭 네비게이션 모두 차단**하고 `OfflineScreen` 만 렌더 (앱 전체 차단)
- 포그라운드 복귀 시 (`AppState === 'active'`) 로그인 상태면 `clearAll()` 후 `refreshHome()` 호출 (캐시 무효화 후 재로드)
- 근거 위치: `src/services/network.ts`, `src/components/OfflineScreen.tsx`, `App.tsx` (상단 `isOnline` 분기 + `AppState` useEffect)

---

## 7. WebView + TradingView Charts 규칙

### 7.1 라이브러리 로드

- TradingView Lightweight Charts: **CDN 방식** (`unpkg.com`)
- npm 패키지 `lightweight-charts` 를 React Native 에 직접 설치 금지 (브라우저 전용)

### 7.2 WebView 메시지 프로토콜

- **RN → WebView**: `injectJavaScript` 로 함수 호출 (e.g. `window.setPriceChart(data)`)
- **WebView → RN**: `window.ReactNativeWebView.postMessage(JSON.stringify({type, ...}))`
- 메시지 타입 **화이트리스트**:
  - `ready` — WebView 초기 로딩 완료
  - `load_earlier` — 좌측 끝 도달 → archive 로드 필요

### 7.3 WebView 설정

```typescript
<WebView
  source={{ html: generateChartHtml() }}
  originWhitelist={['*']}
  javaScriptEnabled
  domStorageEnabled
  scalesPageToFit={false}
  scrollEnabled={false} // 차트 자체가 gesture 처리
  onMessage={onWebViewMessage}
  style={{ backgroundColor: COLORS.card }}
/>
```

### 7.4 차트 라이브러리 버전 고정

- TradingView Lightweight Charts 버전은 `src/utils/constants.ts::CHART_LIB_VERSION` 참조
- 버전을 `@latest` 로 열어두지 말 것 (재현성)

---

## 8. 파일 구조 규칙

### 8.1 폴더 역할

- **`src/screens/`**: 탭별 최상위 컴포넌트만. 라우팅과 직결.
- **`src/components/`**: 2개 이상 screens 에서 재사용되는 순수 UI 컴포넌트.
- **`src/services/`**: 외부 I/O (Firebase, WebView). 순수 함수 위주.
- **`src/store/`**: Zustand store 및 액션.
- **`src/utils/`**: 순수 유틸 (포맷, 검증, 상수).
- **`src/types/`**: 타입 정의 (RTDB 스키마 미러).
- **`src/navigation/`**: React Navigation 설정.

### 8.2 파일당 하나의 주 export

- 한 파일에 컴포넌트 여러 개 정의 금지 (서브 컴포넌트 예외)
- 큰 컴포넌트 (예: `HomeScreen.tsx`) 가 내부 헬퍼를 가질 수 있으나, 같은 파일 scope 내로 한정

### 8.3 경로 alias (선택)

`tsconfig.json` + `babel.config.js` 에 alias 설정 시:

```typescript
// ✗ 상대경로 남용
import { COLORS } from '../../../utils/colors';

// ✓ alias 설정 후
import { COLORS } from '@/utils/colors';
```

상대경로 사용.

---

## 9. 에러 처리 규칙

### 9.1 예외 타입

- **네트워크 에러** (RTDB): `try/catch` + 사용자 메시지
- **유효성 실패** (폼): 필드별 `fieldErrors` 상태 + UI 표시
- **권한 에러**: `PERMISSION_DENIED` / "denied by rules" 패턴 체크 → "RTDB 접근 권한이 없습니다. 로그아웃 후 재로그인해 보세요."

### 9.2 에러 경계 (Error Boundary)

- 별도 Error Boundary 없음. RN 기본 처리에 맡긴다.

### 9.3 로깅

**레벨 사용 원칙**:

- **`console.debug`** — 실행 흐름, 데이터 처리 상태, 개발 중 관찰용. 릴리스 빌드에서 자동 제거 또는 Metro 옵션으로 제거.
- **`console.warn`** — 잠재적 문제 상황 (deprecated API 호출, 예상치 못한 데이터 형식 등). 로직은 계속 진행 가능.
- **`console.error`** — 실제 에러 발생 시 (RTDB 실패, Auth 실패, 유효성 검사 실패 등). 사용자에게도 표시되는 이슈.

**금지 사항**:

- **`console.info` 사용 금지** (일반 정보는 `console.debug` 사용)
- **`console.log` 사용 금지** (명시적으로 `console.debug` 사용 — 릴리스 빌드에서 제거되도록)
- **이모지 사용 금지** (예외: `[rtdb]`, `[auth]` 같은 대괄호 태그는 허용)
- **함수명 중복 기재 금지** — JavaScript 스택 트레이스에 자동 포함되므로 로그 메시지에 함수명 반복 안 함
- **사용자에게 표시되는 에러는 §9.4 규칙 우선** — `console.error` 는 개발자 로그용, 사용자 메시지는 별도 한글 텍스트

**태그 컨벤션**:

대괄호 prefix 로 발생 위치 구분. 예:

- `[rtdb]` — RTDB 읽기/쓰기 관련
- `[auth]` — Firebase Auth 관련
- `[fcm]` — FCM 토큰/메시지 관련
- `[chart]` — 차트 WebView 관련
- `[store]` — Zustand 액션 관련

```typescript
// ✓ 권장
try {
  const p = await readPortfolio();
  console.debug('[rtdb] portfolio loaded');
} catch (e) {
  console.error('[rtdb] readPortfolio failed:', e);
  useStore.getState().setLastError('데이터를 불러올 수 없습니다.');
}

// ✗ 금지
console.log('data:', data); // console.debug 사용
console.info('loaded'); // 금지
console.error('readPortfolio: ...'); // 함수명 중복 (스택에 이미 있음)
console.warn('🔥 problem'); // 이모지 금지
```

### 9.4 사용자 표시 에러

- **한글 메시지**
- 예외 타입 / stack trace 노출 금지
- 구체적 원인 + 다음 행동 제시

```typescript
// ✗ 금지
setError(e.message); // "TypeError: Cannot read..." 같은 영문 노출

// ✓ 권장
setError('데이터를 불러올 수 없습니다. 잠시 후 다시 시도하세요.');
```

---

## 10. 의존성 관리

### 10.1 추가 금지 라이브러리

- **상태 관리**: Redux, MobX, Recoil (Zustand 로 통일)
- **네비게이션**: React Router (React Navigation 사용)
- **차트**: react-native-svg-charts, victory-native (TradingView 사용)
- **HTTP**: axios (RTDB 만 사용, HTTP 호출 없음)
- **날짜**: moment.js, date-fns (내장 Date + `src/utils/format.ts` / `parse.ts` 로 충분)
- **아이콘 라이브러리 전체 패키지** (예: `@expo/vector-icons`) — SVG 인라인 사용 (번들 크기 절감)
- **UI 킷**: NativeBase, React Native Paper (React Native 기본 컴포넌트 + 자체 스타일)

### 10.2 라이브러리 추가 절차

1. Claude Code 는 새 의존성 추가 시 **반드시 사용자에게 질문** (§1.2 형식)
2. Context7 + 웹검색으로 최신 권장 버전 확인
3. 사용자 승인 후 `npm install` / `yarn add`
4. `package.json` 변경 커밋

### 10.3 버전 고정

- 의존성은 `^` 로 정의하되, `package-lock.json` 을 **반드시 커밋**
- **`react-native` 와 `react` 는 정확한 버전 고정** (`^` 금지). 각각 `0.85.1`, `19.2.3`.
- `@react-native/*` 모노레포 패키지들 (preset, config 등) 도 `0.85.1` 로 고정. RN 업그레이드 시 함께 움직임.
- 주요 외부 라이브러리 메이저 업그레이드 (예: Firebase v24 → v25) 는 사용자 승인 필요
- **RN 마이너 버전 업그레이드** (예: 0.85 → 0.86) 는 Upgrade Helper 기반 계획 + 사용자 승인 필요
- `^` 를 빼고 정확히 고정하는 대상은 `package.json` 에서 `^` 없이 표기된 항목들 (대표: `react-native`, `react`, `@react-native/*` 모노레포 계열, `@react-native-community/cli` / `cli-platform-*`)

---

## 11. 보안 / 시크릿 관리

### 11.1 절대 커밋 금지

- `android/app/google-services.json` — `.gitignore` 에 추가
- API 키, 서비스 계정 JSON
- 이메일 / 비밀번호 하드코딩 (LoginScreen 에도 금지)

### 11.2 GitHub 토큰

- **앱에 GitHub 토큰 절대 없음**. Git 정본 접근은 서버 전용.

### 11.3 RTDB 권한

- Firebase RTDB Rules 는 서버에서 설정. 앱은 Rules 변경 안 함.
- `OWNER_UID` 는 **참고용 상수**로만 유지 (근거 위치: `src/utils/constants.ts`). 권한 판정은 RTDB Rules 에 맡긴다.

---

## 12. 금지 사항 (Do Not)

본 문서 전체에 걸쳐 등장한 금지 사항 요약:

| 금지 항목                                   | 이유                         |
| ------------------------------------------- | ---------------------------- |
| `any` 타입                                  | 타입 안정성                  |
| 클래스 컴포넌트                             | 일관성                       |
| 하드코딩 색상 hex                           | 디자인 시스템                |
| 이모지                                      | UI 톤                        |
| `onValue` RTDB 리스너                       | 데이터 깜빡임 방지           |
| Firebase persistence ON                     | 데이터 깜빡임 방지           |
| AsyncStorage / SQLite 로 RTDB 데이터·세션 캐싱 | 메모리 캐시만 (예외: 설치 UUID 1개, §4.4) |
| Redux / MobX / 기타 상태 라이브러리         | Zustand 통일                 |
| `/latest/*`, `/charts/*`, `/history/*` 쓰기 | 서버 전용                    |
| inbox `processed` 필드 쓰기                 | 서버 전용 (읽기는 허용 — §8.3) |
| Git 정본 접근                               | 서버 전용                    |
| iOS 지원                                    | Android 전용 프로젝트         |
| 캐시 초기화 버튼                            | 앱 재시작으로 해결           |
| 차트 기간 선택 버튼                         | 핀치 줌으로 대체             |
| 마커 on/off 토글                            | 4종 항상 표시                |
| FCM data payload 처리                       | notification.body 만 사용    |
| 수익률 / 손익 RTDB 저장                     | 앱에서 실시간 계산           |
| 라이브러리 무단 추가                        | 사용자 승인 필요             |
| 시크릿 커밋                                 | 보안                         |
| QBT 본체 코드 수정                          | 서버 도메인 규칙             |

---

## 13. 환경변수 / 빌드 설정

### 13.1 Android 빌드

- SDK / 버전 수치는 `android/build.gradle` (`minSdkVersion` / `targetSdkVersion` / `compileSdkVersion`) 참조
- Hermes V1 엔진 (RN 0.84+ 기본, 추가 설정 불필요)
- New Architecture ON (RN 0.82+ 강제, 끌 수 없음)
- `applicationId` / `namespace` 는 `android/app/build.gradle` 참조 (`com.ingbeen.qbtlive`)

### 13.2 Metro 번들러

- 포트: 8081 (기본)
- 설정: `metro.config.js` 는 기본값 유지

### 13.3 환경변수

- 환경변수 사용 없음. 상수는 `src/utils/constants.ts` 에 정의.
- 주요 상수: `OWNER_UID`, `RTDB_URL`, `ANDROID_PACKAGE`, `APP_VERSION`, `RTDB_PATHS`, `ASSETS`, `ASSET_TARGETS`, `SYMBOLS`, `RTDB_TIMEOUT_MS`, `TOAST_AUTO_HIDE_MS`, `STALE_WARNING_DAYS`, `CASH_DIFF_THRESHOLD_USD`, `CHART_LIB_VERSION`
- 상세는 `src/utils/constants.ts` 참조.

### 13.4 APP_VERSION 동기화

`APP_VERSION` 문자열이 3곳에 중복된다. 버전 변경 시 **3곳 모두 동일하게 갱신**:

1. `src/utils/constants.ts::APP_VERSION`
2. `package.json` 의 `version`
3. `android/app/build.gradle` 의 `versionName`

---

## 14. 테스트 규칙

- **단위 테스트 파일 없음**. 사용자 검증 중심 (의미 단위로 에뮬레이터/기기 확인).
- 기능 단위 작업 완료마다 사용자가 실제 동작을 확인.

---

## 15. 커밋 / 브랜치 규칙

### 15.1 커밋 메시지

- 한글 가능. 영문 가능. 일관성만 유지.
- 실제 쓰이는 스타일 — 주제 / 상세 구조: 예) `FCM 버그수정 / device_id AsyncStorage 영구화`, `앱 아이콘 / Gemini 퀀트 테마 런처 아이콘 교체`
- 타입 prefix 병용 가능: `fix: 설명`, `feat: 설명`, `refactor: 설명`

### 15.2 브랜치 전략

- 단일 `main` 브랜치
- 작업 후 직접 `main` 에 커밋
- 의미 단위로 커밋 묶어 push

### 15.3 `.gitignore`

실제 내용은 리포 루트 `.gitignore` 참조. 주요 카테고리:

- React Native / Metro 캐시, `node_modules/`, `*.jsbundle`
- Android 빌드 산출물 (`android/app/build/`, `android/.gradle/` 등)
- Firebase 설정 (`android/app/google-services.json`)
- 환경변수 (`.env*`)
- IDE (`.vscode/*`, `.idea/`, `.claude/`)

---

## 16. 변경 관리

### 16.1 본 문서 수정 시

- 코딩 규칙 변경이면 사용자 승인 필요
- 새 금지 사항 추가는 §12 에 반영

### 16.2 명령어 단일 관리처

- 프로젝트 관련 **모든 명령어**(`npm`, `adb`, `gradlew`, 셋업 절차 등)는 `docs/COMMANDS.md` 에만 둔다.
- `CLAUDE.md` / `README.md` / 그 외 문서는 `docs/COMMANDS.md` 를 **링크로만** 참조한다.
- 새 명령어가 생기면 `docs/COMMANDS.md` 에 추가하고, 다른 문서에 복붙하지 않는다.
- 예외: 문장 흐름상 꼭 필요한 경우의 **한 줄 예시**(`npm install`, `npm run android` 수준)는 본문 인라인 허용. 블록 단위의 스크립트/절차는 반드시 `docs/COMMANDS.md` 로 옮긴다.

### 16.3 규칙 충돌 우선순위

1. 사용자의 명시적 지시 (최우선)
2. 본 문서 `CLAUDE.md`
3. `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 계약, 단 데이터 계약 영역만)
4. 라이브러리 공식 문서
5. 일반적 모범 사례

---

## 17. 개발 원칙 (모든 작업의 기본 태도)

본 문서와 설계 문서의 구체적인 규칙들은 모두 아래 4가지 원칙에서 파생된다. 구체적 규칙이 모호하거나 상충하는 상황에서는 이 원칙을 기준으로 판단한다.

### 17.1 YAGNI — "You Aren't Gonna Need It"

**필요성이 확인될 때만 구현한다.**

- "혹시 필요할 수도 있으니까" 로 기능 추가 금지
- 미래 확장을 가정한 미리 구조 설계 금지
- 범용성을 위한 추상화 금지 (실제로 2번 이상 쓰이는 패턴이 발견될 때까지 미룸)
- 설정 옵션 추가 금지 (실제 요구사항이 있을 때까지)

```typescript
// ✗ 금지 (지금 필요 없는 유연성)
interface FetchOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
}
const fetchData = async (path: string, opts?: FetchOptions) => { ... };

// ✓ 권장 (실제 필요한 최소)
const fetchData = async (path: string) => { ... };
// 타임아웃/재시도가 실제로 필요해지면 그때 추가
```

### 17.2 간결성 — "불필요한 추상화 지양"

**직관적이고 읽기 쉬운 코드가 영리한 코드보다 우선.**

- 함수 추출은 **재사용이 발생한 뒤** — 단 1회 쓰이는 헬퍼 함수 남발 금지
- 1~2줄 로직을 굳이 함수로 분리하지 말 것
- 복잡한 타입 추론 체인보다 명시적 타입이 낫다
- 3단 중첩 이상 삼항 연산자 금지 — `if/else` 로 풀기

```typescript
// ✗ 과도한 추상화
const getBadgeColor = (state: string, pending: boolean, shares: number) =>
  pending
    ? shares > 0
      ? COLORS.red
      : COLORS.accent
    : state === 'buy'
    ? shares > 0
      ? COLORS.green
      : COLORS.sub
    : COLORS.sub;

// ✓ 명시적
const getBadgeColor = (state: string, pending: boolean, shares: number) => {
  if (pending) return shares > 0 ? COLORS.red : COLORS.accent;
  if (state === 'buy' && shares > 0) return COLORS.green;
  return COLORS.sub;
};
```

### 17.3 확장성 — "모듈 독립성 유지"

**각 폴더/파일은 자기 책임에만 집중, 타 영역으로 의존이 퍼지지 않도록.**

- `src/screens/` 는 라우팅에만 관여, 재사용 컴포넌트는 `src/components/` 로
- `src/services/` 는 순수 I/O 만 담당, 컴포넌트/스토어 import 금지
- `src/utils/` 는 순수 함수만, Zustand 호출 금지
- 의존 방향 단방향: `screens → components → services → utils`

순환 의존 감지 시 즉시 리팩토링.

### 17.4 사용자 중심 — "한글 메시지, 명확한 오류 정보"

**사용자는 앱의 사용자이자 개발자 본인 + 미래의 자기 자신.**

- 사용자 향 메시지는 **전부 한글** (§5.3)
- 에러는 **무엇이 잘못됐고 + 어떻게 복구할지** 를 함께 제시
- 불분명한 상태는 사용자에게 노출 (로딩 인디케이터, 에러 텍스트)
- 개발자 본인을 위한 주석도 "미래의 나" 를 사용자로 간주 (§5.5)

```typescript
// ✗ 사용자가 이해할 수 없음
setError('PERMISSION_DENIED');

// ✓ 사용자 중심
setError('데이터 접근 권한이 없습니다. 로그아웃 후 재로그인해 보세요.');
```

---

**문서 끝**
