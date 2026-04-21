# COMMANDS.md — QBT Live 앱 명령어

> **단일 관리처**: 프로젝트 관련 모든 명령어는 본 문서에만 둔다.
> `README.md` / `CLAUDE.md` / 그 외 문서는 본 문서를 링크로만 참조한다.
> 새로운 명령어가 생기면 여기에 추가하고, 다른 문서에 같은 명령어를 복붙하지 말 것.

---

## 1. 일상 개발 워크플로우 (멀티 터미널)

프로젝트 루트 기준. Git Bash(VSCode 통합 터미널) 사용.

### Terminal A — Metro 번들러 (상주)

```sh
npm start
```

### Terminal B — 작업별 1회 빌드/설치

```sh
# Metro 는 Terminal A 에서 돌고 있으므로 --no-packager 로 중복 실행 방지
npm run android -- --no-packager
```

### Terminal C — 로그 관찰 (필요 시)

```sh
adb logcat -s ReactNativeJS:V chromium:V
```

---

## 2. 주요 npm 스크립트

```sh
npm install               # 의존성 설치 (package-lock.json 기준)
npm start                 # Metro 번들러 (포트 8081)
npm run android           # Metro 포함 빌드/실행 (Metro 가 안 떠 있을 때)
npm run android -- --no-packager   # Metro 없이 빌드/설치 (Terminal A 상주 시)
npm run lint              # ESLint
npm test                  # Jest
```

---

## 3. 앱 상태 초기화

앱의 AsyncStorage(`device_id`), 캐시, 권한 상태까지 전부 초기화하려면:

```sh
adb shell pm clear com.ingbeen.qbtlive
```

> 앱 재설치와 동등한 상태. 다음 실행 시 FCM 토큰/권한 다이얼로그가 처음부터 다시 진행된다.

---

## 4. 디버깅

### 4.1 RN 로그만 필터링

```sh
adb logcat -s ReactNativeJS:V chromium:V
```

### 4.2 전체 로그에서 앱 PID 로 필터링

```sh
adb logcat --pid=$(adb shell pidof com.ingbeen.qbtlive)
```

### 4.3 연결된 기기/에뮬레이터 확인

```sh
adb devices
```

---

## 5. 초기 셋업 / 새 머신 구성

새로운 개발 머신에서 프로젝트를 처음 구동할 때.

```sh
# 1) 저장소 복제
git clone <repo-url>
cd qbt-live-app

# 2) npm 의존성 설치 (package-lock.json 기준)
npm install

# 3) google-services.json 배치 (수동 — .gitignore 대상이라 별도 공급받아야 함)
#    → android/app/google-services.json 에 저장

# 4) 새 머신의 debug keystore SHA-1 확인 (Firebase Console 에 등록 필요)
cd android && ./gradlew.bat signingReport
#    출력에서 Variant: debug → SHA1 값을
#    Firebase Console → 프로젝트 설정 → SHA 인증서 지문 추가

# 5) google-services.json 재다운로드 (SHA-1 등록 후 갱신된 버전으로 교체)

# 6) Gradle 캐시 초기화 + 첫 빌드 준비
cd android && ./gradlew.bat clean && cd ..

# 7) 에뮬레이터 실행 후 첫 빌드
npm run android
```

---

## 6. 환경변수 (Windows)

새 머신 셋업 시 아래 환경변수가 설정되어 있어야 한다.

```
ANDROID_HOME = %LOCALAPPDATA%\Android\Sdk
JAVA_HOME    = C:\Program Files\Eclipse Adoptium\jdk-17...

PATH 에 다음 경로 포함:
  %ANDROID_HOME%\platform-tools   (adb)
  %ANDROID_HOME%\emulator         (emulator)
  %JAVA_HOME%\bin                 (java)
```

확인:

```sh
adb --version
java -version
echo $ANDROID_HOME
```
