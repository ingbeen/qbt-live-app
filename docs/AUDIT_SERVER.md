# AUDIT_SERVER.md — 서버 측 확인·조치 필요 항목 (핸드오프)

## 0. 핸드오프 안내 (서버 Claude Code 가 먼저 읽을 것)

- **출처**: QBT Live 앱 프로젝트 `qbt-live-app` 의 전체 감사(AUDIT) 과정에서 도출
- **작성일**: 2026-04-22
- **작성 맥락**: 앱만으로는 결정할 수 없는 항목, 서버-앱 데이터 계약 해석이 필요한 항목, 설계서 `DESIGN_QBT_LIVE_FINAL.md` 수정이 필요할 수 있는 항목을 모은 것
- **총 건수**: 14건 (High 2 / Mid 8 / Low 4)

### 서버 Claude Code 에게 기대하는 행동

1. 각 항목의 **"확인 필요"** 내용을 서버 코드 (`drift/live`, GitHub Actions 워크플로우 등) 와 설계서 `DESIGN_QBT_LIVE_FINAL.md` 에 대조
2. 이미 해결/결정되어 있는 항목은 각 항목 하단에 **`**서버 답변**: 이미 …로 구현되어 있음`** 같은 필드 추가
3. 설계서 수정이 필요한 항목은 서버 리포 내 `DESIGN_QBT_LIVE_FINAL.md` 를 직접 수정한 뒤, **"설계서 반영 완료 (커밋 해시 또는 섹션)"** 표기
4. 서버 코드 수정이 필요한 항목은 별도 작업으로 진행 후, **"서버 코드 변경 완료 (PR 번호)"** 표기
5. 작업 완료 후 본 문서를 앱 개발자(`qbt-live-app` 리포)에게 회신 — 앱 측은 회신 결과를 기반으로 `AUDIT_APP.md` 의 ⏸ 대기 3건을 처리

### 앱 측 후속 대기 항목 (서버 답변 후 앱에서 처리)

- **`Portfolio.assets[id]` 타입 가드 여부** — 본 문서 §3.2 결정에 의존
- **`ChartMeta.ma_window` 타입 분리 여부** — 본 문서 §3.1 결정에 의존
- **`FillPayload.reason` 타입 엄격화 여부** — 본 문서 §3.4 결정에 의존

### 본문 표기 규칙

- 본문에 등장하는 `` `src/...` `` 형식 경로는 **앱 프로젝트 내부 경로** 이므로 서버 리포에서는 열 수 없습니다. 각 항목의 문맥은 본문 텍스트에 포함되어 있으므로 경로는 **참조용 출처 표시** 로만 이해하면 됩니다.
- `§` 기호로 시작하는 번호 (예: `§8.2.7`) 는 서버 리포의 `DESIGN_QBT_LIVE_FINAL.md` 섹션 번호입니다. 서버 Claude 가 직접 해당 섹션을 열어 확인하면 됩니다.

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

- **앱 측 참조 위치**: `src/services/rtdb.ts` 의 `readInbox` (대략 64-69줄) — `processed !== true` 로 필터
- **설계서 참조**: `§8.3` — "daily runner 만 `processed=true` 를 쓴다"

**현재 앱이 가정하는 동작**
사용자가 체결을 입력하면 그 inbox 항목은 다음 daily runner 실행에서 반영되고 `processed=true` 로 마킹된다. 앱의 `ReminderBlock` 은 **"`pending_orders` 에 있는데 inbox 에는 해당 자산 없음"** 조건으로 리마인더를 띄우므로, inbox 가 `processed=true` 로 넘어간 이후에는 앱이 해당 항목을 미처리로 간주하지 않는다.

**확인 필요**
1. 서버 daily runner 가 **읽고 → 반영 → 마킹** 의 순서 중 실패 시 항목이 재처리되는가? (DLQ 또는 재시도 큐 존재 여부)
2. `processed=true` 로 마킹된 inbox 항목은 `/history/fills/...` 로 이동 후 inbox 트리에서 **삭제** 되는가, 아니면 그대로 **잔존** 하는가?
3. 잔존한다면 장기적으로 inbox 규모가 커짐 → 청소 정책 필요

