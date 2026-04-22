# qbt-live-app

QBT Live 시스템의 **Android 앱 클라이언트**. Firebase Realtime Database 를 읽어 포트폴리오/차트/시그널을 표시하고, 체결/잔고 보정을 RTDB inbox 로 기록한다.

- **플랫폼**: Android 전용 (iOS 미지원)
- **프레임워크**: React Native CLI (정확 핀, Expo 아님). 버전은 `package.json` 참조
- **언어**: TypeScript (버전은 `package.json` 참조)
- **New Architecture**: 기본 ON (RN 0.82+ 강제, 비활성 불가)

코딩 규칙 / 스타일 / 금지 사항은 [CLAUDE.md](CLAUDE.md) 를 단일 정본(SoT) 으로 참조한다. 서버↔앱 데이터 계약은 [docs/DESIGN_QBT_LIVE_FINAL.md](docs/DESIGN_QBT_LIVE_FINAL.md).

---

## 전제 조건

- **Node**: `package.json` 의 `engines` 참조
- **JDK**: Temurin 17
- **Android SDK**: `android/build.gradle` 참조
- **Android 기기 또는 에뮬레이터** (Android 7.0+, API 24+)
- **Firebase 설정 파일**: `android/app/google-services.json` 배치 필요 (커밋 금지, `.gitignore` 에 포함)

환경 셋업은 React Native 공식 가이드 [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) 의 Android 섹션 참조.

---

## 실행 / 명령어

프로젝트 관련 **모든 명령어**(Metro 실행, 빌드, 로그, 앱 초기화, 새 머신 셋업 등)는 [docs/COMMANDS.md](docs/COMMANDS.md) 에 단일 관리한다.

빠른 시작:

- Terminal A — `npm start`
- Terminal B — `npm run android -- --no-packager`

상세/워크플로우/초기 셋업: [docs/COMMANDS.md](docs/COMMANDS.md) 참조.

---

## 폴더 구조

```
qbt-live-app/
├── App.tsx                 # 최상위 컴포넌트 (Firebase 초기화, Auth/Net 구독, 라우팅)
├── index.js                # RN 엔트리포인트
├── src/
│   ├── screens/            # 탭별 최상위 컴포넌트 (Home, Chart, Trade, Settings, Login)
│   ├── components/         # 재사용 UI 컴포넌트 (Badge, FillForm, ChartWebView, OfflineScreen 등)
│   ├── services/           # 외부 I/O (firebase, auth, rtdb, fcm, network, chart)
│   ├── store/              # Zustand 단일 store (useStore.ts)
│   ├── utils/              # 순수 유틸 (format, validation, colors, constants, chartHtml)
│   ├── types/              # RTDB 스키마 타입 정의 (rtdb.ts)
│   └── navigation/         # React Navigation 설정 (AppNavigator.tsx)
├── android/                # Android 네이티브 프로젝트
├── docs/
│   └── DESIGN_QBT_LIVE_FINAL.md   # 서버↔앱 RTDB 데이터 계약 (서버 SoT)
├── CLAUDE.md               # 코딩 규칙 / 스타일 가이드 (단일 정본)
└── README.md
```

---

## 참고

- 코딩 규칙 / 스타일 / 금지 사항: [CLAUDE.md](CLAUDE.md)
- 명령어 모음: [docs/COMMANDS.md](docs/COMMANDS.md)
- 데이터 계약(서버 SoT): [docs/DESIGN_QBT_LIVE_FINAL.md](docs/DESIGN_QBT_LIVE_FINAL.md)
- React Native 공식: [reactnative.dev](https://reactnative.dev)
