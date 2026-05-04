# qbt-live-app — QBT Live Android 앱 클라이언트

백테스트로 검증한 매매 시그널을 모바일에서 확인하고, 사용자의 실제 체결 결과를 시그널 엔진으로 다시 전달하는 **Android 클라이언트**입니다.

## 프로젝트 목표

- **서버 운영 비용 부담 없는 시그널 알림 체계** 구축을 핵심 목표로, 처음부터 **서버리스 환경**으로 설계
- **Claude Code 를 안정적으로 활용하기 위한 하네스 엔지니어링**을 함께 도입하여, AI 협업의 일관성과 코드 품질을 확보

## 시스템 아키텍처 (앱 관점)

매매 시그널 엔진(별도 리포지토리, 서버리스) 과 본 앱 사이는 Firebase RTDB 를 매개로 한 **양방향 비동기 통신** 구조입니다. 별도 백엔드 서버 없이 **GitHub Actions 의 정기 실행** 과 **Firebase 서비스** 만으로 운영됩니다.

### 데이터 흐름

```
┌────────────────────────────┐                    ┌─────────────────────┐
│  GitHub Actions            │                    │  Android 앱         │
│  (시그널 엔진, 별도 리포)   │                    │  (이 리포)          │
│  평일 장 마감 후 자동 실행  │                    │  진입 시 once 조회  │
└──────────────┬─────────────┘                    └──────────┬──────────┘
               │                                             │
               │  덮어쓰기                              once  │
               ↓                                             │
        ┌─────────────────────────────────────────────────┐  │
        │   Firebase RTDB                                 │ ←┘
        │   /latest /charts /history    (앱 → 읽기 전용)  │
        │   /fills/inbox /balance_adjust/inbox …          │ ←─── 체결 / 보정 입력
        └─────────────────────────────────────────────────┘
               │
               ↓
        ┌──────────────┬──────────────────┐
        │  FCM (주)    │  Telegram (백업) │     한쪽 장애 시에도 도달 보장
        └──────────────┴──────────────────┘
```

### 앱이 책임지는 영역

- **단방향 읽기**: `/latest/*`, `/charts/*`, `/history/*` 는 읽기 전용. 화면 전환 시 once-shot 으로 가져와 메모리 캐시.
- **단방향 쓰기 (inbox 패턴)**: 사용자가 입력한 체결 / 잔고 보정은 `/fills/inbox` 등 별도 inbox 경로에만 기록. 다음 시그널 엔진 실행 사이클에서 처리됨 (양방향 비동기 통신).
- **알림 수신**: FCM 백그라운드 메시지로 시그널 알림 트레이만 표시 (인앱 알림 UI 없음).

## 앱 내부 아키텍처

### 데이터 / 상태 관리

- **상태 라이브러리**: Zustand 단일 store. **RTDB 경로 트리와 동일한 구조** 로 미러링 — 서버 응답을 그대로 매핑하여 변환 비용 / 동기화 버그를 줄임
- **캐시 정책**: **메모리 캐시만** 사용 (앱 재시작 시 전 상태 초기화). Firebase persistence / AsyncStorage RTDB 캐싱 모두 OFF — stale 데이터로 인한 화면 깜빡임 차단

### 오프라인 처리

- 네트워크 단절 시 **로그인 화면 / 탭 네비게이션 모두 차단** 하고 단일 OfflineScreen 만 렌더 → "**최신이 보장되지 않은 데이터를 보여주지 않는다**" 원칙
- 포그라운드 복귀 시 캐시 무효화 후 자동 재로드

### 차트 (TradingView WebView)

- TradingView Lightweight Charts 를 WebView 로 임베드 (RN 네이티브 차트 라이브러리 미사용)
- RN ↔ WebView 사이 **메시지 화이트리스트 프로토콜**: `ready` / `load_earlier` / `crosshair` 만 허용. 임의 메시지 전달 차단

### 알림 (FCM)

- **백그라운드 트레이만** 사용. 포그라운드 push 는 무시 (인앱 알림 UI 없음)
- 알림 탭 시 항상 홈 탭으로 이동 — data payload 분기 로직 제거로 구조 단순화
- `device_id` 만 AsyncStorage 영구화 — 토큰 등록 식별자 1개에 한정

### 기술 결정 요약

| 결정                                | 이유                                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| Expo 가 아닌 **React Native CLI**   | New Architecture / FCM 네이티브 모듈을 직접 제어해야 함. Expo prebuild 의존성 줄임              |
| Redux 가 아닌 **Zustand**           | RTDB 미러용 단일 store 로 충분. 액션/리듀서 보일러플레이트 불필요                               |
| RTDB **once-shot** 만 (`onValue` X) | 실시간 리스너는 데이터 깜빡임 / 권한 만료 처리가 복잡. 화면 전환 시점 fetch 가 단순하고 명시적  |
| Firebase **persistence OFF**        | 오프라인 캐시 stale 데이터로 인한 화면 깜빡임 차단. 메모리 캐시만 신뢰                          |
| 차트는 **WebView + CDN**            | RN 네이티브 차트 라이브러리는 줌 / 핀치 / 오버레이 마커 품질에 한계. TradingView 가 사실상 표준 |
| **Android 단일 플랫폼**             | iOS 대응 시 FCM / 빌드 / 권한 모델 모두 분기 — 단일 플랫폼 집중으로 설계 / 검증 비용 절감       |

