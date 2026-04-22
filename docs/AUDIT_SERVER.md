# AUDIT_SERVER.md — 서버/설계서 확인·조치 필요 리포트

> **작성일**: 2026-04-22
> **범위**: 앱 관점에서 **서버 프로젝트** (`qbt`) 또는 **설계서 `DESIGN_QBT_LIVE_FINAL.md`** 에 확인·조치가 필요한 항목
> **이관 방식**: 본 문서는 사용자가 서버 프로젝트로 옮겨 서버 측 작업 기반으로 사용
> **관련 리포**: 앱 코드 쪽 조치 항목은 [AUDIT_APP.md](AUDIT_APP.md) 참조

---

## 요약

| 섹션 | 건수 | High | Mid | Low |
|---|---|---|---|---|
| 1. 데이터 계약 / 필드 의미 | 4 | 1 | 2 | 1 |
| 2. 런타임 동작 / 프로세스 | 3 | 1 | 2 | 0 |
| 3. 타입 스키마 정확성 | 4 | 0 | 3 | 1 |
| 4. 설계서 본문 수정 | 3 | 0 | 1 | 2 |
| **합계** | **14** | **2** | **8** | **4** |

**High 2건** 은 데이터 무결성·동기화 성격: inbox `processed` 마킹 타이밍, inbox 항목 유실 방지 계약.

---

## 1. 데이터 계약 / 필드 의미