**앱측 영향 (서버 답변에 따라)**
- 삭제 방식 → 앱의 `processed !== true` 필터는 deeper-in-depth 방어로만 유지
- 잔존 방식 → 앱 로직 정확성은 유지되나 성능 영향 발생 시점 예측 필요

---

### 1.2 [High] Inbox 쓰기 후 반영 보장 (UUID 중복 / 손실)

- **앱 측 참조 위치**: `src/services/rtdb.ts` 의 모든 `submit*` 함수 (대략 86-134줄) — UUID 로 `set()` 호출 후 토스트만 표시
- **앱 측 동작**: Zustand store 의 submit 액션들이 "다음 실행에 반영됩니다" 토스트 표시

**현재 앱이 가정하는 동작**
한 번 `set()` 이 성공하면 서버가 반드시 **정확히 한 번** 처리한다. UUID 중복 시 idempotent.

**확인 필요**
1. daily runner 가 **모든 `processed=false` 항목을 빠짐없이** 읽고 처리하는가 (실패 시 재시도 큐나 DLQ)
2. UUID 중복으로 인한 **의도치 않은 skip 방지** 여부 — 앱이 버튼 중복 탭 시 UUID 생성이 같아질 확률은 낮지만, 타임아웃 후 자동 재시도가 있다면 중복 제출 가능
3. 반영 실패 (예: `_dict_to_balance_adjust` 검증 실패) 시 서버가 사용자에게 알리는 경로 — 현재 앱에는 결과 수신 채널 없음

**앱측 영향 (서버 답변에 따라)**
- 실패 알림 경로 신설 시 (예: `/latest/submission_errors/{uid}/{uuid}`) 앱이 이를 구독하여 사용자에게 에러 표시 가능

---

### 1.3 [Mid] `FillPayload.reason` vs `FillHistory.reason` 의미 명확화

- **앱 측 참조 위치**:
  - `src/types/rtdb.ts` 의 `FillPayload.reason?: string` (대략 116줄)
  - `src/types/rtdb.ts` 의 `FillHistory.reason: string` (대략 163줄)
  - `src/components/HistoryList.tsx` 에서 `"system_fill"` / `"personal_trade"` 문자열로 분기 (대략 113-117줄)
- **설계서 참조**: `§8.2.7` — `reason: str (default "")`

**현재 앱이 가정하는 동작**
앱은 사용자 입력 UI 없이 `reason` 필드를 빈 문자열로 전송. 서버의 `drift.classify_fill` 이 분류하여 `FillHistory.reason` 을 `"system_fill"` 또는 `"personal_trade"` 로 저장. 앱은 이 두 값으로 "시스템" / "개인" 배지 렌더링.

**확인 필요**
1. `FillPayload.reason` 이 **사용자 입력 용도** 인지 **서버 분류용 플레이스홀더** 인지 — 둘 다 허용이 의도인가?
2. `FillHistory.reason` 의 값 목록이 정확히 `{"system_fill", "personal_trade"}` 두 가지인가? `""` 나 다른 값이 섞일 수 있다면 앱이 "기타" 케이스 표시 필요
3. 설계서 본문에 두 값을 **명시적 enum** 으로 문서화 필요

**앱측 영향 (서버 답변에 따라)**
- enum 확정 시 앱 타입을 `FillReason = 'system_fill' | 'personal_trade'` literal union 으로 엄격화

**앱 측 답변 (2026-04-22, PLAN_AUDIT_04)**: 옵션 A 채택. 서버 측 실제 동작(`classify_fill` 미호출, `reason` 패스스루) 확인 후 `HistoryList.tsx` 의 `fillTagBadge` dead code 를 제거함. 현재 앱은 "시스템 체결 / 개인 거래" 배지를 노출하지 않음. 서버 설계서 `§8.2.7` / `§8.2.11` 의 `reason` 필드 설명을 **"사용자 자유 텍스트 사유 (서버는 변환하지 않음)"** 로 명확화 요청.

---

### 1.4 [Low] `BalanceAdjustPayload.reason` 서버 필수 여부

- **앱 측 참조 위치**:
  - `src/types/rtdb.ts` 의 `BalanceAdjustPayload.reason: string` (필수, 대략 129줄)
  - `src/components/AdjustForm.tsx` — UI 상 선택, 빈 문자열 시 `'수동 보정'` 기본값 전송
