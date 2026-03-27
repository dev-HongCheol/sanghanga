# PRD: 거래대금 기반 종목 검색

## 📋 문서 정보

| 항목 | 내용 |
|:-----|:-----|
| **작성일** | 2026-03-27 |
| **작성자** | Claude |
| **상태** | 📝 작성중 |
| **버전** | v1.0 |
| **우선순위** | High |

## 🎯 개요

### 목적

거래대금, 시가총액, 상승 패턴 등 **다중 조건**을 조합하여 투자 기회를 발굴하는 종목 검색 기능을 구현합니다.

### 메뉴 위치

- **상위 메뉴**: 종목 발굴
- **하위 메뉴**: 거래대금 기반
- **라우터**: `/stock-discovery/trading-volume`

### 핵심 가치

- **효율적 검색**: 교집합 방식으로 API 호출 최소화 (7200회 → 13~43회, 99% 감소)
- **동적 필터링**: 모든 조건을 UI에서 실시간 조정 가능
- **빠른 응답**: 초 단위 응답 속도
- **직관적 UX**: Shadcn UI 기반 모던 인터페이스

### 배경

기존 전체 종목 스캔 방식은 비효율적이므로, **각 조건별 상위 N개를 교집합**하는 방식으로 구현하여 성능을 대폭 개선합니다.

## 🔍 기능 요구사항

### 1. 필터 조건 (4가지)

#### [A] 시가총액 필터

- **조건**: 시가총액 N억원 이상
- **기본값**: 1000억원
- **활성화**: 체크박스로 On/Off
- **입력**: 숫자 입력 (억 단위)

#### [B] 전일 거래대금 필터

- **조건**: 전일 N봉전 거래대금 M억원 이상, 상위 K개
- **기본값**:
  - 주기: 일봉
  - 봉 오프셋: 1봉전
  - 최소값: 100억원
  - 상위 개수: 50개
- **활성화**: 체크박스로 On/Off
- **입력**:
  - 주기: 일/주/월 선택
  - 봉 오프셋: 숫자 입력
  - 최소값: 숫자 입력 (억 단위)
  - 상위 개수: 숫자 입력 (1~100)

#### [C] 실시간 수급 필터

- **조건**: 실시간 N분봉 M봉전 거래대금 K억원 이상, 상위 L개
- **기본값**:
  - 주기: 1분봉
  - 봉 오프셋: 0봉전 (현재)
  - 최소값: 10억원
  - 상위 개수: 50개
- **활성화**: 체크박스로 On/Off
- **입력**:
  - 주기: 1/3/5/10/15/30/60분 선택
  - 봉 오프셋: 숫자 입력
  - 최소값: 숫자 입력 (억 단위)
  - 상위 개수: 숫자 입력 (1~100)

#### [D] 상승 지속성 필터

- **조건**: N분봉에서 M봉 연속 상승 (종가 기준), 상위 K개
- **기본값**:
  - 주기: 1분봉
  - 연속 봉 개수: 3봉
  - 방향: 상승
  - 가격 기준: 종가
  - 상위 개수: 50개
- **활성화**: 체크박스로 On/Off
- **입력**:
  - 주기: 1/3/5/10/15/30/60분 선택
  - 연속 봉 개수: 숫자 입력
  - 방향: 상승/하락 선택
  - 가격 기준: 종가/고가/저가 선택
  - 상위 개수: 숫자 입력 (1~100)

### 2. 시장 선택

- **옵션**: 전체 / 코스피 / 코스닥
- **기본값**: 전체
- **UI**: 라디오 버튼 또는 탭

### 3. 검색 실행

- **트리거**: "검색" 버튼 클릭
- **처리 방식**: Server Action (`searchStocksAction`)
- **프로세스** (모두 서버 측에서 실행):
  1. 활성화된 필터만 적용
  2. 각 필터별 상위 N개 조회 (병렬)
  3. 교집합 계산
  4. 상세 조건 검증 (시가총액, 분봉 패턴)
  5. 가공된 결과를 클라이언트로 반환
  6. 결과 테이블에 표시

### 4. 결과 테이블

| 컬럼 | 설명 |
|:-----|:-----|
| 종목코드 | 6자리 코드 |
| 종목명 | 한글 종목명 |
| 현재가 | 실시간 가격 |
| 등락률 | 전일 대비 % |
| 시가총액 | 억원 단위 |
| 전일 거래대금 | 억원 단위 |
| 당일 거래대금 | 억원 단위 |
| 1분봉 패턴 | 상승/하락 아이콘 |

### 5. 부가 기능

