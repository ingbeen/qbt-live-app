# DESIGN_APP.md — QBT Live 앱 설계서

> **최종 위치**: `docs/DESIGN_APP.md` (앱 프로젝트 루트 기준 상대경로)
> **역할**: 본 문서는 QBT Live Android 앱(`qbt-live-app`)의 **단일 설계 정본(SoT)** 이다. UI/UX/구조 결정사항 + 코드 구현 가이드를 모두 포함한다.
> **폐기된 문서**: `APP_DESIGN_DECISIONS.md` (본 문서에 흡수됨, 이후 세션에서 불필요).
> **읽기 순서**: §0 → §1 → §2 → 필요 탭 §
> **관련 문서**:
> - `docs/DESIGN_QBT_LIVE_FINAL.md` — 서버↔앱 RTDB 데이터 계약 (SoT, 변경 금지)
> - `CLAUDE.md` — 앱 코딩 규칙
> - `docs/PROMPT_APP.md` — Phase별 작업 프롬프트

---

## 0. 메타 정보

### 0.1 프로젝트 식별

| 항목 | 값 |
|------|---|
| 앱 프로젝트명 | `qbt-live-app` |
| 앱 위치 (Windows) | `C:\android_workspace\qbt-live-app\` |
| GitHub 저장소 | `https://github.com/ingbeen/qbt-live-app` (Public) |
| Android 패키지 | `com.ingbeen.qbtlive` |
| 서버 위치 (WSL) | `/home/yblee/workspace/quant/` (별개 프로젝트, 앱과 무관) |
| Firebase 프로젝트 | `qbt-live` (Spark 무료 요금제) |
| RTDB URL | `https://qbt-live-default-rtdb.asia-southeast1.firebasedatabase.app` |
| OWNER_UID | `SxwvCeg6fRUeUrK9IpyazTzrLJJ2` |
| 텔레그램 봇 (참고용) | `@qbt_live_alert_bot` |

### 0.2 개발 환경 (Windows)

| 항목 | 버전 / 도구 |
|------|------------|
| Node.js | **v22.22.2** (fnm 으로 관리, RN 0.85 는 최소 Node 22.11 요구) |
| npm | 10.9.7 |
| Java JDK | Temurin 17.0.18 (scoop 으로 관리) |
| Android SDK | `C:\Users\yblee\AppData\Local\Android\Sdk` |
| adb | 37.0.0 |
| Android Studio | Panda 3 (2025.3.3 Patch 1) |
| 에뮬레이터 | Pixel_10 (Android 16, API 36) |
| 설치된 SDK Platform | Android 15 (API 35) + Android 16 (API 36) |
| 환경변수 | `ANDROID_HOME`, `PATH` (platform-tools, emulator) 설정됨 |
| 주 터미널 | **Git Bash** (VSCode 통합 터미널 기본값) |
| 보조 터미널 | PowerShell (fnm, 환경변수 GUI 작업용) |

### 0.3 코드 편집 환경

- **메인 편집기**: VSCode (Windows) — Claude Code 실행 위치
- **Android Studio**: 에뮬레이터 실행 전용. 코드 편집 안 함.
- **WSL**: 서버 프로젝트 전용. 앱 개발에 사용하지 않음.
- **VSCode 필수 확장**: ESLint, Prettier, React Native Tools, ES7+ React snippets
- **VSCode 설정**: `.vscode/settings.json` (저장 시 자동 포맷 + ESLint 자동 수정 + LF 라인 엔딩)

### 0.4 사용자 응답 형식 규칙

Claude Code 가 앱 개발 중 확인이 필요한 사항이 있을 때는 **추측 금지, 반드시 질문 후 진행**. 질문 형식:

- 현재 확인된 사실
- 가능한 선택지
- 각 선택지의 영향
- 추천안

---

## 1. 기술 스택 확정

### 1.1 핵심 스택

| 항목 | 선택 | 확정 이유 |
|------|------|----------|
| 프레임워크 | **React Native CLI 0.85.1** (정확히 핀, `^` 금지) | `@react-native-firebase/*` native module 요구. 0.85.0 은 Hermes TurboModule 크래시 버그 있어서 0.85.1 필수. |
| New Architecture | **기본 ON, 비활성 불가** | RN 0.82+ 부터 Legacy(Paper) 아키텍처 런타임 제거. `newArchEnabled=false` 는 경고만 남기고 무시됨. |
| 언어 | **TypeScript 5.8.x** | 타입 안정성. RTDB 스키마를 타입으로 표현. |
| 상태 관리 | **Zustand 5.x** | 가벼움. RTDB 리스너와 궁합 좋음. Redux 대비 보일러플레이트 적음. |
| Firebase SDK | `@react-native-firebase/*` 24.x | Auth + RTDB + Messaging 네이티브 통합. v24 는 modular API 스타일 (Firebase JS SDK 12 기반). |
| 차트 | **TradingView Lightweight Charts** (WebView 내부 로드) | 핀치 줌 / 드래그 기본 제공. 서버 데이터 포맷이 이 라이브러리에 최적화됨. |
| 네비게이션 | React Navigation 7.x (Bottom Tabs) | 4탭 구조. RN 0.85 와 호환 검증됨. |
| 다크모드 | **고정** (시스템 설정 무시) | 주식 차트 앱 관례. |
| Firebase RTDB persistence | **OFF (끔)** | 데이터 깜빡임 방지. 매번 RTDB 직접 읽기. |
| Hermes 엔진 | **V1 기본 활성** | RN 0.84+ 부터 기본. 추가 설정 불필요. |

### 1.2 주요 의존성 (package.json 확정 버전)

RN CLI 템플릿이 자동 생성하는 항목은 **RN 0.85.1 과 함께 테스트된 정확한 조합** 이므로 **개별적으로 버전 업그레이드 금지**. 외부 라이브러리만 아래 버전으로 추가.

```json
{
  "dependencies": {
    "react": "19.2.3",
    "react-native": "0.85.1",
    "@react-native/new-app-screen": "0.85.1",
    "@react-native-firebase/app": "^24.0.0",
    "@react-native-firebase/auth": "^24.0.0",
    "@react-native-firebase/database": "^24.0.0",
    "@react-native-firebase/messaging": "^24.0.0",
    "@react-navigation/native": "^7.2.2",
    "@react-navigation/bottom-tabs": "^7.2.0",
    "react-native-webview": "^13.16.1",
    "react-native-safe-area-context": "^5.7.0",
    "react-native-screens": "^4.24.0",
    "react-native-gesture-handler": "^2.31.1",
    "@react-native-community/netinfo": "^12.0.1",
    "react-native-uuid": "^2.0.4",
    "zustand": "^5.0.12"
  }
}
```

