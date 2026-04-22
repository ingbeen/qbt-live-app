# PLAN_01 — CLEANUP (정리 작업)

> **목적**: `CLAUDE.md §0` "Android 전용" 원칙과 실제 리포 상태를 일치시킨다. 미사용 코드와 테스트 잔존물도 함께 제거한다.
> **관련 감사 항목**: §5.1, §5.2, §2.5, §6.6, §6.7, §7.4
> **원칙**: 삭제는 되돌릴 수 있어야 한다 — 이 작업은 `git log` / 브랜치에서 언제든 복원 가능.

---

## 범위

### A. iOS 관련 파일 / 설정 제거

1. **[삭제] `ios/` 폴더 전체** — `ios/QbtLiveApp/`, `ios/Podfile` 등 모든 하위 파일
2. **[삭제] `Gemfile`** — CocoaPods 전용 (iOS 제거 시 불필요)
3. **[수정] `package.json`**
   - `scripts` 에서 `"ios": "react-native run-ios"` 제거
   - `devDependencies` 에서 `@react-native-community/cli-platform-ios` 제거
4. **[수정] `.gitignore`**
   - "iOS (MVP 에서 사용 안 하지만 템플릿 정리)" 섹션 전체 제거
   - `ios/GoogleService-Info.plist` 항목 제거
5. **[수정] `src/components/FillForm.tsx:289`**
   - `display={Platform.OS === 'ios' ? 'inline' : 'default'}` → `display="default"`
6. **[수정] `src/components/AdjustForm.tsx:242`**
   - 위와 동일
7. **[수정] 두 파일의 `import`**
   - `react-native` 에서 `Platform` 제거 (다른 곳에서 안 쓰이면)

### B. 테스트 파일 / 의존성 제거

1. **[삭제] `__tests__/App.test.tsx`**
2. **[삭제] `__tests__/` 폴더** (비어 있으면)
3. **[수정] `package.json`**
   - `scripts` 에서 `"test": "jest"` 제거
   - `devDependencies` 에서 Jest 관련 제거:
     - `@types/jest`
     - `@types/react-test-renderer`
     - `@react-native/jest-preset`
     - `jest`
     - `react-test-renderer`
4. **[확인] Jest 설정 유무** — `jest.config.js` 존재 시 삭제, `package.json` 내 `"jest"` 필드 존재 시 제거

### C. 미사용 코드 제거

1. **[수정] `src/services/rtdb.ts:148-149`**
   - `readDeviceToken` 함수 삭제 (export 되어 있으나 호출처 0건)
2. **[수정] `App.tsx:65-66`**
   - `st.refreshHome().catch((e) => console.error(...))` 를 `st.refreshHome()` 로 단순화
   - 이유: `refreshHome` 은 내부적으로 try/catch 를 가지며 throw 하지 않음. `.catch` 는 절대 실행되지 않는 죽은 코드.

---

## 검증 절차

1. `npm install` — devDependency 제거가 `package-lock.json` 에 반영되는지 확인
2. `npm run lint` — ESLint 통과
3. `npm start` — Metro 번들러 정상 기동
4. `git status` — 예상한 삭제/수정만 스테이징됐는지 확인
5. 앱 기동 가능성 (수동) — 에뮬레이터/기기에서 체결/보정 폼이 정상 동작 (DateTimePicker 변경 영향)

---

## 커밋 메시지 (예정)

```
cleanup: iOS 잔존물 / 테스트 파일 / 미사용 코드 제거

- ios/ 폴더, Gemfile, cli-platform-ios 의존성 제거
- __tests__/ 및 Jest 관련 의존성 제거
- readDeviceToken (미사용), App.tsx refreshHome.catch (dead code) 제거
- FillForm / AdjustForm 의 Platform.OS iOS 분기 단순화
- .gitignore 의 iOS 섹션 제거
```

---

**문서 끝**
