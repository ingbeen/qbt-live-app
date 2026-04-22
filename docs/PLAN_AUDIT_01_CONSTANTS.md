# PLAN_AUDIT_01 — 상수화 수정 + 감사 항목 정리

> **작성일**: 2026-04-22
> **기반 리포**: [AUDIT_APP.md](AUDIT_APP.md)
> **범위**: 상수 추가/사용 3건 + 재검증 결과 철회 3건 반영
> **원칙**: 코드 동작 변경 없음 (순수 리팩토링). 모든 변경은 기존 로직과 동등.
> **완료 후**: 커밋 대기 → PLAN_AUDIT_02 진행

---

## 수정 항목

### 1. [High] `CASH_DIFF_THRESHOLD_USD` 상수 사용
AUDIT_APP §3.1

- **파일**: [src/components/ModelCompareCard.tsx:30](../src/components/ModelCompareCard.tsx#L30)
- **현재**: `const cashDiffColor = Math.abs(cashDiff) >= 1 ? COLORS.yellow : COLORS.sub;`
- **수정 후**: `const cashDiffColor = Math.abs(cashDiff) >= CASH_DIFF_THRESHOLD_USD ? COLORS.yellow : COLORS.sub;`
- **import 추가**: `import { ASSETS, CASH_DIFF_THRESHOLD_USD, SYMBOLS } from '../utils/constants';`
- **검증**: 현재 상수 값이 `1` 이므로 동작 완전 동일.

### 2. [Mid] `MS_PER_DAY` 상수 신설
AUDIT_APP §3.2

- **신규**: [src/utils/constants.ts](../src/utils/constants.ts) 에 `export const MS_PER_DAY = 86_400_000;` 추가
  - 위치: `RTDB_TIMEOUT_MS` 근처 "네트워크 / 타임아웃" 섹션 하단 또는 새 섹션 "시간" 으로 분리 — **"시간 / 날짜" 섹션 신설** 로 진행
- **파일**: [src/components/UpdateStatusBadge.tsx:17](../src/components/UpdateStatusBadge.tsx#L17)
- **현재**: `return Math.floor((b - a) / 86_400_000);`
- **수정 후**: `return Math.floor((b - a) / MS_PER_DAY);`
- **import 추가**: `import { MS_PER_DAY, STALE_WARNING_DAYS } from '../utils/constants';`
- **검증**: literal 동일.

### 3. [Mid] `COLOR_PRESETS.modalOverlay` 추가
AUDIT_APP §3.3

- **신규**: [src/utils/colors.ts](../src/utils/colors.ts) `COLOR_PRESETS` 에 `modalOverlay: 'rgba(0, 0, 0, 0.75)'` 추가
  - 사유 주석: `// SyncDialog 등 모달 배경 오버레이. withAlpha 는 hex 전제라 rgba 문자열로 별도 정의.`
- **파일**: [src/components/SyncDialog.tsx:98](../src/components/SyncDialog.tsx#L98)
- **현재**: `backgroundColor: 'rgba(0, 0, 0, 0.75)',`
- **수정 후**: `backgroundColor: COLOR_PRESETS.modalOverlay,`
- **import 확인**: SyncDialog 는 이미 `COLOR_PRESETS` import 중. 추가 작업 없음.
- **검증**: 문자열 동일.

### 4. AUDIT_APP.md 재검증 결과 반영
- **철회 3건** (§3.6 chartHtml 색상 / §2.2 Toast onClose / §2.3 AppState) 을 AUDIT_APP.md 에서 삭제
- **서버 확인 대기 3건** (§2.1 / §7.1 / §7.2) 은 상단 주석으로 "서버 확인 후 별도 처리" 명시
- 요약 표, 조치 우선순위 제안 섹션의 숫자 재계산

---

## 실행 순서

1. [src/utils/constants.ts](../src/utils/constants.ts) 에 `MS_PER_DAY` 추가 (신규 섹션)
2. [src/utils/colors.ts](../src/utils/colors.ts) 에 `modalOverlay` 프리셋 추가
3. [src/components/ModelCompareCard.tsx](../src/components/ModelCompareCard.tsx) import + 비교식 수정
4. [src/components/UpdateStatusBadge.tsx](../src/components/UpdateStatusBadge.tsx) import + 나눗셈 수정
5. [src/components/SyncDialog.tsx](../src/components/SyncDialog.tsx) 오버레이 교체
6. [AUDIT_APP.md](AUDIT_APP.md) 내용 업데이트 (철회 / 서버 대기 반영)

---

## 검증

모든 수정이 **literal → 상수 치환** 이므로 런타임 동작은 완전 동일. 타입 체크는 TypeScript strict 모드 기준 자동 검증됨. 수동 실행 불요.

---

## 완료 후 출력

커밋 메시지 제안:
```
refactor: 상수화 보강 + AUDIT 항목 정리 (PLAN_AUDIT_01)

- CASH_DIFF_THRESHOLD_USD, MS_PER_DAY, COLOR_PRESETS.modalOverlay 상수 사용
- ModelCompareCard / UpdateStatusBadge / SyncDialog 에서 literal 제거
- AUDIT_APP.md: 재검증으로 무효화된 3건 삭제 + 서버 확인 대기 3건 표시
```

---

**계획 끝**
