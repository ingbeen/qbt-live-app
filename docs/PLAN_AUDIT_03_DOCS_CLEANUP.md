# PLAN_AUDIT_03 — 문서 버전 하드코딩 정리

> **작성일**: 2026-04-22
> **기반 리포**: [AUDIT_APP.md](AUDIT_APP.md) §8.1, §8.2, §8.3, §8.4 + 재검증 추가 발견 3건
> **범위**: `README.md`, `CLAUDE.md` 의 구체 버전 숫자를 SoT (`package.json` / `android/build.gradle`) 참조로 전환
> **원칙**: 문서의 의미는 유지, 드리프트 유발 구체 수치만 제거
> **완료 후**: 커밋 대기 → 전체 감사 작업 종료 (서버 답변 대기 3건은 별도 처리)

---

## 수정 항목 (총 7건)

### A. README.md (5건)

#### A.1 [Mid] 라인 6 — React Native 버전
- **전**: `- **프레임워크**: React Native 0.85.1 CLI (Expo 아님)`
- **후**: `- **프레임워크**: React Native CLI (정확 핀, Expo 아님). 버전은 `package.json` 참조`

#### A.2 [Mid] 라인 7 — TypeScript 버전
- **전**: `- **언어**: TypeScript 5.8.x`
- **후**: `- **언어**: TypeScript (버전은 `package.json` 참조)`

#### A.3 [Mid] 라인 16 — Node 버전
- **전**: `- **Node**: ≥ 22.11 (동작 확인: 22.22.2)`
- **후**: `- **Node**: `package.json` 의 `engines` 참조`

#### A.4 [Mid] 라인 17 — JDK (유지 결정)
- **현재**: `- **JDK**: Temurin 17`
- **판단**: JDK 는 LTS 3년 주기의 장기 버전. `android/build.gradle` 의 `sourceCompatibility` / `targetCompatibility` 가 SoT 이나, README 셋업 가이드에서 "어떤 JDK 를 설치해야 하는가" 를 바로 알려주는 의미가 큼.
- **결정**: **유지**. 드리프트 위험이 낮고 초기 셋업자 편의가 더 중요.

#### A.5 [Mid] 라인 18 — Android SDK
- **전**: `- **Android SDK**: compileSdk 36 / targetSdk 36 / minSdk 24`
- **후**: `- **Android SDK**: `android/build.gradle` 참조`

---

### B. CLAUDE.md (3건)

#### B.1 [Low] 라인 24 — Node 버전 괄호
- **전**: `- **Node**: `package.json engines` 참조 (22.11 이상)`
- **후**: `- **Node**: `package.json` 의 `engines` 참조`

#### B.2 [Mid] 라인 647 — RN / React 정확 버전 예시
- **전**: `- **`react-native` 와 `react` 는 정확한 버전 고정** (`^` 금지). 각각 `0.85.1`, `19.2.3`.`
- **후**: `- **`react-native` 와 `react` 는 정확한 버전 고정** (`^` 금지). 현재 고정된 버전은 `package.json` 참조.`

#### B.3 [Mid] 라인 648 — `@react-native/*` 버전
- **전**: `- `@react-native/*` 모노레포 패키지들 (preset, config 등) 도 `0.85.1` 로 고정. RN 업그레이드 시 함께 움직임.`
- **후**: `- `@react-native/*` 모노레포 패키지들 (preset, config 등) 도 `react-native` 와 동일한 정확 버전으로 고정. RN 업그레이드 시 함께 움직임.`

---

## 유지 항목 (변경 금지 — 참고)

다음 문구들은 "현재 버전" 이 아니라 **규칙/제약/예시** 이므로 그대로 둔다.

| 위치 | 내용 | 유지 사유 |
|---|---|---|
| CLAUDE.md:23 | "RN 0.82+ 강제" | 최소 버전 제약 (규칙). 현재 버전이 아니라 "이 버전 이상이면 이 규칙 적용" 의 경계값 |
| README.md:8 | "RN 0.82+ 강제, 비활성 불가" | 동일 — 규칙 경계값 |
| CLAUDE.md:650 | "(예: 0.85 → 0.86)" | "마이너 버전 업그레이드" 용어 설명의 **예시**. 사실 주장 아님 |
| README.md:19 | "Android 7.0+, API 24+" | 앱의 **최소 지원 OS** 선언. 사용자 대면 정보로서 유의미 |
| CLAUDE.md:25 / README.md:17 | "Temurin 17" | LTS 장기 버전. 셋업 가이드 편의 |

---

## 실행 순서

1. [README.md](../README.md) 5곳 수정 (라인 6, 7, 16, 18)
2. [CLAUDE.md](../CLAUDE.md) 3곳 수정 (라인 24, 647, 648)
3. [AUDIT_APP.md](AUDIT_APP.md) §8 전체 ✅ 완료로 마크업 + 추가 3건 내역 반영
4. PLAN_AUDIT_03 완료 선언 섹션 추가 (이 PLAN 만 해당)

---

## 검증

- 모든 변경은 **의미 동일, 구체 수치만 제거**
- 각 수정 후 문장이 자연스럽게 읽히는지 확인
- 링크/코드 블록/백틱 포매팅 유지

---

## 완료 후 커밋 메시지 제안

```
docs: 버전 하드코딩 정리 (PLAN_AUDIT_03)

- README.md: RN / TypeScript / Node / Android SDK 구체 숫자 제거 → package.json / build.gradle 참조
- CLAUDE.md: Node 괄호 제거, RN/React/@react-native 버전 예시 제거
- AUDIT_APP.md: §8 전체 완료 마크, 재검증 추가 발견 3건 반영
- 규칙 경계값(RN 0.82+, Android 7.0+) 및 JDK LTS 는 유지
```

---

**계획 끝**