- **초기화**: 모든 필터를 기본값으로 리셋
- **프리셋 저장** (v2): 자주 쓰는 조건 저장
- **실시간 갱신** (v2): 1분마다 자동 재검색

## 🔌 API 명세

### API 호출 순서

**실행 위치**: Server Action (`api/searchStocks.action.ts`)

```
Step 1: 각 필터별 상위 N개 조회 (병렬 처리)
├─ ka10031 (전일거래량상위요청) - qry_tp=2 (거래대금)
├─ ka10030 (당일거래량상위요청) - sort_tp=3 (거래대금)
└─ ka10027 (전일대비등락률상위요청) - sort_tp=1 (상승률)

Step 2: 교집합 계산 (서버)

Step 3: 교집합 각 종목 상세 검증 (병렬 처리)
├─ ka10001 (주식기본정보요청) - 시가총액 체크
└─ ka10080 (주식분봉차트조회요청) - 연속 상승 패턴 체크

Step 4: 최종 결과 반환
└─ { success: true, results: ScreenerResult[] }
```

**장점**:
- 클라이언트에서 API 호출 0회 (모든 호출은 서버에서 처리)
- 병렬 처리로 성능 최적화
- 민감한 API 키 노출 방지

### API 상세

#### 1. ka10031 - 전일거래량상위요청

**용도**: [B] 전일 거래대금 필터

**Request**:
```typescript
{
  mrkt_tp: "000" | "001" | "101",  // 전체/코스피/코스닥
  qry_tp: "2",                      // 2: 전일거래대금
  rank_strt: "0",
  rank_end: string,                 // topN (기본값: "50")
  stex_tp: "3"                      // 3: 통합
}
```

**Response**:
```typescript
{
  pred_trde_qty_upper: Array<{
    stk_cd: string;      // 종목코드
    stk_nm: string;      // 종목명
    cur_prc: string;     // 현재가
    trde_qty: string;    // 거래량
    // 거래대금 = trde_qty × cur_prc (계산 필요)
  }>
}
```

#### 2. ka10030 - 당일거래량상위요청

**용도**: [C] 실시간 수급 필터

**Request**:
```typescript
{
  mrkt_tp: "000" | "001" | "101",
  sort_tp: "3",                     // 3: 거래대금
  mang_stk_incls: "0",              // 0: 전체
  crd_tp: "0",
  trde_qty_tp: "0",
  pric_tp: "0",
  trde_prica_tp: string,            // minVolume 조건 (예: "100" = 10억)
  mrkt_open_tp: "0",
  stex_tp: "3"
}
```

**Response**:
```typescript
{
  tdy_trde_qty_upper: Array<{
    stk_cd: string;
    stk_nm: string;
    cur_prc: string;
    trde_amt: string;    // 거래금액 (백만원 단위)
    flu_rt: string;      // 등락률
  }>
}
```

#### 3. ka10027 - 전일대비등락률상위요청

**용도**: [D] 상승 지속성 필터 (1차 필터링)

**Request**:
```typescript
{
  mrkt_tp: "000" | "001" | "101",
  sort_tp: "1",                     // 1: 상승률
  trde_qty_cnd: "0000",
  stk_cnd: "0",
  crd_cnd: "0",
  updown_incls: "1",                // 1: 상하한 포함
  pric_cnd: "0",
  trde_prica_cnd: string,           // minVolume 조건
  stex_tp: "3"
}
```

**Response**:
```typescript
{
  pred_pre_flu_rt_upper: Array<{
    stk_cd: string;
    stk_nm: string;
    cur_prc: string;
    flu_rt: string;      // 등락률 (양수 = 상승)
  }>
}
```

#### 4. ka10001 - 주식기본정보요청

**용도**: [A] 시가총액 검증

**Request**:
```typescript
{
  stk_cd: string  // 종목코드
}
```

**Response**:
```typescript
{
  mac: string;           // 시가총액 (억원 단위)
  cur_prc: string;       // 현재가
  stk_nm: string;        // 종목명
  // ... 기타 필드
}
```

#### 5. ka10080 - 주식분봉차트조회요청

**용도**: [D] 상승 지속성 검증

**Request**:
```typescript
{
  stk_cd: string,
  tic_scope: "1" | "3" | "5" | "10" | "15" | "30" | "60",  // 분봉 주기
  upd_stkpc_tp: "1",                                        // 수정주가
  base_dt?: string                                          // YYYYMMDD (선택)
}
```

