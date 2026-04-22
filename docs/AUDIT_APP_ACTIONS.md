# AUDIT_APP_ACTIONS.md — 서버 감사 회신 (앱 측 후속 작업)

## 0. 핸드오프 안내 (앱 Claude Code 가 먼저 읽을 것)

- **출처**: QBT Live 서버 리포(`quant`)의 [`docs/AUDIT_SERVER.md`](AUDIT_SERVER.md) — 2026-04-22 서버 회신 완료
- **작성 맥락**: 앱 측이 서버로 보낸 감사 핸드오프(`AUDIT_SERVER.md`)의 **14건 중 앱에서 실제 처리 가능한 작업만 추려서** 액션 중심으로 재정리한 문서. 서버 측 상세 근거 / 코드 라인 출처는 `AUDIT_SERVER.md` 에 그대로 남아있음.
- **사용자 지시**: 이 문서를 그대로 앱 리포의 Claude Code 에게 전달하므로, 앱 Claude 가 (1) 작업 항목 파악, (2) 각 항목의 변경 범위 추정, (3) 실행 계획 수립, (4) 회신이 필요한 항목은 사용자 확정 후 서버에 답변을 보낼 것.
- **중요**: 작업 4건 중 **§3 "reason 불일치"** 는 앱 UI 가 잘못된 동작을 할 가능성이 있는 실제 버그 케이스 이므로 **가장 먼저 확인 바람**.
- **서버 대기 상태**: 서버 측 설계서 수정 계획(§5) 은 앱 답변을 받은 뒤 착수. 앱 Claude 의 결정이 서버 설계서 수정 범위를 확정시킴.

### 본 문서 파일 경로 규칙

- 본문에 등장하는 `` `src/...` `` 형식 경로는 **앱 리포(`qbt-live-app`) 내부 경로**.
- `§` 기호 번호는 **서버 리포의 `docs/DESIGN_QBT_LIVE_FINAL.md`** 섹션 번호 (앱 Claude 는 이 파일을 직접 열 수 없으므로 본문에 필요한 문맥을 전부 포함).
- "서버 파일" 이라고 명시된 경로(`src/live/...`) 는 앱 리포에는 없으니 읽지 말고, 본문의 인용된 동작 설명만 참고하면 됨.

### 앱 측 기존 문서와의 관계

- 앱 리포에 `AUDIT_APP.md` 가 존재하며, 그 안에 "⏸ 대기 3건" (ChartMeta 타입 분리 / Portfolio.assets 타입 가드 / FillPayload.reason 타입 엄격화) 이 기록되어 있음.
- 본 회신으로 그 3 건이 모두 해제됨. `AUDIT_APP.md` 의 해당 항목 상태를 업데이트하는 작업도 본 문서 §4 의 일환으로 포함.

---

## 1. 서버 회신 요약

서버 측 감사 결과 14건 중 앱에서 조치가 필요한 항목은 **4건**. 나머지 10건은 서버 측에서 처리(설계서 보강 / 이미 설계대로 구현) 하거나 사용자 환경 확인(Firebase Rules) 으로 종료됨.

| # | 서버 문서 참조 | 앱 측 조치 내용 | 우선순위 | 변경 규모 |
|---|---|---|---|---|
| 1 | §3.1 | `ChartMeta` 를 `PriceChartMeta` / `EquityChartMeta` 로 분리 + `ma_window` 필수화 | Mid | 타입 정의 + 사용처 업데이트 |
| 2 | §3.2 | `Portfolio.assets` 타입 유지 결정 (추가 작업 불필요) | Mid | 결정만, 코드 변경 없음 |
| 3 | **§1.3** | **`HistoryList` 의 `reason` 분기 로직 재검토 (앱-서버 동작 불일치 발견, 옵션 A/B 선택 필요)** | **High (실질 버그)** | UI 분기 수정 또는 서버 확장 요청 |
| 4 | §3.4 | `FillPayload.reason` 타입을 optional 에서 필수(`reason: string`) 로 엄격화 | Low | 타입 정의 1 줄 + 호출부 확인 |

---

## 2. §3.1 — `ChartMeta` 타입 분리 (조치 필요)

### 2.1 배경 (왜 수정해야 하는가)

앱은 현재 **주가 차트(price chart)** 와 **자산총액 차트(equity chart)** 의 메타 정보를 동일한 `ChartMeta` TypeScript 인터페이스로 받고 있음. 두 차트는 서로 다른 데이터 구조를 가진다:

- **주가 차트 메타** (`/charts/prices/{asset_id}/meta`): 자산별 이동평균 기간(`ma_window`) 이 **항상 있음**
- **자산총액 차트 메타** (`/charts/equity/meta`): `ma_window` 개념 자체가 **없음** (포트폴리오 전체 equity 에는 이동평균을 적용하지 않음)