- **설계서 참조**: `§8.2.8` 표에서 "권장(Recommended)" 으로 표기

**현재 앱이 가정하는 동작**
앱이 항상 기본값을 채워 보내므로 서버는 항상 비공백 문자열 수신.

**확인 필요**
- 서버 2단계 검증 (`§8.2.8.1`) 이 `reason` 공백을 reject 하는가? reject 정책이면 앱 기본값 전략은 안전

**앱측 영향**
- 서버 reject 정책 확인 시 앱의 `'수동 보정'` 기본값 전략을 유지할지, 제거할지 결정

---

## 2. 런타임 동작 / 프로세스

### 2.1 [High] `execution_date` 시간대 불일치 가능성

- **앱 측 참조 위치**:
  - `src/components/UpdateStatusBadge.tsx` — `today()` 와 `execution_date` 를 직접 비교하여 badge 결정 (대략 20-25줄)
  - `src/utils/format.ts` 의 `today()` — **KST 기준** `YYYY-MM-DD` 리턴
- **설계서 참조**: "GitHub Actions 에서 ET 17:27 실행"

**현재 앱이 가정하는 동작**
`/latest/portfolio.execution_date` 는 미국 시장 마감 후의 **거래일** (예: `2026-04-21`). 앱은 KST 기준 `today()` 와 이 값을 비교해 "몇 일 지났는지" 판단 (`STALE_WARNING_DAYS = 4` 경고 임계값).

**확인 필요**
1. 서버가 `execution_date` 를 ET / UTC / KST 중 **어느 기준 날짜** 로 저장하는가
2. KST 기준 아침 (ET 저녁 실행 직후) 에 앱을 켰을 때 `today() - execution_date` 가 0 이어야 하는가 1 이어야 하는가
3. 설계서 본문에 "`execution_date` 는 장 마감 **미국 거래일** 기준" 같은 명시적 정의 필요

**앱측 영향**
- 현재는 `STALE_WARNING_DAYS = 4` 여유 덕에 문제 은폐 중. 임계값 근처 (4~5일) 에서 오판 가능
- 기준이 확정되면 앱 `today()` 를 대응하는 기준으로 변경 또는 `STALE_WARNING_DAYS` 조정

---

### 2.2 [Mid] `pending_fill_reminders` 카운트의 출처

- **설계서 참조**: `§6.2` — 일일 리포트 본문에 "미입력 체결 리마인더: N 건" 노출
- **앱 측 참조 위치**: `src/components/ReminderBlock.tsx` — `pendingOrders` + `inboxFills` + `inboxFillDismiss` 로 **런타임 계산** (대략 30-36줄)

**현재 상황**
서버 측 일일 리포트의 "N 건" 과 앱 화면의 리마인더 표시가 **독립 계산** 되어 불일치 가능.

**확인 필요**
1. 서버 일일 리포트의 N 이 어떤 기준으로 계산되는가 (`pending_orders` 카운트 - inbox 카운트? 별도 저장 필드?)
2. RTDB 에 `/latest/portfolio.pending_fill_reminder_count` 같은 필드 추가 여부 — 앱 로직 단순화 가능

**앱측 영향**
- 필드 추가 시 앱 `Portfolio` 타입에 해당 필드 추가 및 ReminderBlock 로직 단순화

---

### 2.3 [Mid] RTDB Rules 와 `OWNER_UID` 검증

- **앱 측 참조 위치**:
  - `src/utils/constants.ts` 의 `OWNER_UID` 상수
  - `CLAUDE.md §11.3` — "참고용 상수, 권한 판정은 RTDB Rules 가 담당"
- **설계서 현황**: 현재 `DESIGN_QBT_LIVE_FINAL.md` 에 RTDB Rules 명시적 섹션 부재 (추정)

**확인 필요**
1. 현재 RTDB Rules 가 `auth.uid === OWNER_UID` 체크를 하는가, `auth != null` 만 체크하는가
2. 앱 쓰기 허용 경로가 실제 Rules 와 일치하는가
   - `/fills/inbox/*`
   - `/balance_adjust/inbox/*`
   - `/fill_dismiss/inbox/*`
   - `/model_sync/inbox/*`
   - `/device_tokens/*`
3. `/device_tokens/{deviceId}` 는 앱이 직접 쓰지만 타 사용자 deviceId 덮어쓰기 방지 필요 → Rules 강화

