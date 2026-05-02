# PRD: 박스권 자동 매매 시스템 (Grid Trader)

## 📋 문서 정보

| 항목 | 내용 |
|:-----|:-----|
| **작성일** | 2026-04-30 |
| **작성자** | User |
| **상태** | 📝 작성중 |
| **버전** | v1.0 |
| **우선순위** | Medium |

## 🎯 개요

### 목적

**사용자가 선택한 종목**을 대상으로 **박스권 그리드 트레이딩**을 자동화하여:
- **변동성 수익 확보**: 설정 가능한 그리드 간격으로 매수/매도 반복하여 단기 수익 챙기기
- **장기 보유 물량 유지**: Core 물량은 목표가 도달까지 매도 금지하여 장기 포지션 유지
- **24시간 자동 운영**: 장 시작 전 사전 세팅부터 장 마감 후 정리까지 무인 운영
- **다중 종목 지원**: 여러 종목에 대해 독립적인 그리드 전략 동시 운영 가능

### 메뉴 위치

- **상위 메뉴**: 트레이딩 시스템
- **하위 메뉴**: 그리드 트레이더
- **라우터**: `/trading-system/grid-trader`

### 핵심 가치

- **종목 선택 자유**: 사용자가 원하는 종목으로 그리드 매매 설정
- **자동화**: 장 시작부터 종료까지 완전 무인 운영
- **하이브리드 전략**: Core(장기) + Active(트레이딩) 자산 배분으로 리스크 분산
- **실시간 대응**: 체결 이벤트 발생 시 즉시 신규 주문 생성
- **안정적 운영**: API Rate Limit 준수, 토큰 자동 갱신, 예외 처리 완비
- **다중 전략**: 여러 종목에 대해 독립적인 그리드 전략 동시 실행 (Phase 3)

### 배경

박스권 변동성이 큰 종목의 경우, 그리드 매매로 변동성 수익을 챙기면서 동시에 장기 보유 물량을 유지하는 전략이 유효합니다. 본 시스템은 범용적으로 설계되어 사용자가 원하는 종목과 설정으로 자동 매매를 운영할 수 있습니다.

**예시 시나리오**: HD현대(034020) 종목을 현재가 약 30만원 기준으로 그리드 간격 5,000원~7,000원으로 설정하여 운영

## 🔍 기능 요구사항

### 1. 종목 및 전략 설정

#### 종목 선택
- **입력 방식**:
  - 종목 검색 (종목명 또는 종목코드)
  - 자동완성 지원
- **선택 정보 표시**:
  - 종목코드 (6자리)
  - 종목명
  - 현재가
  - 전일 거래량

#### 전략 설정 (종목별 개별 설정)
- **그리드 설정**:
  - **그리드 간격**: 최소 1,000원 ~ 최대 100,000원 (사용자 입력)
  - **상단 그리드 개수**: 1~20개 (기본값: 5개)
  - **하단 그리드 개수**: 1~20개 (기본값: 5개)
  - **주문 수량**: 1주 이상 (그리드당 수량)

- **자산 배분**:
  - **총 운용 자산**: 사용자 입력 (예: 450만원)
  - **Core(장기 보유) 수량**: 0주 이상 (기본값: 전체 수량의 1/3)
  - **Active(트레이딩) 수량**: Core를 제외한 나머지 수량
  - **최소 보유 한도**: Core 수량 (이하로 떨어지면 매도 금지)

- **목표가 설정**:
  - **목표가**: 원 단위 입력 (선택사항)
  - **동작**: 매도 주문 생성 시 목표가 이상인 경우에만 Core 물량 매도 허용

### 2. 하이브리드 자산 배분 전략

#### 자산 구조 (예시: HD현대)
- **총 운용 자산**: 약 450만원 (15주 기준, 현재가 약 301,000원)
- **Core(장기 보유)**: 5주
  - 목표가(예: 40만원) 도달 전까지 **매도 금지**
  - 보유 수량이 이 이하로 떨어지지 않도록 보호
- **Active(트레이딩)**: 10주
  - 그리드 매매용 가용 물량
  - 매수/매도 체결 시 자동으로 신규 주문 생성