버전 확정 근거:
- **react-native 0.85.1**: 0.85.0 의 Hermes `async void` TurboModule 크래시 버그 회피 (2026-04-14 패치)
- **react 19.2.3**: RN 0.85.1 이 요구하는 정확한 React 버전
- **@react-native-firebase 24.x**: modular API, Firebase JS SDK 12 기반. RTDB/Auth/FCM 은 v22→v24 사이 런타임 파괴 변경 없음. Android 전용이라 iOS 측 prebuilt-core 이슈(#8960) 무관.
- **navigation 7.x**: RN 0.85 와 호환 검증됨. screens 4.x + safe-area-context 5.x 와 짝.
- **gesture-handler 2.31.1**: 최신 3 마이너(0.83/0.84/0.85) 공식 테스트. v3.0 베타는 선택 금물.
- **zustand 5.x**: 순수 JS. RN 버전 무관.

참고: 새 라이브러리 추가는 **Phase 별 실제 필요 시점**에 `npm install` 로 진행 (Phase 1~7 진행 중 순차 설치).

### 1.3 빌드 설정 (Android)

| 항목 | 값 | 근거 |
|------|---|-----|
| `minSdkVersion` | 24 (Android 7.0) | Firebase SDK 최소 요구 |
| `targetSdkVersion` | **35** (Android 15) | RN 0.85.1 템플릿 기본값. Play Store 2024+ 정책 충족. |
| `compileSdkVersion` | **35** | targetSdkVersion 과 일치 |
| Hermes 엔진 | **V1 기본 활성** (RN 0.84+) | 추가 설정 불필요 |
| New Architecture | **ON (강제)** | RN 0.82+ 에서 Legacy 제거. 끌 수 없음. |
| 배포 형식 | APK 사이드로드 (MVP) / AAB (Play Store 제출 시) | - |

---

## 2. 비목표 — 앱이 하지 않는 것

다음은 앱의 책임 밖이다. Phase 전체에 걸쳐 아래 항목들을 추가 구현 요청 금지:

| 비목표 | 이유 |
|--------|-----|
| 백테스트 실행 | 서버(`src/live/`) 전담 |
| 시그널 계산 | 서버 전담. 앱은 결과만 표시. |
| Git 정본 직접 접근 | `qbt-live-state` 리포는 서버 전용. **앱에 GitHub 토큰 절대 없음**. |
| 오프라인 모드 동작 | 네트워크 필수. 오프라인 시 전체 화면 차단. |
| 디바이스 저장 | 메모리 캐시만. AsyncStorage / SQLite 미사용. |
| Firebase RTDB persistence | 깜빡임 방지 위해 OFF. |
| iOS 지원 | Android 전용. |
| 캐시 초기화 버튼 | 앱 재시작으로 해결. |
| 실시간 RTDB 리스너 | `onValue` 미사용. `once` 만 사용. |
| Drift 상세 화면 | 제거됨. drift 는 Model 비교 카드에서만 노출. |
| 별도 포트폴리오 카드 | 자산 현황 카드에 통합. |
| 차트 기간 선택 버튼 | 3M/6M/1Y/전체 등 모두 제거. 핀치 줌/드래그만. |
| 마커 종류별 on/off 토글 | 4종(매수시그널/매도시그널/내매수/내매도) 항상 표시. |
| 자산별 부분 동기화 | Model 동기화는 항상 전체. |
| 알림 data payload 처리 | `notification.body` 텍스트만 표시. |
| 수익률 / 실현 손익 저장 | 원본(가격, 수량)만 저장. 앱에서 표시 시 실시간 계산. |

---

## 3. 전체 아키텍처

### 3.1 서버 ↔ 앱 데이터 흐름

```
                   [GitHub Actions cron]
                    평일 ET 17:27 1회
                           |
                           v
                   +----------------+
                   |  live (서버)    |
                   +----------------+
                     |            |
     Git 원장 read/write         RTDB read/write
                     v            v
          [qbt-live-state]   [Firebase RTDB]  --- FCM 알림 --->  [Android 앱]
           (앱 접근 불가)    /latest/*                                  ^
                             /charts/*                                  |
                             /history/*                                 |
                             /fills/inbox       <----- 체결/보정 입력 ---+
                             /balance_adjust/inbox                      |
                             /fill_dismiss/inbox                        |
                             /model_sync/inbox                          |
                             /device_tokens                             |
```

### 3.2 핵심 원칙 (앱 관점)

1. **앱이 유일한 UI** — 웹 없음.
2. **Git = 서버 정본, RTDB = 앱 버스** — 앱은 Git 에 직접 접근하지 않는다.
3. **model / actual 분리** — actual 축은 앱 입력으로만 갱신된다. 서버는 actual 을 덮어쓰지 않는다.
4. **inbox 패턴** — `/latest/*` 는 서버가 매 실행마다 전체 덮어쓰므로 앱이 직접 쓰면 사라진다. 앱의 모든 쓰기는 4개 inbox + `/device_tokens/` 로만 가능:
   - `/fills/inbox/{uuid}`
   - `/balance_adjust/inbox/{uuid}`
   - `/fill_dismiss/inbox/{uuid}`
   - `/model_sync/inbox/{uuid}`
   - `/device_tokens/{device_id}`
5. **앱이 절대 쓰면 안 되는 경로**:
   - `/latest/*` (서버가 매 실행 덮어씀)
   - `/charts/*` (서버 갱신)
   - `/history/*` (서버 갱신)
   - `*/inbox/{uuid}` 의 `processed` 필드 (서버 전용)
6. **리스너 미사용** — `onValue` 금지. 매 탭 진입/refresh 마다 `once('value')` 로 직접 읽기.

### 3.3 서버 실행 / 갱신 시점

- **daily runner 실행**: 평일 ET 17:27 cron (≈ KST 새벽 06:27)
- **RTDB 갱신 완료**: ≈ KST 06:30
- **사용자 앱 사용 추정**: KST 07:00 이후
- **주말/휴일**: daily runner 미실행 → 데이터 변화 없음

---

## 4. 폴더 구조

### 4.1 앱 프로젝트 루트

```
qbt-live-app/
├── CLAUDE.md                        ← 앱 코딩 규칙
├── LICENSE                          ← (미래 추가 예정, Phase 9 이후)
├── README.md                        ← (개발 완료 후 포트폴리오 형태로 작성)
├── .gitignore                       ← google-services.json / node_modules / 빌드 산출물 제외
├── .gitattributes                   ← 줄바꿈 LF 통일
├── .vscode/
│   └── settings.json                ← 포맷터/린터 자동화 (팀 공유)
├── docs/
│   ├── DESIGN_APP.md                ← 본 문서
│   ├── DESIGN_QBT_LIVE_FINAL.md     ← 서버↔앱 RTDB 계약 (서버와 공유)
│   └── PROMPT_APP.md                ← Phase별 작업 프롬프트
├── android/                         ← React Native CLI 자동 생성
│   └── app/
│       ├── google-services.json     ← Firebase 설정 (사용자가 배치, Git 제외)
│       └── build.gradle             ← applicationId: com.ingbeen.qbtlive
├── ios/                             ← 현재 무시 (Android 전용)
├── src/
│   ├── App.tsx                      ← 진입점 (NavigationContainer + Auth gate)
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ChartScreen.tsx
│   │   ├── TradeScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/                  ← 재사용 컴포넌트
│   │   ├── Badge.tsx
│   │   ├── Toast.tsx
│   │   ├── SyncDialog.tsx
│   │   ├── OfflineScreen.tsx
│   │   ├── LoadingIndicator.tsx
│   │   └── PullToRefreshScrollView.tsx
│   ├── store/
│   │   └── useStore.ts              ← Zustand
│   ├── services/
│   │   ├── firebase.ts              ← Firebase 초기화 (persistence OFF 포함)
│   │   ├── rtdb.ts                  ← RTDB 읽기/쓰기 헬퍼
│   │   ├── auth.ts                  ← Auth 관리
│   │   ├── fcm.ts                   ← FCM 토큰 관리
│   │   └── chart.ts                 ← 차트 데이터 로드 (recent + archive 병합)
│   ├── navigation/
│   │   └── AppNavigator.tsx         ← React Navigation (Bottom Tabs)
│   ├── utils/
│   │   ├── validation.ts            ← 유효성 검사 함수
│   │   ├── format.ts                ← 숫자/날짜 포맷 (한국어 단위 포함)
│   │   ├── colors.ts                ← 색상 상수
│   │   ├── constants.ts             ← 앱 전역 상수 (RTDB 경로, OWNER_UID 등)
│   │   └── chartHtml.ts             ← TradingView Lightweight Charts HTML 생성
│   └── types/
│       └── rtdb.ts                  ← RTDB 데이터 타입 (DESIGN_QBT_LIVE_FINAL 미러)
├── package.json
├── tsconfig.json
├── babel.config.js
└── metro.config.js
```

### 4.2 분류 원칙

- **screens/**: 탭별 최상위 컴포넌트. 라우팅과 직결되는 화면만.
- **components/**: 2개 이상 screens 에서 재사용 가능한 순수 UI 컴포넌트.
- **services/**: 외부 I/O (Firebase, WebView 등). 순수 함수 위주.
- **store/**: Zustand store 및 액션.
- **utils/**: 순수 유틸 (포맷, 검증, 상수).
- **types/**: 타입 정의 (RTDB 스키마 미러).

---

## 5. 데이터 계약 (RTDB)

본 섹션은 서버 SoT `docs/DESIGN_QBT_LIVE_FINAL.md` 를 앱 관점에서 재구성한 것이다. **스키마 변경 시 서버 문서가 우선, 본 섹션은 미러**. 상세 필드 설명은 `docs/DESIGN_QBT_LIVE_FINAL.md §8.2` 를 SoT 로 참조한다.

### 5.1 앱이 읽는 RTDB 경로

```
/latest/portfolio                                 ← 전체 자산 요약 + drift + assets/{asset_id}
/latest/signals/{asset_id}                        ← 당일 시그널 / MA / 밴드
/latest/pending_orders/{asset_id}                 ← 익일 체결 예정 주문 (pending 있는 자산만)
/charts/prices/{asset_id}/meta                    ← 차트 메타
/charts/prices/{asset_id}/recent                  ← 최근 6개월 slice
/charts/prices/{asset_id}/archive/{YYYY}          ← 연도별 slice
/charts/equity/meta
/charts/equity/recent
/charts/equity/archive/{YYYY}
/history/fills/{YYYY-MM-DD}/{uuid}
/history/balance_adjusts/{YYYY-MM-DD}/{uuid}
/history/signals/{YYYY-MM-DD}/{asset_id}
/fills/inbox/{uuid}                               ← processed=false 만 필터
/balance_adjust/inbox/{uuid}                      ← processed=false 만 필터
/fill_dismiss/inbox/{uuid}                        ← processed=false 만 필터
/model_sync/inbox/{uuid}                          ← processed=false 만 필터
```

### 5.2 앱이 쓰는 RTDB 경로

```
/fills/inbox/{uuid}              ← 체결 입력
/balance_adjust/inbox/{uuid}     ← 잔고 보정
/fill_dismiss/inbox/{uuid}       ← 시그널 스킵
/model_sync/inbox/{uuid}         ← Model 동기화 요청
/device_tokens/{device_id}       ← FCM 토큰 등록
```

### 5.3 TypeScript 타입 정의 (`src/types/rtdb.ts`)

본 섹션은 TypeScript 로 변환한 스키마이다. 실제 코드에 그대로 사용.

```typescript
// ============================================================
// Enum / Literal
// ============================================================

export type AssetId = 'sso' | 'qld' | 'gld' | 'tlt';
export type Direction = 'buy' | 'sell';
export type SignalState = 'buy' | 'sell';          // 누적 원장
export type DetectionState = 'buy' | 'sell' | 'none'; // 당일 감지

export type IntentType =
  | 'EXIT_ALL'
  | 'ENTER_TO_TARGET'
  | 'REDUCE_TO_TARGET'
  | 'INCREASE_TO_TARGET';

// ============================================================
// /latest/portfolio
// ============================================================

export interface AssetSnapshot {
  model_shares: number;
  actual_shares: number;
  signal_state: SignalState;
}

export interface Portfolio {
  execution_date: string;         // ISO 8601 YYYY-MM-DD
  model_equity: number;
  actual_equity: number;
  drift_pct: number;              // 0~1 ratio (ROUND_RATIO=4)
  shared_cash_model: number;
  shared_cash_actual: number;
  assets: Record<AssetId, AssetSnapshot>;
}

// ============================================================
// /latest/signals/{asset_id}
// ============================================================

export interface Signal {
  state: DetectionState;
  close: number;                  // ROUND_PRICE=6
  ma_value: number | null;        // 워밍업 null
  ma_distance_pct: number;        // 0~1 ratio, 음수 가능
  upper_band: number | null;      // BufferZone 미사용 자산 null
  lower_band: number | null;
}

// ============================================================
// /latest/pending_orders/{asset_id}
// ============================================================

export interface PendingOrder {
  asset_id: AssetId;
  intent_type: IntentType;
  signal_date: string;            // ISO 8601
  current_amount: number;
  target_amount: number;
  delta_amount: number;           // 음수=매도, 양수=매수
  target_weight: number;          // 0~1
  hold_days_used: number;
  reason: string;
}

// ============================================================
// /charts/prices/{asset_id}/meta, /charts/equity/meta
// ============================================================

export interface ChartMeta {
  first_date: string;
  last_date: string;
  ma_window?: number;             // 주가만
  recent_months: number;
  archive_years: number[];        // 오름차순
}

// ============================================================
// /charts/prices/{asset_id}/(recent|archive/{YYYY})
// ============================================================

export interface PriceChartSeries {
  dates: string[];
  close: number[];
  ma_value: (number | null)[];
  upper_band: (number | null)[];
  lower_band: (number | null)[];
  buy_signals?: string[];         // RTDB 빈 배열 미저장 → 키 부재 시 []
  sell_signals?: string[];
  user_buys?: string[];
  user_sells?: string[];
}

// ============================================================
// /charts/equity/(recent|archive/{YYYY})
// ============================================================

export interface EquityChartSeries {
  dates: string[];
  model_equity: number[];
  actual_equity: number[];
  drift_pct: number[];            // 0~1
}

// ============================================================
// /fills/inbox/{uuid} (write)
// ============================================================

export interface FillPayload {
  asset_id: AssetId;
  direction: Direction;
  actual_price: number;
  actual_shares: number;
  trade_date: string;             // YYYY-MM-DD
  input_time_kst: string;         // ISO 8601 KST with offset
  memo?: string | null;
  reason?: string;                // 기본 ""
}

// ============================================================
// /balance_adjust/inbox/{uuid} (write)
// ============================================================

export interface BalanceAdjustPayload {
  asset_id?: AssetId | null;      // 현금만 보정 시 null
  new_shares?: number | null;
  new_avg_price?: number | null;
  new_entry_date?: string | null; // YYYY-MM-DD
  new_cash?: number | null;
  reason: string;
  input_time_kst: string;
}

// ============================================================
// /fill_dismiss/inbox/{uuid} (write)
// ============================================================

export interface FillDismissPayload {
  asset_id: AssetId;
  reason?: string;
  input_time_kst: string;
}

// ============================================================
// /model_sync/inbox/{uuid} (write)
// ============================================================

export interface ModelSyncPayload {
  input_time_kst: string;         // 필수, 빈 문자열 불가
}

// ============================================================
// /history/fills/{YYYY-MM-DD}/{uuid}
// ============================================================

export interface FillHistory extends FillPayload {
  applied_at: string;             // ISO 8601 KST
  memo: string | null;            // 읽을 때는 null 가능
  reason: string;                 // 읽을 때는 필수
}

// ============================================================
// /history/balance_adjusts/{YYYY-MM-DD}/{uuid}
// ============================================================

export interface BalanceAdjustHistory {
  asset_id: AssetId | null;
  new_shares: number | null;
  new_avg_price: number | null;
  new_entry_date: string | null;
  new_cash: number | null;
  reason: string;
  input_time_kst: string;
  applied_at: string;
}

// ============================================================
// /history/signals/{YYYY-MM-DD}/{asset_id}
// ============================================================

export interface SignalHistory {
  state: DetectionState;
  close: number;
  ma_value: number | null;
  ma_distance_pct: number;
  upper_band: number | null;
  lower_band: number | null;
}
```

### 5.4 빈 배열 / null 처리 (중요)

Firebase RTDB 는 빈 배열(`[]`)을 저장하지 않는다. 따라서:

- 차트 마커 4종 (`buy_signals` / `sell_signals` / `user_buys` / `user_sells`) 이 비어있으면 **키 자체가 생성되지 않음**. 앱은 `key === undefined` 를 "빈 배열" 로 해석해야 한다.
- `ma_value` / `upper_band` / `lower_band` 워밍업 구간은 `null` 값. 배열 인덱스는 유지.

Helper 예시:

```typescript
const buySignals = chartRecent.buy_signals ?? [];
```

### 5.5 `drift_pct` 스케일 규칙

- RTDB 저장: **0~1 ratio** (예: `0.0037` = 0.37%)
- UI 표시: `(drift_pct * 100).toFixed(2) + '%'`
- 앱 계층에서 `×100` 변환. 서버 데이터는 건드리지 않는다.

### 5.6 drift 임계값 라벨 (§12 참고)

| 비율 (0~1) | 라벨 | UI 표시 예 |
|-----------|------|-----------|
| 0 ~ 0.03 | 정상 | `0.00%` ~ `2.99%` |
| 0.03 ~ 0.05 | 주의 | `3.00%` ~ `4.99%` |
| 0.05 이상 | 보정 필요 | `5.00%` 이상 |

앱 내부 비교는 0~1 ratio 로 직접 수행 (스케일 변환 불필요).

### 5.7 식별자 규칙

- `asset_id`: **항상 소문자** (`sso`, `qld`, `gld`, `tlt`) — RTDB 경로, 페이로드, 저장 키 모두
- UI 표시: **대문자** (`SSO`, `QLD`, `GLD`, `TLT`) — 앱이 표시 시점에만 변환

```typescript
// utils/format.ts
export const toUpperTicker = (id: AssetId): string => id.toUpperCase();
```

### 5.8 MA 근접도 티커 매핑

MA 근접도는 **signal 티커** (trade 티커 아님):

| 자산 ID | Trade 티커 | Signal 티커 (MA 근접도 표시) |
|---------|------------|-----------------------------|
| `sso`   | SSO        | **SPY**                     |
| `qld`   | QLD        | **QQQ**                     |
| `gld`   | GLD        | GLD                         |
| `tlt`   | TLT        | TLT                         |

```typescript
// utils/format.ts
export const toSignalTicker = (id: AssetId): string => {
  const map: Record<AssetId, string> = {
    sso: 'SPY', qld: 'QQQ', gld: 'GLD', tlt: 'TLT',
  };
  return map[id];
};
```

---

## 6. Zustand Store 구조

### 6.1 핵심 원칙

1. **Zustand store 구조 = RTDB 경로 트리와 동일** — 학습 부담 최소화
2. **데이터별 캐시** (탭별 분리 아님) — 탭 간 자연스럽게 공유
3. **actions 플래그 없음** — RTDB inbox 자체가 "액션 상태" 를 담당
4. **Firebase RTDB persistence OFF** — 매번 직접 읽기
5. **메모리 캐시만** — AsyncStorage / 디바이스 저장 없음
6. **리스너 없음** — `onValue` 금지. `once` 로만 읽고 수동 refresh.

### 6.2 Store 인터페이스 (`src/store/useStore.ts`)

```typescript
import { create } from 'zustand';
import type {
  Portfolio, Signal, PendingOrder,
  ChartMeta, PriceChartSeries, EquityChartSeries,
  FillHistory, BalanceAdjustHistory, SignalHistory,
  FillPayload, BalanceAdjustPayload,
  AssetId,
} from '../types/rtdb';

interface InboxItem {
  uuid: string;
  data: unknown;
}

interface PriceChartCache {
  meta: ChartMeta | null;
  recent: PriceChartSeries | null;
  archive: Record<number, PriceChartSeries>;   // { 2024: {...}, ... }
}

interface EquityChartCache {
  meta: ChartMeta | null;
  recent: EquityChartSeries | null;
  archive: Record<number, EquityChartSeries>;
}

interface Store {
  // ─── 인증 ───
  user: { uid: string; email: string | null } | null;

  // ─── /latest/* ───
  portfolio: Portfolio | null;
  signals: Record<AssetId, Signal> | null;
  pendingOrders: Partial<Record<AssetId, PendingOrder>> | null;  // pending 있는 자산만

  // ─── /charts/* ───
  priceCharts: Partial<Record<AssetId, PriceChartCache>>;
  equityChart: EquityChartCache;

  // ─── /history/* ───
  historyFills: FillHistory[] | null;
  historyBalanceAdjusts: BalanceAdjustHistory[] | null;
  historySignals: Array<{ date: string; asset_id: AssetId; signal: SignalHistory }> | null;

  // ─── inbox (processed=false 만) ───
  inboxFills: InboxItem[] | null;
  inboxBalanceAdjusts: InboxItem[] | null;
  inboxFillDismiss: InboxItem[] | null;
  inboxModelSync: InboxItem[] | null;

  // ─── UI 상태 ───
  loading: Partial<Record<string, boolean>>;  // { portfolio: false, chart_sso: true, ... }
  lastError: string | null;
  isOnline: boolean;

  // ─── 액션: 읽기 ───
  refreshHome: () => Promise<void>;
  refreshChart: (assetId: AssetId | 'equity') => Promise<void>;
  refreshTrade: () => Promise<void>;
  loadPriceArchive: (assetId: AssetId, year: number) => Promise<void>;
  loadEquityArchive: (year: number) => Promise<void>;

  // ─── 액션: 쓰기 (RTDB inbox 로 push) ───
  submitFill: (p: FillPayload) => Promise<void>;
  submitBalanceAdjust: (p: BalanceAdjustPayload) => Promise<void>;
  submitFillDismiss: (assetId: AssetId, reason?: string) => Promise<void>;
  submitModelSync: () => Promise<void>;

  // ─── 액션: 세션 ───
  setUser: (user: Store['user']) => void;
  clearAll: () => void;
  setOnline: (online: boolean) => void;
}

export const useStore = create<Store>((set, get) => ({
  user: null,

  portfolio: null,
  signals: null,
  pendingOrders: null,

  priceCharts: {},
  equityChart: { meta: null, recent: null, archive: {} },

  historyFills: null,
  historyBalanceAdjusts: null,
  historySignals: null,

  inboxFills: null,
  inboxBalanceAdjusts: null,
  inboxFillDismiss: null,
  inboxModelSync: null,

  loading: {},
  lastError: null,
  isOnline: true,

  refreshHome: async () => { /* §9.2 참고 */ },
  refreshChart: async (assetId) => { /* §9.3 참고 */ },
  refreshTrade: async () => { /* §9.4 참고 */ },
  loadPriceArchive: async (assetId, year) => { /* §9.3 참고 */ },
  loadEquityArchive: async (year) => { /* §9.3 참고 */ },

  submitFill: async (p) => { /* §9.5 참고 */ },
  submitBalanceAdjust: async (p) => { /* §9.5 참고 */ },
  submitFillDismiss: async (assetId, reason) => { /* §9.5 참고 */ },
  submitModelSync: async () => { /* §9.5 참고 */ },

  setUser: (user) => set({ user }),
  clearAll: () => set({
    portfolio: null, signals: null, pendingOrders: null,
    priceCharts: {}, equityChart: { meta: null, recent: null, archive: {} },
    historyFills: null, historyBalanceAdjusts: null, historySignals: null,
    inboxFills: null, inboxBalanceAdjusts: null,
    inboxFillDismiss: null, inboxModelSync: null,
    loading: {}, lastError: null,
  }),
  setOnline: (isOnline) => set({ isOnline }),
}));
```

### 6.3 탭별 데이터 의존성

| 탭 | 사용 Store 필드 |
|----|----------------|
| 홈 | `portfolio`, `signals`, `pendingOrders`, `inboxFills`, `inboxFillDismiss`, `inboxModelSync` |
| 차트 | `priceCharts.*`, `equityChart.*` |
| 거래 | `pendingOrders`, `inboxFills`, `historyFills`, `historyBalanceAdjusts`, `historySignals` |
| 설정 | (RTDB 데이터 불필요, `user` 만) |

`pendingOrders` 와 `inboxFills` 는 홈/거래 탭에서 **공유** (재로드 안 함).

### 6.4 로딩 정책

| 시점 | 동작 |
|------|------|
| 앱 시작 (cold start) | 캐시 전부 없음 → 홈 데이터만 로드 |
| 백그라운드 → 포그라운드 | 모든 캐시 무효화 (`clearAll`) + 홈 데이터만 재로드 |
| Pull-to-refresh | 현재 탭 데이터만 재로드 |
| 탭 이동 | 캐시 있으면 사용, 없으면 로드 |
| 차트 자산 변경 | 해당 자산만 로드 (캐시 활용) |
| 차트 줌 아웃 (recent 끝) | 필요한 archive 연도만 추가 로드 |
| 체결/보정/스킵/동기화 저장 후 | **자동 재로드 안 함**. 폼 초기화 + 토스트만. 사용자가 pull-to-refresh 로 갱신. |

### 6.5 "처리 상태" 판단 원칙

앱은 inbox 의 `processed` 필드를 **읽지 않는다**. 체결/보정 반영 여부는:

- **체결 반영**: `/latest/portfolio.actual_shares` 변화, `/latest/pending_orders` 소멸
- **보정 반영**: `/latest/portfolio.actual_shares` / `shared_cash_actual` 변화
- **스킵 반영**: 다음 daily runner 후 "미입력 체결 리마인더" 사라짐
- **동기화 반영**: `model_shares === actual_shares`, `shared_cash_model === shared_cash_actual`

inbox 에서 `processed=false` 인 항목은 "아직 반영 안 된 요청" 으로 간주, 필터링해서 store 에 저장.

---

## 7. 인증 (Firebase Auth Email/Password)

### 7.1 로그인 플로우

```
앱 시작
 │
 v
