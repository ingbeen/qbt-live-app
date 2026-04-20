# `device_id` 영구화 작업 계획

> **상태**: 차후 별도 세션에서 처리 예정 (2026-04-20 기록).
> **관련 문서**: `docs/DESIGN_APP.md §10.4` (이슈 진단), `docs/PROMPT_APP.md` (Phase 7 FCM 구현).
> **목적**: `/device_tokens/` RTDB 트리에 같은 디바이스의 동일 FCM 토큰이 여러 `device_id` 키로 누적되는 현상을 해소.

---

## 1. 배경

### 1.1 발견 경위

2026-04-20 실기 테스트 중 Firebase Console 에서 `/device_tokens/` 노드를 확인한 결과, **9개 항목 중 6개가 동일 FCM 토큰을 공유** 하는 패턴을 발견. 같은 디바이스에서 앱을 여러 번 재실행하는 동안 매번 새 `device_id` UUID 가 생성되어 RTDB 에 등록된 결과.

### 1.2 직접 원인

`src/services/fcm.ts` 의 device_id 생성 로직:

```typescript
let cachedDeviceId: string | null = null;  // 메모리 전용

const getDeviceId = (): string => {
  if (!cachedDeviceId) cachedDeviceId = uuid.v4() as string;
  return cachedDeviceId;
};
```

- `cachedDeviceId` 가 **앱 프로세스 변수** 라서 종료 시 소실.
- `App.tsx` 의 user useEffect 가 앱 재시작/자동 재로그인/수동 재로그인 시점마다 `ensureFcmToken()` 호출 → 새 UUID 생성 + RTDB 등록.
- FCM 토큰 자체는 같은 디바이스에서 비교적 안정적이라 같은 토큰이 다른 device_id 키로 매번 누적.

### 1.3 정책 배경

`CLAUDE.md §12` 의 **"AsyncStorage / SQLite / mmkv 금지 — 메모리 캐시만"** 원칙을 적용한 결과 device_id 까지 휘발성이 됨. 이 정책의 본래 의도는 **RTDB 데이터(portfolio 등) 의 로컬 캐시 방지** (깜빡임 방지) 였지 device_id 같은 작은 식별자까지 휘발시키는 것은 아님 — 의도하지 않은 부작용.

### 1.4 부작용

- `/device_tokens/` 가 무한 누적될 가능성 (정리 로직 부재).
- 서버 daily run 이 device_id 기준 발송 시 같은 디바이스에 N번 중복 알림 가능 (서버 dedupe 여부 미확인).
- `fcm.ts` 코멘트의 "서버가 invalid 토큰 자동 정리" 는 **invalid 토큰만** 정리. 활성 토큰의 중복 등록은 정리 대상 아님.

---

## 2. 해결 옵션 비교

| 옵션 | 방법 | 라이브러리 추가 | 정책 변경 | 서버 변경 |
|---|---|---|---|---|
| **A** | AsyncStorage 도입, device_id 영구화 | `@react-native-async-storage/async-storage` 1개 | `CLAUDE.md §12` 예외 명시 (식별자 1개) | 없음 |
| **B** | `react-native-device-info` 도입, `getUniqueId()` 사용 | `react-native-device-info` 1개 | 없음 | 없음 |
| **C** | `/device_tokens/{token-hash}` 키 변경 (FCM 토큰 SHA256 해시) | 해시 라이브러리 1개 | 없음 | **RTDB 스키마 변경 → 서버 협조 필수** |
| **D** | 클라이언트 무변경 + 서버 daily run 에서 token 기준 dedupe | 없음 | 없음 | 서버 daily run 로직 추가 |

---

## 3. 권장안 — 옵션 A

### 3.1 근거

1. **정책 의도와의 정합성**: `CLAUDE.md §12` 의 본래 의도(RTDB 데이터 캐시 방지) 와 device_id 식별자 1개 저장은 본질적으로 다른 카테고리. 예외 명시로 정합성 유지 가능.
2. **변경 범위 최소**: 라이브러리 1개 + `getDeviceId()` async 화 + 정책 문서 한 줄 수정. 서버 변경 불필요.
3. **사용자 경험**: 앱 재시작 후 동일 device_id 유지 → RTDB 누적 즉시 해소.
4. **타 옵션 대비**:
   - 옵션 B (device-info) 는 라이브러리가 무겁고(여러 디바이스 정보 모두 포함) device_id 만을 위해 도입은 과함.
   - 옵션 C (토큰 해시 키) 는 서버 협조 필요. RTDB 스키마 변경은 영향 범위 큼.
   - 옵션 D (서버 dedupe) 는 클라이언트 누적은 계속 발생 후 사후 정리. 근본 해결 아님.