#### 안전장치
- **최소 보유 한도** (`minHoldingLimit`): Core 수량 (사용자 설정)
- **매도 금지 조건**: 보유 수량 ≤ `minHoldingLimit`인 경우 매도 주문 생성 중단
- **목표가 제한**: 매도 지정가가 목표가 미만인 경우 Core 물량 보호 로직 적용 가능

### 3. 그리드 매매 로직

#### 그리드 설정 (예시: HD현대, 그리드 간격 5,000원)
- **주문 배치 구조**:
  ```
  현재가 기준
  ↑ 매도 주문 5개 (305,000 / 310,000 / 315,000 / 320,000 / 325,000)
  ━━━━━━━━━━━━━━━━━
     현재가: 300,000원
  ━━━━━━━━━━━━━━━━━
  ↓ 매수 주문 5개 (295,000 / 290,000 / 285,000 / 280,000 / 275,000)
  ```

#### 주문 생성 규칙
- **초기 배치**: 시스템 기동 시 현재가 기준 상단/하단 그리드 주문 생성
- **체결 이벤트 대응**:
  - **매수 체결 시**:
    1. 즉시 한 칸 위(+Grid Gap) 매도 주문 생성
    2. 한 칸 아래(-Grid Gap) 신규 매수 주문 준비 (그리드 유지)
  - **매도 체결 시**:
    1. 즉시 한 칸 아래(-Grid Gap) 매수 주문 생성
    2. 한 칸 위(+Grid Gap) 신규 매도 주문 준비 (그리드 유지)

#### 제약 조건
- **매도 제한**: `보유 수량 ≤ minHoldingLimit` → 매도 주문 생성 중단
- **예수금 부족**: 잔고 확인 후 매수 주문 생성 방지
- **그리드 이탈**: 현재가가 그리드 범위를 벗어난 경우 리밸런싱

### 4. 시스템 스케줄링

| 시간 | 작업 | 설명 |
|:-----|:-----|:-----|
| **08:00** | 시스템 기동 | OAuth 2.0 인증 및 Access Token 갱신 |
| **08:30** | 사전 세팅 | 계좌 잔고 확인, 당일 기준가 설정, 기존 미체결 주문 조회 |
| **08:50** | 그리드 배치 | 활성화된 모든 종목의 현재가 기준 초기 그리드 주문 생성 |
| **09:00 ~ 15:30** | 장중 운용 | 실시간 시세 모니터링, 체결 이벤트 처리, 그리드 주문 관리 |
| **15:30** | 장 마감 처리 | 당일 미체결 주문 취소, 일일 매매 로그 기록 (P&L 계산) |

### 5. 주문 상태 관리

#### 영속성 유지
- **DB 저장 항목**:
  - 종목코드
  - 주문 번호 (키움 API `order_no`)
  - 그리드 가격 (지정가)
  - 주문 상태 (접수/체결/취소)
  - 주문 유형 (매수/매도)
  - 수량
  - 생성 시각
  - 전략 ID (어느 그리드 설정에 속하는지)

#### 동기화 로직
- **서버 재시작 시**:
  1. DB에서 활성 전략의 미체결 주문 목록 조회
  2. 키움 API로 실제 주문 상태 확인 (`ka30004` - 주문체결내역조회)
  3. 불일치 항목 자동 정정 (DB 업데이트 또는 주문 재생성)

### 6. 리밸런싱 (급변동성 대응)

#### 트리거 조건
- **시간 기반**: 1시간마다 자동 실행
- **가격 이탈**: 현재가가 그리드 범위(상단/하단)를 벗어난 경우
- **수동 트리거**: 사용자가 UI에서 "리밸런싱" 버튼 클릭

#### 리밸런싱 로직
1. 해당 종목의 모든 미체결 주문 취소
2. 현재가 기준으로 그리드 재계산
3. 신규 그리드 주문 생성 (상단 + 하단)
4. DB 및 로그 업데이트

### 7. 모니터링 및 알림

#### 실시간 알림 (텔레그램/슬랙)
- **체결 알림**: 매수/매도 체결 시 종목명, 가격, 수량, 수익률 전송
- **에러 알림**: API 에러, 토큰 만료, 예수금 부족 등
- **일일 리포트**: 장 마감 후 당일 거래 내역 요약 (종목별 총 매수/매도 횟수, P&L)