Firebase Auth 자동 로그인 시도 (persistence 기본값 — 토큰 유지)
 │
 ├── 성공 → Store.setUser + 홈 탭 진입 + /device_tokens/ 확인
 │
 └── 실패 → LoginScreen 표시
             │
             v
          이메일 + 비밀번호 입력 → [로그인] → 성공 시 위 흐름
```

### 7.2 `src/services/auth.ts`

```typescript
import auth from '@react-native-firebase/auth';
import { useStore } from '../store/useStore';

export const signIn = async (email: string, password: string): Promise<void> => {
  const cred = await auth().signInWithEmailAndPassword(email, password);
  useStore.getState().setUser({
    uid: cred.user.uid,
    email: cred.user.email,
  });
};

export const signOut = async (): Promise<void> => {
  await auth().signOut();
  useStore.getState().clearAll();
  useStore.getState().setUser(null);
};

export const subscribeAuthState = (
  onChange: (user: { uid: string; email: string | null } | null) => void,
): (() => void) => {
  return auth().onAuthStateChanged((fbUser) => {
    if (fbUser) {
      onChange({ uid: fbUser.uid, email: fbUser.email });
    } else {
      onChange(null);
    }
  });
};
```

### 7.3 권한 검증

- RTDB Rules: `auth.uid === OWNER_UID` 만 읽기/쓰기 허용
- 앱은 로그인 후 자동으로 권한 획득 (Rules 는 서버 측 배치, §15 참고)

### 7.4 로그인 화면 (`src/screens/LoginScreen.tsx`)

- 디자인: 최소 (다크 모드, 중앙 정렬)
- 구성: 제목 "QBT Live" + 이메일 input + 비밀번호 input + [로그인] 버튼
- 에러 시: 빨간 텍스트로 "이메일 또는 비밀번호가 올바르지 않습니다" 표시
- 로딩 시: 버튼 비활성화 + 스피너

---

## 8. 네비게이션

### 8.1 `src/App.tsx` 구조

```typescript
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { subscribeAuthState } from './services/auth';
import { useStore } from './store/useStore';
import { LoginScreen } from './screens/LoginScreen';
import { AppNavigator } from './navigation/AppNavigator';
import { OfflineScreen } from './components/OfflineScreen';
import { initFirebase } from './services/firebase';
import { setupNetworkListener } from './services/network';

export default function App() {
  const user = useStore(s => s.user);
  const isOnline = useStore(s => s.isOnline);

  useEffect(() => {
    initFirebase();
    const unsubAuth = subscribeAuthState((u) => useStore.getState().setUser(u));
    const unsubNet = setupNetworkListener();
    return () => { unsubAuth(); unsubNet(); };
  }, []);

  if (!isOnline) return <OfflineScreen />;

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <LoginScreen />}
    </NavigationContainer>
  );
}
```

### 8.2 `src/navigation/AppNavigator.tsx`

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { ChartScreen } from '../screens/ChartScreen';
import { TradeScreen } from '../screens/TradeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { HomeHeader } from '../components/HomeHeader';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      header: () => <HomeHeader />,     // "QBT Live" 고정 헤더
      tabBarStyle: { backgroundColor: '#161b22', borderTopColor: '#30363d' },
      tabBarActiveTintColor: '#58a6ff',
      tabBarInactiveTintColor: '#8b949e',
    }}
  >
    <Tab.Screen name="홈" component={HomeScreen} />
    <Tab.Screen name="차트" component={ChartScreen} />
    <Tab.Screen name="거래" component={TradeScreen} />
    <Tab.Screen name="설정" component={SettingsScreen} />
  </Tab.Navigator>
);
```

### 8.3 헤더 규칙

- **상단 헤더**: 모든 탭에서 "QBT Live" 고정. 화면 전환 시 헤더 변경 없음.
- **탭 아이콘**: Feather-style (SVG, mockup v4 §TabIcon 참고)
- **토스트**: 탭 전환과 무관하게 헤더 바로 아래 overlay. zIndex: 25.

---

## 9. 서비스 레이어 (RTDB)

### 9.1 Firebase 초기화 (`src/services/firebase.ts`)

**Firebase SDK v24 사용**. v24 는 modular API 기반 (Firebase JS SDK 12 와 유사). 본 프로젝트는 각 서비스(auth, database, messaging)의 **default export 함수 호출 스타일** 로 통일한다. `firebase.database()` 같은 namespaced 접근은 사용하지 않는다.

```typescript
import database from '@react-native-firebase/database';

export const initFirebase = (): void => {
  // Persistence OFF — 데이터 깜빡임 방지, 매번 직접 읽기
  database().setPersistenceEnabled(false);
};

// RTDB 루트 헬퍼
export const db = () => database();
```

**주의**: `@react-native-firebase/app` v24 는 **Android minSdk 23 이상** 을 요구하지만 본 프로젝트 minSdk 24 는 충족. Firebase iOS SDK 12.x 기반이나 Android 전용이라 무관.

### 9.2 홈 탭 로더 (`src/services/rtdb.ts`)

```typescript
import { db } from './firebase';
import type {
  Portfolio, Signal, PendingOrder, AssetId,
  FillPayload, BalanceAdjustPayload,
  FillDismissPayload, ModelSyncPayload,
} from '../types/rtdb';

// ─── 읽기 헬퍼 (once 만 사용, onValue 금지) ───

export const readOnce = async <T>(path: string): Promise<T | null> => {
  const snap = await db().ref(path).once('value');
  return snap.exists() ? (snap.val() as T) : null;
};

// ─── /latest/* ───

export const readPortfolio = (): Promise<Portfolio | null> =>
  readOnce<Portfolio>('/latest/portfolio');

export const readAllSignals = (): Promise<Record<AssetId, Signal> | null> =>
  readOnce<Record<AssetId, Signal>>('/latest/signals');

export const readAllPendingOrders = (): Promise<Partial<Record<AssetId, PendingOrder>> | null> =>
  readOnce<Partial<Record<AssetId, PendingOrder>>>('/latest/pending_orders');

// ─── /charts/* ───

export const readPriceChartMeta = (assetId: AssetId) =>
  readOnce<ChartMeta>(`/charts/prices/${assetId}/meta`);

export const readPriceChartRecent = (assetId: AssetId) =>
  readOnce<PriceChartSeries>(`/charts/prices/${assetId}/recent`);

export const readPriceChartArchive = (assetId: AssetId, year: number) =>
  readOnce<PriceChartSeries>(`/charts/prices/${assetId}/archive/${year}`);

export const readEquityChartMeta = () =>
  readOnce<ChartMeta>('/charts/equity/meta');

export const readEquityChartRecent = () =>
  readOnce<EquityChartSeries>('/charts/equity/recent');

export const readEquityChartArchive = (year: number) =>
  readOnce<EquityChartSeries>(`/charts/equity/archive/${year}`);

// ─── /history/* ───

export const readHistoryFills = async (): Promise<FillHistory[]> => {
  const snap = await db().ref('/history/fills').once('value');
  if (!snap.exists()) return [];
  const tree = snap.val() as Record<string, Record<string, FillHistory>>;
  const flat: FillHistory[] = [];
  for (const date of Object.keys(tree)) {
    for (const uuid of Object.keys(tree[date])) {
      flat.push(tree[date][uuid]);
    }
  }
  // 최신순 정렬
  flat.sort((a, b) => b.input_time_kst.localeCompare(a.input_time_kst));
  return flat;
};

// (balance_adjusts, signals 도 유사 패턴)

// ─── inbox (processed=false 필터) ───

export const readInboxFills = async (): Promise<InboxItem[]> => {
  const snap = await db().ref('/fills/inbox').once('value');
  if (!snap.exists()) return [];
  const tree = snap.val() as Record<string, { processed?: boolean } & FillPayload>;
  return Object.entries(tree)
    .filter(([_, v]) => v.processed !== true)
    .map(([uuid, data]) => ({ uuid, data }));
};

// (balance_adjust/fill_dismiss/model_sync 도 유사)
```

### 9.3 차트 점진 로딩 규칙

```
앱 진입 시:
  1. meta + recent 병렬 로드 → setData(recent)

사용자가 좌측 끝까지 줌 아웃:
  2. meta.archive_years 참고하여 archive/{YYYY} 추가 로드
     - 이미 로드된 연도 skip
     - Map<date, point> 으로 dedupe 후 차트 갱신

전체 보기:
  3. archive_years 전체 순회 로드 (캐시 재사용)
```

**중요**: recent 와 archive/{현재_연도} 는 경계 날짜가 겹친다. 앱은 반드시 dedupe 해야 함 (§5.2 참고).

```typescript
// src/services/chart.ts
export const mergeChartSeries = (
  recent: PriceChartSeries,
  archives: PriceChartSeries[],
): PriceChartSeries => {
  type Point = {
    close: number;
    ma_value: number | null;
    upper_band: number | null;
    lower_band: number | null;
  };
  const map = new Map<string, Point>();

  const ingest = (s: PriceChartSeries) => {
    s.dates.forEach((date, i) => {
      map.set(date, {
        close: s.close[i],
        ma_value: s.ma_value[i],
        upper_band: s.upper_band[i],
        lower_band: s.lower_band[i],
      });
    });
  };

  archives.forEach(ingest);
  ingest(recent);  // recent 가 archive 덮어쓰기 (동일 날짜면 recent 우선)

  const sortedDates = Array.from(map.keys()).sort();
  return {
    dates: sortedDates,
    close: sortedDates.map(d => map.get(d)!.close),
    ma_value: sortedDates.map(d => map.get(d)!.ma_value),
    upper_band: sortedDates.map(d => map.get(d)!.upper_band),
    lower_band: sortedDates.map(d => map.get(d)!.lower_band),
    buy_signals: dedupMarkers([
      ...(recent.buy_signals ?? []),
      ...archives.flatMap(a => a.buy_signals ?? []),
    ]),
    sell_signals: dedupMarkers([
      ...(recent.sell_signals ?? []),
      ...archives.flatMap(a => a.sell_signals ?? []),
    ]),
    user_buys: dedupMarkers([
      ...(recent.user_buys ?? []),
      ...archives.flatMap(a => a.user_buys ?? []),
    ]),
    user_sells: dedupMarkers([
      ...(recent.user_sells ?? []),
      ...archives.flatMap(a => a.user_sells ?? []),
    ]),
  };
};

const dedupMarkers = (arr: string[]): string[] => Array.from(new Set(arr)).sort();
```

### 9.4 거래 탭 로더 (히스토리 + inbox)

```typescript
export const loadTradeTabData = async () => {
  const [fills, adjusts, signals, inboxFills, inboxAdjusts, inboxDismiss] = await Promise.all([
    readHistoryFills(),
    readHistoryBalanceAdjusts(),
    readHistorySignals(),
    readInboxFills(),
    readInboxBalanceAdjusts(),
    readInboxFillDismiss(),
  ]);
  return { fills, adjusts, signals, inboxFills, inboxAdjusts, inboxDismiss };
};
```

### 9.5 쓰기 헬퍼 (inbox push)

```typescript
import uuid from 'react-native-uuid';

const kstNow = (): string => {
  const d = new Date();
  const off = 9 * 60;  // KST +09:00
  const local = new Date(d.getTime() + (off - d.getTimezoneOffset()) * 60000);
  const iso = local.toISOString().replace('Z', '+09:00');
  return iso;
};

export const submitFill = async (p: FillPayload): Promise<void> => {
  const key = uuid.v4() as string;
  const payload = {
    ...p,
    input_time_kst: p.input_time_kst || kstNow(),
    reason: p.reason ?? '',
  };
  await db().ref(`/fills/inbox/${key}`).set(payload);
};

export const submitBalanceAdjust = async (p: BalanceAdjustPayload): Promise<void> => {
  const key = uuid.v4() as string;
  const payload = {
    ...p,
    input_time_kst: p.input_time_kst || kstNow(),
  };
  await db().ref(`/balance_adjust/inbox/${key}`).set(payload);
};

export const submitFillDismiss = async (assetId: AssetId, reason?: string): Promise<void> => {
  const key = uuid.v4() as string;
  const payload: FillDismissPayload = {
    asset_id: assetId,
    reason: reason ?? '수동 스킵',
    input_time_kst: kstNow(),
  };
  await db().ref(`/fill_dismiss/inbox/${key}`).set(payload);
};

export const submitModelSync = async (): Promise<void> => {
  const key = uuid.v4() as string;
  const payload: ModelSyncPayload = {
    input_time_kst: kstNow(),
  };
  await db().ref(`/model_sync/inbox/${key}`).set(payload);
};
```

