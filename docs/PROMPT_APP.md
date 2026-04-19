# PROMPT_APP.md — Phase별 작업 프롬프트

> **최종 위치**: `docs/PROMPT_APP.md` (앱 프로젝트 루트 기준 상대경로)
> **역할**: QBT Live 앱(`qbt-live-app`) 구현을 **Phase 0 ~ Phase 9** 로 나누어 Claude Code 에게 전달하는 프롬프트 모음.
> **사용법**: 각 Phase 의 프롬프트 블록(### Phase N 아래)을 **통째로 복사** 하여 Claude Code 에 붙여넣는다. Phase 간 작업 결과는 실제 에뮬레이터 동작으로 사용자가 직접 검증한 후 다음 Phase 로 넘어간다.
> **관련 문서**:
> - `docs/DESIGN_APP.md` — 앱 설계 / 구현 가이드 (SoT)
> - `CLAUDE.md` — 앱 코딩 규칙
> - `docs/DESIGN_QBT_LIVE_FINAL.md` — 서버↔앱 RTDB 계약 (서버 SoT)

---

## 환경 전제 (모든 Phase 공통)

Claude Code 가 동작하는 환경은 다음으로 고정되어 있다. 변경이 필요하면 반드시 사용자에게 질문.

| 항목 | 값 |
|------|---|
| 프로젝트 루트 | `C:\android_workspace\qbt-live-app\` (Git Bash: `/c/android_workspace/qbt-live-app`) |
| Node | v22.22.2 (fnm) |
| Java | Temurin 17.0.18 (scoop) |
| Android Studio | Panda 3 (에뮬레이터 실행 전용) |
| 에뮬레이터 | Pixel_10 (Android 16, API 36) |
| RN | 0.85.1 (정확히 핀, `^` 금지) |
| New Architecture | 기본 ON, 비활성 불가 |
| Firebase SDK | `@react-native-firebase/*` ^24.0.0 (modular API) |
| 주 터미널 | **Git Bash** (VSCode 통합 터미널 기본값) |
| Git 원격 | `https://github.com/ingbeen/qbt-live-app` (Public) |

---

## 사용 원칙

1. **한 번에 한 Phase 만**. Phase 병합 / 건너뛰기 금지.
2. 각 Phase 는 "goal/DoD 인라인 + 세부 규칙은 문서 참조" 형식(하이브리드). 세부 스펙은 `docs/DESIGN_APP.md` / `CLAUDE.md` 섹션 번호로 참조.
3. Claude Code 가 **추측을 필요로 하는 순간**이 오면 반드시 질문(형식: `CLAUDE.md §1.2`).
4. Phase 완료 시 반드시 **DoD 체크리스트 전부 통과 + 사용자 육안 검증** 후 다음 Phase.
5. 라이브러리 최신 API / 버전 차이는 **Context7 → 웹검색** 순으로 확인.
6. Phase 완료 시 **git 커밋 + push** 로 마무리 (커밋 메시지: `[Phase N] 간단 설명`).

---

## 공통 전제 조건 (모든 Phase 공통)

모든 Phase 프롬프트는 아래 전제 조건을 암묵적으로 포함한다. 프롬프트에서 명시적으로 반복.

- **목적**: 해당 Phase 작업을 정확히 수행한다.
- **외부 정보 확보**: 작업에 필요한 외부 라이브러리 최신 사용법 / 버전 차이 / 공식 스펙 확인이 필요하면 **Context7 으로 학습**, 부족하면 **웹검색으로 근거 보완**.
- **기존 문서 학습**: 프로젝트 루트의 `CLAUDE.md`, 관련 폴더의 `CLAUDE.md`(있을 경우), `docs/DESIGN_APP.md` 해당 섹션을 **먼저 읽고** 규칙을 숙지한다.
- **질문 정책**: 구현 전 확인이 필요한 사항이 있으면 **반드시 사용자에게 먼저 질문**(추측 금지). 질문 형식은 `CLAUDE.md §1.2` 준수:
  ```
  현재 확인된 사실:
  가능한 선택지:
  각 선택지의 영향:
  추천안:
  ```
- **범위 준수**: 해당 Phase 에 명시되지 않은 파일 / 기능을 임의로 추가하지 않는다. 다른 Phase 영역을 "미리 준비" 하지 않는다.
- **검증 필수**: DoD 체크리스트를 하나하나 통과했음을 **사용자에게 명시적으로 보고**. 통과하지 못한 항목은 미해결 사항으로 보고.

---

## Phase 0: 환경 검증 + 프로젝트 초기 셋업 ✅ **완료 상태**

### [상태]
**이 Phase 는 설계 문서 업데이트 시점 이전에 완료됨.** Claude Code 는 Phase 1 부터 진행한다. 본 섹션은 어떤 상태가 이미 준비되었는지 파악하기 위한 **참고용 스냅샷** 이다.

### [참조 문서]
- `docs/DESIGN_APP.md §0.2` — 개발 환경 버전
- `docs/DESIGN_APP.md §0.3` — 코드 편집 환경
- `docs/DESIGN_APP.md §18 Phase 0` — 완료 상태 상세

### [완료된 체크리스트]
- [x] `node v22.22.2`, `npm 10.9.7`, `java Temurin 17.0.18`, `adb 37.0.0` 모두 Git Bash 에서 동작
- [x] `ANDROID_HOME` 환경변수 설정, Pixel_10 에뮬레이터 부팅 + `adb devices` 인식
- [x] Git Bash 환경 (`~/.bashrc` + `~/.bash_profile`) 설정 완료
- [x] `C:\android_workspace\qbt-live-app\` 에 RN 0.85.1 + TypeScript 프로젝트 생성됨
- [x] `npm install` 로 기본 의존성 설치 완료 (react 19.2.3, react-native 0.85.1)
- [x] Android SDK Platform 36 설치 (`compileSdk 36` 기본값)
- [x] Git 저장소: `.gitignore` (보안), `.gitattributes` (LF 통일) 커밋 + GitHub `ingbeen/qbt-live-app` (Public) 에 push
- [x] `.vscode/settings.json` (자동 포맷 + ESLint + LF)
- [x] VSCode 확장 설치 (ESLint, Prettier, React Native Tools, ES7+ snippets)
- [x] Firebase `qbt-live` 프로젝트에 Android 앱 등록 (`com.ingbeen.qbtlive`)
- [x] `android/app/google-services.json` 배치 (SHA-1 미포함 초기 버전)
- [x] Firebase Auth Email/Password 활성화, OWNER_UID 사용자 로그인 가능

### [아직 안 한 것 — Phase 1 에서 처리]
- RN 의존성 추가 (Firebase, React Navigation, WebView 등)
- Firebase Gradle 플러그인 등록
- Android 패키지명을 기본값 → `com.ingbeen.qbtlive` 로 변경
- Display name 을 `QbtLiveApp` → `QBT Live` 로 변경 (strings.xml)
- Hello World + Firebase 초기화 로그가 찍히는 App.tsx
- debug SHA-1 추출 + Firebase 등록 + `google-services.json` 재다운로드

### [주의사항]
- 서버 프로젝트(`/home/yblee/workspace/quant/`) 는 별개 프로젝트. 앱 개발에서 직접 접근 금지.
- Phase 0 재실행 요청은 원칙적으로 없음. 환경 문제 발생 시 별도 트러블슈팅 작업으로 분리.

---

## Phase 1: Firebase 통합 + 의존성 추가 + 첫 빌드 ✅ **완료 상태 (2026-04-19)**

**[전제 조건]**
- 목적: `qbt-live-app` 프로젝트에 Firebase Gradle 플러그인을 등록하고, Android 패키지명/Display name 을 확정한 후, 모든 필요 의존성을 설치하여 에뮬레이터에서 **Hello World + Firebase 초기화** 까지 성공시킨다.
- 작업에 필요한 외부 라이브러리 최신 사용법/버전 차이/공식 스펙 확인 필요 시 Context7 으로 학습, 부족하면 웹검색으로 근거 보완.
- 관련 폴더의 CLAUDE.md 존재 시 추가 학습.
- 계획서 작성 및 구현 전 확인 필요 사항 있으면 반드시 질문 후 진행(추측 금지). 질문 형식: 현재 확인된 사실/가능한 선택지/각 선택지의 영향/추천안.

**[참조 문서]**
- `docs/DESIGN_APP.md §1.2` — 주요 의존성 정확 버전
- `docs/DESIGN_APP.md §1.3` — Android 빌드 설정 (compileSdk 36, New Arch ON)
- `docs/DESIGN_APP.md §18 Phase 1` — 상세 수행 내용
- `docs/DESIGN_APP.md §20` — google-services.json 배치
- `CLAUDE.md §6.1` — Firebase 초기화 (persistence OFF)
- `CLAUDE.md §10.3` — 버전 고정 규칙
- `CLAUDE.md §11` — 시크릿 관리
- `CLAUDE.md §13.1` — Android 빌드 설정

**[수행할 내용]**

1. **의존성 설치** (§1.2 의 버전 정확히 반영)
   ```bash
   cd /c/android_workspace/qbt-live-app
   # Firebase
   npm install \
     @react-native-firebase/app@^24.0.0 \
     @react-native-firebase/auth@^24.0.0 \
     @react-native-firebase/database@^24.0.0 \
     @react-native-firebase/messaging@^24.0.0
   # Navigation
   npm install \
     @react-navigation/native@^7.2.2 \
     @react-navigation/bottom-tabs@^7.2.0 \
     react-native-safe-area-context@^5.7.0 \
     react-native-screens@^4.24.0 \
     react-native-gesture-handler@^2.31.1
   # Utility
   npm install \
     react-native-webview@^13.16.1 \
     @react-native-community/netinfo@^12.0.1 \
     react-native-uuid@^2.0.4 \
     zustand@^5.0.12
   ```

2. **Android 패키지명 변경**:
   - `android/app/build.gradle`: `applicationId`, `namespace` → `com.ingbeen.qbtlive` (현재 `com.qbtliveapp` 로 박혀있음)
   - `android/app/src/main/java/` 의 기존 패키지 폴더 `com/qbtliveapp/` 를 `com/ingbeen/qbtlive/` 구조로 이동 + 기존 폴더 삭제
   - `MainActivity.kt`, `MainApplication.kt` 상단의 `package com.qbtliveapp` → `package com.ingbeen.qbtlive`
   - `AndroidManifest.xml` 의 `package` 속성은 RN 0.85 에서 build.gradle 의 `namespace` 로 이관됨 (별도 수정 불필요)
   - 변경 후 `./gradlew clean` 필수 (캐시 문제 방지)

3. **Display name 변경**:
   - `android/app/src/main/res/values/strings.xml` 의 `<string name="app_name">QbtLiveApp</string>` → `QBT Live`
   - (프로젝트는 `init QbtLiveApp --directory qbt-live-app` 으로 생성되어 app_name 기본값이 `QbtLiveApp` 임)

4. **Firebase Gradle 플러그인 등록**:
   - `android/build.gradle` (루트): `buildscript.dependencies` 에 `classpath("com.google.gms:google-services:4.4.2")` 추가
   - `android/app/build.gradle`: 파일 상단 plugins 블록 근처에 `apply plugin: "com.google.gms.google-services"` 추가

5. **`tsconfig.json` 강화** — `CLAUDE.md §2.4` 의 권장 설정 반영 (`strict`, `noUncheckedIndexedAccess`, `noImplicitAny`, `strictNullChecks`)

6. **`App.tsx` 교체** — RN CLI 기본 `@react-native/new-app-screen` 제거, 커스텀 Hello World + Firebase 초기화 로그:
   ```tsx
   import React, { useEffect } from 'react';
   import { View, Text, StyleSheet } from 'react-native';
   import database from '@react-native-firebase/database';

   export default function App() {
     useEffect(() => {
       database().setPersistenceEnabled(false);
       console.log('[Firebase] initialized, persistence OFF');
     }, []);

     return (
       <View style={styles.container}>
         <Text style={styles.text}>Hello QBT Live</Text>
       </View>
     );
   }

   const styles = StyleSheet.create({
     container: { flex: 1, backgroundColor: '#0d1117', justifyContent: 'center', alignItems: 'center' },
     text: { color: '#e6edf3', fontSize: 20 },
   });
   ```
   주: Phase 1 에서는 `services/firebase.ts` 는 생성하지 않음. Phase 2 에서 리팩토링.

7. **clean 빌드**:
   ```bash
   cd /c/android_workspace/qbt-live-app/android
   ./gradlew clean
   cd ..
   ```

8. **첫 빌드 실행**:
   ```bash
   npm start                  # Metro (별도 Git Bash 창에서 유지)
   # 또 다른 Git Bash 창에서:
   npm run android
   ```

9. **debug SHA-1 추출** (Phase 7 FCM 대비):
   ```bash
   cd /c/android_workspace/qbt-live-app/android
   ./gradlew signingReport
   # Variant: debug 의 SHA1 문자열 복사
   ```
   사용자에게 SHA-1 을 출력해 알려주고, **사용자가** Firebase Console → `qbt-live` → Project Settings → Android 앱 → "Add fingerprint" 에서 SHA-1 등록을 진행하도록 안내.

10. **`google-services.json` 재다운로드 + 배치**:
    - 사용자가 SHA-1 등록 완료 후 새 `google-services.json` 다운로드
    - 기존 `android/app/google-services.json` 덮어쓰기 안내
    - 덮어쓰기 후 `.gitignore` 가 여전히 이 파일을 제외하는지 `git status` 로 재확인

11. **재빌드 + 로그 확인**:
    ```bash
    npm run android
    adb logcat -s "ReactNativeJS:V"   # "[Firebase] initialized" 확인
    ```

12. **Git 커밋**:
    ```bash
    git add -A
    git status                          # google-services.json 이 포함 안 됐는지 재확인
    git commit -m "[Phase 1] add dependencies, configure Firebase, set package name com.ingbeen.qbtlive"
    git push
    ```

**[DoD 검증 체크리스트]**

- [x] `package.json` 에 §1.2 의 모든 의존성 반영
- [x] `applicationId`, `namespace` 가 `com.ingbeen.qbtlive`
- [x] Display name 이 "QBT Live"
- [x] `tsconfig.json` 에 strict 모드 활성
- [x] 에뮬레이터에 "QBT Live" 이름으로 앱 설치
- [x] 앱 실행 시 Hello World 텍스트 표시 (다크 배경)
- [x] `adb logcat` 에서 `[Firebase] initialized, persistence OFF` 로그 확인
- [x] Firebase native module 관련 에러 0 (modular API deprecation 경고는 Phase 2 에서 해소 예정)
- [x] Hot reload 동작
- [x] `tsc --noEmit` 에러 0
- [x] debug SHA-1 Firebase Console 에 등록 완료 (`5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`)
- [x] `google-services.json` 이 SHA-1 포함된 최신 버전으로 교체됨
- [x] `.gitignore` 가 `google-services.json` 을 여전히 제외 (`git status` 에 표시 안 됨)
- [x] `[Phase 1]` 커밋이 GitHub 에 push 됨

**[주의사항]**

- RN 0.85 는 **New Architecture 강제 ON**. `gradle.properties` 의 `newArchEnabled=true` 유지 또는 해당 프로퍼티 부재 상태 유지. `false` 시도 시 경고 후 무시됨.
- `@react-native-firebase/*` v24 는 **modular API 기반**. `firebase.database()` 같은 namespaced 스타일 금지. `import database from '@react-native-firebase/database'; database().ref(...)` 스타일 사용.
- 패키지명 변경 후 첫 빌드 전에 반드시 `./gradlew clean` 실행 (stale 캐시 문제 방지).
- Metro 8081 포트 충돌 시 `adb reverse tcp:8081 tcp:8081` 실행.
- 이 Phase 에서는 Auth / RTDB / 네비게이션 / Zustand 구현 **금지**. Phase 2~3 에서 진행.
- `google-services.json` 덮어쓰기 후 커밋 전 **반드시** `git status` 에서 이 파일이 안 보이는지 확인. 보이면 `.gitignore` 가 제대로 작동하지 않는 것.

**[수행 결과 / 특이사항]**

Phase 1 구현 중 발생한 이슈와 해결 내역. 이후 Phase 에서도 동일 환경을 공유하므로 참고.

### 설계 문서 갱신 연동

Phase 1 계획 단계에서 사용자 결정에 따라 **`compileSdk` / `targetSdk` 를 RN 0.85.1 템플릿 기본값인 `36` 으로 유지** (초기 설계서 명시값 `35` 에서 변경). 근거: RN 템플릿 기본값과의 이탈을 최소화하여 이후 RN 업그레이드·라이브러리 호환 이슈를 줄이고, Google Play 2025년 8월+ targetSdk 35 이상 요구도 충족.

코드 레벨 반영: `android/build.gradle` 의 `ext.compileSdkVersion = 36`, `ext.targetSdkVersion = 36` (Phase 0 시점부터 이미 36, Phase 1 에서 변경 없이 유지).

관련 문서 갱신 (별도 커밋에서 사용자 직접 수행):
- `CLAUDE.md §13.1` (Android 빌드 설정)
- `docs/DESIGN_APP.md §0.2` (환경 버전 표) / `§1.3` (Android 빌드 설정 표) / `§18 Phase 0` (완료 체크리스트)
- `docs/DESIGN_QBT_LIVE_FINAL.md` (서버 도메인 쪽에서 SDK 언급이 있던 부분)
- `docs/PROMPT_APP.md` Phase 0 완료 체크리스트 / Phase 1 참조 문서 주석

### 계획 대비 추가된 수정

1. **`app.json` 의 `name` 필드 수정** — RN CLI 0.85.1 템플릿이 `name: "qbt-live-app"` (kebab-case) 로 생성했으나, 네이티브 `MainActivity.getMainComponentName()` 은 `"QbtLiveApp"` (PascalCase) 를 반환하여 불일치. 첫 빌드 시 `"QbtLiveApp" has not been registered` 런타임 에러 발생. **`app.json.name` 을 `QbtLiveApp` 으로 변경** 하여 native 등록명과 일치. 같은 맥락으로 `displayName` 도 `QBT Live` 로 통일 (실제 Android 표시명은 `strings.xml` 의 `app_name` 이 사용되므로 iOS 용 장식).

2. **`metro.config.js` 에 `resolver.blockList` 추가** — Windows 환경에서 Gradle CMake 빌드 중 `android/app/.cxx/` 하위에 임시 폴더를 생성/삭제하는데, Metro 워처가 이를 감시하려다 `ENOENT` 로 크래시. blockList 에 `android/app/.cxx`, `android/build`, `android/app/build`, `android/.gradle` 추가로 회피.

3. **`.gitignore` 보강** — `.claude/` (Claude Code 로컬 작업 디렉토리), `android/app/.cxx/` (Gradle CMake 임시 폴더) 를 추가. 기존에는 `android/.cxx/` 만 있어 앱 레벨 `.cxx` 가 untracked 로 노출됐음.

### 실행 중 확인된 팁

- **`npm run android` 포트 8081 충돌 프롬프트**: Terminal B 에서 RN CLI 가 Metro 가 이미 돌고 있을 때 "Use port 8082 instead?" 프롬프트 표시. **`No` 선택** 또는 **`npm run android -- --no-packager`** 사용. `Yes` 를 누르면 8082 에 임시 Metro 가 뜨지만 앱 번들은 8081 을 바라보고 있어 "Unable to load script" 빨간 화면 발생.
- **`console.log` 가 Metro 터미널에 안 찍힘**: RN 0.74+ 부터 JS 런타임 콘솔 출력이 Metro 창으로 자동 전달되지 않음. `adb logcat -s ReactNativeJS:V` (별도 Git Bash 창) 또는 Terminal A 에서 `j` 키(React Native DevTools) 로 확인.
- **`react-native-safe-area-context`**: Phase 0 에서 이미 `^5.5.2` 로 설치돼 있어 `npm install ...@^5.7.0` 실행 시 업그레이드됨. 설계서 §1.2 기준으로 맞춤.
- **`@react-navigation/bottom-tabs`**: 설계서 §1.2 의 `^7.2.0` caret range 에서 npm 이 최신 `^7.15.9` 를 설치. caret 규칙상 호환이므로 문제 없음.

### Phase 2 로 이관된 후속 작업

- **Firebase modular API 전환**: 현재 App.tsx 는 `database().setPersistenceEnabled(false)` (namespaced API) 를 사용 중이며 `@react-native-firebase` v22+ 의 **deprecation 경고** 출력됨. Phase 2 의 `src/services/firebase.ts` 리팩토링 시점에 `getApp` / `getDatabase` 기반 modular API 로 전환. `CLAUDE.md §6.1` 예제 코드도 함께 갱신 대상.

---

---

## Phase 2: 인증 + 네비게이션 골격 ✅ **완료 상태 (2026-04-19)**

### [목적]
Firebase Auth 이메일/비밀번호 로그인을 구현하고, 4탭(홈/차트/거래/설정) 빈 화면 구조를 만들어 탭 전환이 가능하게 한다. **로그인 후 자동 재로그인**도 작동해야 한다.

### [참조 문서]
- `docs/DESIGN_APP.md §7` — 인증 플로우, `services/auth.ts`
- `docs/DESIGN_APP.md §8` — 네비게이션 구조
- `docs/DESIGN_APP.md §11.1` — 색상 시스템
- `CLAUDE.md §3` — React 규칙
- `CLAUDE.md §4` — Zustand 규칙
- `CLAUDE.md §6.1, §6.4` — Firebase persistence OFF, Auth

### [수행할 내용]

1. **`src/services/firebase.ts`** — `initFirebase()` 호출 + `setPersistenceEnabled(false)` (`CLAUDE.md §6.1`)
2. **`src/utils/colors.ts`** — COLORS 상수 (`docs/DESIGN_APP.md §11.1` 전체 복사)
3. **`src/utils/constants.ts`** — OWNER_UID, RTDB_PATHS, ASSETS (`CLAUDE.md §13.3`)
4. **`src/store/useStore.ts`** — Zustand store 스켈레톤:
   - 현재는 `user`, `isOnline`, `lastError`, `setUser`, `clearAll`, `setOnline` 만 구현
   - 나머지 필드 / 액션은 Phase 3~7 에서 점진 추가
5. **`src/services/auth.ts`** — `docs/DESIGN_APP.md §7.2` 대로 `signIn`, `signOut`, `subscribeAuthState`
6. **`src/screens/LoginScreen.tsx`** — 이메일/비밀번호 input + [로그인] 버튼 + 에러 표시:
   - 디자인 최소화 (다크 모드, 중앙 정렬, `docs/DESIGN_APP.md §7.4`)
7. **`src/navigation/AppNavigator.tsx`** — Bottom Tab Navigator 4탭 (`docs/DESIGN_APP.md §8.2`):
   - 홈 / 차트 / 거래 / 설정 각 탭 화면은 "[탭명]" 텍스트만 표시 (빈 화면)
8. **`src/screens/{Home,Chart,Trade,Settings}Screen.tsx`** — 각각 `<Text>탭이름</Text>` 만
9. **`src/components/HomeHeader.tsx`** — "QBT Live" 헤더 (`docs/DESIGN_APP.md §8.3`)
10. **`src/App.tsx`** — Auth gate + NavigationContainer (`docs/DESIGN_APP.md §8.1` 구조):
    - 로그인 전 → LoginScreen
    - 로그인 후 → AppNavigator

### [DoD 검증 체크리스트]

- [x] 앱 첫 실행 시 LoginScreen 표시 (로그인 세션 없을 때)
- [x] 잘못된 이메일/비밀번호 입력 → 빨간 에러 텍스트 "이메일 또는 비밀번호가 올바르지 않습니다"
- [x] 올바른 자격증명 → 로그인 성공 → 4탭 화면으로 이동
- [x] "QBT Live" 헤더가 모든 탭에서 고정 표시
- [x] 탭 4개 전환 가능 (홈/차트/거래/설정)
- [x] 앱 재시작 시 자동 재로그인 (로그인 화면 스킵)
- [x] 설정 탭에 "로그아웃" 버튼 없음 (Phase 7 에서 추가)
- [x] 색상이 모두 `COLORS` 상수 사용 (하드코딩 hex 없음, `CLAUDE.md §3.3`)
- [x] `tsc --noEmit` 타입 에러 0개

### [주의사항]

- `setPersistenceEnabled` 는 Auth 가 아닌 **Database** 에서 호출 (React Native Firebase 관례). 헷갈리면 Context7 확인.
- `AppState` 리스너 / `NetInfo` 는 Phase 8 에서 추가. 이 Phase 에서는 `isOnline` 을 `true` 로 고정.
- RTDB 읽기 / 쓰기는 이 Phase 에서 **금지**. 다음 Phase.

### [수행 결과 / 특이사항]

Phase 2 구현 중 발생한 이슈와 해결 내역. Phase 3 이후에도 동일 환경/구조를 공유하므로 참고.

#### 설계 문서 갱신 연동

Phase 1 종료 시점에 이월된 부채 — **Firebase namespaced API deprecation 경고 해소** — 를 Phase 2 에서 처리. `src/services/firebase.ts`, `src/services/auth.ts` 를 모두 **modular API** 로 작성:

- `firebase.ts`: `getApp()` + `getDatabase(app)` + `setPersistenceEnabled(db, false)`
- `auth.ts`: `getAuth()` + `signInWithEmailAndPassword(auth, email, password)` + `signOut(auth)` + `onAuthStateChanged(auth, cb)`

Phase 1 빌드 logcat 에서 출력되던 deprecation 경고 2건이 Phase 2 빌드에서 더 이상 나오지 않음을 육안 검증 완료.

설계 문서 측 갱신 대상 (사용자 별도 커밋으로 진행):
- `CLAUDE.md §6.1` — `initFirebase()` 예제 코드가 `database().setPersistenceEnabled(false)` (namespaced) 로 작성되어 있음. `getDatabase` / `setPersistenceEnabled(db, false)` modular 스타일로 교체 대상.
- `docs/DESIGN_APP.md §7.2` — `services/auth.ts` 예제가 `auth().signInWithEmailAndPassword(...)` (namespaced). `getAuth` / `signInWithEmailAndPassword(getAuth(), ...)` modular 스타일로 교체 대상.

#### 계획 대비 추가된 수정

설계서 §8.1 의 `App.tsx` 예시에는 없지만, React Navigation v7 + `react-native-gesture-handler` v2 + `react-native-safe-area-context` v5 조합의 **기술적 필수** 래핑이라 추가:

1. **`GestureHandlerRootView`** (`react-native-gesture-handler`): 앱 루트에 래핑. 제스처 핸들러가 올바르게 동작하려면 필수. New Architecture ON 환경에서도 자동 처리 안 됨 — 명시적 래핑 필요.
2. **`SafeAreaProvider`** (`react-native-safe-area-context`): `useSafeAreaInsets` / `SafeAreaView` 컴포넌트가 동작하려면 루트에 Provider 필요. `HomeHeader`, `LoginScreen` 양쪽 모두에서 safe area 를 사용하므로 Provider 도입.
3. **`StatusBar`** 명시 설정: `barStyle="light-content"` + `backgroundColor={COLORS.bg}` — 다크 모드 앱이므로 상단 시스템 바 글자가 밝아야 가독성 확보.
4. **`HomeHeader`** 에 `useSafeAreaInsets().top` 적용: Bottom Tab Navigator 의 커스텀 헤더는 기본적으로 safe area 를 건너뛰지 않음. 상단 status bar 높이(노치 포함)를 직접 패딩으로 반영.
5. **`LoginScreen`** 에 `SafeAreaView` 래핑: 다크 배경이 status bar 영역까지 이어지도록 + 상단 노치 영역 안전 처리.

#### 실행 중 확인된 팁

- **로그인 상태 초기화**: Phase 7 에서 설정 탭에 "로그아웃" 버튼 추가 전까지는, LoginScreen 을 수동으로 재현하려면 `adb shell pm clear com.ingbeen.qbtlive` 로 앱 데이터 삭제 후 재실행 필요.
- **`onAuthStateChanged` 초기 호출 동작**: 앱 시작 직후 `fbUser === null` 로 한 번 호출된 뒤, Firebase Auth 가 디스크에서 세션 복원에 성공하면 실제 사용자 객체로 한 번 더 호출됨 (총 2회). `subscribeAuthState` 가 여러 번 `setUser` 를 호출해도 Zustand 의 얕은 비교로 리렌더 최소화 — 동작에 문제 없음.
- **Auth persistence 는 Firebase 내부 구현**: v24 에서 토큰을 디스크(AsyncStorage/Keychain 계열)에 자동 저장하여 재시작 시 복원. 이는 Firebase 라이브러리 내부 구현이며 `CLAUDE.md §12` 의 "앱 코드 레벨 AsyncStorage 금지" 규칙과 무관.
- **탭 이름 한글**: `Tab.Screen name="홈"` 은 라우트 키이자 탭 레이블 기본값. 한글 라우트 키가 문제되는 부분은 현재까지 없음 (Phase 3 이후 `navigation.navigate('홈')` 같은 호출이 필요해지면 재평가).

#### Phase 3 로 이관된 후속 작업

- **`src/types/rtdb.ts` 신규**: RTDB payload 타입 (Portfolio, Signals, PendingOrder, FillPayload 등) 전체 정의 (`DESIGN_APP.md §5.3`)
- **`src/services/rtdb.ts` 신규**: `once('value')` 기반 읽기 헬퍼 (`readPortfolio`, `readAllSignals`, `readAllPendingOrders`, 4개 inbox readers) — `CLAUDE.md §6.2` 준수
- **`src/utils/format.ts` 신규**: `formatKRW`, `formatShares`, `formatUSD`, `formatSignedPct`, `formatWeight`, `today`, `kstNow`, `formatShortDate`, `toUpperTicker`, `toSignalTicker` (`DESIGN_APP.md §16.1`)
- **`src/utils/constants.ts` 확장**: `RTDB_PATHS`, `ASSETS` 추가 (Phase 2 에서는 YAGNI 로 생략했음)
- **`src/store/useStore.ts` 확장**: `portfolio`, `signals`, `pendingOrders`, `inboxFills`, `inboxBalanceAdjusts`, `inboxFillDismiss`, `inboxModelSync`, `loading` 필드 + `refreshHome()` 액션 추가
- **`src/components/Badge.tsx` 신규** + **`src/components/PullToRefreshScrollView.tsx` 신규**
- **`src/screens/HomeScreen.tsx` 확장**: 자산 현황 카드 구현 (4자산 + 현금, 합계, 비중)

---

## Phase 3: Zustand store + RTDB 연동 (홈 탭 자산 현황)

### [목적]
RTDB 에서 `/latest/portfolio`, `/latest/signals`, `/latest/pending_orders`, 4개 inbox 를 읽어 Zustand store 에 저장하고, **홈 탭의 "자산 현황 카드"** 만 완성한다. (홈 탭의 나머지 요소는 Phase 4.)

### [참조 문서]
- `docs/DESIGN_APP.md §5` — RTDB 데이터 계약, TypeScript 타입
- `docs/DESIGN_APP.md §6` — Zustand store 구조
- `docs/DESIGN_APP.md §9.1, §9.2, §9.6` — firebase.ts, rtdb.ts, 에러 처리
- `docs/DESIGN_APP.md §15.1` 중 "자산 현황 카드" + §15.1.1 (평균가 표시 제한)
- `docs/DESIGN_APP.md §16` — 숫자/날짜 포맷
- `CLAUDE.md §4, §5.2, §5.4, §6.2, §6.3` — Zustand, 자산 ID 규칙, 포맷, RTDB 읽기/쓰기

### [수행할 내용]

1. **`src/types/rtdb.ts`** — `docs/DESIGN_APP.md §5.3` 의 타입 전체 정의 (모든 타입 한 번에)
2. **`src/services/rtdb.ts`** — 읽기 헬퍼:
   - `readOnce<T>`, `readPortfolio`, `readAllSignals`, `readAllPendingOrders`
   - `readInboxFills`, `readInboxFillDismiss`, `readInboxModelSync`, `readInboxBalanceAdjusts` (processed=false 필터)
   - **`onValue` 사용 금지. `once('value')` 만 사용** (`CLAUDE.md §6.2`)
3. **`src/utils/format.ts`** — `docs/DESIGN_APP.md §16.1` 전체 복사:
   - `formatKRW`, `formatShares`, `formatUSD`, `formatSignedPct`, `formatWeight`, `today`, `kstNow`, `formatShortDate`, `toUpperTicker`, `toSignalTicker`
4. **`src/store/useStore.ts`** — 확장:
   - 필드 추가: `portfolio`, `signals`, `pendingOrders`, `inboxFills`, `inboxBalanceAdjusts`, `inboxFillDismiss`, `inboxModelSync`, `loading`
   - 액션 추가: `refreshHome()` — 위 모든 경로를 `Promise.all` 로 병렬 로드
   - 에러 처리: `try/catch` + `lastError` 업데이트
5. **`src/components/Badge.tsx`** — 공통 배지 (`docs/DESIGN_APP.md §11.4`)
6. **`src/components/PullToRefreshScrollView.tsx`** — RN 의 `RefreshControl` 래퍼
7. **`src/screens/HomeScreen.tsx`** — **자산 현황 카드만** 구현:
   - 제목 좌측 "자산 현황" + 우측 합계 금액 (`formatKRW(actual_equity)`)
   - 4자산 행: 티커(대문자) + 배지 + 수량 + 비중
   - **평균가 표시 생략** (`docs/DESIGN_APP.md §15.1.1`)
   - 마지막 행: 현금 (`shared_cash_actual` + 비중)
   - 탭 진입 시 `refreshHome()` 호출
   - Pull-to-refresh 로 재호출 가능
   - 로딩 중 `ActivityIndicator` 표시

### [DoD 검증 체크리스트]

- [ ] 홈 탭 진입 시 RTDB 실제 데이터 로드 확인 (사용자 RTDB console 에서 값과 일치)
- [ ] 자산 현황 카드에 SSO / QLD / GLD / TLT 4자산 + 현금 표시
- [ ] 합계 금액 형식 `1억 301만원` 정상
- [ ] 비중 형식 `33.8%` 정상
- [ ] 배지 4종 정상 (`[보유]`, `[현금]`, `[매수대기]`, `[매도대기]`) — `docs/DESIGN_APP.md §11.3`
- [ ] Pull-to-refresh 동작
- [ ] 모든 자산 ID 가 RTDB/저장은 소문자, UI 는 대문자 (`CLAUDE.md §5.2`)
- [ ] `onValue` 호출 0곳 (`grep -r "onValue" src/` 결과 비어있음)
- [ ] 하드코딩 hex 0곳

### [주의사항]

- `pending_orders` 는 pending 있는 자산만 키로 존재. 전체 자산 순회 시 `Partial<Record<AssetId, PendingOrder>>` 로 안전 접근.
- `drift_pct` 는 RTDB 저장 시 0~1 ratio. 표시 시에만 ×100 (`formatSignedPct` 사용).
- 이 Phase 에서 리마인더 / 시그널 블록 / MA / Model 비교는 **구현 금지**. Phase 4.

---

## Phase 4: 홈 탭 완성

### [목적]
Phase 3 에서 구현한 홈 탭에 **나머지 요소 전부** 추가 — 업데이트 배지, 리마인더 블록, 시그널 체결 예정 블록, MA 근접도, Model 비교, 동기화 다이얼로그, 토스트.

### [참조 문서]
- `docs/DESIGN_APP.md §11.3` — 배지 시스템
- `docs/DESIGN_APP.md §11.5` — 토스트 시스템
- `docs/DESIGN_APP.md §15.1` — 홈 탭 전체 구현 가이드
- `docs/DESIGN_APP.md §9.5` — RTDB 쓰기 헬퍼 (submitModelSync)
- `docs/DESIGN_APP.md §17` — 인앱 텍스트 컨벤션 / 허용 기호
- `CLAUDE.md §5.3, §5.4` — 한글 텍스트, 이모지 금지, 숫자 포맷

### [수행할 내용]

1. **`src/services/rtdb.ts`** 확장 — `submitModelSync` 추가 (`docs/DESIGN_APP.md §9.5`)
2. **`src/store/useStore.ts`** 확장 — `submitModelSync` 액션 추가
3. **`src/utils/constants.ts`** 확장 — `SYMBOLS` 상수 (`docs/DESIGN_APP.md §17.4` — WARN, BOLT, ARROW_UP/DOWN, CIRCLE, CLOSE, ARROW_RIGHT)
4. **`src/components/UpdateStatusBadge.tsx`**:
   - 좌측: 11px 회색 `업데이트: {execution_date} 07:30 KST`
   - 우측: [정상]/[경고] 배지 — `오늘 - execution_date` 일수 차이로 판단 (`docs/DESIGN_APP.md §12.3`)
5. **`src/components/ReminderBlock.tsx`** — 표시 조건 엄격 준수 (`docs/DESIGN_APP.md §15.1`):
   - pending 존재 + 해당 자산의 inboxFills / inboxFillDismiss **모두 없음**
   - 주황 배경/테두리. `⚠` + 본문.
6. **`src/components/SignalNextFillBlock.tsx`**:
   - pending 1개 이상 존재 시만 표시
   - 자산별 한 줄: `{ASSET_UPPER} {수량}주 {매수/매도}`
   - 수량 = `Math.round(Math.abs(delta_amount) / signals[asset].close)`
7. **`src/components/MAProximityCard.tsx`**:
   - 행별 `{signal_ticker}` (SPY/QQQ/GLD/TLT) + 부호 퍼센트 (초록/빨강)
8. **`src/components/ModelCompareCard.tsx`**:
   - 접힘/펼침 토글 (`useState<boolean>`)
   - 펼친 상태에서 자산별 `M:{n} / A:{n} ({diff})` 표시 (차이 0 = 회색, 아니면 노랑)
   - [Model을 실제로 동기화] 버튼 → SyncDialog 열기
9. **`src/components/SyncDialog.tsx`**:
   - 모달 (React Native `Modal`)
   - pending 있을 때 안내 블록 (주황 테두리)
   - [취소] / [동기화] 버튼
   - [동기화] 탭 → `submitModelSync()` → Dialog 닫음 → Toast
10. **`src/components/Toast.tsx`** — `docs/DESIGN_APP.md §11.5` 그대로
11. **`src/screens/HomeScreen.tsx`** — 모든 섹션 통합:
    - 순서: UpdateStatusBadge → ReminderBlock → SignalNextFillBlock → AssetSummaryCard → MAProximityCard → ModelCompareCard

### [DoD 검증 체크리스트]

- [ ] 업데이트 시각 정상 표시, `오늘 - execution_date >= 5일` 일 때 [경고] 배지 (테스트용으로 RTDB 값을 과거로 조작하여 검증)
- [ ] 리마인더 블록: pending 있고 해당 자산 inbox 비어있을 때만 표시
- [ ] 시그널 체결 예정 블록: pending 1개 이상일 때만 표시
- [ ] MA 근접도: 4행, 부호 + 색상 정확 (양수 초록, 음수 빨강)
- [ ] Model 비교 카드 접힘/펼침 정상
- [ ] 동기화 다이얼로그 → [동기화] → RTDB `/model_sync/inbox/{uuid}` 에 payload 확인 (`input_time_kst` 필수)
- [ ] 토스트 메시지 `동기화 요청이 저장되었습니다.\n다음 실행에 반영됩니다.` 표시
- [ ] 토스트 3초 자동 사라짐 + ✕ 버튼 수동 닫기
- [ ] 이모지 0개 (`⚠⚡▲▼●✕→` 는 허용)
- [ ] 한글 텍스트 컨벤션 준수 (`docs/DESIGN_APP.md §17.1`)
- [ ] `tsc --noEmit` 에러 0

### [주의사항]

- 리마인더 / 시그널 블록이 동시에 표시될 수도 있고(상단 리마인더 → 하단 시그널), 둘 다 안 보일 수도 있다. 두 블록은 독립적.
- 동기화 후 **자동 재로드 안 함** (`docs/DESIGN_APP.md §6.4`). 사용자 pull-to-refresh 를 대기.
- B&H 자산(GLD/TLT)도 리밸런싱 시 `[매수대기]/[매도대기]` 배지 가능.

---

## Phase 5: 거래 탭

### [목적]
거래 탭의 체결 입력 / 잔고 보정 / 히스토리 전체를 구현한다.

### [참조 문서]
- `docs/DESIGN_APP.md §9.4, §9.5` — 거래 탭 로더, 쓰기 헬퍼
- `docs/DESIGN_APP.md §13` — 유효성 검사
- `docs/DESIGN_APP.md §15.3` — 거래 탭 전체 구현 가이드
- `docs/DESIGN_APP.md §17` — 인앱 텍스트
- `CLAUDE.md §5, §6.3` — 네이밍, 쓰기 경로 제약

### [수행할 내용]

1. **`src/utils/validation.ts`** — `docs/DESIGN_APP.md §13.5`:
   - `validateFill(payload, portfolio): ValidationResult`
   - `validateBalanceAdjust(payload, portfolio): ValidationResult`
2. **`src/services/rtdb.ts`** 확장:
   - `submitFill`, `submitBalanceAdjust`, `submitFillDismiss`
   - `readHistoryFills`, `readHistoryBalanceAdjusts`, `readHistorySignals`
   - 모두 `CLAUDE.md §6.3` 의 5개 쓰기 경로 준수
3. **`src/store/useStore.ts`** 확장:
   - 필드: `historyFills`, `historyBalanceAdjusts`, `historySignals`
   - 액션: `refreshTrade`, `submitFill`, `submitBalanceAdjust`, `submitFillDismiss`
4. **`src/components/FillForm.tsx`** (`docs/DESIGN_APP.md §15.3.1`):
   - pending 힌트 영역 (조건부, `⚡ ... pending`)
   - 자산 4버튼 (pending 있는 자산은 `⚡` 표시)
   - 방향 [매수]/[매도] (초록/빨강)
   - 수량 + 체결가 (숫자 키패드)
   - 체결일 DatePicker (미래 disabled)
   - 메모 (선택)
   - [체결 저장] — `validateFill` 통과 시만 활성
   - [이 시그널 스킵] — pending 있는 자산 선택 시만 표시
5. **`src/components/AdjustForm.tsx`** (`docs/DESIGN_APP.md §15.3.2`):
   - 대상 5버튼 (SSO/QLD/GLD/TLT/현금)
   - 자산: 현재 상태 (주수만) + 새 주수 / 평균가 / 진입일 (3열)
   - 현금: 현재 현금 + 새 현금
   - 공통: 사유 + [보정 저장]
   - `validateBalanceAdjust` — 전 필드 미입력 시 저장 비활성 + "빈 보정은 전송할 수 없습니다"
6. **`src/components/HistoryList.tsx`** (`docs/DESIGN_APP.md §15.3.3`):
   - 필터 칩 (전체/체결/보정/신호)
   - 타임라인: 날짜 내림차순
   - 행: 날짜 + 색상바 + 내용 + 타입 배지 + 태그 배지(`[시스템]`/`[개인]`)
7. **`src/screens/TradeScreen.tsx`** — TabSelector (체결/보정) + 폼 + HistoryList

### [DoD 검증 체크리스트]

- [ ] 체결 입력: pending 있는 자산 선택 시 `⚡` + 예상 체결가 힌트 표시
- [ ] 매도 수량 > 보유 주수 → 빨간 에러 + [저장] 비활성
- [ ] 체결 저장 → RTDB `/fills/inbox/{uuid}` 에 payload 생성 (uuid, direction 소문자, trade_date YYYY-MM-DD, input_time_kst +09:00)
- [ ] 저장 후 폼 초기화 (자산/방향 유지, 수량/가격/메모 초기화) + Toast 3초
- [ ] [이 시그널 스킵] → RTDB `/fill_dismiss/inbox/{uuid}` 에 payload + Toast
- [ ] 잔고 보정: 자산 선택 시 현재 주수 표시. 현금 선택 시 현재 현금 표시.
- [ ] `actual_shares === 0` 자산에 평균가 단독 입력 → 차단 + 안내
- [ ] 모든 필드 미입력 + [보정 저장] → 차단 + "빈 보정은 전송할 수 없습니다"
- [ ] 보정 저장 → RTDB `/balance_adjust/inbox/{uuid}`
- [ ] 히스토리 필터 4종 정상 (`전체/체결/보정/신호`)
- [ ] 히스토리 행 색상 (`체결매수→초록, 체결매도→빨강, 신호→파랑, 보정→노랑`)
- [ ] `[시스템]`/`[개인]` 배지 정확 (`reason` 필드 기준)
- [ ] `tsc --noEmit` 에러 0

### [주의사항]

- `signals` 히스토리에서 `state === 'none'` 은 타임라인에서 제외 (`docs/DESIGN_APP.md §15.3.3`).
- `input_time_kst` 는 **클라이언트 기준 KST 현재 시각** (`kstNow()` 헬퍼). 서버 시각 아님.
- 저장 실패 시 Toast 대신 빨간 에러 텍스트 + 폼 유지 (`docs/DESIGN_APP.md §9.6`).
- inbox `processed` 필드는 **절대 읽지도 쓰지도 말 것** (`CLAUDE.md §12`).

---

## Phase 6: 차트 탭

### [목적]
TradingView Lightweight Charts 를 WebView 로 통합하여 주가 차트 (4자산) + Equity 차트를 구현한다. 핀치 줌 / 드래그 / 좌측 끝 도달 시 archive 자동 로드 + dedupe.

### [참조 문서]
- `docs/DESIGN_APP.md §9.3` — 차트 점진 로딩, `mergeChartSeries`
- `docs/DESIGN_APP.md §14` — WebView + Lightweight Charts HTML
- `docs/DESIGN_APP.md §15.2` — 차트 탭 구현 가이드
- `CLAUDE.md §7` — WebView + 라이브러리 CDN 규칙

### [수행할 내용]

1. **`src/utils/chartHtml.ts`** — `docs/DESIGN_APP.md §14.2` 의 HTML 템플릿. 버전 **`@4.2.0` 고정** (`CLAUDE.md §7.4`).
2. **`src/services/chart.ts`** — `mergeChartSeries` (`docs/DESIGN_APP.md §9.3`) + `mergeEquitySeries` (유사 패턴)
3. **`src/services/rtdb.ts`** 확장 — `readPriceChart*`, `readEquityChart*`
4. **`src/store/useStore.ts`** 확장:
   - 필드: `priceCharts: Partial<Record<AssetId, PriceChartCache>>`, `equityChart: EquityChartCache`
   - 액션: `refreshChart(assetIdOrEquity)`, `loadPriceArchive(assetId, year)`, `loadEquityArchive(year)`
5. **`src/components/ChartTypeToggle.tsx`** — 주가 / Equity
6. **`src/components/AssetSelector.tsx`** — 4자산 (SSO/QLD/GLD/TLT)
7. **`src/components/ChartWebView.tsx`**:
   - `WebView` + `onMessage` 핸들러
   - 메시지 타입 화이트리스트 (`ready`, `load_earlier`)
   - `injectJavaScript` 로 `window.setPriceChart` / `window.setEquityChart` 호출
8. **`src/components/ChartLegend.tsx`** — 주가/Equity 범례 자동 전환 (`docs/DESIGN_APP.md §15.2`)
9. **`src/screens/ChartScreen.tsx`** — 통합:
   - 최초 진입: meta + recent 병렬 로드
   - 좌측 끝 (`load_earlier` 수신) → 직전 연도 archive 로드 → 재주입
   - 캐시 활용 (같은 자산 재진입 시 재로드 안 함)

### [DoD 검증 체크리스트]

- [ ] 차트 탭 첫 진입 시 SSO 주가 차트 렌더 (기본 자산)
- [ ] 자산 전환(SSO→QLD→GLD→TLT) 정상
- [ ] 주가 차트 라인 4종: 종가(파랑), EMA-200(노랑), 상단밴드(빨강 점선), 하단밴드(초록 점선)
- [ ] 마커 4종: ▲매수시그널(belowBar 초록), ▼매도시그널(aboveBar 빨강), ●내매수(belowBar 초록), ●내매도(aboveBar 빨강)
- [ ] 차트 종류 Equity 전환 시 Model/Actual 2라인
- [ ] 핀치 줌 / 드래그 동작
- [ ] 기간 선택 버튼 **없음** (`docs/DESIGN_APP.md §2` 비목표)
- [ ] 마커 on/off 토글 **없음**
- [ ] 좌측 끝 도달 → archive 자동 로드 → 추가 라인 표시 (RTDB 호출 횟수는 logcat 또는 네트워크 인스펙터로 확인)
- [ ] recent + archive 경계 날짜 dedupe 정상 (중복 데이터 없음)
- [ ] 범례 주가/Equity 자동 전환
- [ ] WebView 에서 에러 0 (Chrome DevTools 원격 디버그로 확인, `CLAUDE.md §21.5`)

### [주의사항]

- Lightweight Charts 버전은 **@4.2.0 고정**. `@latest` 쓰지 말 것 (재현성).
- WebView 에서 `setPersistenceEnabled` 같은 Firebase 호출 금지 (HTML 은 RN 밖).
- `buy_signals` 등 빈 배열 키는 RTDB 에 없음 → `?? []` 로 폴백 (`docs/DESIGN_APP.md §5.4`).
- 주가 차트 TLT/GLD 는 BufferZone 미사용이라 `upper_band` / `lower_band` 가 모두 `null` 일 수 있음. 렌더 시 `filter(p => p.value !== null)` 처리.

---

## Phase 7: 설정 탭 + FCM

### [목적]
설정 탭을 완성하고 FCM 토큰 등록 + 푸시 알림 수신 + 알림 탭 시 홈 탭 이동을 구현한다.

### [참조 문서]
- `docs/DESIGN_APP.md §10` — FCM
- `docs/DESIGN_APP.md §15.4` — 설정 탭 구조
- `CLAUDE.md §6.5` — Messaging 규칙

### [수행할 내용]

1. **`src/services/fcm.ts`** — `docs/DESIGN_APP.md §10.1`:
   - `ensureFcmToken` — 권한 요청 + 토큰 획득 + `/device_tokens/{device_id}` 저장
   - `onTokenRefresh` 등록
   - `setupForegroundHandler` — MVP: 무시
   - `setupNotificationTapHandler` — 백그라운드/종료 상태에서 알림 탭 → 콜백
2. **`android/app/src/main/AndroidManifest.xml`** — FCM 권한 + 서비스 설정 확인 (React Native Firebase 자동 적용, 필요 시 보강)
3. **`src/App.tsx`** 확장:
   - 로그인 성공 후 `ensureFcmToken()` 호출
   - `setupNotificationTapHandler(() => navigate('홈'))` 등록
4. **`src/screens/SettingsScreen.tsx`** — 6개 행:
   - 계정 (user.email)
   - Firebase (qbt-live (Spark))
   - RTDB 연결 (정상/오류 — `/latest/portfolio` 읽기 성공 여부로 판단)
   - FCM 토큰 (등록됨/미등록)
   - 마지막 실행 (`portfolio.execution_date` + 07:30 KST)
   - 앱 버전 (package.json version)
   - [로그아웃] 버튼 (빨강 테두리) — `signOut()` 호출

### [DoD 검증 체크리스트]

- [ ] 로그인 후 `/device_tokens/{device_id}` 에 토큰 저장 확인 (Firebase console)
- [ ] 설정 탭 6개 행 모두 정확히 표시
- [ ] RTDB 연결 상태: `/latest/portfolio` 읽기 성공 → [정상], 실패 → [오류]
- [ ] FCM 토큰 표시 정확
- [ ] 로그아웃 → LoginScreen 복귀
- [ ] 서버에서 테스트 FCM 발송 → 앱이 백그라운드 상태에서 알림 트레이 표시
- [ ] 알림 탭 → 앱 열림 → 홈 탭 진입
- [ ] 포그라운드에서 FCM 수신 시 인앱 알림 표시 **없음** (MVP 무시)
- [ ] `tsc --noEmit` 에러 0

### [주의사항]

- Android 13+ 에서 알림 권한은 **런타임 요청** 필요. `requestPermission` 호출 시점 = 로그인 직후.
- `device_id` 는 메모리만 유지 (`uuid.v4()` 로 매 실행마다 새로 생성). AsyncStorage 사용 금지 (`CLAUDE.md §12`).
- FCM data payload 처리 **금지**. `notification.body` 만 사용 (`CLAUDE.md §6.5`).
- 서버에서 SHA-1 지문을 Firebase Console 에 등록하지 않았다면 FCM 이 동작 안 할 수 있음. 실패 시 사용자에게 SHA-1 등록 요청.

---

## Phase 8: 오프라인 / 에러 처리

### [목적]
네트워크 감지 + 오프라인 전체 화면 차단 + RTDB 에러 처리 + 포그라운드 복귀 시 캐시 무효화.

### [참조 문서]
- `docs/DESIGN_APP.md §12` — 오프라인 / 데이터 최신성
- `docs/DESIGN_APP.md §9.6` — 에러 처리
- `CLAUDE.md §9` — 에러 처리 규칙

### [수행할 내용]

1. **`src/services/network.ts`** — `NetInfo` 리스너 (`docs/DESIGN_APP.md §12.1`)
2. **`src/components/OfflineScreen.tsx`** — 전체 화면 차단 (`docs/DESIGN_APP.md §12.2`):
   - 중앙 "disconnect" SVG 아이콘 (이모지 금지)
   - "네트워크 없음 / 연결 후 다시 시도"
   - [다시 시도] 버튼 → `NetInfo.refresh()`
3. **`src/components/ErrorState.tsx`** — 공통 에러 상태 컴포넌트:
   - "데이터를 불러올 수 없습니다."
   - [다시 시도] 버튼 (refresh 함수 prop 주입)
4. **`src/App.tsx`** 확장:
   - `setupNetworkListener` 구독
   - `isOnline === false` → OfflineScreen 전체 차단
   - `AppState` 리스너: `active` 로 전환 시 `clearAll()` + `refreshHome()` (`docs/DESIGN_APP.md §12.4`)
5. **`src/services/rtdb.ts`** 강화:
   - 모든 `readOnce` 에 10초 타임아웃
   - `PERMISSION_DENIED` 코드 감지 → 한글 메시지 + 로그아웃 제안
6. **홈 탭 상단 [경고] 배지** 동작 재확인 (execution_date 가 오래됨)

### [DoD 검증 체크리스트]

- [ ] 에뮬레이터 airplane mode → 즉시 OfflineScreen 표시
- [ ] Airplane mode 해제 → 자동으로 OfflineScreen 사라지고 이전 화면 복귀
- [ ] RTDB 타임아웃 시 ErrorState + [다시 시도] 버튼 동작
- [ ] 권한 오류 시 "권한이 없습니다. OWNER_UID 설정을 확인하세요." 표시
- [ ] 앱 백그라운드 → 포그라운드 전환 시 홈 데이터 자동 재로드 (logcat / RTDB 호출 확인)
- [ ] `portfolio.execution_date` 가 오늘 대비 5일 이상 전 → 홈 상단 [경고] 배지 (노랑)
- [ ] 에러 메시지 전부 한글, 예외 타입 / stack trace 노출 없음 (`CLAUDE.md §9.4`)
- [ ] `tsc --noEmit` 에러 0

### [주의사항]

- `NetInfo.isInternetReachable` 은 iOS/Android 간 동작 차이 존재. Android 에서는 `isConnected && isInternetReachable !== false` 패턴 권장.
- `AppState` 리스너는 `App.tsx` 에서만 등록 (여러 군데 등록 금지).
- 캐시 무효화는 `clearAll` 호출이지만, `user` / `isOnline` 은 **유지**. `clearAll` 내부 구현이 이를 지키는지 확인.

---

## Phase 9: 마무리

### [목적]
일관성 검증 (색상 / 배지 / 폰트) + 앱 아이콘 + APK 빌드 + 실기기 테스트.

### [참조 문서]
- `docs/DESIGN_APP.md §11` — 색상/배지
- `docs/DESIGN_APP.md §23` — 최종 체크리스트
- `CLAUDE.md §12` — 금지사항 통합

### [수행할 내용]

1. **전체 소스 검증**:
   - `grep -rn "#[0-9a-fA-F]" src/` → 하드코딩 hex 0곳 (COLORS 상수 외)
   - `grep -rn "any" src/` → 명시적 `any` 타입 0곳
   - `grep -rn "onValue" src/` → 0곳
   - `grep -rn "AsyncStorage" src/` → 0곳
   - 이모지 검색 (`grep -rPn "[\x{1F300}-\x{1FAFF}]" src/`) → 0곳
2. **Pretendard 폰트 적용** (`docs/DESIGN_APP.md §11.2`):
   - `android/app/src/main/assets/fonts/` 에 Pretendard Variable `.ttf` 배치
   - `react-native.config.js` 에 등록 → `npx react-native-asset` 실행
   - 전역 `Text` 스타일에 `fontFamily: 'Pretendard'` 적용
3. **앱 아이콘**:
   - 간단한 "QBT" 텍스트 + 파랑 배경 SVG → Android Studio Image Asset Studio 로 mipmap 생성
   - `android/app/src/main/res/mipmap-*` 교체
4. **`android/app/build.gradle`**:
   - `versionCode 1`, `versionName "1.0.0"` 확정
5. **APK 빌드**:
   - `cd android && ./gradlew assembleRelease`
   - 결과물: `android/app/build/outputs/apk/release/app-release.apk`
   - 서명 키스토어가 없으면 생성 (사용자에게 비밀번호 확인)
6. **실기기 설치 테스트**:
   - `adb install app-release.apk`
   - 로그인 + 홈 데이터 로드 + 푸시 알림 수신 검증

### [DoD 검증 체크리스트]

- [ ] 하드코딩 hex 색상 0곳 (COLORS 상수 외)
- [ ] `any` 타입 0곳
- [ ] `onValue` 0곳
- [ ] `AsyncStorage` / `SQLite` 0곳
- [ ] 이모지 0개
- [ ] Pretendard 폰트 모든 텍스트에 적용 (타이포그래피 균일)
- [ ] 앱 아이콘이 기본 RN 아이콘이 아님
- [ ] `versionName 1.0.0`
- [ ] APK 빌드 성공 + 파일 크기 확인 (50MB 이하 권장)
- [ ] 실기기 설치 + 로그인 + 홈 데이터 로드 성공
- [ ] 실기기 FCM 수신 성공
- [ ] `docs/DESIGN_APP.md §23` 의 최종 체크리스트 전부 ✓
- [ ] `tsc --noEmit` 에러 0

### [주의사항]

- 서명 키스토어는 **분실 시 Play Store 업로드 불가**. `.gitignore` 에 키스토어 파일 추가 + 비밀번호 안전 보관 (사용자 책임).
- 실기기 테스트 시 Firebase Console 에 실기기 SHA-1 (`release` variant) 지문 추가 필요할 수 있음.
- MVP 배포는 APK 사이드로드 (`docs/DESIGN_APP.md §1.3`). Play Store 제출은 별도 작업.
- Phase 9 이후 추가 작업이 필요하면(버그 수정 / 디자인 개선 등) 별도 Phase 로 분리.

---

## 부록 A — Phase 간 공통 검증 명령어

각 Phase 완료 후 실행:

```bash
# 타입 검증
npx tsc --noEmit

# Lint (Phase 1 에서 eslint 설정한 경우)
npx eslint src/

# 하드코딩 hex 찾기 (false positive 있을 수 있음 — COLORS 정의 파일 제외)
grep -rn "#[0-9a-fA-F]\{3,6\}" src/ | grep -v "colors.ts"

# 금지 API 검색
grep -rn "onValue\|AsyncStorage\|SQLite\|Redux" src/
```

## 부록 B — 문제 발생 시 Claude Code 에게 재지시 템플릿

```
Phase N 작업 중 {문제 요약} 이 발생했다.

현재 상태:
  - 완료된 파일: ...
  - 실패 지점: ...
  - 에러 메시지: ...

다음 방향으로 재시도하라:
  1. ...
  2. ...

참조: docs/DESIGN_APP.md §X, CLAUDE.md §Y
확인이 필요하면 질문 후 진행할 것.
```

---

**문서 끝**