#### 대시보드 (Frontend)
- **전략 목록**: 활성화된 모든 종목의 전략 카드 (종목명, 상태, 손익)
- **종목별 상세**:
  - **실시간 잔고**: 보유 수량, 평균 단가, 평가 손익
  - **활성 주문 목록**: 현재 그리드에 배치된 주문 (가격, 수량, 상태)
  - **체결 히스토리**: 최근 10개 체결 내역
- **P&L 차트**: 일별/주별 누적 수익 그래프 (전체 및 종목별)

## 🔌 API 명세

### 필요한 키움 REST API

#### 1. ka10001 - 주식기본정보요청

**용도**: 현재가, 호가 조회 (그리드 배치 시 기준가)

**Request**:
```typescript
{
  stk_cd: string  // 종목코드 (6자리, 예: "034020")
}
```

**Response**:
```typescript
{
  cur_prc: string;     // 현재가
  stk_nm: string;      // 종목명
  // ... 기타 필드
}
```

#### 2. ka30001 - 주식주문(현금)

**용도**: 매수/매도 주문 생성

**Request**:
```typescript
{
  acnt_no: string;          // 계좌번호
  acnt_pswd: string;        // 계좌비밀번호
  order_tp: "1" | "2";      // 1: 매도, 2: 매수
  stk_cd: string;           // 종목코드 (6자리)
  qty: string;              // 주문수량
  pric: string;             // 지정가
  exec_tp: "0";             // 0: 지정가
  ctac_tlno: string;        // 연락처
}
```

**Response**:
```typescript
{
  koreq_ord_no: string;     // 한국거래소 주문번호 (저장 필요)
  return_code: string;      // "00000" = 성공
  return_msg: string;
}
```

#### 3. ka30003 - 주식정정취소주문(현금)

**용도**: 미체결 주문 취소 (리밸런싱 시)

**Request**:
```typescript
{
  acnt_no: string;
  acnt_pswd: string;
  org_order_no: string;     // 원주문번호
  order_tp: "3";            // 3: 취소
  qty: string;              // 취소 수량
  pric: "0";                // 취소는 0
}
```

#### 4. ka30004 - 주문체결내역조회

**용도**: 체결 이벤트 확인, 미체결 주문 조회

**Request**:
```typescript
{
  acnt_no: string;
  inqr_strt_dt: string;     // YYYYMMDD
  inqr_end_dt: string;      // YYYYMMDD
  stk_cd?: string;          // 종목코드 (선택)
  cntr_yn: "0";             // 연속조회 여부
}
```

**Response**:
```typescript
{
  ord_exec_dtl_inqr: Array<{
    ord_no: string;         // 주문번호
    ord_tp: string;         // 주문유형
    stk_cd: string;         // 종목코드
    qty: string;            // 주문수량
    exec_qty: string;       // 체결수량
    cntr_pric: string;      // 체결가격
    ord_stts: string;       // 주문상태 (접수/체결/취소)
  }>
}
```

#### 5. ka30007 - 계좌잔고조회

**용도**: 보유 수량, 예수금 확인

**Request**:
```typescript
{
  acnt_no: string;
  inqr_tp: "1";             // 1: 전체
  stk_tp: "0";              // 0: 전체
}
```

**Response**:
```typescript
{
  acnt_bln_dtl_inqr: {
    deposit_amt: string;    // 예수금
    buy_pwr: string;        // 매수 가능 금액
  },
  acnt_bln_rsp: Array<{
    stk_cd: string;
    stk_nm: string;
    hold_qty: string;       // 보유수량
    avg_buy_pric: string;   // 평균단가
    cur_pric: string;       // 현재가
  }>
}
```

#### 6. ka10040 - 주식종목조회

**용도**: 종목 검색 (자동완성)

**Request**:
```typescript
{
  stk_nm?: string;          // 종목명 (부분 검색)
  stk_cd?: string;          // 종목코드 (부분 검색)
}
```

### API 호출 전략