앱이 하나의 타입으로 묶다 보니 `ma_window?: number` (optional) 으로 완화되어 있고, price 차트 쪽 타입 체크가 느슨해짐.

### 2.2 서버 측 실제 동작 (확정 사항)

서버는 이미 두 dataclass 를 **별도로** 정의하고 있음 (서버 `src/live/models.py`):

```python
# 주가 차트 메타 — ma_window 필수
@dataclass
class ChartMeta:
    first_date: str
    last_date: str
    ma_window: int           # 필수
    recent_months: int
    archive_years: list[int]

# equity 차트 메타 — ma_window 없음
@dataclass
class EquityChartMeta:
    first_date: str
    last_date: str
    recent_months: int
    archive_years: list[int]
```

RTDB 경로도 `/charts/prices/{asset_id}/meta` vs `/charts/equity/meta` 로 분리되어 있어 런타임 페이로드가 섞이는 일은 없음. 즉 **앱도 두 타입으로 분리하는 것이 서버 스키마와 1:1 대응**.

### 2.3 앱 측 변경 내용

**예상 수정 위치**: `src/types/rtdb.ts` (앱 리포).

```ts
// 기존 — 하나의 타입
interface ChartMeta {
  first_date: string;
  last_date: string;
  ma_window?: number;  // optional 로 완화되어 있음
  recent_months: number;
  archive_years: number[];
}

// 변경 후 — 두 타입으로 분리
interface PriceChartMeta {
  first_date: string;
  last_date: string;
  ma_window: number;        // 필수 전환
  recent_months: number;
  archive_years: number[];
}

interface EquityChartMeta {
  first_date: string;
  last_date: string;
  recent_months: number;
  archive_years: number[];
}
```

**후속 영향 범위** (앱 Claude 가 검색해서 업데이트):
- `ChartMeta` 타입을 import 하여 사용하는 파일 전체.
- 주가 차트 화면(`/charts/prices/*` 로딩 코드)은 `PriceChartMeta` 로 교체.
- equity 차트 화면(`/charts/equity/*` 로딩 코드)은 `EquityChartMeta` 로 교체.
- `readOnce<ChartMeta>(...)` 같은 제네릭 호출부를 두 타입으로 분기.

### 2.4 회신 양식 (서버에 보낼 내용)

작업 완료 시 다음 중 하나를 `AUDIT_SERVER.md` §3.1 에 기록:

- `**앱 측 답변**: 타입 분리 완료 (앱 리포 커밋 해시 또는 PR #N)`
- `**앱 측 답변**: 현 통합 타입 유지 결정 (사유: ...)` — 만약 분리 안 함

---

## 3. §1.3 — `reason` 필드 불일치 (앱 UI 버그 가능성, 가장 중요)

### 3.1 배경

앱의 `AUDIT_APP.md` 또는 앱 측 가정 문서에는 다음 흐름이 기록되어 있음:

> 앱은 `FillPayload.reason` 을 빈 문자열로 전송 → 서버의 `drift.classify_fill` 이 분류하여 `FillHistory.reason` 을 `"system_fill"` 또는 `"personal_trade"` 로 저장 → 앱의 `HistoryList` 가 이 두 값으로 "시스템 체결" / "개인 거래" 배지 구분 렌더링.

### 3.2 서버 측 실제 동작 (확정 사항)

**위 앱 측 가정은 사실이 아님.** 서버 코드 실제 동작은 다음과 같음:

1. `_dict_to_actual_fill` (서버 `src/live/rtdb_gateway.py:130-157`) 은 앱이 전달한 `reason` 을 **그대로** `ActualFill.reason` 에 저장. 코드상 `reason=str(data.get("reason", ""))`.
2. `write_history_fills` (서버 `src/live/rtdb_gateway.py:513-534`) 는 `ActualFill` dataclass 를 `asdict()` 로 통째 덤프하여 `/history/fills/{trade_date}/{rtdb_key}` 에 저장. 서버가 `reason` 을 덮어쓰는 로직은 **없음**.
3. `drift.classify_fill` (서버 `src/live/drift.py:38-67`) 은 `"system_fill"` / `"personal_trade"` 를 **반환** 하지만, 반환값이 `ActualFill.reason` 에 대입되지 않음. 현재 `run_daily` 흐름에서는 이 함수 자체가 **호출되지 않으며**, audit/drift 분석 용도로만 예약되어 있음.

**결론**: `/history/fills/.../reason` 은 앱이 보낸 원본 값(주로 `""`) 그대로이므로, 앱의 `HistoryList` 가 `reason === "system_fill"` / `reason === "personal_trade"` 로 분기한다면 **두 분기 모두 매칭되지 않아 "기타" 케이스로 떨어지거나 배지가 잘못 표시됨**. 실제 UI 에서 이 증상이 관찰되는지 앱 Claude 가 먼저 확인 요망.