**앱측 영향**
- Rules 강화 시 앱의 "RTDB 접근 권한이 없습니다" 메시지가 정확히 트리거되는지 확인 필요

---

## 3. 타입 스키마 정확성

### 3.1 [Mid] `ChartMeta.ma_window` 필수성

- **앱 측 참조 위치**: `src/types/rtdb.ts` 의 단일 `ChartMeta` 인터페이스에서 `ma_window?: number` (optional, 대략 69-75줄)
- **설계서 참조**: `§8.2.5.1` price chart meta 에서 `ma_window: int` 필수

**현재 앱 상황**
price chart 와 equity chart 가 동일 `ChartMeta` 인터페이스를 공유. equity chart 에는 `ma_window` 개념 없음 → price 쪽도 optional 로 완화됨.

**확인 필요**
서버가 `/charts/prices/{assetId}/meta` 에 **항상** `ma_window` 를 포함하는가?

**앱측 영향 (서버 답변에 따라)**
- **항상 포함** → 앱 측에서 `PriceChartMeta` / `EquityChartMeta` 인터페이스 분리 + `PriceChartMeta.ma_window` 를 필수로
- **누락 가능** → 현 optional 유지

**앱 측 답변 (2026-04-22, PLAN_AUDIT_04)**: 타입 분리 완료. `ChartMeta` 를 `PriceChartMeta` (ma_window 필수) / `EquityChartMeta` (ma_window 없음) 로 분리했고, `services/rtdb.ts` 의 `readPriceChartMeta` / `readEquityChartMeta` 와 `store/useStore.ts` 의 캐시 타입도 1:1 로 갱신함.

---

### 3.2 [Mid] `Portfolio.assets` 누락 자산 처리 계약

- **앱 측 참조 위치**:
  - `src/types/rtdb.ts` 의 `Portfolio.assets: Record<AssetId, AssetSnapshot>` (대략 33줄)
  - `src/components/AssetSummaryCard.tsx` 등에서 `portfolio.assets[id]` 무방비 접근

**현재 앱 상황**
타입상 4자산(`sso, qld, gld, tlt`) 이 항상 존재한다고 가정. 런타임에 키가 누락되면 `undefined` 접근으로 크래시 가능.

**확인 필요**
서버가 4자산을 **항상 모두 채워서** 저장하는가? RTDB 가 빈 필드 저장을 안 하므로, 자산이 전부 0주·미보유일 때도 키가 남는가?

**앱측 영향 (서버 답변에 따라)**
- **항상 4자산 보장** → 현 타입 유지
- **누락 가능** → 앱 타입을 `Partial<Record<AssetId, AssetSnapshot>>` 로 변경 + UI 가드 추가

**앱 측 답변 (2026-04-22, PLAN_AUDIT_04)**: 현 타입 `Record<AssetId, AssetSnapshot>` 유지 결정. 서버가 4자산을 항상 보장하므로 방어용 런타임 가드는 추가하지 않음 (YAGNI). 코드 변경 없음.

---

### 3.3 [Mid] 차트 시리즈의 빈 배열 처리

- **앱 측 참조 위치**: `src/services/rtdb.ts` 의 `readOnce` (대략 36-42줄) — null 리턴, 호출부에서 `?? []` 적용
- **설계서 참조**: "Firebase RTDB 는 빈 배열 `[]` 을 저장하지 않는다"

**확인 필요**
1. `PriceChartSeries.buy_signals` / `sell_signals` / `user_buys` / `user_sells` 가 비어있을 때 **키 자체 부재** 인가, `null` 값인가?
2. 비어있을 때 앱은 `?? []` 로 처리하는데, 서버가 명시적으로 `null` 을 쓴다면 타입을 `(string[] | null | undefined)` 로 확장 필요

**앱측 영향**
- null 처리 필요 시 types 확장

---

### 3.4 [Low] `FillPayload.reason` 타입 엄격화

- **앱 측 참조 위치**: `src/types/rtdb.ts` 의 `reason?: string` (optional, 대략 116줄)
- **설계서 참조**: `§8.2.7` — `reason: str (default "")` (필수, 기본값 있음)

**확인 필요**
설계 기준으로 필수 (기본값 있음). 앱 타입을 `reason: string` 으로 맞출 때 서버 입력 검증에 영향 없는가?