#### Rate Limiting 준수
- **키움 API 제한**: 초당 20회
- **주문 API**: 초당 5회 이하로 제한 (안전 마진)
- **배치 처리**: 초기 그리드 주문을 500ms 간격으로 분산 생성
- **다중 종목**: 종목별 주문 생성 시 순차 처리 (동시 처리 시 Rate Limit 초과 방지)

#### 토큰 관리
- **Access Token 만료**: 24시간
- **Refresh Token**: 만료 1시간 전 자동 갱신
- **재인증 로직**: 401 에러 발생 시 자동으로 토큰 갱신 후 재시도

## 📦 데이터 모델

### Zod 스키마

```typescript
import { z } from "zod";

/**
 * 그리드 전략 설정
 */
export const gridStrategySchema = z.object({
  /** 전략 ID */
  id: z.string().optional(),

  /** 종목코드 */
  stockCode: z.string().length(6),

  /** 종목명 */
  stockName: z.string(),

  /** 그리드 간격 (원) */
  gridGap: z.number().int().min(1000).max(100000),

  /** 상단 그리드 개수 */
  upperGridCount: z.number().int().min(1).max(20),

  /** 하단 그리드 개수 */
  lowerGridCount: z.number().int().min(1).max(20),

  /** 그리드당 주문 수량 */
  quantityPerGrid: z.number().int().min(1),

  /** 최소 보유 수량 (Core) */
  minHoldingLimit: z.number().int().min(0),

  /** 목표가 (원, 선택사항) */
  targetPrice: z.number().int().min(0).optional(),

  /** 전략 활성화 여부 */
  isActive: z.boolean(),
});

/**
 * 그리드 주문
 */
export const gridOrderSchema = z.object({
  /** 주문 ID */
  id: z.string().optional(),

  /** 전략 ID */
  strategyId: z.string(),

  /** 종목코드 */
  stockCode: z.string().length(6),

  /** 주문 번호 (키움 API) */
  orderId: z.string(),

  /** 주문 유형 */
  orderType: z.enum(["BUY", "SELL"]),

  /** 그리드 가격 (지정가) */
  gridPrice: z.number().int(),

  /** 수량 */
  quantity: z.number().int().min(1),

  /** 주문 상태 */
  status: z.enum(["PENDING", "FILLED", "CANCELLED"]),

  /** 생성 시각 */
  createdAt: z.date(),

  /** 체결 시각 */
  filledAt: z.date().optional(),
});

/**
 * 체결 이벤트
 */
export const fillEventSchema = z.object({
  /** 이벤트 ID */
  id: z.string().optional(),

  /** 전략 ID */
  strategyId: z.string(),

  /** 종목코드 */
  stockCode: z.string().length(6),

  /** 원 주문 번호 */
  orderId: z.string(),

  /** 체결가 */
  fillPrice: z.number().int(),

  /** 체결 수량 */
  fillQuantity: z.number().int(),

  /** 체결 시각 */
  fillTime: z.date(),

  /** 주문 유형 */
  orderType: z.enum(["BUY", "SELL"]),

  /** 손익 (매도 시에만 계산) */
  profitLoss: z.number().optional(),
});

export type GridStrategy = z.infer<typeof gridStrategySchema>;
export type GridOrder = z.infer<typeof gridOrderSchema>;
export type FillEvent = z.infer<typeof fillEventSchema>;
```

### 데이터베이스 스키마 (Prisma)

```prisma
model GridStrategy {
  id               String   @id @default(cuid())
  stockCode        String   @db.VarChar(6)
  stockName        String
  gridGap          Int
  upperGridCount   Int
  lowerGridCount   Int
  quantityPerGrid  Int
  minHoldingLimit  Int
  targetPrice      Int?
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  orders           GridOrder[]
  fillEvents       FillEvent[]

  @@index([stockCode])
  @@index([isActive])
}

model GridOrder {
  id               String      @id @default(cuid())
  strategyId       String
  stockCode        String      @db.VarChar(6)
  orderId          String      @unique  // 키움 주문번호
  orderType        OrderType
  gridPrice        Int
  quantity         Int
  status           OrderStatus @default(PENDING)
  createdAt        DateTime    @default(now())
  filledAt         DateTime?

  strategy         GridStrategy @relation(fields: [strategyId], references: [id], onDelete: Cascade)
  fillEvent        FillEvent?

  @@index([strategyId, status])
  @@index([stockCode])
  @@index([orderId])
}

model FillEvent {
  id               String   @id @default(cuid())
  strategyId       String
  stockCode        String   @db.VarChar(6)
  orderId          String   @unique
  fillPrice        Int
  fillQuantity     Int
  fillTime         DateTime
  orderType        OrderType
  profitLoss       Int?     // 계산된 손익

  strategy         GridStrategy @relation(fields: [strategyId], references: [id], onDelete: Cascade)
  order            GridOrder @relation(fields: [orderId], references: [id])

  @@index([strategyId, fillTime])
  @@index([stockCode])
}

enum OrderType {
  BUY
  SELL
}

enum OrderStatus {
  PENDING
  FILLED
  CANCELLED
}
```