**Response**:
```typescript
{
  stk_min_pole_chart_qry: Array<{
    cur_prc: string;     // 종가
    trde_qty: string;    // 거래량
    cntr_tm: string;     // 체결시간
    open_pric: string;
    high_pric: string;
    low_pric: string;
  }>
}
```

## 📦 데이터 모델

### Zod 스키마

```typescript
import { z } from "zod";

/**
 * 시장 구분
 */
export const marketSchema = z.enum(["ALL", "KOSPI", "KOSDAQ"]);

/**
 * 분봉 주기
 */
export const candlePeriodSchema = z.union([
  z.literal(1),
  z.literal(3),
  z.literal(5),
  z.literal(10),
  z.literal(15),
  z.literal(30),
  z.literal(60),
]);

/**
 * 일/주/월 주기
 */
export const dailyPeriodSchema = z.enum(["daily", "weekly", "monthly"]);

/**
 * [A] 시가총액 필터
 */
export const marketCapFilterSchema = z.object({
  /** 필터 활성화 여부 */
  enabled: z.boolean(),
  /** 최소 시가총액 (억원) */
  min: z.number().int().min(0).default(1000),
});

/**
 * [B] 전일 거래대금 필터
 */
export const prevDayVolumeFilterSchema = z.object({
  /** 필터 활성화 여부 */
  enabled: z.boolean(),
  /** 주기 (일/주/월) */
  period: dailyPeriodSchema.default("daily"),
  /** 봉 오프셋 (몇 봉전) */
  candleOffset: z.number().int().min(0).default(1),
  /** 최소 거래대금 (억원) */
  min: z.number().int().min(0).default(100),
  /** 상위 개수 */
  topN: z.number().int().min(1).max(100).default(50),
});

/**
 * [C] 실시간 수급 필터
 */
export const realtimeVolumeFilterSchema = z.object({
  /** 필터 활성화 여부 */
  enabled: z.boolean(),
  /** 분봉 주기 */
  period: candlePeriodSchema.default(1),
  /** 봉 오프셋 (몇 봉전) */
  candleOffset: z.number().int().min(0).default(0),
  /** 최소 거래대금 (억원) */
  min: z.number().int().min(0).default(10),
  /** 상위 개수 */
  topN: z.number().int().min(1).max(100).default(50),
});

/**
 * [D] 상승 지속성 필터
 */
export const trendFilterSchema = z.object({
  /** 필터 활성화 여부 */
  enabled: z.boolean(),
  /** 분봉 주기 */
  period: candlePeriodSchema.default(1),
  /** 연속 봉 개수 */
  consecutiveBars: z.number().int().min(2).max(10).default(3),
  /** 방향 (상승/하락) */
  direction: z.enum(["up", "down"]).default("up"),
  /** 가격 기준 (종가/고가/저가) */
  priceType: z.enum(["close", "high", "low"]).default("close"),
  /** 상위 개수 */
  topN: z.number().int().min(1).max(100).default(50),
});

/**
 * 전체 스크리너 필터 폼
 */
export const stockScreenerFormSchema = z.object({
  /** 시장 선택 */
  market: marketSchema.default("ALL"),

  /** [A] 시가총액 필터 */
  marketCap: marketCapFilterSchema,

  /** [B] 전일 거래대금 필터 */
  prevDayVolume: prevDayVolumeFilterSchema,

  /** [C] 실시간 수급 필터 */
  realtimeVolume: realtimeVolumeFilterSchema,

  /** [D] 상승 지속성 필터 */
  trend: trendFilterSchema,
});

export type StockScreenerFormValues = z.infer<typeof stockScreenerFormSchema>;
```

### 결과 타입

```typescript
/**
 * 스크리너 검색 결과 (단일 종목)
 */
export interface ScreenerResult {
  /** 종목코드 */
  stockCode: string;
  /** 종목명 */
  stockName: string;
  /** 현재가 */
  currentPrice: number;
  /** 등락률 (%) */
  changeRate: number;
  /** 시가총액 (억원) */
  marketCap: number;
  /** 전일 거래대금 (억원) */
  prevDayVolume: number;
  /** 당일 거래대금 (억원) */
  currentDayVolume: number;
  /** 1분봉 패턴 (연속 상승 여부) */
  trendPattern: "up" | "down" | "sideways";
}
```

## 🎨 UI/UX

### 레이아웃