### 9.6 에러 처리 규칙

| 상황 | 처리 |
|------|------|
| RTDB 타임아웃 (10초) | "데이터를 불러올 수 없습니다." + [다시 시도] 버튼 |
| RTDB 권한 오류 (PERMISSION_DENIED) | "권한이 없습니다. OWNER_UID 설정을 확인하세요." + 로그아웃 옵션 |
| 네트워크 없음 | §12 참고 (전체 화면 차단) |
| 저장 실패 (submit*) | Toast 는 **성공 시에만** 표시. 실패 시 빨간 에러 텍스트 + 폼 유지. |

---

## 10. FCM (푸시 알림)

### 10.1 토큰 등록 / 갱신

```typescript
// src/services/fcm.ts
import messaging from '@react-native-firebase/messaging';
import { db } from './firebase';
import uuid from 'react-native-uuid';

const DEVICE_ID_KEY = 'qbt_device_id';  // 메모리만. 세션 간 유지 안 함.
let cachedDeviceId: string | null = null;

const getDeviceId = (): string => {
  if (!cachedDeviceId) cachedDeviceId = uuid.v4() as string;
  return cachedDeviceId;
};

export const ensureFcmToken = async (): Promise<void> => {
  // 1. 권한 요청 (Android 13+)
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  if (!enabled) return;

  // 2. 토큰 가져오기
  const token = await messaging().getToken();
  const deviceId = getDeviceId();
  await db().ref(`/device_tokens/${deviceId}`).set(token);

  // 3. 토큰 갱신 감지
  messaging().onTokenRefresh(async (newToken) => {
    await db().ref(`/device_tokens/${deviceId}`).set(newToken);
  });
};

export const setupForegroundHandler = (): (() => void) => {
  return messaging().onMessage(async (msg) => {
    // 포그라운드 알림은 인앱 표시 (선택) 또는 무시
    // MVP: 무시. 알림 트레이만 사용.
  });
};

export const setupNotificationTapHandler = (
  onTap: () => void,  // 홈 탭으로 이동
): (() => void) => {
  // 백그라운드에서 알림 탭 → 앱 열림
  messaging().onNotificationOpenedApp(() => onTap());

  // 앱 종료 상태에서 알림 탭 → 앱 시작
  messaging()
    .getInitialNotification()
    .then((msg) => { if (msg) onTap(); });

  return () => {};  // onNotificationOpenedApp 은 unsubscribe 불필요
};
```

### 10.2 알림 수신 정책

| 앱 상태 | 동작 |
|---------|------|
| 포그라운드 | 알림 무시 (MVP). 사용자가 pull-to-refresh 로 새 데이터 확인. |
| 백그라운드 | 시스템 알림 트레이에 표시 |
| 종료 상태 | 시스템 알림 트레이에 표시 |
| 알림 탭 (백그라운드/종료) | 앱 열림 → **항상 홈 탭** |

### 10.3 알림 payload 파싱 규칙

서버는 FCM `notification.body` 만 사용 (data payload 없음). 앱은 **텍스트를 그대로 표시** (파싱/가공 금지). 예:

```
[QBT Live] 2026-04-15

시그널: SSO buy
리밸런싱: 발생
미입력 체결 리마인더: 1 건

model equity: 12,345,678
actual equity: 12,300,000
drift: 0.37%
MA 근접도: SPY +2.45%, QQQ -1.05%, GLD +0.80%, TLT -1.20%
```

---

## 11. 색상 / 폰트 / 배지 / 토스트

### 11.1 색상 시스템 (다크 모드, `src/utils/colors.ts`)

```typescript
export const COLORS = {
  bg: '#0d1117',
  card: '#161b22',
  border: '#30363d',
  text: '#e6edf3',
  sub: '#8b949e',

  // 액센트
  accent: '#58a6ff',   // 파랑 — 링크, 활성 탭, 정보
  green: '#3fb950',    // 매수, 보유, 정상
  red: '#f85149',      // 매도, 경고
  yellow: '#d29922',   // 주의, 보정, drift 경고
  orange: '#db6d28',   // 리마인더, pending 강조

  // 토스트 전용
  toastBg: '#1a3a26',
  toastBorder: '#3fb950',
  toastText: '#e8ffe8',
  toastClose: '#a8d8b3',
} as const;
```

### 11.2 폰트

- **권장**: Pretendard (한글 + 영문, 한국어 가독성). Variable 폰트로 번들링.
- **폴백**: `-apple-system, sans-serif` (폰트 로딩 실패 시)
- **적용 방법**: `android/app/src/main/assets/fonts/` 에 `.ttf` 배치 후 `react-native.config.js` 에 등록 → `fontFamily: 'Pretendard'` 전역 사용

### 11.3 배지 시스템

#### 자산 상태 배지 (홈 탭 자산 현황 카드)

| 배지 | 조건 | 색상 (카테고리) |
|------|------|----------------|
| `[보유]` | `actual_shares > 0` (B&H 포함) | 초록 (`green`) |
| `[현금]` | `signal_state === 'sell'` && `actual_shares === 0` | 회색 (`sub`) |
| `[매수대기]` | `pendingOrders[asset]` 존재 && `delta_amount > 0` | 파랑 (`accent`) |
| `[매도대기]` | `pendingOrders[asset]` 존재 && `delta_amount < 0` | 빨강 (`red`) |

**중요**: 리밸런싱 시 B&H 자산(GLD/TLT)도 `[매수대기]` / `[매도대기]` 배지 가능.

```typescript
// components/AssetBadge.tsx
export const getAssetBadge = (
  snap: AssetSnapshot,
  pending: PendingOrder | undefined,
): { text: string; color: string } => {
  if (pending) {
    return pending.delta_amount > 0
      ? { text: '매수대기', color: COLORS.accent }
      : { text: '매도대기', color: COLORS.red };
  }
  if (snap.actual_shares > 0) return { text: '보유', color: COLORS.green };
  return { text: '현금', color: COLORS.sub };
};
```

#### 히스토리 이벤트 배지

| 배지 | 위치 | 조건 | 색상 |
|------|------|------|------|
| `[시스템]` | 체결 히스토리 | `reason === 'system_fill'` | 초록 |
| `[개인]` | 체결 히스토리 | `reason === 'personal_trade'` | 빨강 |

#### 알림 / 상태 배지

| 배지 | 위치 | 조건 | 색상 |
|------|------|------|------|
| `[정상]` | 홈 상단 | `오늘 - execution_date <= 4일` | 초록 |
| `[경고]` | 홈 상단 | `오늘 - execution_date > 4일` | 노랑 |

### 11.4 공통 Badge 컴포넌트

```typescript
// src/components/Badge.tsx
import { View, Text, StyleSheet } from 'react-native';

export const Badge: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <View style={[styles.wrap, { backgroundColor: color + '22' }]}>
    <Text style={[styles.text, { color }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, marginLeft: 6 },
  text: { fontSize: 10, fontWeight: '600' },
});
```

### 11.5 토스트 시스템

#### 스타일

- **위치**: 상단 (헤더 바로 아래, zIndex 25)
- **배경**: 진한 초록 `#1a3a26` + 초록 테두리 `#3fb950`
- **그림자**: `offset: (0, 4), radius: 12, opacity: 0.6` (가독성)
- **텍스트**: 밝은 초록 `#e8ffe8`, 13px
- **닫기 버튼**: 우측 `✕` (단, 텍스트에 `✕` 외 이모지는 **금지**)

#### 메시지

| 액션 | 메시지 |
|------|--------|
| 체결 저장 | `체결이 저장되었습니다.\n다음 실행에 반영됩니다.` |
| 보정 저장 | `보정이 저장되었습니다.\n다음 실행에 반영됩니다.` |
| 시그널 스킵 | `스킵이 저장되었습니다.\n다음 실행에 반영됩니다.` |
| Model 동기화 | `동기화 요청이 저장되었습니다.\n다음 실행에 반영됩니다.` |

#### 저장 후 동작

1. RTDB inbox 에 저장 (await)
2. **입력 폼 전체 초기화** (모든 필드 비우기)
3. 토스트 표시 (자동 사라짐 3초 또는 ✕ 탭)
4. 화면 전환 없음 (같은 탭 유지)

#### 토스트 컴포넌트

```typescript
// src/components/Toast.tsx
import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';

interface Props {
  message: string;
  onClose: () => void;
  autoHideMs?: number;  // 기본 3000
}

export const Toast: React.FC<Props> = ({ message, onClose, autoHideMs = 3000 }) => {
  useEffect(() => {
    const t = setTimeout(onClose, autoHideMs);
    return () => clearTimeout(t);
  }, [autoHideMs, onClose]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{message}</Text>
      <TouchableOpacity onPress={onClose} style={styles.close}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', top: 54, left: 12, right: 12, zIndex: 25,
    backgroundColor: COLORS.toastBg,
    borderWidth: 1, borderColor: COLORS.toastBorder,
    borderRadius: 8, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, shadowOpacity: 0.6,
    elevation: 8,
  },
  text: { flex: 1, fontSize: 13, color: COLORS.toastText, fontWeight: '500', lineHeight: 18 },
  close: { marginLeft: 10 },
  closeText: { color: COLORS.toastClose, fontSize: 16 },
});
```

---

## 12. 오프라인 / 데이터 최신성

### 12.1 네트워크 감지 (`src/services/network.ts`)

```typescript
import NetInfo from '@react-native-community/netinfo';
import { useStore } from '../store/useStore';

export const setupNetworkListener = (): (() => void) => {
  return NetInfo.addEventListener((state) => {
    const online = !!state.isConnected && state.isInternetReachable !== false;
    useStore.getState().setOnline(online);
  });
};
```

### 12.2 오프라인 화면 (`src/components/OfflineScreen.tsx`)

네트워크 없음 → 전체 화면 차단:

```
┌─────────────────────┐
│                     │
│      (아이콘)        │    ← 이모지 금지. SVG "disconnect" 아이콘 사용.
│                     │
│   네트워크 없음       │
│   연결 후 다시 시도   │
│                     │
│    [다시 시도]       │
│                     │
└─────────────────────┘
```

- [다시 시도] 탭 → `NetInfo.refresh()` 호출
- 네트워크 복귀 → 자동으로 `OfflineScreen` 사라지고 이전 화면 복귀

### 12.3 데이터 최신성 배지

**홈 탭 상단**:
```
업데이트: 2026-04-15 07:27 KST    [정상]
```

- 시각: `/latest/portfolio.execution_date` + 고정 시각 (daily runner 완료 시각 추정)
- 배지 규칙:
  - `오늘 - execution_date <= 4일` → `[정상]` (초록)
  - `오늘 - execution_date > 4일` → `[경고]` (노랑)

**갱신 시점**:
- 앱 시작 (cold start)
- 백그라운드 → 포그라운드 복귀 (모든 캐시 무효화 + 홈 데이터만 재로드)
- Pull-to-refresh (현재 탭만 재로드)

**NYSE 거래일 판단 안 함** — 앱은 단순 일 단위 차이로만 판단. 휴일/주말 고려 없음.

### 12.4 포그라운드 복귀 처리 (`src/App.tsx`)

```typescript
import { AppState } from 'react-native';

useEffect(() => {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      // 캐시 무효화 + 홈 재로드
      useStore.getState().clearAll();
      if (useStore.getState().user) useStore.getState().refreshHome();
    }
  });
  return () => sub.remove();
}, []);
```

---

## 13. 유효성 검사 (클라이언트 단)

서버 측에도 동일 검증이 있지만 (§`docs/DESIGN_QBT_LIVE_FINAL.md` §8.2.7~8.2.8), 사용자에게 즉각 피드백을 주기 위해 앱에서도 검증.

### 13.1 체결 입력

| 필드 | 검증 |
|------|------|
| 자산 (`asset_id`) | 4자산(`sso`/`qld`/`gld`/`tlt`) 중 1개 필수 |
| 방향 (`direction`) | `buy` / `sell` 필수 (대소문자 민감) |
| 수량 (`actual_shares`) | 양의 정수. 매도 시 `actual_shares <= 보유 주수` |
| 체결가 (`actual_price`) | 양의 실수 (소수점 가능) |
| 체결일 (`trade_date`) | `YYYY-MM-DD` 형식, 미래 날짜 불가 |
| 메모 (`memo`) | 자유 텍스트 (선택) |

### 13.2 잔고 보정

| 필드 | 검증 |
|------|------|
| 대상 | 5개(SSO/QLD/GLD/TLT/현금) 중 1개 필수 |
| 새 주수 (자산, `new_shares`) | 0 이상 정수 |
| 새 평균가 (자산, `new_avg_price`) | 양의 실수. `actual_shares === 0` 이고 `new_shares` 미지정이면 차단 ("보유 주수가 0인 자산의 평균가/진입일을 설정할 수 없습니다") |
| 새 진입일 (자산, `new_entry_date`) | `YYYY-MM-DD` 형식, 미래 날짜 불가 |
| 새 현금 (`new_cash`) | 0 이상 정수 (원 단위) |
| 사유 (`reason`) | 권장 (audit 목적) |

**추가 규칙**:
- `new_shares` / `new_avg_price` / `new_entry_date` / `new_cash` 네 필드 모두 미입력 → [저장] 비활성화 ("빈 보정은 전송할 수 없습니다")
- `new_shares === 0` + `new_avg_price` 동시 입력 → 평균가 무시 안내 ("주수가 0이면 평균가는 무시됩니다")

### 13.3 Model 동기화

- 별도 입력 필드 없음 (확인 다이얼로그 1회만)
- 다이얼로그 본문에 pending 자동 표시

### 13.4 검증 실패 시 UI

- 해당 필드 빨강 테두리 (`borderColor: COLORS.red`)
- 하단에 에러 메시지 (빨강 텍스트, 12px)
- [저장] 버튼 비활성화 (`backgroundColor: COLORS.sub`, `opacity: 0.5`)

### 13.5 `src/utils/validation.ts` 예시