## 🎨 UI/UX

### 레이아웃

```
┌──────────────────────────────────────────────────────────┐
│  그리드 트레이더                                          │
│  박스권 자동 매매 시스템                                  │
├──────────────────────────────────────────────────────────┤
│  ┌─ 전략 목록 (상단) ──────────────────────────────┐   │
│  │                                                    │   │
│  │  [+ 새 전략 추가]                                  │   │
│  │                                                    │   │
│  │  ┌─────────────────────────────────────────┐      │   │
│  │  │ HD현대 (034020)                 🟢 활성 │      │   │
│  │  │ 현재가: 301,000원 | 그리드: 5,000원     │      │   │
│  │  │ 평가손익: +72,000원 (+2.03%)            │      │   │
│  │  │ [상세보기] [중지] [삭제]                │      │   │
│  │  └─────────────────────────────────────────┘      │   │
│  │                                                    │   │
│  │  ┌─────────────────────────────────────────┐      │   │
│  │  │ 삼성전자 (005930)               🔴 중지 │      │   │
│  │  │ 현재가: 70,000원 | 그리드: 1,000원      │      │   │
│  │  │ 평가손익: -15,000원 (-1.2%)             │      │   │
│  │  │ [상세보기] [시작] [삭제]                │      │   │
│  │  └─────────────────────────────────────────┘      │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌─ 전략 상세 (선택 시 표시) ──────────────────────┐   │
│  │                                                    │   │
│  │  HD현대 (034020) - 그리드 트레이더                │   │
│  │                                                    │   │
│  │  ┌─ 설정 ──────────────────────────────────┐      │   │
│  │  │ 종목: [034020 - HD현대] [검색]           │      │   │
│  │  │ 그리드 간격: [5000]원                     │      │   │
│  │  │ 상/하단 개수: [5] / [5]                   │      │   │
│  │  │ 그리드당 수량: [1]주                      │      │   │
│  │  │ 최소 보유: [5]주  목표가: [400000]원     │      │   │
│  │  │                                           │      │   │
│  │  │ [저장] [리밸런싱]                         │      │   │
│  │  └───────────────────────────────────────────┘      │   │
│  │                                                    │   │
│  │  ┌─ 실시간 잔고 ───────────────────────────┐      │   │
│  │  │ 보유 수량: 12주                           │      │   │
│  │  │ 평균 단가: 295,000원                      │      │   │
│  │  │ 현재가: 301,000원                         │      │   │
│  │  │ 평가 손익: +72,000원 (+2.03%)             │      │   │
│  │  │                                           │      │   │
│  │  │ 예수금: 1,250,000원                       │      │   │
│  │  └───────────────────────────────────────────┘      │   │
│  │                                                    │   │
│  │  ┌─ 활성 주문 ─────────────────────────────┐      │   │
│  │  │ 총 10개 주문 활성화 중                    │      │   │
│  │  │                                           │      │   │
│  │  │ [Table]                                   │      │   │
│  │  │ 주문번호│유형│가격│수량│상태│시각        │      │   │
│  │  │ ──────────────────────────────────────   │      │   │
│  │  │ 12345678│매도│325,000│1│대기│09:05    │      │   │
│  │  │ ...     │매도│...    │ │   │         │      │   │
│  │  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │      │   │
│  │  │      현재가: 300,000원                    │      │   │
│  │  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │      │   │
│  │  │ 12345673│매수│295,000│1│대기│09:05    │      │   │
│  │  │ ...     │매수│...    │ │   │         │      │   │
│  │  └───────────────────────────────────────────┘      │   │
│  │                                                    │   │
│  │  ┌─ 체결 히스토리 ─────────────────────────┐      │   │
│  │  │ 최근 10개 체결 내역                       │      │   │
│  │  │                                           │      │   │
│  │  │ [Table]                                   │      │   │
│  │  │ 시각│유형│체결가│수량│손익│누적P&L      │      │   │
│  │  │ ──────────────────────────────────────   │      │   │
│  │  │ 14:23│매도│315,000│1│+7,000│+45,000  │      │   │
│  │  │ 13:15│매수│308,000│1│  -   │+38,000  │      │   │
│  │  │ ...                                       │      │   │
│  │  └───────────────────────────────────────────┘      │   │
│  └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### 필요한 Shadcn 컴포넌트

```bash
npx shadcn@latest add form input button card table badge switch separator alert dialog select
```

**컴포넌트 용도**:
- `form`: 전략 설정 폼
- `input`: 숫자/텍스트 입력 (그리드 간격, 수량 등)
- `button`: 제어 버튼
- `card`: 전략 카드, 섹션 카드
- `table`: 주문/체결 테이블
- `badge`: 상태 표시 (활성/중지)
- `switch`: 전략 On/Off
- `separator`: 구분선
- `alert`: 알림 메시지
- `dialog`: 전략 추가/수정 모달
- `select`: 종목 검색 (자동완성)

## 🏗️ 기술 스택 및 아키텍처

### 아키텍처 개요

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js App Router)                          │
│  - 전략 목록 및 상세 대시보드                            │
│  - 종목 검색 및 전략 설정 폼                             │
└─────────────────────────────────────────────────────────┘
                        ↓↑ (Server Actions)
┌─────────────────────────────────────────────────────────┐
│  Backend (Next.js Server)                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Cron Jobs (node-cron)                          │   │
│  │  - 08:00: 토큰 갱신                              │   │
│  │  - 08:30: 사전 세팅                              │   │
│  │  - 08:50: 활성 전략의 그리드 배치                │   │
│  │  - 15:30: 미체결 취소 및 로그 기록              │   │
│  │  - 매시간: 리밸런싱 체크                         │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Grid Trading Engine                            │   │
│  │  - 전략별 독립적 관리                            │   │
│  │  - 체결 이벤트 감지 (Polling 1초 간격)          │   │
│  │  - 신규 주문 생성                                │   │
│  │  - 리밸런싱 로직                                 │   │
│  │  - Rate Limiting 제어                            │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Server Actions                                 │   │
│  │  - createStrategy.action.ts (전략 생성)          │   │
│  │  - updateStrategy.action.ts (전략 수정)          │   │
│  │  - deleteStrategy.action.ts (전략 삭제)          │   │
│  │  - placeOrder.action.ts (주문 생성)              │   │
│  │  - cancelOrder.action.ts (주문 취소)             │   │
│  │  - getAccountBalance.action.ts (잔고 조회)       │   │
│  │  - searchStock.action.ts (종목 검색)             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                        ↓↑ (REST API)
┌─────────────────────────────────────────────────────────┐
│  키움증권 REST API                                       │
│  - ka30001 (주문), ka30003 (취소), ka30004 (체결조회)   │
│  - ka30007 (계좌잔고), ka10001 (주식기본정보)           │
│  - ka10040 (주식종목조회)                                │
└─────────────────────────────────────────────────────────┘
                        ↓↑
┌─────────────────────────────────────────────────────────┐
│  Database (Prisma + PostgreSQL/SQLite)                  │
│  - GridStrategy, GridOrder, FillEvent                   │
└─────────────────────────────────────────────────────────┘
```