### 3.3 앱 측 선택지 (서버에 답변 필요)

#### 옵션 A — 앱 측 분기 로직 제거 (권장, 변경 최소)

**방침**: `HistoryList.tsx` 에서 `reason` 기반 분기를 제거하거나 "기타" 하나로 통합. `reason` 은 원래 의도대로 **사용자 자유 텍스트 사유** 로만 취급(UI 에 그냥 문자열 표시).

**배지 유지가 꼭 필요하면 앱에서 자체 분류**:
- 앱이 과거 `pending_orders` 스냅샷 이력을 보관하고 있다면, 해당 fill 의 `trade_date` 시점에 같은 자산·방향 pending 이 있었는지 대조하여 앱에서 자체 판정.
- 단 이 판정은 앱이 pending 이력을 어딘가에 저장해야 가능. 현재 `/latest/pending_orders` 는 "당일" 만 담으므로, 과거 fill 재판정은 불가.
- 실용적 대안: **최근 fill(체결 당일 ~ 익일 리포트 표시까지) 만 배지** 를 보여주고, 과거 이력은 배지 없이 리스트로만 노출.

**장점**: 서버 확장 불필요, 앱 측 UI 1곳만 수정. 설계와 코드가 원래 "`reason` = 자유 텍스트" 의도와 일치.

**단점**: 사용자 관점에서 "시스템 체결 vs 개인 거래" 구분이 UI 에서 사라짐 (또는 최근 건만 구분).

#### 옵션 B — 서버에 분류 필드 추가 요청 (확장 필요)

**방침**: 서버가 `classify_fill` 결과를 `ActualFill.reason` 이 아닌 **새 필드** `classification: "system_fill" | "personal_trade"` 에 저장하도록 확장.

**서버 측에서 필요한 변경 (범위가 큼)**:
- `ActualFill` dataclass 에 `classification` 필드 추가 (서버 `src/live/models.py`).
- `drift.apply_fills_idempotent` 가 fill 반영 시점에 `classify_fill` 호출하여 결과를 `classification` 에 기록 (서버 `src/live/drift.py`).
- `write_history_fills` 가 `classification` 을 포함해 저장 (자동, asdict 덤프이므로).
- 설계서 §8.2.7 (`/fills/inbox`) / §8.2.11 (`/history/fills`) 두 섹션 모두 스키마 확장 + enum 값 문서화.
- 회귀 테스트 / idempotency 재검증.

**장점**: 앱 UI 에서 과거/현재 모든 체결에 대해 정확한 배지 표시 가능. enum 강제화로 UI 실수 감소.

**단점**: 서버 코드 + 설계서 + 테스트 + 앱 타입 모두 수정 필요. 작업 규모가 큼.

### 3.4 권장 결정 프로세스

1. 앱 Claude 가 먼저 `HistoryList.tsx` 의 현재 `reason` 분기 실제 동작을 확인 (로컬 실행 또는 코드 리뷰).
2. 실제로 UI 가 잘못 렌더링되고 있으면 증상 스크린샷/로그를 사용자에게 공유.
3. 사용자와 함께 옵션 A / B 선택.
4. 선택 결과를 `AUDIT_SERVER.md` §1.3 하단에 아래 형식 중 하나로 기록:
   - `**앱 측 답변**: 옵션 A 채택. HistoryList 분기 제거 완료 (앱 리포 커밋/PR)`
   - `**앱 측 답변**: 옵션 A 채택 + 최근 건만 자체 분류. 상세 UX 는 ...`
   - `**앱 측 답변**: 옵션 B 요청. 서버 측 classification 필드 추가 플랜 작성 요청`

### 3.5 서버 측 대기 상태

**옵션 A 선택 시**: 서버는 설계서 §8.2.7 / §8.2.11 의 `reason` 행에 "앱이 보낸 자유 텍스트 사유이며 서버는 변환하지 않음" 을 명시하는 선에서 마무리.

**옵션 B 선택 시**: 서버 측에서 별도 플랜(`docs/plans/PLAN_fill_classification.md`) 작성 후 사용자 승인 거쳐 진행. 설계서 수정 + 코드 확장 + 회귀 테스트 1 세트가 묶인 별도 작업 단위로 취급.

**어느 쪽이든 앱 답변 전에는 서버 설계서 §8.2.7/§8.2.11 수정을 보류**.

---

## 4. §3.2, §3.4 — 타입 엄격화 및 유지 결정

### 4.1 §3.2 — `Portfolio.assets` 타입 유지

