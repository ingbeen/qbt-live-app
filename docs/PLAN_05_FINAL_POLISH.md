# PLAN_05 — FINAL POLISH (누락 / 유보 정리)

> **목적**: PLAN_01~04 에서 헬퍼만 추가하고 치환되지 않은 항목 + 문서 내 유보 표현을 일괄 정리한다.
> **관련 감사 항목**: §3.5 (CHART_LIB_VERSION), §3.9 (COLOR_PRESETS), §7.6 (readOnce semantics), §9 (유보/계획 표현)
> **주의**: §2.8 Toast rearm 은 🟢 Minor 로 결정되어 **현재 상태 유지**.

---

## 범위

### A. `CHART_LIB_VERSION` 실제 적용 (Q-B)

`src/utils/chartHtml.ts:11` 의 `lightweight-charts@4.2.0` 하드코딩을 상수 참조로 치환.

- `generateChartHtml` 이 문자열 템플릿 리터럴 이므로 `${CHART_LIB_VERSION}` 직접 삽입 가능
- import 추가: `import { CHART_LIB_VERSION } from './constants';`

### B. `COLOR_PRESETS` / `withAlpha` 전체 치환 (Q-C)

기존 `COLORS.x + 'NN'` 패턴을 찾아 `COLOR_PRESETS` 프리셋 또는 `withAlpha(color, 'NN')` 헬퍼로 교체.

대상 파일:
- `src/components/ReminderBlock.tsx` — `COLORS.orange + '22'`, `+ '70'`
- `src/components/SyncDialog.tsx` — `COLORS.orange + '22'`, `+ '70'`
- `src/components/Badge.tsx` — `color + '22'` (동적 prop)
- `src/components/FillForm.tsx` — `COLORS.accent + '22'`, `+ '1e'`, `+ '55'`, `COLORS.green + '22'`, `COLORS.red + '22'`
- `src/components/AdjustForm.tsx` — `COLORS.accent + '22'`
- `src/components/HistoryList.tsx` — `COLORS.accent + '22'`
- `src/components/SignalNextFillBlock.tsx` — `COLORS.accent + '1e'`, `+ '55'`
- `src/screens/SettingsScreen.tsx` — `COLORS.red + '11'`
- `src/screens/TradeScreen.tsx` — `COLORS.accent + '22'`
- `src/components/AssetSelector.tsx` / `ChartTypeToggle.tsx` — 있으면 함께

판단 기준:
- **프리셋에 해당 색상이 있으면** → `COLOR_PRESETS.xxx`
- **동적 prop 으로 받는 color 에 alpha 적용** (Badge 등) → `withAlpha(color, 'NN')`

### C. `readOnce` JSDoc 추가 (Q-D)

`src/services/rtdb.ts::readOnce` 에 주석 추가:

```ts
/**
 * RTDB 경로에서 단발성 읽기. 경로가 존재하지 않거나 값이 null 인 경우 모두 null 리턴.
 * 빈 배열 / 기본값 폴백이 필요한 호출부는 결과에 `?? []` 로 처리한다 (RTDB 는 빈 배열을 저장하지 않음).
 */
```

### D. CLAUDE.md 유보 표현 정리 (Q-E)

| # | 섹션 | 현재 | 변경 |
|---|---|---|---|
| 1 | §8.3 | `현재 상대경로 사용. alias 는 필요 시 도입.` | `상대경로 사용.` |
| 2 | §9.2 | `별도 Error Boundary 없음. 필요 시 검토.` | `별도 Error Boundary 없음. RN 기본 처리에 맡긴다.` |
| 3 | §10.1 | `**날짜**: moment.js, date-fns (내장 Date + 유틸 함수 사용. 실제 필요 발생 시 별도 검토)` | `**날짜**: moment.js, date-fns (내장 Date + \`src/utils/format.ts\` / \`parse.ts\` 로 충분)` |
| 4 | §14 | `향후 도입 시 후보: **Jest + React Native Testing Library**, Firebase mock, 순수 함수 우선 (\`format.ts\`, \`validation.ts\`, \`chart.ts::mergeChartSeries\`).` | 이 줄 삭제. 앞 두 줄 ("단위 테스트 파일 없음", "기능 단위 작업 완료마다 ...") 만 유지. |
| 5 | §17.3 | `순환 의존 감지 시 즉시 리팩토링. \`madge\` 같은 도구는 필요 시 도입.` | `순환 의존 감지 시 즉시 리팩토링.` |

---

## 작업 순서

1. (A) `chartHtml.ts` CHART_LIB_VERSION 적용
2. (C) `rtdb.ts::readOnce` JSDoc
3. (D) CLAUDE.md 유보 표현 5곳 정리
4. (B) 색상 프리셋/헬퍼 치환 (가장 넓은 범위 — 마지막)
5. lint / tsc 검증
6. 커밋

---

## 검증 절차

1. `npm run lint` — 에러 0
2. `npx tsc --noEmit` — 통과
3. `git diff --stat` 으로 변경 파일 범위 확인

---

## 커밋 메시지 (예정)

```
polish: PLAN_02 헬퍼 적용 + 유보 표현 제거 (PLAN_05)

- chartHtml.ts: 하드코딩 @4.2.0 → CHART_LIB_VERSION 참조
- 색상 alpha: COLORS.x + 'NN' 패턴 → COLOR_PRESETS / withAlpha 로 전체 치환
  (Reminder / Sync / Fill / Adjust / History / Settings / Trade 등)
- rtdb.ts::readOnce: 경로 부재 시 null 리턴 semantics JSDoc 추가
- CLAUDE.md: 유보 표현 정리
  - §8.3 "alias 는 필요 시 도입" 제거
  - §9.2 "필요 시 검토" → "RN 기본 처리에 맡긴다"
  - §10.1 날짜 라이브러리 "필요 발생 시 별도 검토" 제거
  - §14 "향후 도입 시 후보" 줄 삭제
  - §17.3 "madge 같은 도구는 필요 시 도입" 제거
```

---

**문서 끝**