### 상세 기술 스택

- **Frontend**: Next.js 16 (App Router) + TypeScript
- **Backend**:
  - **Cron**: `node-cron` (시간별 자동화)
  - **Server Actions**: 전략/주문 관리 (FSD `api/` 세그먼트)
- **Database**: Prisma + PostgreSQL (또는 SQLite)
- **Validation**: Zod
- **UI**: Shadcn UI + Tailwind CSS
- **알림**: 텔레그램 Bot API (또는 슬랙 Webhook)
- **State Management**:
  - **서버 상태**: DB (영속성)
  - **클라이언트 상태**: Zustand (선택된 전략 ID)

### 체결 감지 전략

**Polling 방식** (WebSocket 대신):
- **이유**: 키움 WebSocket은 실시간 시세 전용, 체결 이벤트는 REST API로만 조회 가능
- **간격**: 1초마다 `ka30004` (주문체결내역조회) 호출
- **필터링**: 활성 전략의 종목만 조회, 최근 1분 내 체결 내역만 처리하여 중복 방지
- **Rate Limit**: 전략 개수에 따라 조회 간격 조정 (예: 3개 전략 → 3초마다 각 1회씩)

## ✅ 구현 체크리스트

### Phase 1: 단일 종목 핵심 기능 (v1.0)