### 3.2 구현 단계

#### 3.2.1 라이브러리 추가
```bash
npm install @react-native-async-storage/async-storage
```
- `CLAUDE.md §10.2` 라이브러리 추가 절차에 따라 사용자 승인 필수.
- Context7 또는 npm view 로 RN 0.85 호환 최신 버전 확인 후 진행.
- 네이티브 모듈이므로 설치 후 Gradle 리빌드 필요 (`npm run android`).

#### 3.2.2 `CLAUDE.md §12` 정책 예외 명시
- "AsyncStorage / SQLite / mmkv 금지" 옆에 다음 예외 추가:
  > **예외**: `device_id` 식별자(UUID 1개) 의 영구 저장 목적의 `AsyncStorage` 사용은 허용. 본 정책의 의도는 RTDB 데이터(portfolio 등) 의 로컬 캐시 방지이며 식별자 1개 저장은 그 의도 밖.

#### 3.2.3 `src/services/fcm.ts` 수정

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

const DEVICE_ID_KEY = 'qbt_device_id';

const getDeviceId = async (): Promise<string> => {
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;
  const fresh = uuid.v4() as string;
  await AsyncStorage.setItem(DEVICE_ID_KEY, fresh);
  return fresh;
};
```

- `ensureFcmToken` 에서 `await getDeviceId()` 로 호출.
- 기존 메모리 캐시(`let cachedDeviceId`) 는 옵션 (AsyncStorage 호출이 매번 disk I/O 라 한 번만 읽고 캐시하면 효율적). 단순성을 위해 메모리 캐시 유지 + AsyncStorage 는 미스 시에만 fallback 도 가능.

#### 3.2.4 Firebase Console 정리
- 기존 누적된 `/device_tokens/` 항목 일괄 삭제 (콘솔에서 노드 통째로 삭제).
- 새 빌드 설치 후 1개의 device_id 만 등록되는지 확인.

#### 3.2.5 검증
- 앱 첫 실행 → `/device_tokens/{uuid}` 1개 등록 확인.
- 앱 종료 후 재실행 → 같은 uuid 키 유지 확인 (새 항목 추가 없음).
- 앱 데이터 삭제 (`adb shell pm clear com.ingbeen.qbtlive`) 후 재실행 → 새 uuid 1개 등록 확인.
- 로그인 → 로그아웃 → 재로그인 → 동일 uuid 유지 확인.

---

## 4. 작업 시작 체크리스트

- [ ] 본 문서 + `docs/DESIGN_APP.md §10.4` 재읽기
- [ ] `npm view @react-native-async-storage/async-storage version` 으로 최신 버전 확인
- [ ] 사용자 승인 (`CLAUDE.md §10.2`)
- [ ] 라이브러리 설치
- [ ] `CLAUDE.md §12` 예외 추가 (별도 커밋 권장)
- [ ] `fcm.ts` 수정
- [ ] `tsc --noEmit` EXIT=0
- [ ] Firebase Console 기존 `/device_tokens/` 누적 데이터 일괄 삭제
- [ ] 재빌드 + 위 §3.2.5 검증
- [ ] `docs/DESIGN_APP.md §10.4` 의 "차후 처리 예정" 표기 제거 + 해결 완료 기록
- [ ] 본 문서 archive 처리 (`docs/archived/` 또는 삭제)

---

## 5. 작업 분리 이유

본 작업을 메인 Phase 흐름에서 분리한 이유:

- 본질적으로 **MVP 출시 후 안정화 작업** 성격 (사용자 영향 즉각적이지 않음, 서버가 dedupe 한다면 기능적 문제 없음).
- 라이브러리 추가 + 정책 문서 수정 + RTDB 데이터 정리 등 여러 영역 동시 변경 → 별도 커밋/세션이 깔끔.
- 옵션 결정에 사용자 의사 확인 필요 (옵션 A vs D).