```typescript
import type { FillPayload, BalanceAdjustPayload, AssetId, Portfolio } from '../types/rtdb';

export interface ValidationResult {
  valid: boolean;
  fieldErrors: Partial<Record<string, string>>;
  formError?: string;
}

export const validateFill = (
  p: Partial<FillPayload>,
  portfolio: Portfolio | null,
): ValidationResult => {
  const fieldErrors: Record<string, string> = {};

  if (!p.asset_id) fieldErrors.asset_id = '자산을 선택하세요';
  if (!p.direction) fieldErrors.direction = '방향을 선택하세요';
  if (!p.actual_shares || p.actual_shares <= 0 || !Number.isInteger(p.actual_shares)) {
    fieldErrors.actual_shares = '수량은 양의 정수여야 합니다';
  }
  if (!p.actual_price || p.actual_price <= 0) {
    fieldErrors.actual_price = '체결가는 양수여야 합니다';
  }
  if (!p.trade_date || !/^\d{4}-\d{2}-\d{2}$/.test(p.trade_date)) {
    fieldErrors.trade_date = 'YYYY-MM-DD 형식이어야 합니다';
  } else if (p.trade_date > new Date().toISOString().slice(0, 10)) {
    fieldErrors.trade_date = '미래 날짜는 입력할 수 없습니다';
  }

  // 매도 수량 검증
  if (
    p.direction === 'sell' && p.asset_id && p.actual_shares && portfolio
  ) {
    const owned = portfolio.assets[p.asset_id]?.actual_shares ?? 0;
    if (p.actual_shares > owned) {
      fieldErrors.actual_shares = `매도 수량이 보유 주수(${owned}주)를 초과합니다`;
    }
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
};

// validateBalanceAdjust 도 유사 패턴
```

### 13.6 수익률 / 손익 계산 (앱 전담)

- **저장하지 않음**. 원본(가격, 수량, 평균가)만 RTDB/Git 에 저장.
- **앱에서 실시간 계산**: 표시 시점의 종가 vs 평균 매수가
- 계산식:
  ```typescript
  const roi = (close - actualAvgPrice) / actualAvgPrice;  // 0~1 ratio
  const realized = (actualPrice - actualAvgPrice) * actualShares;  // 실현 손익
  ```

---

## 14. 차트 (TradingView Lightweight Charts)

### 14.1 구현 방식

- **WebView** 내부에 `<script>` 로 Lightweight Charts 라이브러리 로드
- RTDB 데이터 → `postMessage` 로 WebView 로 전달
- WebView → 차트 렌더링, 핀치 줌 / 드래그 기본 제공

### 14.2 WebView HTML 생성 (`src/utils/chartHtml.ts`)

```typescript
// CDN: https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js
export const generateChartHtml = (): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <script src="https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js"></script>
  <style>
    html, body, #chart { margin:0; padding:0; width:100%; height:100%; background:#161b22; }
    body { overflow: hidden; }
  </style>
</head>
<body>
  <div id="chart"></div>
  <script>
    const chart = LightweightCharts.createChart(document.getElementById('chart'), {
      layout: { background: { color: '#161b22' }, textColor: '#8b949e' },
      grid: { vertLines: { color: '#30363d22' }, horzLines: { color: '#30363d22' } },
      timeScale: { borderColor: '#30363d' },
      rightPriceScale: { borderColor: '#30363d' },
      crosshair: { mode: 1 },
    });

    let closeSeries, maSeries, upperSeries, lowerSeries;
    let modelSeries, actualSeries;

    // 주가 차트 모드
    window.setPriceChart = (data) => {
      chart.removeSeries(closeSeries); /* ...모두 정리 */
      closeSeries = chart.addLineSeries({ color: '#58a6ff', lineWidth: 2 });
      maSeries = chart.addLineSeries({ color: '#d29922', lineWidth: 1, lineStyle: 2 });
      upperSeries = chart.addLineSeries({ color: '#f85149aa', lineWidth: 1, lineStyle: 2 });
      lowerSeries = chart.addLineSeries({ color: '#3fb950aa', lineWidth: 1, lineStyle: 2 });

      closeSeries.setData(data.dates.map((d,i) => ({ time: d, value: data.close[i] })));
      maSeries.setData(data.dates.map((d,i) => ({ time: d, value: data.ma_value[i] })).filter(p => p.value !== null));
      upperSeries.setData(data.dates.map((d,i) => ({ time: d, value: data.upper_band[i] })).filter(p => p.value !== null));
      lowerSeries.setData(data.dates.map((d,i) => ({ time: d, value: data.lower_band[i] })).filter(p => p.value !== null));

      // 마커 4종
      const markers = [];
      (data.buy_signals || []).forEach(d => markers.push({ time: d, position: 'belowBar', color: '#3fb950', shape: 'arrowUp', text: '' }));
      (data.sell_signals || []).forEach(d => markers.push({ time: d, position: 'aboveBar', color: '#f85149', shape: 'arrowDown', text: '' }));
      (data.user_buys || []).forEach(d => markers.push({ time: d, position: 'belowBar', color: '#3fb950', shape: 'circle', text: '' }));
      (data.user_sells || []).forEach(d => markers.push({ time: d, position: 'aboveBar', color: '#f85149', shape: 'circle', text: '' }));
      markers.sort((a,b) => a.time.localeCompare(b.time));
      closeSeries.setMarkers(markers);
    };

    // Equity 차트 모드
    window.setEquityChart = (data) => {
      modelSeries = chart.addLineSeries({ color: '#58a6ff', lineWidth: 2, title: 'Model' });
      actualSeries = chart.addLineSeries({ color: '#3fb950', lineWidth: 2, lineStyle: 2, title: 'Actual' });
      modelSeries.setData(data.dates.map((d,i) => ({ time: d, value: data.model_equity[i] })));
      actualSeries.setData(data.dates.map((d,i) => ({ time: d, value: data.actual_equity[i] })));
    };

    // 좌측 끝 감지 → React Native 에 archive 로드 요청
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range && range.from < 10) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'load_earlier' }));
      }
    });

    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
  </script>
</body>
</html>
`;
```

### 14.3 ChartScreen 구조

```
[차트 종류 토글]  주가 / Equity
[자산 선택]      (주가 선택 시만) SSO / QLD / GLD / TLT
[WebView 차트]   핀치 줌 / 드래그만. 기간 선택 버튼 없음.
[범례]           차트 하단 고정
```

**범례** (주가):
```
── 종가    --- EMA-200    ┄ 상단밴드    ┄ 하단밴드
▲ 매수시그널    ▼ 매도시그널    ● 내 매수    ● 내 매도
```

**범례** (Equity):
```
── Model    --- Actual
```

### 14.4 WebView 메시지 프로토콜

```
RN → WebView: webviewRef.injectJavaScript(`window.setPriceChart(${JSON.stringify(data)})`)
WebView → RN: window.ReactNativeWebView.postMessage(JSON.stringify({ type, ... }))
              - type: 'ready'          → WebView 초기 로딩 완료
              - type: 'load_earlier'   → 사용자가 좌측 끝 도달 → archive 로드 필요
```

### 14.5 차트 마커 정책

| 이벤트 | 마커 | 색상 | 데이터 소스 |
|--------|------|------|------------|
| 시스템 매수 시그널 | ▲ (arrowUp, belowBar) | 초록 `#3fb950` | `buy_signals` |
| 시스템 매도 시그널 | ▼ (arrowDown, aboveBar) | 빨강 `#f85149` | `sell_signals` |
| 내 매수 체결 | ● (circle, belowBar) | 초록 `#3fb950` | `user_buys` |
| 내 매도 체결 | ● (circle, aboveBar) | 빨강 `#f85149` | `user_sells` |

**정책**:
- 4종 **항상 표시** (on/off 토글 없음)
- 시그널 마커 위치 = 시그널 발생일 (종가 기준, i일)
- 체결 마커 위치 = 체결일 (시가 기준, i+1일 시가 체결, fill 입력 시)
- `balance_adjust` / `model_sync` / `fill_dismiss` 는 **차트 마커 대상 아님**

---

## 15. 화면별 구현 가이드

### 15.1 홈 탭 (`src/screens/HomeScreen.tsx`)

#### 화면 구조 (위→아래)

```
1. 업데이트 시각 + 정상/경고 배지
2. 미입력 체결 리마인더 블록 (있을 때만)
3. 시그널 → 다음 거래일 체결 예정 블록 (있을 때만)
4. 자산 현황 카드 (제목 우측에 합계 금액 통합)
5. MA 근접도 (200일선)
6. Model 비교 (접힌 상태, 클릭 시 펼침)
```

#### 컴포넌트 트리

```
HomeScreen
├── PullToRefreshScrollView
│   ├── UpdateStatusBadge             ← execution_date + 정상/경고
│   ├── ReminderBlock                 ← 미입력 체결 리마인더 (조건부)
│   ├── SignalNextFillBlock           ← 다음 거래일 체결 예정 (조건부)
│   ├── AssetSummaryCard              ← 자산 현황 (4자산 + 현금)
│   ├── MAProximityCard               ← MA 근접도 (SPY/QQQ/GLD/TLT)
│   └── ModelCompareCard              ← 접힌 상태, 탭 시 펼침
│       └── SyncDialog (modal)
└── Toast (조건부, store.lastToast 기반)
```

#### 업데이트 시각 + 배지

```
업데이트: 2026-04-15 07:27 KST    [정상]
```

- 왼쪽: 11px 회색 텍스트 `업데이트: YYYY-MM-DD HH:MM KST`
  - 날짜 = `portfolio.execution_date`
  - 시각 = 고정 "07:30 KST" (daily runner 완료 추정) 또는 서버 제공 시 그 값 사용. MVP 는 고정.
- 오른쪽: 배지 (§11.3)

#### 미입력 체결 리마인더 블록

**표시 조건**: `pendingOrders[asset]` 이 존재하고, **해당 자산에 대해 최근 `inboxFills` / `inboxFillDismiss` 모두 없는** 경우.

```typescript
const shouldShowReminder = (
  pending: PendingOrder,
  inboxFills: InboxItem[],
  inboxDismiss: InboxItem[],
): boolean => {
  const hasFill = inboxFills.some(x => (x.data as FillPayload).asset_id === pending.asset_id);
  const hasDismiss = inboxDismiss.some(x => (x.data as FillDismissPayload).asset_id === pending.asset_id);
  return !hasFill && !hasDismiss;
};
```

**스타일**: 주황 배경/테두리 (`#db6d28` 15% 배경 + 44% 테두리)

**본문**:
```
⚠ 미입력 체결 리마인더
{ASSET_UPPER} {수량}주 {매수/매도} ({날짜} 시그널)
```

- 안내 문구/추가 버튼 없음 (단순 표시만)
- 거래 탭에서 처리 유도

**참고**: `⚠` 는 이모지가 아닌 유니코드 기호로 간주. `src/utils/constants.ts` 에 `WARN_SIGN = '⚠'` 로 정의. (이모지 금지 규칙 §`CLAUDE.md` 참고)

#### 시그널 → 체결 예정 블록 (합친 블록)

**표시 조건**: `pendingOrders` 가 1개 이상 존재 (pending 없는 날은 블록 자체 숨김)

**스타일**: 파랑 배경/테두리 (`#58a6ff` 12% 배경 + 33% 테두리)

**제목**: "시그널 → 다음 거래일 체결 예정"

**본문**: 자산별 한 줄
```
{ASSET_UPPER} {수량}주 {매수/매도}
```

- 예상가 표시 안 함
- 수량 계산: `Math.floor(pending.delta_amount / 예상가)` — 단, 앱이 정확한 수량을 모를 수 있으므로 `delta_amount` 만 표시하거나 서버 제공 `target_shares` 필드가 있으면 그 값 사용 (현재 서버 스키마엔 없으므로 `delta_amount > 0 ? '매수' : '매도'` 방향만 표시하고 수량은 생략 가능)

**실제 구현 결정**: `delta_amount` 과 `/latest/signals/{asset_id}.close` 를 조합해서 예상 수량 계산

```typescript
const estimatedShares = Math.round(Math.abs(pending.delta_amount) / signals[pending.asset_id].close);
const direction = pending.delta_amount > 0 ? '매수' : '매도';
const line = `${toUpperTicker(pending.asset_id)} ${estimatedShares}주 ${direction}`;
```

#### 자산 현황 카드

**헤더**: 좌측 "자산 현황" (13px 볼드) + 우측 합계 금액 (18px 볼드)
- 합계 = `model_equity` 또는 `actual_equity` (MVP: `actual_equity` 사용)
- 형식: `1억 424만원` (한국어 단위 포맷, §16.1)

**자산별 행** (4개, SSO/QLD/GLD/TLT 순):
```
[ASSET_UPPER]  [배지]           {수량}주 {평균가}
                                 {비중%}
```

- 왼쪽: 13px 볼드 티커 + 배지 (`[보유]` / `[현금]` / `[매수대기]` / `[매도대기]`)
- 오른쪽:
  - 상단: 12px 텍스트 `298주 $82.05` (수량은 `actual_shares`, 평균가는 계산 — 실제로는 `actual_avg_entry_price` 가 RTDB 에 없으므로 표시 불가. **MVP: 평균가 표시 생략** 또는 history 에서 계산. 결정 필요 — §15.1.7 참고)
  - 하단: 10px 회색 `비중%` (자산 평가액 / 총 equity × 100, `.1` 소수점)

**마지막 행 — 현금**:
```
현금                                {금액}
                                    {비중%}
```

- `shared_cash_actual` → `1,234만원` 형식
- 비중 = `shared_cash_actual / actual_equity × 100`

#### 15.1.1 평균가 / 진입일 표시 처리 (중요)

**문제**: RTDB `/latest/portfolio.assets.{asset_id}` 는 `model_shares`, `actual_shares`, `signal_state` 3개 필드만 제공. `actual_avg_entry_price` / `actual_entry_date` 는 노출되지 않음.

**해결 방안**: `/history/fills/` 에서 가장 최근 `actual_avg_entry_price` 에 해당하는 값을 역산하거나, `/history/balance_adjusts/` 의 최근 값을 참고.

**MVP 결정**:
- **자산 현황 카드**: 수량 + 비중만 표시. 평균가는 **거래 탭 > 보정 탭 > 대상 선택 시** 현재 상태 영역에서만 노출 (서버가 거기서는 정확한 값을 제공하므로).
- 홈 탭 자산 행의 UI 목업에 "$82.05" 가 있는 부분 → **MVP 에서는 평균가 표시 제거**. Phase 9 이후 추후 확장 시 서버 스키마 확장 검토.
- 대안: 서버에 `/latest/portfolio/assets/{asset_id}/actual_avg_entry_price` 추가 요청 (별도 plan 필요, MVP 범위 밖)

이 결정은 UI 목업 v4 와 약간 다르지만, 데이터 정합성 우선.

#### MA 근접도 카드

**제목**: "MA 근접도 (200일선)" (13px 볼드)

**행**: `SPY` / `QQQ` / `GLD` / `TLT` (signal 티커 기준, trade 티커 아님)
```
SPY                                +3.23%
QQQ                                -0.84%
GLD                                +1.12%
TLT                                -2.05%
```

- 왼쪽: 12px 회색 signal 티커
- 오른쪽: 12px 색상 있는 텍스트 (`+` → 초록 `#3fb950`, `-` → 빨강 `#f85149`)
- 값: `(signals[asset].ma_distance_pct * 100).toFixed(2) + '%'` (부호 포함)