#### Database 설계
- [ ] Prisma 스키마 작성 (`GridStrategy`, `GridOrder`, `FillEvent`)
- [ ] 마이그레이션 실행
- [ ] Seed 데이터 생성 (예시: HD현대 기본 설정)

#### 종목 선택 및 전략 관리
- [ ] 종목 검색 UI (`ui/StockSearchInput.tsx`)
- [ ] 전략 설정 폼 (`ui/GridStrategyForm.tsx`)
- [ ] Server Actions 작성
  - [ ] `api/createStrategy.action.ts` (전략 생성)
  - [ ] `api/updateStrategy.action.ts` (전략 수정)
  - [ ] `api/deleteStrategy.action.ts` (전략 삭제)
  - [ ] `api/searchStock.action.ts` (ka10040 - 종목 검색)

#### 키움 API 연동
- [ ] Server Actions 작성
  - [ ] `api/placeOrder.action.ts` (ka30001)
  - [ ] `api/cancelOrder.action.ts` (ka30003)
  - [ ] `api/getOrders.action.ts` (ka30004)
  - [ ] `api/getAccountBalance.action.ts` (ka30007)
  - [ ] `api/getCurrentPrice.action.ts` (ka10001)
- [ ] 토큰 관리 로직 (만료 감지 및 자동 갱신)
- [ ] Rate Limiting 제어 (초당 5회 주문 제한)

#### 그리드 트레이딩 엔진
- [ ] 그리드 계산 로직 (`lib/calculateGrid.ts`)
- [ ] 초기 그리드 배치 (`lib/deployGrid.ts`)
- [ ] 체결 감지 Polling (`lib/pollFills.ts`)
- [ ] 신규 주문 생성 로직 (`lib/handleFillEvent.ts`)
- [ ] 리밸런싱 로직 (`lib/rebalanceGrid.ts`)

#### Cron Jobs
- [ ] 08:00 - 토큰 갱신
- [ ] 08:30 - 사전 세팅 (잔고 확인, 기존 주문 조회)
- [ ] 08:50 - 활성 전략의 초기 그리드 배치
- [ ] 09:00~15:30 - 체결 감지 Polling (1초 간격)
- [ ] 15:30 - 미체결 취소 및 일일 로그 기록
- [ ] 매시간 - 리밸런싱 체크

#### Frontend UI
- [ ] Shadcn 컴포넌트 설치
- [ ] UI 컴포넌트 작성
  - [ ] `ui/StrategyList.tsx` (전략 목록)
  - [ ] `ui/StrategyCard.tsx` (전략 카드)
  - [ ] `ui/GridStrategyForm.tsx` (설정 폼)
  - [ ] `ui/StockSearchInput.tsx` (종목 검색)
  - [ ] `ui/AccountBalance.tsx` (잔고 카드)
  - [ ] `ui/ActiveOrdersTable.tsx` (활성 주문 테이블)
  - [ ] `ui/FillHistoryTable.tsx` (체결 히스토리)
- [ ] 페이지 통합
  - [ ] `app/trading-system/grid-trader/page.tsx` (전략 목록)
  - [ ] `app/trading-system/grid-trader/[strategyId]/page.tsx` (전략 상세)
- [ ] 실시간 업데이트 (1초 간격 polling)

### Phase 2: 알림 및 모니터링 (v2.0)