## Claude Code 하네스 엔지니어링

Claude Code 에 매번 컨텍스트를 설명하면 같은 실수를 반복하고 코드 스타일이 흔들리는 문제를 관찰하여, **AI 가 따라야 할 규칙과 작업 프로세스를 프로젝트 내부에 문서화** 했습니다.

- **AI 전용 가이드 계층화**: 루트 [`CLAUDE.md`](CLAUDE.md) 와 도메인별 보조 문서([`docs/CLAUDE.md`](docs/CLAUDE.md)) 로 분리. 작업 시작 전 해당 도메인 문서를 반드시 읽도록 강제. 개발 원칙 / 수술적 변경 같은 **행동 원칙은 문서 초반에 배치** 하여 attention 손실을 줄임
- **계획서 템플릿 표준화**: 모든 코드 변경 작업이 [`docs/plans/_template.md`](docs/plans/_template.md) 를 따르도록 하여, **목표 / 범위 / 검증 기준 / 리스크 / Commit 메시지 후보** 가 항상 동일한 형식으로 작성되고 **Phase 단위로 실행** 되도록 표준화
- **검증 방식**: 본 앱은 단위 테스트 대신 **사용자 실기 검증** 을 단일 통과 기준으로 삼음. 계획서 각 Phase 의 Validation 에 "사용자가 무엇을 보면 완료로 판단하는지" 를 구체적으로 명시하도록 강제 — 모호한 "정상 동작 확인" 은 거부
- **명령어 단일 SoT**: 실행 명령어는 [`docs/COMMANDS.md`](docs/COMMANDS.md) 에만 두고 다른 문서에서 복붙하지 않음 — 명령어 변경 시 동기화 누락 방지

## 기술 스택

- **언어**: TypeScript (버전은 `package.json` 참조)
- **프레임워크**: React Native CLI (정확 핀, Expo 아님). 버전은 `package.json` 참조
- **아키텍처**: New Architecture (RN 0.82+ 강제, 끌 수 없음)
- **상태 관리**: Zustand 단일 store
- **네비게이션**: React Navigation
- **데이터**: Firebase RTDB (once-shot, persistence OFF)
- **알림**: Firebase Cloud Messaging (FCM)
- **차트**: TradingView Lightweight Charts (WebView CDN)
- **JDK**: Temurin 17
- **플랫폼**: Android 전용 (iOS 미지원)

## 빠른 시작

전제 조건: Temurin 17 / Android SDK / Android 7.0+ 기기 또는 에뮬레이터 / Firebase 설정 파일 (`android/app/google-services.json`, 커밋 금지). 환경 셋업은 React Native 공식 가이드 [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) 의 Android 섹션 참조.

- Terminal A — `npm start`
- Terminal B — `npm run android -- --no-packager`

상세 / 워크플로우 / 초기 셋업: [docs/COMMANDS.md](docs/COMMANDS.md) 참조.

## 폴더 구조

```
qbt-live-app/
├── App.tsx                            # 최상위 컴포넌트 (Firebase 초기화, Auth/Net 구독, 라우팅)
├── index.js                           # RN 엔트리포인트
├── src/
│   ├── screens/                       # 탭별 최상위 컴포넌트 (홈/차트/거래/설정)
│   ├── components/                    # 재사용 UI 컴포넌트
│   ├── services/                      # 외부 I/O (Firebase / WebView / FCM / 네트워크)
│   ├── store/                         # Zustand 단일 store
│   ├── utils/                         # 순수 유틸 (포맷 / 검증 / 색상 / 상수)
│   ├── types/                         # RTDB 스키마 타입 정의
│   └── navigation/                    # React Navigation 설정
├── android/                           # Android 네이티브 프로젝트
├── docs/
│   ├── CLAUDE.md                      # docs / 계획서 운영 SoT
│   ├── COMMANDS.md                    # 실행 명령어 SoT
│   ├── DESIGN_QBT_LIVE_FINAL.md       # 서버↔앱 RTDB 데이터 계약 (서버 SoT)
│   └── plans/                         # 변경 계획서 저장소
├── CLAUDE.md                          # 코딩 규칙 / 스타일 가이드 SoT
└── README.md
```

## 관련 문서

- 코딩 규칙 / 스타일 / 금지 사항: [CLAUDE.md](CLAUDE.md)
- 데이터 계약 (서버↔앱 RTDB): [docs/DESIGN_QBT_LIVE_FINAL.md](docs/DESIGN_QBT_LIVE_FINAL.md)
- 명령어 모음: [docs/COMMANDS.md](docs/COMMANDS.md)
- 계획서 운영 규칙: [docs/CLAUDE.md](docs/CLAUDE.md)
