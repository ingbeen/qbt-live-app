# COMMANDS.md — QBT Live 앱 명령어

> **단일 관리처**: 프로젝트 관련 모든 명령어는 본 문서에만 둔다.
> `README.md` / `CLAUDE.md` / 그 외 문서는 본 문서를 링크로만 참조한다.
> 새로운 명령어가 생기면 여기에 추가하고, 다른 문서에 같은 명령어를 복붙하지 말 것.

---

## 1. 자주 쓰는 명령어 (Quick Reference)

```sh
npm run android                              # 빌드/설치
adb devices                                  # 연결된 기기/에뮬레이터 확인
adb logcat -s ReactNativeJS:V chromium:V     # RN 로그
scrcpy                                       # 화면 미러링 (USB)
scrcpy --tcpip                               # 화면 미러링 (무선)
```

상세 워크플로우 / 옵션은 아래 섹션 참고.

---

## 2. 일상 개발 워크플로우

프로젝트 루트 기준. Git Bash(VSCode 통합 터미널) 사용.

### 빌드/설치/실행

```sh
npm run android
```

> `npm run android` 는 Metro 번들러를 포함해 자동으로 띄우고, 빌드/설치까지 수행한다.

### 로그 관찰 (필요 시, 별도 터미널)

```sh
adb logcat -s ReactNativeJS:V chromium:V
```

---

## 3. 주요 npm 스크립트

```sh
npm install               # 의존성 설치 (package-lock.json 기준)
npm run android           # Metro 포함 빌드/설치/실행
npm run lint              # ESLint
```

---

## 4. 앱 상태 초기화

앱의 AsyncStorage(`device_id`), 캐시, 권한 상태까지 전부 초기화하려면:

```sh
adb shell pm clear com.ingbeen.qbtlive
```

> 앱 재설치와 동등한 상태. 다음 실행 시 FCM 토큰/권한 다이얼로그가 처음부터 다시 진행된다.

---

## 5. 디버깅

### 5.1 RN 로그만 필터링

```sh
adb logcat -s ReactNativeJS:V chromium:V
```

### 5.2 전체 로그에서 앱 PID 로 필터링

```sh
adb logcat --pid=$(adb shell pidof com.ingbeen.qbtlive)
```

### 5.3 연결된 기기/에뮬레이터 확인

```sh
adb devices
```

---

## 6. 화면 미러링 (scrcpy)

설치 (winget):

```sh
winget install --exact Genymobile.scrcpy
```

git bash 에서 호출하려면 `~/bin/scrcpy` wrapper 사용 (winget 패키지 폴더의 최신 버전 자동 탐색).

### 6.1 기본 사용

```sh
scrcpy                              # USB 연결
scrcpy --tcpip                      # 무선 (USB 1회 연결 후 분리 가능)
scrcpy --tcpip=192.168.0.123:5555   # IP 직접 지정 (tcpip 모드 활성 후)

# 무선에서는 기기의 화면 꺼짐 타임아웃을 일시적으로 키운다 (scrcpy 종료 시 원래 값으로 자동 복원, scrcpy 2.7+)
scrcpy --screen-off-timeout=86400 --tcpip    # 24시간
```

### 6.2 자주 쓰는 옵션

```sh
scrcpy --max-size 1280              # 해상도 제한 (성능/지연 개선)
scrcpy --max-fps 30                 # FPS 제한
scrcpy --video-bit-rate 2M          # 비트레이트 낮춤 (무선 약할 때)
```

### 6.3 기기 IP 확인

```sh
adb shell ip route | awk '{print $9}'        # USB 연결 시 기기 IP 출력
```

### 6.4 무선 모드 종료 / USB 모드 복귀

```sh
adb usb
```

---

## 7. 초기 셋업 / 새 머신 구성

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

## 8. 환경변수 (Windows)

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