- [ ] 텔레그램 Bot 연동
  - [ ] 체결 알림 (종목별)
  - [ ] 에러 알림
  - [ ] 일일 리포트 (전체 및 종목별)
- [ ] 대시보드 고도화
  - [ ] 전체 P&L 차트 (일별/주별)
  - [ ] 종목별 P&L 차트
  - [ ] 체결 통계 (평균 수익률, 승률 등)

### Phase 3: 다중 종목 지원 (v3.0)

- [ ] 다중 전략 동시 실행
  - [ ] 전략별 독립적 체결 감지
  - [ ] 전략별 Rate Limiting 분배
- [ ] 전략 복사 기능
- [ ] 전략 템플릿 저장/불러오기
- [ ] 동적 그리드 간격 조정 (변동성 기반)
- [ ] 백테스팅 시뮬레이터

## 🧪 테스트 계획

### 단위 테스트

1. 그리드 계산 로직 (종목별)
2. 체결 이벤트 핸들러
3. 리밸런싱 로직
4. Rate Limiting 제어
5. 전략 CRUD 로직

### 통합 테스트

1. 전체 주문 플로우 (생성 → 체결 → 신규 주문)
2. 다중 전략 동시 실행
3. 토큰 만료 및 재발급
4. 예수금 부족 시나리오
5. 리밸런싱 트리거

### 시뮬레이션 테스트

1. 모의 체결 데이터로 24시간 운영 시뮬레이션
2. 다중 종목 동시 운영
3. 급변동성 시나리오 (Gap 상승/하락)
4. API 에러 복구 시나리오

## 📊 성능 지표

| 지표 | 목표 | 설명 |
|:-----|:-----|:-----|
| **체결 감지 지연** | < 2초 | 체결 발생부터 신규 주문 생성까지 |
| **주문 생성 속도** | < 500ms | API 호출 완료까지 |
| **리밸런싱 시간** | < 10초 | 10개 주문 취소 및 재생성 |
| **시스템 가동률** | > 99% | 장 시작부터 종료까지 안정 운영 |
| **API 에러율** | < 1% | Rate Limit 준수 및 재시도 로직 |
| **다중 전략 지원** | 최대 10개 | 동시 실행 가능한 전략 개수 (Phase 3) |

## 🚨 주의사항

### API 관련
1. **Rate Limiting**: 초당 20회 제한, 주문은 초당 5회 이하로 안전 마진 확보
2. **다중 전략**: 전략별 주문 생성 시 순차 처리하여 Rate Limit 초과 방지
3. **토큰 만료**: 24시간마다 자동 갱신, 매일 08:00에 수동 갱신
4. **계좌 비밀번호**: 환경변수 암호화 저장 (`.env.local`)

### 리스크 관리
5. **최소 보유 한도**: Core 수량은 절대 매도 금지 (코드 레벨 보호)
6. **예수금 부족**: 매수 주문 생성 전 반드시 잔고 확인
7. **급변동성**: 1시간마다 리밸런싱으로 그리드 이탈 방지
8. **목표가 제한**: 설정된 목표가 미만 매도 시 Core 물량 보호

### 운영
9. **장 마감 후 정리**: 미체결 주문 자동 취소, 익일 재배치
10. **서버 재시작**: DB 동기화 로직으로 미체결 주문 복구
11. **수동 개입**: 긴급 시 전략 중지 버튼으로 즉시 중단 가능
12. **전략 삭제**: 미체결 주문이 있는 전략 삭제 시 경고 및 자동 취소

### 법적 책임
13. **투자 책임**: 자동 매매 시스템 사용에 따른 손실은 사용자 책임
14. **테스트 계좌**: 실전 운영 전 모의투자 계좌로 충분히 테스트
15. **알고리즘 규제**: 키움증권 약관 및 금융당국 규제 준수

## 🔗 관련 문서

- [API 가이드](../../api-guide.md)
- [아키텍처](../../architecture.md)
- [코딩 규칙](../../coding-standards.md)
- [개발 가이드](../../development.md)
- [키움 API 명세](../../api/README.md)

## 📝 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|:-----|:-----|:----------|:-------|
| v1.0 | 2026-04-30 | 초기 작성 - 범용 박스권 그리드 트레이딩 시스템 PRD | User |
