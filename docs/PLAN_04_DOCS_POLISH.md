# PLAN_04 — DOCS POLISH (문서 / 주석 마감)

> **목적**: CLAUDE.md 에 인라인된 자주 변경될 수치/리스트를 축약하고, "MVP" 같은 개발 단계 표현을 현재 기준 중립 표현으로 교체한다. 주석의 § 참조 오류도 일괄 수정.
> **관련 감사 항목**: §7.1, §7.2, §7.3, §7.5, §7.7, §7.8, §7.9, §7.10, §7.11, §8, §9, §3.2, §3.11

---

## 범위

### A. `docs/DESIGN_QBT_LIVE_FINAL.md` — `processed` 필드 정책 예외 추가 (Q1 사용자 결정: B)

§8.3 맨 아래 "`processed` 필드 규칙" 문단을 다음으로 확장:

```
**`processed` 필드 규칙**: /fills/inbox/{uuid} / /balance_adjust/inbox/{uuid} /
/fill_dismiss/inbox/{uuid} / /model_sync/inbox/{uuid} 의 `processed` 필드는
daily runner 만 "쓴다". 앱은 이 필드를 "쓰지 않는다". 읽기는 허용하며, 앱은
"미처리 inbox 레코드" 를 필터링할 때 `processed !== true` 조건을 사용한다
(ReminderBlock 에서 사용자가 이미 입력한 체결/스킵을 리마인더에서 숨기는 용도).
체결 / 보정 반영 상태는 /latest/portfolio 의 변화나 /latest/pending_orders 의
소멸로도 확인 가능하며, 두 경로를 보조적으로 병용한다.
```

> 사용자가 서버쪽 설계서로 옮기겠다고 명시했으나, 앱 프로젝트 내 복사본도 일관성을 위해 동일하게 수정.

### B. `CLAUDE.md` — 섹션별 정리

#### §0 개요
- Node 버전 마이너 패치 제거: "Node: 22.22.2 (최소 22.11)" → "Node: `package.json engines` 참조 (22.11 이상)"
- 라이브러리 버전 제거: "Firebase v24", "TradingView Lightweight Charts (CDN @4.2.0)" 등 버전 숫자 삭제, 이름만 열거
- "주 터미널: Git Bash (VSCode 통합 터미널)" 줄 제거 → `docs/COMMANDS.md` 로 이동

#### §3.1 (컴포넌트 선언)
- "default export 금지 (단, App.tsx + screens 파일은 default export 허용)" → 현재 실제로 screens 가 named export 를 쓰므로 "screens/App.tsx 도 named export 사용" 으로 명확화

#### §5.3 (UI 텍스트 언어)
- "허용 기호 화이트리스트는 `src/utils/constants.ts::SYMBOLS` 를 사용한다. 기호 리스트는 해당 상수를 SoT 로 한다." 로 축약 (리스트 반복 제거)

#### §6.3 (RTDB 쓰기)
- "앱이 쓸 수 있는 경로는 `src/utils/constants.ts::RTDB_PATHS` 의 5개" 로 축약

#### §7.4 (차트 버전 고정)
- "버전은 `src/utils/constants.ts::CHART_LIB_VERSION` 참조" 로 축약

#### §8.3 (경로 alias)
- "MVP 에서는 alias 없이 상대경로 사용 (단순성 우선)" → "현재 상대경로 사용. alias 는 필요 시 도입."

#### §9.2 (에러 경계)
- "MVP: 별도 Error Boundary 구현 안 함" → "별도 Error Boundary 없음. 필요 시 검토."

#### §10.1 (추가 금지 라이브러리)
- 구체 리스트는 유지 (현재 규칙으로 의미 있음), "MVP 범위" 같은 표현만 제거

#### §10.3 (버전 고정)
- 정확 고정 대상 긴 리스트를 축약 — 원칙 서술 위주로. 구체 대상은 "`package.json` 의 `^` 없는 항목들을 참고" 로 치환

#### §13.1 (Android 빌드)
- `minSdkVersion 24`, `targetSdkVersion 36`, `compileSdkVersion 36` → "SDK 버전은 `android/build.gradle` 참조" 로 축약

#### §13.3 (환경변수)
- "MVP: 환경변수 사용 없음" → "환경변수 사용 없음"
- `constants.ts` 전체 예시 블록 → 핵심 상수 이름 몇 개만 남기고 "상세는 `src/utils/constants.ts` 참조" 로 축약