#### Model 비교 카드

**접힌 상태**:
```
Model 비교                         ▼
```
- 탭 시 펼침

**펼친 상태**:
```
Model 비교                         ▲
─────────────────────────────────────
Model           Actual
1억 345만       1억 301만

SSO     M:300 / A:298  (-2)        ← 차이 있으면 노랑
QLD     M:400 / A:395  (-5)
GLD     M:55  / A:55
TLT     M:170 / A:170
─────────────────────────
현금    M:50만 / A:48.5만           ← 노랑

[Model을 실제로 동기화]            ← 파랑 버튼
```

- 차이가 `0` 이면 회색 (`sub`), 아니면 노랑 (`yellow`)
- 동기화 버튼 탭 → SyncDialog 표시

#### SyncDialog

**모달 구성**:
- 배경: 검정 75% 투명
- 카드: 320px 최대 너비
- 제목: "Model 동기화"
- 본문: "Model을 실제 기준으로 동기화합니다."
- pending 안내 (있을 때만, 주황 배경/테두리):
  ```
  ⚠ 체결 예정 주문이 있습니다:
  {ASSET_UPPER} {수량}주 {매수/매도} ({날짜} 시그널)
  
  동기화 시 이 주문은 취소되고,
  다음 실행에서 새로 계산됩니다.
  ```
- 버튼: `[취소]` (회색 테두리) + `[동기화]` (파랑 채움)

**동기화 확정**:
1. `store.submitModelSync()` 호출
2. Dialog 닫음
3. Toast: `동기화 요청이 저장되었습니다.\n다음 실행에 반영됩니다.`

---

### 15.2 차트 탭 (`src/screens/ChartScreen.tsx`)

#### 화면 구조

```
[차트 종류 토글]  주가 / Equity
[자산 선택]      (주가 선택 시만) SSO / QLD / GLD / TLT
[WebView 차트]   핀치 줌 / 드래그
[범례]           차트 하단 고정
```

#### 컴포넌트 트리

```
ChartScreen
├── ChartTypeToggle                   ← 주가 / Equity
├── AssetSelector (조건부)             ← 주가일 때만
├── ChartWebView                      ← TradingView Lightweight Charts
└── ChartLegend                       ← 범례
```

#### 상태 관리

```typescript
const ChartScreen = () => {
  const [chartType, setChartType] = useState<'price' | 'equity'>('price');
  const [assetId, setAssetId] = useState<AssetId>('sso');
  const webviewRef = useRef<WebView>(null);
  
  const priceCache = useStore(s => s.priceCharts[assetId]);
  const equityCache = useStore(s => s.equityChart);
  const loadPriceArchive = useStore(s => s.loadPriceArchive);
  const loadEquityArchive = useStore(s => s.loadEquityArchive);
  
  // 탭 진입 또는 자산 변경 시 meta+recent 로드
  useEffect(() => {
    if (chartType === 'price') {
      if (!priceCache?.recent) {
        useStore.getState().refreshChart(assetId);
      } else {
        injectChartData();
      }
    } else {
      if (!equityCache.recent) {
        useStore.getState().refreshChart('equity');
      } else {
        injectChartData();
      }
    }
  }, [chartType, assetId]);
  
  // WebView 에서 'load_earlier' 받으면 archive 로드
  const onWebViewMessage = (event: WebViewMessageEvent) => {
    const msg = JSON.parse(event.nativeEvent.data);
    if (msg.type === 'ready') {
      injectChartData();
    } else if (msg.type === 'load_earlier') {
      loadEarlierData();
    }
  };
  
  // ...
};
```

#### 차트 데이터 주입

```typescript
const injectChartData = () => {
  if (chartType === 'price') {
    const merged = mergeChartSeries(
      priceCache.recent!,
      Object.values(priceCache.archive),
    );
    webviewRef.current?.injectJavaScript(
      `window.setPriceChart(${JSON.stringify(merged)}); true;`
    );
  } else {
    const merged = mergeEquitySeries(
      equityCache.recent!,
      Object.values(equityCache.archive),
    );
    webviewRef.current?.injectJavaScript(
      `window.setEquityChart(${JSON.stringify(merged)}); true;`
    );
  }
};
```

#### 좌측 끝 감지 → archive 로드

```typescript
const loadEarlierData = async () => {
  if (chartType === 'price') {
    const meta = priceCache?.meta;
    if (!meta) return;
    const loadedYears = new Set(Object.keys(priceCache.archive).map(Number));
    const earliestLoaded = Math.min(
      ...priceCache.recent!.dates.map(d => parseInt(d.slice(0, 4))),
      ...loadedYears,
    );
    const yearToLoad = earliestLoaded - 1;
    if (meta.archive_years.includes(yearToLoad)) {
      await loadPriceArchive(assetId, yearToLoad);
      injectChartData();
    }
  }
  // equity 도 유사
};
```

#### 기간 선택 버튼 없음

- 3M / 6M / 1Y / 전체 버튼 **없음**
- 핀치 줌 / 드래그만으로 탐색
- 안내 텍스트 없음 (사용자 직관 기대)

#### 차트 종류 토글 스타일

```
[ 주가 ][ Equity ]    ← 활성: 파랑 채움 + 흰 텍스트 / 비활성: 어두운 카드 + 회색 텍스트
```

#### 자산 선택 버튼 (주가 차트 전용)

```
[SSO][QLD][GLD][TLT]  ← 활성: 파랑 반투명 + 파랑 텍스트 / 비활성: 투명 + 회색
```

---

### 15.3 거래 탭 (`src/screens/TradeScreen.tsx`)

#### 화면 구조

```
[거래 종류 탭]  체결 입력 / 잔고 보정
[입력 폼]      (탭에 따라 다름)
[히스토리]     필터 + 통합 타임라인
```

#### 컴포넌트 트리

```
TradeScreen
├── TradeTabSelector                  ← 체결 / 보정
├── FillForm (체결 선택 시)
│   ├── PendingHint (조건부)
│   ├── AssetSelector (4자산, pending 자산 ⚡ 표시)
│   ├── DirectionSelector (매수/매도)
│   ├── SharesInput + PriceInput
│   ├── DatePicker
│   ├── MemoInput
│   ├── [체결 저장] 버튼
│   └── [이 시그널 스킵] 버튼 (조건부)
├── AdjustForm (보정 선택 시)
│   ├── TargetSelector (SSO/QLD/GLD/TLT/현금)
│   ├── CurrentStatus (선택 대상 현재 값)
│   ├── InputFields (자산 3개 또는 현금 1개)
│   ├── ReasonInput
│   └── [보정 저장] 버튼
└── HistoryList
    ├── FilterChips (전체/체결/보정/신호)
    └── HistoryRow[]
```

#### 15.3.1 체결 입력 폼 (FillForm)

**필드 순서**:

1. **pending 힌트 영역** (있을 때만)
   - 스타일: 파랑 배경 (`accent` 15%)
   - 텍스트: `⚡ {ASSET_UPPER} {수량}주 {매수/매도} pending`
   - 자산 선택 시 자동으로 "예상 체결가" 힌트 표시 (pending.target_amount / delta_amount 기반)

2. **자산 선택**
   - 4자산 모두 선택 가능 (시그널 없는 자산도 개인 매매 허용)
   - pending 있는 자산은 `⚡` 표시 (우측 상단)
   - 활성: 파랑 반투명 + 파랑 텍스트

3. **방향 선택**
   - `[매수]` / `[매도]` 2버튼
   - 매수 활성: 초록 반투명 / 매도 활성: 빨강 반투명

4. **수량 입력** + **체결가 입력** (2열 grid)
   - 숫자 키패드 (`keyboardType="numeric"`)
   - placeholder: "0" / "0.00"

5. **체결일**
   - DatePicker (기본값: 오늘, KST 로컬)
   - 미래 날짜 disabled

6. **메모** (선택, 자유 텍스트)

7. **[체결 저장]** 버튼
   - 파랑 채움, 13px 볼드, 전폭

8. **[이 시그널 스킵]** 버튼 (pending 있는 자산 선택 시만 표시)
   - 투명 배경 + 회색 테두리 + 회색 텍스트
   - 탭 시 `submitFillDismiss` 호출 → Toast: 스킵 저장

**중요 규칙**:
- 시그널 없는 자산도 자유롭게 체결 입력 가능 (개인 매매)
- 서버에서 `reason` 자동 분류 (`system_fill` / `personal_trade`)
- 예상 체결가 힌트 표시 (pending 기준)

#### 체결 저장 플로우

```
사용자 [체결 저장] 탭
  → validateFill() 검사
     → 통과: submitFill() → RTDB inbox 쓰기
        → 폼 초기화 (자산/방향은 유지, 수량/가격/메모만 초기화)
        → Toast: "체결이 저장되었습니다.\n다음 실행에 반영됩니다."
     → 실패: 필드별 에러 표시, 저장 버튼 비활성화
```

#### 15.3.2 잔고 보정 폼 (AdjustForm)

**대상 선택** (5개 버튼, 한 줄):
```
[SSO][QLD][GLD][TLT][현금]
```

**자산 선택 시** (SSO/QLD/GLD/TLT):
1. **현재 상태 표시** (회색 텍스트, 11px)
   ```
   현재: 298주 / 평균가 $82.05 / 진입일 2026-03-15
   ```
   - 값은 `/history/balance_adjusts/` 또는 `/history/fills/` 에서 역산 필요 (§15.1.1 참고)
   - MVP: 주수만 표시 (`현재: 298주`), 평균가/진입일 생략 또는 "-"

2. **새 주수** / **새 평균가** / **새 진입일** (3열 grid)
   - 각 필드 placeholder: "미변경"
   - 선택적 입력 (미입력 시 미변경)

**현금 선택 시**:
1. **현재 현금 표시**
   ```
   현재 현금: 1,234만원
   ```
2. **새 현금 (원)**
   - placeholder: "예: 1500000"
   - 한국 원 단위

**공통**:
- **사유** (자유 텍스트)
- **[보정 저장]** 버튼 (파랑)

**보정 규칙**:
- 자산과 현금을 한 번에 보정 안 함 (각각 별도 입력)
- `new_shares=0` + `new_avg_price` 동시 → 리셋 우선 (avg_price 무시 — 서버 규칙)
- `actual_shares=0` 인 자산에 `new_avg_price` 단독 → 클라이언트 단에서 차단

#### 15.3.3 히스토리 (HistoryList)

**필터 칩** (가로 스크롤, 한 줄):
```
[전체][체결][보정][신호]
```
- 활성: 파랑 반투명 / 비활성: 카드색

**행 구성**:
```
[날짜] [좌측 색상바] [내용]              [타입 + 태그 배지]

4/15  |초록 바| SSO 매수 42주 $82.05      [체결] [시스템]
4/15  |파랑 바| QLD 매도 시그널            [신호]
4/10  |노랑 바| SSO 주수 150→120,         [보정]
              평균가 $82→$80
4/08  |빨강 바| QLD 매도 50주 $65.30      [체결] [개인]
```

**색상바**:
- 체결 매수 → 초록 (`green`)
- 체결 매도 → 빨강 (`red`)
- 신호 → 파랑 (`accent`)
- 보정 → 노랑 (`yellow`)

**데이터 병합 로직**:

```typescript
type HistoryEvent =
  | { kind: 'fill'; date: string; fill: FillHistory }
  | { kind: 'balance_adjust'; date: string; adjust: BalanceAdjustHistory }
  | { kind: 'signal'; date: string; asset_id: AssetId; signal: SignalHistory };

const buildHistoryTimeline = (
  fills: FillHistory[],
  adjusts: BalanceAdjustHistory[],
  signals: Array<{ date: string; asset_id: AssetId; signal: SignalHistory }>,
  filter: '전체' | '체결' | '보정' | '신호',
): HistoryEvent[] => {
  const events: HistoryEvent[] = [];

  if (filter === '전체' || filter === '체결') {
    fills.forEach(f => events.push({ kind: 'fill', date: f.trade_date, fill: f }));
  }
  if (filter === '전체' || filter === '보정') {
    adjusts.forEach(a => events.push({
      kind: 'balance_adjust', date: a.applied_at.slice(0, 10), adjust: a,
    }));
  }
  if (filter === '전체' || filter === '신호') {
    signals
      .filter(s => s.signal.state !== 'none')  // none 은 제외
      .forEach(s => events.push({ kind: 'signal', date: s.date, asset_id: s.asset_id, signal: s.signal }));
  }

  // 최신순 정렬
  events.sort((a, b) => b.date.localeCompare(a.date));
  return events;
};
```

---

### 15.4 설정 탭 (`src/screens/SettingsScreen.tsx`)

#### 화면 구조

각 행: 좌측 라벨 / 우측 값 (+ 상태 색상)

| 라벨 | 값 | 출처 |
|------|----|------|
| 계정 | `user.email` | Firebase Auth |
| Firebase | `qbt-live (Spark)` | 고정 |
| RTDB 연결 | `정상` (초록) / `오류` (빨강) | `/latest/portfolio` 읽기 성공 여부 |
| FCM 토큰 | `등록됨` (초록) / `미등록` (빨강) | `/device_tokens/{device_id}` 존재 여부 |
| 마지막 실행 | `2026-04-15 07:27 KST` | `portfolio.execution_date` + 고정 시각 |
| 앱 버전 | `1.0.0` | `package.json` 의 version |

#### 하단 액션

- **로그아웃** 버튼 (빨강 테두리, 빨강 텍스트, 전폭)
  - 탭 시 `signOut()` 호출 → `useStore.clearAll()` → LoginScreen 으로 자동 이동

#### 제외 항목

- 캐시 초기화 버튼 **없음** (앱 재시작으로 해결)
- 다크 모드 토글 **없음** (다크 고정)

---

## 16. 한국어 숫자 / 날짜 / 타임스탬프 포맷

### 16.1 `src/utils/format.ts`