**서버 확정 사항**: `/latest/portfolio.assets` 는 **항상 4자산(sso/qld/gld/tlt) 전체를 포함**. 자산을 전량 매도하여 0 주 상태가 되어도 키는 유지되며 `model_shares=0, actual_shares=0, signal_state="sell"` 로 저장됨. RTDB 의 "빈 값 생략" 정책은 `null` / 빈 배열에만 적용되고 정수 0 / 문자열 `"sell"` 은 정상 저장.

**앱 측 조치**:
- 현재 `Portfolio.assets: Record<AssetId, AssetSnapshot>` 타입 그대로 유지.
- 방어용 런타임 가드(`portfolio.assets[id] ? ... : fallback`) 는 불필요. 오히려 불필요한 복잡도를 유발.
- `AUDIT_APP.md` 의 해당 ⏸ 항목 상태를 "결정 완료: 현 타입 유지" 로 업데이트.

### 4.2 §3.4 — `FillPayload.reason` 타입 엄격화

**서버 확정 사항**: `_dict_to_actual_fill` 이 `reason=str(data.get("reason", ""))` 로 파싱하므로, 앱이 `reason` 을 생략하든 빈 문자열로 보내든 항상 정상 처리. `reason` 공백을 reject 하지 않음.

**앱 측 조치**:
- `src/types/rtdb.ts` 의 `FillPayload.reason` 을 optional(`reason?: string`) 에서 **필수(`reason: string`)** 로 전환.
- `FillPayload` 를 생성하는 모든 호출부가 `reason: ""` 을 명시적으로 포함하는지 확인.
- **§3 (`reason` 불일치) 작업과 세트로 진행**. §3 의 옵션 A/B 결정에 따라 `reason` 의 의미가 "자유 텍스트" 인지 "서버 분류값 placeholder" 인지 달라지므로, 타입 주석(JSDoc 등) 문구도 같이 업데이트.

---

## 5. 서버 측 대기 중인 결정 사항 (앱 Claude 가 알아두어야 할 것)

서버 측은 다음 4 개 설계서 섹션을 수정할 예정이지만, **§1.3 의 앱 답변을 받은 뒤 한 번에 반영**. 사유: §1.3 결정에 따라 §8.2.7 / §8.2.11 수정 문구가 크게 달라지기 때문.

| 서버 설계서 섹션 | 수정 내용 요약 | 앱 답변 대기 여부 |
|---|---|---|
| §1.3 / §8.2.7 / §8.2.11 | `reason` 필드 의미 명시 (옵션 A vs B 에 따라 분기) | **대기 중** |
| §8.3 | inbox `processed` 마킹 후 삭제 안 함 + DLQ 부재 명시 | 대기 아님 (§1.3 과 같이 묶어 반영) |
| §8.2.1 | `execution_date` 의 ET 기준 명시 | 대기 아님 |
| §11 | RTDB Rules 경로별 권한 표 추가 (사용자 Firebase Console 확인 완료) | 대기 아님 |

즉 **앱 답변을 받는 즉시 서버 측 설계서 수정 계획서 작성 → 승인 → 일괄 반영** 순서로 진행.

---

## 6. 앱 Claude 에게 권장하는 작업 순서

1. **§3 (`reason` 불일치) 를 가장 먼저 확인** — `HistoryList.tsx` 의 현재 동작 점검. 실제 UI 가 잘못되고 있는지 사용자에게 보고 후 옵션 A/B 결정.
2. §3 결정이 확정되면 §3.4 (`FillPayload.reason` 타입 엄격화) 와 **같은 커밋** 에 묶어 수정. JSDoc 문구도 같이.
3. §2 (`ChartMeta` 분리) 는 §3 과 독립이므로 병행 진행 가능.
4. §4.1 (`Portfolio.assets` 타입 유지) 는 코드 변경 없음. 앱 리포의 `AUDIT_APP.md` 상태 업데이트만.
5. 모든 작업 완료 후 `AUDIT_SERVER.md` 의 해당 섹션(§1.3, §3.1, §3.2, §3.4) 하단에 "앱 측 답변" 한 줄씩 기록 → 서버 리포에 다시 전달.

---

## 7. 회신 양식 (앱 → 서버)

각 항목에 다음 중 하나를 기록:

- `**앱 측 답변**: 완료 (앱 리포 커밋/PR)` — 이미 처리
- `**앱 측 답변**: 결정 유지 (사유: ...)` — 변경 없이 결정만
- `**앱 측 답변**: 옵션 B 요청 — 서버 측 확장 플랜 작성 요청 (§1.3 해당)`
- `**앱 측 답변**: 추가 질문 필요 — ...` — 서버에 재질의

회신 완료 후 이 문서 또는 `AUDIT_SERVER.md` 중 하나를 업데이트하여 서버 리포에 전달. 서버 측에서 앱 답변을 반영하여 설계서 수정 계획서를 작성/실행.

---

**문서 끝**