#### §14.1 (테스트 규칙)
- "MVP 정책" 단락 삭제 → "단위 테스트 파일 없음. 사용자 검증 중심 (에뮬레이터/기기에서 의미 단위 확인)."

#### §12 (금지 사항 표)
- "iOS 지원" 행 — 프로젝트가 Android 전용임은 유지하되 "현재 범위" 같은 애매한 표현 없이 정제
- 다른 행은 유지

### C. 코드 주석의 § 참조 오류 수정

| 파일:라인 | 현재 | 수정 |
|---|---|---|
| `App.tsx:24` | `§15` | 삭제 (탭 이름과 무관한 참조) |
| `src/store/useStore.ts:167` | `§12.4` | `§6.6 네트워크/오프라인 차단` |
| `src/services/network.ts` | `§12.1` | `§6.6` |
| `src/services/fcm.ts:103` | `§10` | `§6.5` |
| `src/components/ErrorState.tsx:10` | `§12.5` | `§9 에러 처리` |
| `src/components/OfflineScreen.tsx:13` | `§12.2` | `§6.6` |
| `src/components/ChartWebView.tsx:13` | 설계서 `§14.4` | 설계서 §14 없음 → "§7.2 WebView 메시지 프로토콜" (CLAUDE.md) |

### D. `auth.ts`, `fcm.ts` 코드 주석 — 이력 표현 정리 (§9.2, §9.3, §9.4)

- `fcm.ts:97` `// MVP: 포그라운드 알림 무시(CLAUDE.md §6.5)` → `// 포그라운드 알림 무시 (CLAUDE.md §6.5)`
- `auth.ts:13-15` "signIn 내 수동 setUser 는 중복 호출을 유발하여 ... 제거" → 원리만 남김 ("onAuthStateChanged 가 user 상태 단일 진입점")
- `auth.ts:31-33` "누적되는 문제 방지" 구문 → 원리만 ("Firebase Auth 가 자동 로그인 시 같은 user 로 2회 방출되므로 필터링")

### E. `.gitignore` 예시와 CLAUDE.md §15.3 정렬

- CLAUDE.md §15.3 의 `.gitignore` 예시 블록에 `.claude/` 항목 추가 (실제와 일치시킴)
- 또는 "예시는 참고용, 실제는 리포 `.gitignore` 참조" 한 줄로 축약

### F. `format.ts::kstNow/toKstDate` JSDoc 추가 (§7.11)

```ts
/**
 * 현재 시각을 KST (UTC+9) 기준 ISO-8601 문자열로 리턴.
 * KST 는 DST 없는 고정 UTC+9 오프셋이므로 시즌 무관.
 * 예: "2026-04-22T15:30:22+09:00"
 */
export const kstNow = (): string => ...;
```

---

## 작업 순서

1. (A) 설계서 §8.3 문안 수정
2. (B) CLAUDE.md 섹션별 정리 (§0, §3.1, §5.3, §6.3, §7.4, §8.3, §9.2, §10.3, §13, §14, §12)
3. (C) 코드 주석 § 참조 수정 — 일괄 편집
4. (D) fcm.ts / auth.ts 이력 표현 정리
5. (E) CLAUDE.md §15.3 조정
6. (F) format.ts JSDoc 추가

---

## 검증 절차

1. `npm run lint` — 에러 0
2. `npx tsc --noEmit` — 타입 에러 없음
3. `git diff --stat` 으로 변경 파일 예상 범위 확인

---

## 커밋 메시지 (예정)

```
docs: CLAUDE.md / 주석 마감 + processed 필드 정책 업데이트 (PLAN_04)

- DESIGN §8.3: processed 필드를 앱도 읽기 허용하도록 문안 업데이트 (Q1: B)
- CLAUDE.md: MVP/개발단계 표현 제거, 인라인 수치/리스트 축약
  - §0: Node / 라이브러리 버전 숫자 → package.json 참조
  - §5.3: SYMBOLS 화이트리스트 → constants.ts 참조
  - §6.3 / §7.4: RTDB_PATHS / CHART_LIB_VERSION 참조
  - §13 / §14: MVP 표현 제거, 구체 수치 참조로 축약
- 코드 주석 § 참조 일괄 수정 (App.tsx, useStore, network, fcm,
  ErrorState, OfflineScreen, ChartWebView)
- auth.ts / fcm.ts: "MVP" / 과거 이력 표현 → 현재 상태 원리 설명
- format.ts: kstNow/toKstDate JSDoc 추가
```

---

**문서 끝**