```typescript
// ─── 금액 (원) — 한국어 단위 + 콤마 ───

export const formatKRW = (amount: number): string => {
  if (amount < 10000) return `${amount.toLocaleString('ko-KR')}원`;

  const 억 = Math.floor(amount / 100_000_000);
  const 만 = Math.floor((amount % 100_000_000) / 10_000);

  if (억 > 0 && 만 > 0) {
    return `${억}억 ${만.toLocaleString('ko-KR')}만원`;
  }
  if (억 > 0) {
    return `${억}억원`;
  }
  return `${만.toLocaleString('ko-KR')}만원`;
};

// 예시:
// formatKRW(103_012_345) → "1억 301만원"
// formatKRW(12_340_000)  → "1,234만원"
// formatKRW(5_000)       → "5,000원"

// ─── 수량 ───

export const formatShares = (shares: number): string =>
  `${shares.toLocaleString('ko-KR')}주`;

// ─── 달러 ───

export const formatUSD = (price: number): string =>
  `$${price.toFixed(2)}`;

// ─── 퍼센트 (부호 포함, 비율 ×100) ───

export const formatSignedPct = (ratio: number, digits: number = 2): string => {
  const pct = ratio * 100;
  const sign = pct > 0 ? '+' : '';  // 음수는 - 가 자동으로 붙음
  return `${sign}${pct.toFixed(digits)}%`;
};

// ─── 비중 (부호 없음, 소수점 1자리) ───

export const formatWeight = (ratio: number): string =>
  `${(ratio * 100).toFixed(1)}%`;

// ─── 날짜 ───

export const today = (): string => {
  const now = new Date();
  const off = 9 * 60;
  const local = new Date(now.getTime() + (off - now.getTimezoneOffset()) * 60000);
  return local.toISOString().slice(0, 10);
};

export const formatShortDate = (iso: string): string => {
  // "2026-04-15" → "4/15"
  const [, m, d] = iso.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
};

// ─── KST 타임스탬프 (서버 계약 형식) ───

export const kstNow = (): string => {
  const d = new Date();
  const off = 9 * 60;
  const local = new Date(d.getTime() + (off - d.getTimezoneOffset()) * 60000);
  return local.toISOString().replace('Z', '+09:00');
};

// kstNow() → "2026-04-18T07:30:22+09:00"
```

### 16.2 표시 단위 규칙 표

| 유형 | 예시 | 포맷 |
|------|------|------|
| 금액 (원) | `103,012,345` → `1억 301만원` | 큰 단위 한글 + 천 단위 콤마 |
| 금액 (원) | `12,340,000` → `1,234만원` | - |
| 금액 (원) | `5,000` → `5,000원` | - |
| 수량 | `1,234주` (대량) / `298주` (소량) | 천 단위 콤마 + "주" |
| 달러 | `$82.05`, `$583.45` | `$` + 소수점 2자리 |
| 퍼센트 (부호) | `+3.23%`, `-0.84%` | 부호 + 소수점 2자리 |
| 비중 | `33.8%` | 소수점 1자리 |

### 16.3 시간대 / 거래일

- **모든 표시 시각**: KST 기준
- **차트 X축**: NYSE 거래일 (서버에서 변환된 ISO 날짜 그대로 사용)
- **체결일 입력**: 사용자 로컬 날짜 (KST)
- **앱에서 거래일 계산 안 함** — NYSE 캘린더 모름. 서버 데이터를 그대로 신뢰.

---

## 17. 인앱 텍스트 컨벤션

### 17.1 용어 통일

| 영문 / 원어 | 앱 표시 | 비고 |
|-------------|---------|-----|
| Tomorrow / Next trading day | **다음 거래일** | NYSE 휴일 고려 |
| Next execution | **다음 실행** | 서버 batch |
| Model (equity/shares) | **Model** | 영문 그대로 (전문용어) |
| Actual (equity/shares) | **Actual** | 영문 그대로 |
| Sync | **동기화** | Model 동기화 |
| Adjust / Balance adjust | **보정** | 잔고 보정 |
| Fill / Execution | **체결** | |
| Dismiss | **스킵** | 간결성 우선 |
| Pending | **체결 예정** 또는 **pending** | 문맥 따라 |
| Signal | **시그널** / **신호** | 문맥 따라 |
| Drift | **drift** | 영문 소문자 그대로 |
| Rebalancing | **리밸런싱** | |

### 17.2 저장 후 안내 문구 (토스트)

§11.5.2 참고. 모두 `\n다음 실행에 반영됩니다.` 로 끝맺음.

### 17.3 금지 어휘

- 이모지 (`😀`, `👍`, `❌` 등)
- 영문 대문자 남용 ("SAVE!", "OK!")
- 과도한 강조 (`!!!`, `??`)
- 속어 / 비공식 표현

### 17.4 허용 기호 (이모지 아닌 유니코드 기호)

| 기호 | 용도 | 사용 위치 |
|------|------|-----------|
| `⚠` | 경고 | 리마인더 블록, 동기화 다이얼로그 |
| `⚡` | 강조 (pending 자산) | 거래 탭 자산 선택, 체결 힌트 |
| `▲` / `▼` | 방향 / 펼침 | 차트 마커, Model 비교 카드 |
| `●` | 체결 마커 | 차트 |
| `✕` | 닫기 | 토스트 |
| `→` | 전환 | "시그널 → 다음 거래일 체결 예정" 제목 |

위 기호들은 시스템 폰트의 기본 글리프이며 컬러풀한 이모지가 아니므로 허용. `utils/constants.ts` 에 심볼 상수로 정의:

```typescript
export const SYMBOLS = {
  WARN: '⚠',
  BOLT: '⚡',
  ARROW_UP: '▲',
  ARROW_DOWN: '▼',
  CIRCLE: '●',
  CLOSE: '✕',
  ARROW_RIGHT: '→',
} as const;
```

---

## 18. Phase별 구현 가이드

각 Phase 완료 시 **사용자가 에뮬레이터에서 직접 검증** → 다음 Phase 진행. 한 번에 전체 구현 금지.

### Phase 0: 환경 검증 + 프로젝트 초기 셋업 ✅ **완료 상태**

**목적**: 개발 환경 동작 확인 + RN CLI 프로젝트 생성 + Git 위생 + Firebase 기본 준비.

이 Phase 는 **설계 문서 업데이트 시점 이전에 완료**되었으므로, 앞으로 Claude Code 는 Phase 1 부터 진행한다. 본 섹션은 "무엇이 이미 준비되어 있는지" 의 참고용 스냅샷.