**앱측 영향**
- 서버가 빈 문자열 허용 확인 시 앱 타입을 필수로 전환하고 호출부가 항상 빈 문자열 포함해 전송

**앱 측 답변 (2026-04-22, PLAN_AUDIT_04)**: 타입 필수 전환 완료. `FillPayload.reason?: string` → `reason: string` 으로 변경하고, `FillForm` 이 `reason: ''` 명시 전송. `services/rtdb.ts::submitFill` 의 `?? ''` 폴백 제거 (이제 불필요). `§1.3` 답변과 세트로 묶어 처리.

---

## 4. 설계서 본문 수정

### 4.1 [Mid] `§6.2` 일일 리포트 예시에 "Model 동기화 적용" 라인 포함

- **설계서 위치**: `§6.2` 강조 블록 라인 규칙 (line 263 근처) — "Model 동기화 적용" 을 최상단 표시라고 명시
- **문제**: 본문 예시 (§6.2 244-254 추정) 에는 이 라인이 없음
- **조치**: `model_sync` 적용 실행의 리포트 본문 예시 추가

---

### 4.2 [Low] `§8.2.7` `reason` 필드 용도 명시

- **설계서 위치**: `§8.2.7` `reason` 행
- **조치**: "사용자 입력 체결 사유 또는 서버 분류 결과. FillHistory 이동 시 `drift.classify_fill` 결과가 덮어쓸 수 있음" 수준의 의미 설명 추가
- 본 문서 §1.3 와 연동

---

### 4.3 [Low] `execution_date` 의 타임존 기준 명시

- **설계서 위치**: `§1.3` 또는 `§8.2.1` Portfolio 행
- **조치**: "`execution_date` 는 **미국 거래일** (ET 기준) 을 `YYYY-MM-DD` 로 표기. 서버 실행 시각이 한국 시간의 다음 날이어도 필드 값은 실행일 기준 미국 거래일" 같은 정의 추가
- 본 문서 §2.1 과 연동

---

## 5. 우선순위별 조치 제안

### 즉시 확인 (High)
1. **§1.1** `processed` 마킹 타이밍 / 청소 정책
2. **§1.2** inbox 항목 유실 방지 / 중복 처리 idempotency / 실패 알림 경로
3. **§2.1** `execution_date` 타임존 기준

### 단기 (Mid)
4. **§1.3** `FillHistory.reason` enum 확정 및 설계서 문서화
5. **§2.2** `pending_fill_reminders` 카운트 SoT 확정
6. **§2.3** RTDB Rules 점검 (OWNER_UID + 쓰기 경로)
7. **§3.1** price/equity ChartMeta 분리 검토
8. **§3.2** `Portfolio.assets` 항상 4자산 포함 보장 여부
9. **§3.3** 빈 배열 vs null vs 키 부재 계약 명시
10. **§4.1** 설계서 §6.2 예시 업데이트

### 장기 (Low)
11. **§1.4** `BalanceAdjustPayload.reason` 필수성 확정
12. **§3.4** `FillPayload.reason` 타입 엄격화
13. **§4.2** 설계서 `reason` 필드 의미 설명
14. **§4.3** 설계서 `execution_date` 타임존 명시

---

## 6. 회신 양식 (서버 → 앱)

각 항목에 다음 중 하나를 표기해 주세요:

- `**서버 답변**: 이미 ...로 구현되어 있음 (커밋/라인 출처)` — 이미 처리 완료
- `**서버 답변**: 설계서 §X.X 수정 완료 (커밋 해시)` — 문서만 수정하면 되는 경우
- `**서버 답변**: 서버 코드 수정 완료 (PR #N)` — 코드 변경이 필요했던 경우
- `**서버 답변**: 앱 측에서 방어 처리 권장 (사유: ...)` — 서버는 변경 안 하고 앱이 처리하는 쪽으로 결정
- `**서버 답변**: 추가 질문 필요 — ...` — 내용이 불충분하면 앱 개발자에게 재질문

작업 완료 후 이 문서를 `qbt-live-app` 리포의 `docs/AUDIT_SERVER.md` 에 덮어써서 PR 을 보내거나, 내용을 앱 개발자에게 전달해 주세요.

---

**문서 끝**