```
┌──────────────────────────────────────────────────────────┐
│  거래대금 기반                                            │
│  거래대금, 시가총액, 상승 패턴 조건을 조합하여 종목 검색  │
├──────────────────────────────────────────────────────────┤
│  ┌─ 필터 설정 (왼쪽 사이드바) ──────────────────────┐   │
│  │                                                    │   │
│  │  [시장 선택]                                       │   │
│  │  ◉ 전체  ○ 코스피  ○ 코스닥                       │   │
│  │                                                    │   │
│  │  ☑ [A] 시가총액                                    │   │
│  │     최소: [1000] 억원                              │   │
│  │                                                    │   │
│  │  ☑ [B] 전일 거래대금                               │   │
│  │     주기: [일봉 ▼]  봉: [1]                        │   │
│  │     최소: [100] 억원                               │   │
│  │     상위: [50]개                                   │   │
│  │                                                    │   │
│  │  ☑ [C] 실시간 수급                                 │   │
│  │     주기: [1분 ▼]  봉: [0]                         │   │
│  │     최소: [10] 억원                                │   │
│  │     상위: [50]개                                   │   │
│  │                                                    │   │
│  │  ☑ [D] 상승 지속성                                 │   │
│  │     주기: [1분 ▼]                                  │   │
│  │     연속: [3]봉 [상승 ▼] ([종가 ▼] 기준)          │   │
│  │     상위: [50]개                                   │   │
│  │                                                    │   │
│  │  ┌─────────────────────────────────────────┐      │   │
│  │  │ ℹ️ 예상 API 호출: ~13회                  │      │   │
│  │  └─────────────────────────────────────────┘      │   │
│  │                                                    │   │
│  │  [검색] [초기화]                                   │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌─ 검색 결과 (메인) ────────────────────────────────┐   │
│  │                                                    │   │
│  │  총 12개 종목 발견                                 │   │
│  │                                                    │   │
│  │  [Table]                                           │   │
│  │  종목코드 │ 종목명 │ 현재가 │ 등락률 │ 시총 │ ... │   │
│  │  ─────────────────────────────────────────────    │   │
│  │  005930  │삼성전자│ 70,000│ +2.5% │ 4170억│ ... │   │
│  │  000660  │SK하이닉│105,000│ +3.1% │ 7650억│ ... │   │
│  │  ...                                               │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### 필요한 Shadcn 컴포넌트

실행 전 다음 컴포넌트를 설치하세요:

```bash
npx shadcn@latest add form input checkbox select label button card table badge switch slider tabs radio-group separator
```

**컴포넌트 용도**:
- `form`: React Hook Form 통합
- `input`: 숫자 입력 (금액, 봉 개수)
- `checkbox`: 필터 활성화 토글
- `select`: 드롭다운 (주기, 방향, 가격 기준)
- `label`: 입력 필드 라벨
- `button`: 검색/초기화 버튼
- `card`: 필터 섹션 카드
- `table`: 결과 테이블
- `badge`: 상태 표시 (상승/하락)
- `switch`: On/Off 토글 (checkbox 대안)
- `slider`: topN 슬라이더 (선택적)
- `tabs`: 시장 선택 탭
- `radio-group`: 라디오 버튼 그룹
- `separator`: 구분선

## 🏗️ 기술 스택

### 프론트엔드

- **Framework**: Next.js 16 App Router
- **언어**: TypeScript 5.x
- **폼 관리**: React Hook Form + Zod
- **UI**: Shadcn UI (Tailwind CSS)
- **서버 통신**: Server Actions ("use server")
- **상태 관리**: React useState (클라이언트 상태만)

### 아키텍처

- **레이어**: `features/trading-volume-screener`
- **페이지**: `app/stock-discovery/trading-volume/page.tsx`
- **슬라이스 구조** (FSD 표준):
  ```
  features/trading-volume-screener/
  ├── ui/
  │   ├── TradingVolumeScreenerForm.tsx  # 필터 폼 (Client Component)
  │   ├── ScreenerResultTable.tsx        # 결과 테이블 (Client Component)
  │   └── FilterSection.tsx              # 필터 섹션 컴포넌트
  ├── model/
  │   ├── screener.schema.ts             # Zod 스키마
  │   └── screener.types.ts              # TypeScript 타입
  ├── api/
  │   └── searchStocks.action.ts         # Server Action (검색 로직)
  ├── lib/
  │   ├── intersection.ts                # 교집합 계산 로직
  │   ├── validators.ts                  # 조건 검증 로직
  │   └── transformers.ts                # 데이터 변환 로직
  └── index.ts
  ```

**아키텍처 특징**:
- **FSD 표준 준수**: Server Action은 `api` 세그먼트에 배치 (FSD 공식 가이드)
- **Server Action 기반**: 모든 API 호출과 비즈니스 로직은 `api/searchStocks.action.ts`에서 처리
- **클라이언트 최소화**: UI는 폼 입력과 결과 표시만 담당
- **직접 kiwoomClient 호출**: Server Action에서 `shared/lib/kiwoom/client.ts` 직접 사용

### API 통신

- **Server Action**: `features/trading-volume-screener/api/searchStocks.action.ts`
  - "use server" 지시어 사용
  - kiwoomClient 직접 호출
  - 모든 API 로직 서버 측 실행
  - FSD `api` 세그먼트에 배치 (표준 준수)
- **Base Client**: `shared/lib/kiwoom/client.ts` (Server Action에서 사용)
- **브라우저 API Proxy**: `app/api/kiwoom/dostk/**` (사용하지 않음)

## ✅ 구현 체크리스트

### Phase 1: 기본 구조 (v1.0)

- [x] Shadcn 컴포넌트 설치
- [x] Zod 스키마 작성 (`model/screener.schema.ts`)
- [x] TypeScript 타입 정의 (`model/screener.types.ts`)
- [x] Server Action 작성
  - [x] `api/searchStocks.action.ts` (전체 검색 로직, FSD 표준)
  - [x] 병렬 API 호출 (ka10031, ka10030, ka10027)
  - [x] 교집합 계산 및 검증 (ka10001, ka10080)
  - [x] 에러 핸들링 및 로깅
- [x] 유틸리티 함수 작성
  - [x] `lib/intersection.ts` (교집합 계산)
  - [x] `lib/validators.ts` (시가총액, 분봉 패턴 검증)
  - [x] `lib/transformers.ts` (API 응답 → UI 데이터)
- [x] UI 컴포넌트 작성
  - [x] `ui/FilterSection.tsx` (개별 필터 섹션)
  - [x] `ui/TradingVolumeScreenerForm.tsx` (전체 폼)
  - [x] `ui/ScreenerResultTable.tsx` (결과 테이블)
- [x] 페이지 통합
  - [x] `app/stock-discovery/trading-volume/page.tsx` (Server Action 호출)
- [ ] 에러 핸들링 개선
  - [x] API 에러 처리 (return_code 체크)
  - [x] 폼 검증 에러 표시
  - [x] 빈 결과 처리
  - [ ] 사용자 친화적 에러 메시지
- [ ] 로딩 상태 개선
  - [ ] Skeleton UI 구현
  - [x] 로딩 스피너

### Phase 2: 고급 기능 (v2.0)

- [ ] 프리셋 저장/불러오기
- [ ] 실시간 자동 갱신 (1분 간격)
- [ ] 결과 정렬/필터링
- [ ] CSV 내보내기
- [ ] 차트 연동 (종목 클릭 시 분봉 차트)

### Phase 3: 최적화 (v3.0)

- [ ] 교집합 알고리즘 최적화
- [ ] API 응답 캐싱 (TanStack Query)
- [ ] 무한 스크롤 (결과 100개+)
- [ ] 웹워커 활용 (교집합 계산)

## 🧪 테스트 계획

### 단위 테스트 (`test-spec-unit.md`)

1. Zod 스키마 검증
2. 교집합 계산 로직
3. 조건 검증 로직 (시가총액, 분봉 패턴)
4. 데이터 변환 로직

### 통합 테스트 (`test-spec-integration.md`)

1. 전체 검색 플로우
2. API 호출 순서 및 에러 핸들링
3. 폼 제출 및 결과 렌더링
4. 교집합 크기별 시나리오

## 📊 성능 지표

| 지표 | 목표 |
|:-----|:-----|
| **API 호출 횟수** | 13~43회 (교집합 크기에 따라) |
| **응답 시간** | < 3초 (교집합 20개 기준) |
| **UI 렌더링** | < 500ms |
| **폼 검증** | < 100ms |

## 🚨 주의사항

1. **분봉 거래대금 계산**: `거래량 × 종가` 근사치 사용 (정확한 거래대금 필드 없음)
2. **API 제한**: ka10031 최대 100개, 연속조회 시 `cont-yn` 처리 필요
3. **교집합 크기**: 조건이 엄격할수록 결과 0개 가능 → 사용자에게 안내
4. **시가총액 필터**: 순위 API 없으므로 후처리로 필터링
5. **rate limiting**: API 호출 간격 조정 필요 시 구현

## 🔗 관련 문서

- [API 가이드](../../api/README.md)
- [아키텍처](../../architecture.md)
- [코딩 규칙](../../coding-standards.md)
- [개발 가이드](../../development.md)

## 📝 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|:-----|:-----|:----------|:-------|
| v1.0 | 2026-03-27 | 초기 작성 | Claude |