### 1.1 [High] `processed` 필드 쓰기 타이밍과 앱 의존성
- **관련 앱 위치**: [src/services/rtdb.ts:64-69](../src/services/rtdb.ts#L64-L69) — `readInbox` 가 `processed !== true` 로 필터
- **관련 설계서**: §8.3 "daily runner 만 `processed=true` 를 쓴다"
- **현재 앱 가정**: 사용자가 체결을 입력한 후 해당 inbox 항목은 다음 daily runner 실행 시 처리되어 `processed=true` 로 마킹된다. 앱의 `ReminderBlock` 은 "`pending_orders` 에 있으나 inbox 에는 해당 자산이 없음" 조건으로 리마인더를 띄움. 따라서 inbox 가 `processed=true` 로 넘어간 다음 실행부터는 리마인더가 다시 뜰 수도 있음 (`pending_orders` 가 아직 해소되지 않았다면).
- **확인 필요**:
  1. 서버 daily runner 가 **읽고-반영-마킹** 의 순서를 보장하는지, 실패 시 항목이 re-process 되는지.
  2. `processed=true` 로 마킹된 inbox 항목은 `/history/fills/...` 로 이동 후 inbox 트리에서 삭제되는지, 남아있는지.
  3. 마킹 후에도 trie 에 남는다면 장기적으로 inbox 크기가 커짐 — 청소 정책 필요.
- **앱측 영향**: 서버가 삭제 방식이면 앱 필터 `processed !== true` 는 불필요하지만 deeper in depth 로직으로 유지(방어). 청소되지 않으면 리마인더 로직 정확성은 유지되나 성능 영향.
- **우선순위**: High

### 1.2 [High] Inbox 쓰기 후 반영 보장 (UUID 중복 / 손실)
- **관련 앱 위치**: [src/services/rtdb.ts:86-134](../src/services/rtdb.ts#L86-L134) — 모든 inbox submit 함수가 UUID `set()` 후 토스트만 표시
- **관련 앱 동작**: [src/store/useStore.ts](../src/store/useStore.ts) 의 submit 액션들이 "다음 실행에 반영됩니다" 토스트를 표시
- **현재 앱 가정**: 한 번 `set()` 이 성공하면 서버가 반드시 한 번 처리한다. UUID 중복 시 idempotent.
- **확인 필요**:
  1. daily runner 가 **모든 `processed=false` 항목을 빠짐없이** 읽어 처리하는가 (실패 시 재시도 큐나 DLQ 존재 여부).
  2. UUID 중복으로 인한 **의도치 않은 skip 방지** (앱이 버튼 중복 탭 시 같은 UUID 생성 가능성은 낮지만 타임아웃/재시도 시 이중 호출 가능).
  3. 반영 실패(예: `_dict_to_balance_adjust` 검증 실패) 시 서버가 사용자에게 알리는 경로가 있는가 — 현재 앱에는 결과 수신 채널 없음.
- **앱측 영향**: 서버가 실패 알림 채널 제공 시(예: `/latest/submission_errors/{uid}/{uuid}`) 앱이 구독해서 사용자에게 표시 가능.
- **우선순위**: High

### 1.3 [Mid] `FillPayload.reason` vs `FillHistory.reason` 의미 명확화
- **관련 앱 위치**: [src/types/rtdb.ts:116](../src/types/rtdb.ts#L116) (`FillPayload.reason?: string`), [src/types/rtdb.ts:163](../src/types/rtdb.ts#L163) (`FillHistory.reason: string`), [src/components/HistoryList.tsx:114-115](../src/components/HistoryList.tsx#L114-L115) (`"system_fill"` / `"personal_trade"` 문자열 기대)
- **관련 설계서**: §8.2.7 `reason: str (default "")`
- **현재 앱 가정**: 앱은 `reason` 을 사용자 입력 UI 없이 빈 문자열로 전송. 이후 서버 `drift.classify_fill` 이 분류하여 `FillHistory.reason` 을 `"system_fill"` 또는 `"personal_trade"` 로 저장. 앱은 이 두 값 문자열로 배지 렌더링 (§4.1 필터).
- **확인 필요**:
  1. `FillPayload.reason` 이 실제로 사용자 입력 용도인지 서버 분류용 플레이스홀더인지 — 둘 다 가능하게 열려 있는 게 의도인지.
  2. `FillHistory.reason` 의 값 목록이 정확히 `{"system_fill", "personal_trade"}` 두 가지인지. 혹시 `""` 나 다른 값이 섞일 수 있다면 앱이 "기타" 케이스를 표시해야 함.
  3. DESIGN 본문에 이 두 값을 **명시적 enum 문서화** 필요.
- **앱측 영향**: enum 확정 후 `src/types/rtdb.ts` 에 `FillReason = 'system_fill' | 'personal_trade' | ''` 같은 literal union 도입.
- **우선순위**: Mid

### 1.4 [Low] `BalanceAdjustPayload.reason` 서버 필수 여부
- **관련 앱 위치**: [src/types/rtdb.ts:129](../src/types/rtdb.ts#L129) (`reason: string` — 필수), [src/components/AdjustForm.tsx](../src/components/AdjustForm.tsx) (UI 상 선택, 빈 문자열 시 `'수동 보정'` 기본값 전송)
- **관련 설계서**: §8.2.8 표에서 "권장(Recommended)" 으로 표기
- **현재 앱 가정**: 앱이 항상 기본값을 채워 보내므로 서버는 항상 비공백 문자열 수신.
- **확인 필요**: 서버 2단계 검증(§8.2.8.1) 이 `reason` 공백을 reject 하는지. reject 한다면 앱 측 기본값 전략은 안전.
- **앱측 영향**: 서버가 reject 정책이면 앱이 기본값 없이 빈 문자열 전송 시도 테스트로 검증 필요.
- **우선순위**: Low

---

## 2. 런타임 동작 / 프로세스

### 2.1 [High] `execution_date` 시간대 불일치 가능성
- **관련 앱 위치**: [src/components/UpdateStatusBadge.tsx:20-25](../src/components/UpdateStatusBadge.tsx#L20), [src/utils/format.ts:74](../src/utils/format.ts#L74) — 앱이 `today()` 를 **KST** 기준으로 생성하여 `execution_date` 와 비교
- **관련 설계서**: "GitHub Actions 에서 ET 17:27 실행"
- **현재 앱 가정**: `/latest/portfolio.execution_date` 는 미국 시장 마감 후의 **거래일** (예: `2026-04-21`) 을 담는다.
- **확인 필요**:
  1. 서버가 `execution_date` 를 ET / UTC / KST 중 **어느 기준 날짜** 로 쓰는가.
  2. 한국 시간 기준 아침 (ET 저녁 실행 직후) 에 앱을 켰을 때, `today()` (KST) 와 `execution_date` 차이가 0 이어야 하는가 1 이어야 하는가.
  3. DESIGN 본문에 "`execution_date` 는 장 마감 **미국 거래일** 기준" 같은 명시적 정의 필요.
- **앱측 영향**: `STALE_WARNING_DAYS = 4` 임계값이 의미 있으려면 기준이 일치해야 함. 차이가 항상 1 이상으로 나오면 badge 색상 오판.
- **우선순위**: High (현재 `STALE_WARNING_DAYS = 4` 여유로 가려져 있을 뿐 임계값에 가까운 날에 오류 발생 가능)

### 2.2 [Mid] `pending_fill_reminders` 카운트의 출처
- **관련 설계서**: §6.2 "미입력 체결 리마인더: N 건" 알림 본문
- **관련 앱 위치**: [src/components/ReminderBlock.tsx:30-36](../src/components/ReminderBlock.tsx#L30-L36) — 앱이 `pendingOrders` + `inboxFills` + `inboxFillDismiss` 로 **런타임 계산**
- **현재 상태**: 서버 측 일일 리포트의 "N 건" 숫자와 앱 화면의 리마인더 표시가 **독립 계산** 될 가능성. 불일치 가능.
- **확인 필요**:
  1. 서버 일일 리포트의 N 이 어떤 기준으로 계산되는가 (`pending_orders` - inbox? 또는 별도 저장 필드?).
  2. RTDB 에 `/latest/portfolio.pending_fill_reminder_count` 같은 필드를 추가해 단일 진실 원천 제공하면 앱 로직 단순화 가능.
- **앱측 영향**: 필드 추가 시 `src/types/rtdb.ts::Portfolio` 에 필드 추가 및 ReminderBlock 카운트 표시 단순화.
- **우선순위**: Mid

### 2.3 [Mid] RTDB Rules 와 `OWNER_UID` 검증
- **관련 앱 위치**: [src/utils/constants.ts:3](../src/utils/constants.ts#L3) (`OWNER_UID` 상수), [CLAUDE.md §11.3](../CLAUDE.md) — "참고용 상수, 판정은 Rules 가"
- **관련 설계서**: 현재 DESIGN_QBT_LIVE_FINAL.md 에서 RTDB Rules 명시적 섹션 부재 (추정).
- **확인 필요**:
  1. 현재 RTDB Rules 가 `auth.uid === OWNER_UID` 체크를 하는지, 아니면 `auth != null` 만 체크하는지.
  2. 앱 쓰기 허용 경로(`/fills/inbox/*`, `/balance_adjust/inbox/*`, `/fill_dismiss/inbox/*`, `/model_sync/inbox/*`, `/device_tokens/*`) 와 실제 Rules 가 일치하는지.
  3. 특히 `/device_tokens/{deviceId}` 는 앱이 직접 쓰지만 다른 사용자 deviceId 는 덮어쓰면 안 됨 → Rules 로 보호.
- **앱측 영향**: 권한 거부 에러 메시지 ([src/store/useStore.ts](../src/store/useStore.ts)) 의 "RTDB 접근 권한이 없습니다" 문구가 적절히 triggered.
- **우선순위**: Mid

---

## 3. 타입 스키마 정확성

### 3.1 [Mid] `ChartMeta.ma_window` 필수성
- **관련 앱 위치**: [src/types/rtdb.ts:69-75](../src/types/rtdb.ts#L69-L75) — 단일 `ChartMeta` 에서 `ma_window?: number`
- **관련 설계서**: §8.2.5.1 price chart meta 에서 `ma_window: int` 필수
- **확인 필요**: 서버가 `/charts/prices/{assetId}/meta` 에 **항상** `ma_window` 를 포함하는지 확인. 포함한다면 DESIGN 대로 앱 타입을 분리하여 price 필수 / equity 미포함으로.
- **앱측 영향**: [AUDIT_APP.md §7.1](AUDIT_APP.md) 의 인터페이스 분리 작업과 연동.
- **우선순위**: Mid

### 3.2 [Mid] `portfolio.assets` 누락 자산 처리 계약
- **관련 앱 위치**: [src/types/rtdb.ts:33](../src/types/rtdb.ts#L33) (`assets: Record<AssetId, AssetSnapshot>`), [src/components/AssetSummaryCard.tsx:60](../src/components/AssetSummaryCard.tsx#L60)
- **확인 필요**: 서버가 4자산(sso/qld/gld/tlt) 을 **항상 모두 채워서** 저장하는지. RTDB 가 빈 필드 저장을 안 하므로, 자산이 전부 0주 · 미보유일 때도 키가 남는지.
- **앱측 영향**: 서버가 항상 4개 보장 → 현 타입 유지. 일부 누락 가능 → 앱 타입을 `Partial<Record<...>>` 로 바꾸고 UI 가드 추가. [AUDIT_APP.md §2.1](AUDIT_APP.md) 참조.
- **우선순위**: Mid

### 3.3 [Mid] 차트 시리즈의 빈 배열 처리
- **관련 앱 위치**: [src/services/rtdb.ts:36-42](../src/services/rtdb.ts#L36-L42) — `readOnce` 는 null 리턴, 호출부가 `?? []` 적용
- **관련 설계서**: "Firebase RTDB 는 빈 배열 `[]` 을 저장하지 않는다"
- **확인 필요**:
  1. `PriceChartSeries.buy_signals` / `sell_signals` / `user_buys` / `user_sells` 가 비어있을 때 **키 자체가 부재** 하는지, `null` 값인지.
  2. 비어있을 때 앱은 `?? []` 로 처리하는데(§4.1 chart.ts), 서버가 명시적으로 `null` 을 쓰면 타입 `(string[] | undefined)` 가 `(string[] | null | undefined)` 로 확장 필요.
- **앱측 영향**: null 처리가 필요하면 types 확장.
- **우선순위**: Mid

### 3.4 [Low] `FillPayload.reason` 타입 엄격화
- **관련 앱 위치**: [src/types/rtdb.ts:116](../src/types/rtdb.ts#L116) (`reason?: string`)
- **관련 설계서**: §8.2.7 `reason: str (default "")`
- **확인 필요**: 설계 기준으로 필수(기본값 있음). 앱 타입을 `reason: string` 로 맞춰도 되는지 서버 입력 검증 확인.
- **앱측 영향**: [AUDIT_APP.md §7.2](AUDIT_APP.md) 의 타입 엄격화 작업.
- **우선순위**: Low

---

## 4. 설계서 본문 수정

### 4.1 [Mid] §6.2 일일 리포트 예시에 "Model 동기화 적용" 라인 포함
- **관련 설계서 위치**: §6.2 강조 블록 라인 규칙(line 263) 은 "Model 동기화 적용" 을 최상단 표시라고 하는데, 본문 예시(§6.2 244~254 추정) 에는 이 라인 없음
- **권장**: 예시 본문을 업데이트하여 `model_sync` 적용 실행의 리포트 형태 포함
- **우선순위**: Mid (문서 자체의 예시 정합성)

### 4.2 [Low] §8.2.7 `reason` 필드 용도 명시
- **관련 설계서 위치**: §8.2.7 `reason` 행
- **권장**: "사용자가 입력한 체결 사유 또는 서버 분류 결과가 저장. FillHistory 로 이동 시 `drift.classify_fill` 결과가 덮어쓸 수 있음" 같은 **의미 설명 문장 추가**.
- **우선순위**: Low

### 4.3 [Low] `execution_date` 의 타임존 기준 명시
- **관련 설계서 위치**: §1.3 또는 §8.2.1 Portfolio 행
- **권장**: "`execution_date` 는 **미국 거래일** (ET 기준) 을 `YYYY-MM-DD` 로 표기. 서버 실행 시각이 한국 시간의 다음 날이어도 필드 값은 실행일 기준 미국 거래일이다" 같은 정의 문장 추가.
- **관련**: §2.1 과 연동.
- **우선순위**: Low

---

## 5. 서버 이관 시 참고 사항

- 본 문서는 **앱 관점 관찰사항** 모음으로, 서버 코드(`qbt`) 를 직접 읽지 않은 상태에서 작성됨. 서버 쪽 실 구현과 대조 후 이미 해결된 항목은 제거 권장.
- 각 항목의 "우선순위" 는 앱 사용자 관점 영향도이며, 서버 쪽 작업량은 별도 판단 필요.
- [AUDIT_APP.md](AUDIT_APP.md) 의 `§2.1`, `§7.1`, `§7.2` 는 서버 확인 결과에 따라 앱 작업 방향이 정해지는 연동 항목.

---

## 6. 조치 우선순위 제안

### 즉시 확인 (High)
1. **§1.1** `processed` 마킹 타이밍 / 청소 정책
2. **§1.2** inbox 항목 유실 방지 / 중복 처리 idempotency / 실패 알림 경로
3. **§2.1** `execution_date` 타임존 기준

### 단기 (Mid)
4. **§1.3** `FillHistory.reason` enum 확정 및 설계서 문서화
5. **§2.2** `pending_fill_reminders` 카운트 SoT 확정
6. **§2.3** RTDB Rules 점검 (OWNER_UID + 쓰기 경로)
7. **§3.1** price/equity ChartMeta 분리 검토 — 서버에 영향 없는 앱 측 타입 작업이나 서버가 `ma_window` 를 항상 보내는지 확인 필요
8. **§3.2** `portfolio.assets` 항상 4자산 포함 보장
9. **§3.3** 빈 배열 vs null vs 키 부재 계약 명시
10. **§4.1** 설계서 §6.2 예시 업데이트

### 장기 (Low)
11. **§1.4** `BalanceAdjustPayload.reason` 필수성 확정
12. **§3.4** `FillPayload.reason` 타입 엄격화
13. **§4.2** 설계서 `reason` 필드 의미 설명
14. **§4.3** 설계서 `execution_date` 타임존 명시

---

**문서 끝**