**완료된 체크리스트**:
- [x] node v22.22.2, java Temurin 17.0.18, adb 37.0.0 동작
- [x] `ANDROID_HOME` 환경변수 설정, Pixel_10 에뮬레이터 부팅 확인 (API 36)
- [x] Git Bash 환경 설정 (`.bashrc` + `.bash_profile`)
- [x] `C:\android_workspace\qbt-live-app\` 에 RN 0.85.1 + TypeScript 프로젝트 생성
- [x] Android SDK Platform 35 설치 (RN 0.85.1 `compileSdk` 기본값)
- [x] `npm install` 로 기본 의존성 설치 (`react 19.2.3`, `react-native 0.85.1` 등)
- [x] Git 저장소 초기화 + `.gitignore` (민감 정보 제외) + `.gitattributes` (LF 통일) 커밋
- [x] GitHub Public 저장소 `ingbeen/qbt-live-app` 로 push
- [x] `.vscode/settings.json` 작성 (자동 포맷 + ESLint + LF)
- [x] VSCode 확장 설치 (ESLint, Prettier, React Native Tools, ES7+ snippets)
- [x] Firebase Console 에서 `qbt-live` 프로젝트의 Android 앱 (`com.ingbeen.qbtlive`) 등록
- [x] `google-services.json` 발급 + `android/app/google-services.json` 배치 (SHA-1 미포함 초기 버전)
- [x] Firebase Auth Email/Password 활성화 + OWNER_UID 사용자 로그인 가능 상태

**아직 안 한 것 (Phase 1 에서 처리)**:
- RN 의존성 추가 (Firebase, React Navigation, WebView 등 §1.2 목록)
- Firebase Gradle 플러그인 등록 (build.gradle 수정)
- Android 패키지명을 템플릿 기본값 → `com.ingbeen.qbtlive` 로 변경
- Display name 을 `qbt-live-app` → `QBT Live` 로 변경
- Hello World (+ Firebase 초기화 로그) 로 첫 빌드 성공
- debug SHA-1 추출 + Firebase 등록 + `google-services.json` 재다운로드

---

### Phase 1: Firebase 통합 + 의존성 추가 + 첫 빌드

**목적**: `qbt-live-app` 프로젝트에 Firebase Gradle 플러그인을 등록하고, Android 패키지명/Display name 을 확정한 후, 모든 필요 의존성을 설치하여 에뮬레이터에서 **Hello World + Firebase 초기화** 까지 성공시킨다.

**사전 조건**: Phase 0 의 완료 체크리스트 전부 통과 + 에뮬레이터 부팅 상태 + Firebase Console 에 앱 등록 완료.

**작업**:

1. **의존성 설치** (§1.2 의 버전 정확히 반영)
   ```bash
   cd /c/android_workspace/qbt-live-app
   npm install \
     @react-native-firebase/app@^24.0.0 \
     @react-native-firebase/auth@^24.0.0 \
     @react-native-firebase/database@^24.0.0 \
     @react-native-firebase/messaging@^24.0.0
   npm install \
     @react-navigation/native@^7.2.2 \
     @react-navigation/bottom-tabs@^7.2.0 \
     react-native-safe-area-context@^5.7.0 \
     react-native-screens@^4.24.0 \
     react-native-gesture-handler@^2.31.1
   npm install \
     react-native-webview@^13.16.1 \
     @react-native-community/netinfo@^12.0.1 \
     react-native-uuid@^2.0.4 \
     zustand@^5.0.12
   ```

2. **Android 패키지명 변경** (`com.qbtliveapp` → `com.ingbeen.qbtlive`)
   - `android/app/build.gradle`: `applicationId`, `namespace`
   - `android/app/src/main/AndroidManifest.xml`: `package` 속성은 RN 0.85 에서는 build.gradle 의 `namespace` 로 완전 이관됨
   - `android/app/src/main/java/` 하위 폴더 구조: `com/qbtliveapp/` → `com/ingbeen/qbtlive/`
   - `MainActivity.kt`, `MainApplication.kt` 의 패키지 선언 수정

3. **Display name 변경**
   - `android/app/src/main/res/values/strings.xml` 의 `app_name` 을 `QBT Live` 로

4. **Firebase Gradle 플러그인 등록**
   - `android/build.gradle` (루트) — `buildscript.dependencies` 에 `classpath("com.google.gms:google-services:4.4.2")`
   - `android/app/build.gradle` — 파일 상단 plugins 블록 근처에 `apply plugin: "com.google.gms.google-services"`

5. **App.tsx 교체** — RN CLI 기본 `@react-native/new-app-screen` 제거 후 커스텀 Hello World + Firebase 초기화 로그
   ```tsx
   import { initFirebase } from './src/services/firebase';  // Phase 2 준비
   // MVP: 단순 <View><Text>Hello QBT Live</Text></View>
   // firebase().database().setPersistenceEnabled(false) 로그 찍기
   ```
   - 단, Phase 1 에서는 `services/firebase.ts` 는 생성하지 않고 App.tsx 에서 직접 호출 (Phase 2 에서 리팩토링)

6. **첫 빌드**
   ```bash
   npm start              # Metro (별도 터미널에서 유지)
   npm run android        # 에뮬레이터 설치 + 실행
   ```

7. **debug SHA-1 추출 + Firebase 등록**
   ```bash
   cd android
   ./gradlew signingReport
   # Variant: debug 의 SHA1 복사
   ```
   Firebase Console → `qbt-live` → Project Settings → Android 앱 → "Add fingerprint" → SHA-1 붙여넣기 → Save

8. **`google-services.json` 재다운로드 + 배치**
   - 새 `google-services.json` 다운로드 (SHA-1 포함된 버전)
   - 기존 `android/app/google-services.json` 덮어쓰기
   - `.gitignore` 가 여전히 이 파일을 제외하는지 재확인

9. **최종 빌드 재확인**
   ```bash
   npm run android
   adb logcat -s "ReactNativeJS:V"   # Firebase 초기화 로그 확인
   ```

10. **Git 커밋**
    ```bash
    git add -A
    git commit -m "[Phase 1] add dependencies, configure Firebase, set package name"
    git push
    ```

**산출물**:
- `package.json` 에 모든 의존성 반영
- Android 패키지명 `com.ingbeen.qbtlive` 확정
- Firebase 플러그인 등록된 build.gradle
- Hello World + Firebase 초기화 로그가 찍히는 App.tsx
- SHA-1 반영된 `google-services.json`

**검증**:
- [ ] 에뮬레이터에 "QBT Live" 이름으로 앱 설치
- [ ] 앱 실행 시 Hello World 텍스트 표시
- [ ] `adb logcat` 에서 Firebase 관련 native module 로딩 로그 확인 (에러 없음)
- [ ] Hot reload 동작
- [ ] `tsc --noEmit` 에러 0
- [ ] `npm run android` 가 clean 빌드로 성공 (경고는 있어도 에러 없음)
- [ ] GitHub 에 Phase 1 커밋 push 됨
- [ ] Firebase Console Android 앱 설정에 debug SHA-1 등록됨

**주의사항**:
- RN 0.85 는 **New Architecture 강제 ON**. `gradle.properties` 의 `newArchEnabled=true` 또는 해당 프로퍼티 부재 상태 유지. `false` 시도 시 경고 후 무시됨.
- `@react-native-firebase/app` v24 는 **modular API 기반**. namespaced 스타일(`firebase.database()`) 대신 `import database from '@react-native-firebase/database'; database().ref(...)` 스타일 권장.
- 패키지명 변경 후 첫 빌드 전에 `android && ./gradlew clean` 한 번 실행하면 캐시 문제 방지.
- Metro 8081 포트 충돌 시 `adb reverse tcp:8081 tcp:8081` 실행.

---

### Phase 2: 인증 + 네비게이션 골격

**목적**: 로그인 화면 + 4탭 빈 화면 구조.

**작업**:
1. `src/services/firebase.ts` — `initFirebase()` + `persistence: OFF`
2. `src/services/auth.ts` — `signIn`, `signOut`, `subscribeAuthState`
3. `src/store/useStore.ts` — Zustand store 스켈레톤 (user 필드 + setUser)
4. `src/screens/LoginScreen.tsx` — 이메일 + 비밀번호 + [로그인]
5. `src/navigation/AppNavigator.tsx` — Bottom Tab Navigator (4탭 빈 화면)
6. `src/screens/{Home,Chart,Trade,Settings}Screen.tsx` — 탭 이름만 표시
7. `src/components/HomeHeader.tsx` — "QBT Live" 고정 헤더
8. `src/App.tsx` — Auth gate + NavigationContainer

**검증**:
- [ ] 첫 실행 시 로그인 화면 표시
- [ ] 잘못된 이메일/비밀번호 → 에러 텍스트
- [ ] 올바른 로그인 → 홈 탭 이동 + "QBT Live" 헤더
- [ ] 4탭 전환 가능 (홈/차트/거래/설정)
- [ ] 앱 재시작 → 자동 로그인

---

### Phase 3: Zustand store + RTDB 연동 (홈 탭 기본)

**목적**: RTDB 읽기 + 홈 탭 자산 현황 카드 표시.

**작업**:
1. `src/types/rtdb.ts` — §5.3 타입 전체 정의
2. `src/services/rtdb.ts` — `readPortfolio`, `readAllSignals`, `readAllPendingOrders`, `readInboxFills`, `readInboxFillDismiss`, `readInboxModelSync`
3. `src/store/useStore.ts` — portfolio/signals/pendingOrders/inbox* 필드 + `refreshHome()` 액션
4. `src/utils/format.ts` — `formatKRW`, `formatShares`, `formatWeight`, `formatSignedPct`, `today`
5. `src/utils/colors.ts` — 색상 상수
6. `src/components/Badge.tsx` — 공통 Badge 컴포넌트
7. `src/components/PullToRefreshScrollView.tsx` — Pull-to-refresh 래퍼
8. `src/screens/HomeScreen.tsx` — 자산 현황 카드만 구현 (나머지는 Phase 4)

**검증**:
- [ ] 홈 탭 진입 시 RTDB 데이터 로드 (loading 인디케이터)
- [ ] 자산 현황 카드에 SSO/QLD/GLD/TLT + 현금 표시
- [ ] 합계 금액 (`1억 424만원` 형식) 표시
- [ ] 배지 (`[보유]`/`[현금]`/`[매수대기]`/`[매도대기]`) 정상 표시
- [ ] Pull-to-refresh 동작

---

### Phase 4: 홈 탭 완성

**목적**: 홈 탭의 나머지 요소 (리마인더, 시그널, MA, Model 비교, 동기화).

**작업**:
1. `src/components/UpdateStatusBadge.tsx` — 업데이트 시각 + 정상/경고 배지
2. `src/components/ReminderBlock.tsx` — 미입력 체결 리마인더 (조건부)
3. `src/components/SignalNextFillBlock.tsx` — 시그널 체결 예정 (조건부)
4. `src/components/MAProximityCard.tsx` — MA 근접도 (SPY/QQQ/GLD/TLT)
5. `src/components/ModelCompareCard.tsx` — 접힘/펼침 + 동기화 버튼
6. `src/components/SyncDialog.tsx` — 모달 다이얼로그
7. `src/store/useStore.ts` — `submitModelSync()` 액션
8. `src/services/rtdb.ts` — `submitModelSync`
9. `src/components/Toast.tsx` — 토스트 컴포넌트
10. `src/screens/HomeScreen.tsx` — 모든 섹션 통합

**검증**:
- [ ] 경고 배지 (4일 초과) 동작 확인 (테스트로 execution_date 조작)
- [ ] 리마인더 블록 표시/숨김 조건 정확
- [ ] 시그널 블록 표시/숨김 조건 정확
- [ ] MA 근접도 SPY/QQQ/GLD/TLT 순서 + 색상
- [ ] Model 비교 접힘/펼침 애니메이션
- [ ] 동기화 다이얼로그 → 동기화 → Toast → RTDB 확인

---

### Phase 5: 거래 탭

**목적**: 체결 입력 + 잔고 보정 + 히스토리.

**작업**:
1. `src/utils/validation.ts` — `validateFill`, `validateBalanceAdjust`
2. `src/services/rtdb.ts` — `submitFill`, `submitBalanceAdjust`, `submitFillDismiss`, `readHistoryFills`, `readHistoryBalanceAdjusts`, `readHistorySignals`
3. `src/store/useStore.ts` — `refreshTrade()`, `submitFill`, `submitBalanceAdjust`, `submitFillDismiss` 액션
4. `src/components/FillForm.tsx` — 체결 입력 폼
5. `src/components/AdjustForm.tsx` — 잔고 보정 폼
6. `src/components/HistoryList.tsx` — 필터 + 타임라인
7. `src/screens/TradeScreen.tsx` — 탭 선택 + 히스토리 통합

**검증**:
- [ ] pending 있는 자산 선택 시 ⚡ 표시
- [ ] 매도 수량이 보유 주수 초과 시 에러
- [ ] 체결 저장 → Toast + 폼 초기화 + RTDB `/fills/inbox/` 확인
- [ ] 보정 저장 → Toast + 폼 초기화 + RTDB `/balance_adjust/inbox/` 확인
- [ ] 시그널 스킵 → Toast + RTDB `/fill_dismiss/inbox/` 확인
- [ ] 히스토리 필터 (전체/체결/보정/신호) 정상 동작
- [ ] 히스토리 행 색상 (초록/빨강/파랑/노랑) + 배지 ([시스템]/[개인])

---

### Phase 6: 차트 탭

**목적**: TradingView Lightweight Charts WebView 통합.

**작업**:
1. `src/utils/chartHtml.ts` — WebView HTML 템플릿
2. `src/services/chart.ts` — `mergeChartSeries`, `mergeEquitySeries`
3. `src/services/rtdb.ts` — `readPriceChartMeta/Recent/Archive`, `readEquityChartMeta/Recent/Archive`
4. `src/store/useStore.ts` — `refreshChart`, `loadPriceArchive`, `loadEquityArchive` 액션
5. `src/components/ChartTypeToggle.tsx` — 주가/Equity 토글
6. `src/components/AssetSelector.tsx` — 4자산 선택
7. `src/components/ChartWebView.tsx` — WebView + 메시지 핸들러
8. `src/components/ChartLegend.tsx` — 범례 (주가/Equity 전환)
9. `src/screens/ChartScreen.tsx` — 통합

**검증**:
- [ ] 주가 차트: 4자산 전환 + 종가/EMA-200/상단/하단 밴드 라인
- [ ] 마커 4종 (▲매수시그널/▼매도시그널/●내매수/●내매도) 표시
- [ ] Equity 차트: Model / Actual 2라인
- [ ] 핀치 줌 / 드래그 동작
- [ ] 좌측 끝 도달 → archive 자동 로드 + dedupe
- [ ] 기간 선택 버튼 없음 확인

---

### Phase 7: 설정 탭 + FCM

**목적**: 설정 표시 + 푸시 알림 토큰 등록.

**작업**:
1. `src/services/fcm.ts` — `ensureFcmToken`, `setupForegroundHandler`, `setupNotificationTapHandler`
2. `src/screens/SettingsScreen.tsx` — 6개 행 + 로그아웃 버튼
3. `src/App.tsx` — 로그인 후 `ensureFcmToken()` 호출 + 알림 탭 시 홈 탭 이동 핸들러
4. FCM 토큰 RTDB `/device_tokens/{device_id}` 저장 확인
5. 서버에서 테스트 FCM 발송 → 알림 수신 확인

**검증**:
- [ ] 설정 탭 6개 행 모두 표시 (계정/Firebase/RTDB/FCM/마지막실행/버전)
- [ ] FCM 토큰 등록 → RTDB 에 기록
- [ ] 앱 백그라운드에서 FCM 수신 → 알림 트레이 표시
- [ ] 알림 탭 → 앱 실행 + 홈 탭 진입
- [ ] 로그아웃 → 로그인 화면 복귀

---

### Phase 8: 오프라인 / 에러 처리

**목적**: 네트워크 감지 + 오프라인 화면 + RTDB 에러 메시지.

**작업**:
1. `src/services/network.ts` — NetInfo 리스너
2. `src/components/OfflineScreen.tsx` — 전체 화면 차단
3. `src/App.tsx` — `isOnline` gate
4. `src/services/rtdb.ts` — 타임아웃 처리 (10초) + 권한 오류 처리
5. `src/components/ErrorState.tsx` — 공통 에러 상태 컴포넌트 ([다시 시도] 버튼)
6. 홈 상단 "경고" 배지 동작 검증

**검증**:
- [ ] 에뮬레이터 airplane mode → OfflineScreen 표시
- [ ] 네트워크 복귀 → 자동 복구
- [ ] RTDB 타임아웃 시 에러 + 재시도 버튼
- [ ] execution_date 4일 초과 시 [경고] 배지

---

### Phase 9: 마무리

**목적**: 배지/색상 일관성 검증 + 앱 아이콘 + APK 빌드.

**작업**:
1. 모든 화면에서 색상/폰트 일관성 검증
2. 배지 시스템 통합 검증 (§11.3)
3. 앱 아이콘 (간단한 "QBT" 텍스트, 파랑 배경)
4. `android/app/build.gradle` — versionCode/versionName 확정 (`1.0.0`)
5. `cd android && ./gradlew assembleRelease` → APK 빌드
6. 실제 Android 디바이스에 사이드로드 테스트

**검증**:
- [ ] 모든 배지 (§11.3) 의도대로 표시
- [ ] 모든 색상 (§11.1) COLORS 상수에서 import (하드코딩 없음)
- [ ] Pretendard 폰트 정상 렌더링
- [ ] APK 빌드 성공
- [ ] 실제 디바이스 설치 + 로그인 + 홈 데이터 로드 성공
- [ ] 푸시 알림 실제 디바이스 수신

---

## 19. RTDB 보안 규칙 (참고)

**설정 주체**: 서버 운영자 (Firebase Console)
**앱 측 역할**: 로그인 후 자동 권한 획득. 앱에서 Rules 변경 안 함.

**기본 Rules** (단순):

```json
{
  "rules": {
    ".read": "auth.uid === 'SxwvCeg6fRUeUrK9IpyazTzrLJJ2'",
    ".write": "auth.uid === 'SxwvCeg6fRUeUrK9IpyazTzrLJJ2'"
  }
}
```

**경로별 세분화 Rules** (권장, 선택):

```json
{
  "rules": {
    "latest": {
      ".read": "auth.uid === 'SxwvCeg6fRUeUrK9IpyazTzrLJJ2'",
      ".write": false
    },
    "charts": {
      ".read": "auth.uid === 'SxwvCeg6fRUeUrK9IpyazTzrLJJ2'",
      ".write": false
    },
    "history": {
      ".read": "auth.uid === 'SxwvCeg6fRUeUrK9IpyazTzrLJJ2'",
      ".write": false
    },
    "fills": {
      "inbox": {
        ".read": "auth.uid === 'SxwvCeg6fRUeUrK9IpyazTzrLJJ2'",
        ".write": "auth.uid === 'SxwvCeg6fRUeUrK9IpyazTzrLJJ2'"
      }
    },
    "balance_adjust": { "inbox": { ".read": "...", ".write": "..." } },
    "fill_dismiss":   { "inbox": { ".read": "...", ".write": "..." } },
    "model_sync":     { "inbox": { ".read": "...", ".write": "..." } },
    "device_tokens": {
      ".read": "auth.uid === 'SxwvCeg6fRUeUrK9IpyazTzrLJJ2'",
      ".write": "auth.uid === 'SxwvCeg6fRUeUrK9IpyazTzrLJJ2'"
    }
  }
}
```

서버 Admin SDK 는 Rules 무시 (Service Account 로 full access).

---

## 20. google-services.json 배치

**절차**:
1. Firebase Console → `qbt-live` 프로젝트 → Project Settings → Your apps → Android 앱 추가
2. 패키지명: `com.ingbeen.qbtlive`
3. SHA-1: 디버그 키스토어의 SHA-1 등록 (FCM 위해 필수)
   ```bash
   cd android && ./gradlew signingReport
   # Variant: debug → SHA1 복사
   ```
4. `google-services.json` 다운로드 → `android/app/google-services.json` 배치
5. 사용자가 직접 배치 (보안상 Git 커밋 안 함)

**`.gitignore` 추가**:
```
android/app/google-services.json
```

**`android/build.gradle`**:
```gradle
dependencies {
    classpath("com.google.gms:google-services:4.4.2")
}
```

**`android/app/build.gradle`** (최상단 plugins 블록):
```gradle
apply plugin: "com.google.gms.google-services"
```

---

## 21. 개발 / 디버깅 팁

### 21.1 Metro 번들러

- 포트: 8081
- 시작: `npx react-native start`
- 캐시 리셋: `npx react-native start --reset-cache`

### 21.2 에뮬레이터 단축키

- Reload: `R` 두 번 또는 `Ctrl+M` → "Reload"
- Dev menu: `Ctrl+M` (Windows) / `Cmd+M` (Mac)
- Hot reload: 코드 저장 시 자동

### 21.3 adb 명령어

- 디바이스 확인: `adb devices`
- 앱 설치: `adb install app-debug.apk`
- 로그 보기: `adb logcat *:S ReactNative:V ReactNativeJS:V`
- 8081 포트 포워딩 (실기기 테스트): `adb reverse tcp:8081 tcp:8081`

### 21.4 Firebase 디버그

- React Native Firebase 로그 레벨 조정:
  ```typescript
  import firebase from '@react-native-firebase/app';
  firebase.database.setLoggingEnabled(true);  // 개발 중만
  ```
- RTDB 콘솔: Firebase Console → Realtime Database → Data 탭

### 21.5 WebView 디버깅

- Chrome DevTools 원격 디버깅: `chrome://inspect`
- WebView 활성화 (개발 빌드):
  ```typescript
  <WebView
    originWhitelist={['*']}
    javaScriptEnabled
    setWebContentsDebuggingEnabled  // Android
  />
  ```

### 21.6 Zustand 디버깅

```typescript
// Zustand devtools middleware
import { devtools } from 'zustand/middleware';

export const useStore = create<Store>()(
  devtools(
    (set, get) => ({ /* store */ }),
    { name: 'qbt-live-store' },
  ),
);
```

---

## 22. 변경 관리 / 문서 유지

### 22.1 본 문서의 역할

- **DESIGN_APP.md (본 문서)** = 앱 설계 단일 정본 (SoT)
- 모든 앱 관련 결정은 본 문서를 업데이트. 구조/UI/데이터/Phase 계획 어디든.
- 서버와의 데이터 계약이 변경되면 `docs/DESIGN_QBT_LIVE_FINAL.md` 서버 SoT 를 먼저 업데이트 → 본 문서 §5 를 미러.

### 22.2 변경 시 확인 사항

- [ ] 본 문서 해당 섹션 업데이트
- [ ] 영향받는 Phase 프롬프트 (`docs/PROMPT_APP.md`) 업데이트
- [ ] 필요 시 `CLAUDE.md` (코딩 규칙) 업데이트
- [ ] 타입 변경 시 `src/types/rtdb.ts` 동기화

### 22.3 폐기된 문서

- `APP_DESIGN_DECISIONS.md` — 본 문서에 흡수됨. 이후 세션에서 불필요.

---

## 23. 체크리스트 (최종 배포 전)

- [ ] 4탭 모두 정상 동작
- [ ] 로그인 → 자동 로그인 → 로그아웃 전 플로우
- [ ] RTDB 읽기/쓰기 모두 정상 (5개 경로)
- [ ] 토스트 4종 모두 표시 (체결/보정/스킵/동기화)
- [ ] 배지 시스템 전 규칙 동작 (§11.3)
- [ ] 색상 상수 100% 사용 (하드코딩 hex 없음)
- [ ] 이모지 0개 (§17.3)
- [ ] Pretendard 폰트 모든 텍스트에 적용
- [ ] 한국어 금액 포맷 정상 (§16.1)
- [ ] 차트 마커 4종 + 범례 표시
- [ ] 차트 archive 점진 로딩 + dedupe
- [ ] Pull-to-refresh 4탭 모두
- [ ] 오프라인 화면 차단 + 복구
- [ ] FCM 토큰 등록 + 알림 탭 → 홈
- [ ] `google-services.json` Git 제외
- [ ] APK 빌드 성공 + 실기기 설치
- [ ] 타입 에러 0개 (`tsc --noEmit`)

---

**문서 끝**
