# COMMANDS.md — QBT Live 앱 명령어

> **단일 관리처**: 프로젝트 관련 모든 명령어는 본 문서에만 둔다.
> `README.md` / `CLAUDE.md` / 그 외 문서는 본 문서를 링크로만 참조한다.
> 새로운 명령어가 생기면 여기에 추가하고, 다른 문서에 같은 명령어를 복붙하지 말 것.

---

## 1. 자주 쓰는 명령어 (Quick Reference)

```sh
adb devices                                       # 연결된 기기/에뮬레이터 확인
adb logcat -s ReactNativeJS:V chromium:V          # RN 로그
npx react-native start                            # Metro 켜기
npm run android                                   # 빌드/설치 (Metro 자동 실행)
npx react-native run-android --no-packager        # 빌드/설치 (Metro 이미 켜진 경우)
adb shell pm clear com.ingbeen.qbtlive            # 앱 상태 초기화 (재설치 동등)
scrcpy                                            # 화면 미러링 (USB)
scrcpy --tcpip                                    # 화면 미러링 (무선)
scrcpy --screen-off-timeout=86400 --tcpip         # 24시간
```

상세 옵션 / 셋업은 아래 섹션 참고.

---

## 2. 기타 npm 스크립트

```sh
npm install               # 의존성 설치 (package-lock.json 기준)
npm run lint              # ESLint
```

---

## 3. 디버깅 (고급)

§1 의 RN 로그 필터로 부족할 때 사용.

### 3.1 앱 PID 로 전체 로그 필터링

```sh
adb logcat --pid=$(adb shell pidof com.ingbeen.qbtlive)
```

---

## 4. 화면 미러링 (scrcpy) 옵션

설치 (winget):

```sh
winget install --exact Genymobile.scrcpy
```

git bash 에서 호출하려면 `~/bin/scrcpy` wrapper 사용 (winget 패키지 폴더의 최신 버전 자동 탐색).

기본 명령은 §1 참고. 아래는 추가 옵션.

### 4.1 IP 직접 지정

```sh
scrcpy --tcpip=192.168.0.123:5555   # tcpip 모드 활성 후
```

### 4.2 자주 쓰는 옵션

```sh
scrcpy --max-size 1280              # 해상도 제한 (성능/지연 개선)
scrcpy --max-fps 30                 # FPS 제한
scrcpy --video-bit-rate 2M          # 비트레이트 낮춤 (무선 약할 때)
```

### 4.3 기기 IP 확인

```sh
adb shell ip route | awk '{print $9}'        # USB 연결 시 기기 IP 출력
```

### 4.4 무선 모드 종료 / USB 모드 복귀

```sh
adb usb
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
