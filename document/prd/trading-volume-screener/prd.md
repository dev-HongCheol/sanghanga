# PRD: 거래대금 기반 종목 검색

## 📋 문서 정보

| 항목 | 내용 |
|:-----|:-----|
| **작성일** | 2026-03-29 |
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

- **효율적 검색**: 서버 캐싱 + 배치 조회로 API 호출 99% 감소 (7200회 → 1~31회)
- **동적 필터링**: 모든 조건을 UI에서 실시간 조정 가능
- **빠른 응답**: 1~2초 내 결과 반환
- **직관적 UX**: Shadcn UI 기반 모던 인터페이스
- **현실적 기본값**: 삼성전자 등 대형주가 기본 검색되는 실용적 설정

### 배경

기존 전체 종목 스캔 방식은 비효율적이므로, **각 조건별 상위 N개를 교집합**하는 방식으로 구현하여 성능을 대폭 개선합니다.

## 🔍 기능 요구사항

### 1. 필터 조건 (4가지)

#### [A] 시가총액 필터

- **조건**: 시가총액 N억원 이상
- **기본값**: 1000억원 (기본: 비활성화)
- **활성화**: 체크박스로 On/Off
- **입력**: 숫자 입력 (억 단위)
- **참고**: 선택적으로 사용 (대형주 위주로 검색 시 활성화)

#### [B] 전일 거래대금 필터

- **조건**: 전일 거래대금 N억원 이상, 상위 M개
- **기본값**:
  - 최소값: 50억원
  - 상위 개수: 100개
- **활성화**: 체크박스로 On/Off (기본: 활성화)
- **입력**:
  - 최소값: 숫자 입력 (억 단위)
  - 상위 개수: 슬라이더 (1~100)
- **참고**: 키움 API는 전일 데이터만 제공 (고정)

#### [C] 실시간 수급 필터

- **조건**: 실시간 N분봉 M봉전 거래대금 K억원 이상, 상위 L개
- **기본값**:
  - 주기: 1분봉
  - 봉 오프셋: 0봉전 (현재)
  - 최소값: 5억원
  - 상위 개수: 100개
- **활성화**: 체크박스로 On/Off (기본: 활성화)
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
- **활성화**: 체크박스로 On/Off (기본: 비활성화)
- **입력**:
  - 주기: 1/3/5/10/15/30/60분 선택
  - 연속 봉 개수: 숫자 입력
  - 방향: 상승/하락 선택
  - 가격 기준: 종가/고가/저가 선택
  - 상위 개수: 숫자 입력 (1~100)
- **참고**: 매우 엄격한 조건이므로 필요 시에만 활성화

### 2. 시장 선택

- **옵션**: 전체 / 코스피 / 코스닥
- **기본값**: 전체
- **UI**: 라디오 버튼 또는 탭

### 3. 검색 실행

- **트리거**: "검색" 버튼 클릭
- **처리 방식**: Server Action (`searchStocksAction`)
- **페이지네이션**: 25개씩 처리 (무한 스크롤)
- **프로세스** (모두 서버 측에서 실행):
  1. 활성화된 필터만 적용
  2. 각 필터별 상위 N개 조회 (병렬)
  3. 교집합 계산 (전체 종목 수 확인)
  4. 요청한 페이지(25개)만 상세 검증 (시가총액, 분봉 패턴)
  5. 가공된 결과를 클라이언트로 반환 (`results`, `totalCount`, `hasMore`)
  6. 결과 테이블에 표시
  7. 사용자가 스크롤하면 자동으로 다음 페이지 로드

### 4. 결과 테이블

| 컬럼 | 설명 |
|:-----|:-----|
| 종목코드 | 6자리 코드 |
| 종목명 | 한글 종목명 |
| 현재가 | 실시간 가격 (색상 표시, 부호 없음) |
| 등락률 | 전일 대비 % (색상 표시, 부호 옵션) |
| 시가총액 | 억원 단위 |
| 전일 거래대금 | 억원 단위 |
| 당일 거래대금 | 억원 단위 |
| 1분봉 패턴 | 상승/하락 아이콘 |

### 5. 주가 색상 표시

**목적**: 주가/등락률 변동을 직관적으로 파악할 수 있도록 색상으로 표시

#### 색상 스킴

**한국 시장** (기본값):
- **상승**: 빨간색 (`text-red-500`)
- **하락**: 파란색 (`text-blue-500`)
- **보합**: 기본 텍스트 색상

**미국 시장**:
- **상승**: 초록색 (`text-green-500`)
- **하락**: 빨간색 (`text-red-500`)
- **보합**: 기본 텍스트 색상

#### 래퍼 컴포넌트

**컴포넌트**: `ColoredValue` (`shared/ui/ColoredValue.tsx`)

**Props**:
```typescript
interface ColoredValueProps {
  /** 표시할 값 (숫자) */
  value: number;
  /** 등락 방향 (value의 부호로 자동 판단) */
  change?: number;
  /** 부호 표시 여부 (기본값: false) */
  showSign?: boolean;
  /** 색상 스킴 (선택적, 기본값: 전역 설정) */
  colorScheme?: "korea" | "us";
  /** 추가 className */
  className?: string;
}
```

**동작**:
1. **상승/하락 판단**:
   - `change` prop이 있으면 해당 값의 부호로 판단
   - `change` prop이 없으면 `value`의 부호로 판단
2. **색상 적용**: 색상 스킴에 따라 적절한 Tailwind 색상 클래스 적용
3. **부호 표시**:
   - `showSign={true}`: 부호 표시 (예: `+2.5%`, `-35%`)
   - `showSign={false}` (기본값): 부호 제거, 절댓값만 표시 (예: `170,000`)

**전역 설정**: Zustand 스토어 (`shared/model/priceColorScheme.store.ts`)

```typescript
interface PriceColorSchemeStore {
  /** 색상 스킴 (기본값: "korea") */
  scheme: "korea" | "us";
  /** 색상 스킴 변경 */
  setScheme: (scheme: "korea" | "us") => void;
}
```

#### 사용 예시

**현재가 (항상 양수, 색상만)**:
```tsx
<ColoredValue value={170000} change={changeRate} />
// 렌더링: "170,000" (changeRate < 0이면 파란색)
```

**등락률 (부호 + 색상)**:
```tsx
<ColoredValue value={-35} showSign />
// 렌더링: "-35%" (파란색)

<ColoredValue value={2.5} showSign />
// 렌더링: "+2.5%" (빨간색)
```

**거래대금 (부호 없이 색상만)**:
```tsx
<ColoredValue value={5000} change={changeFromPrevDay} />
// 렌더링: "5,000억" (전일 대비 증가면 빨간색)
```

**정리**:
- **현재가**: `value={price}`, `change={changeRate}` → 부호 없이 색상만
- **등락률**: `value={changeRate}`, `showSign` → 부호 + 색상
- **거래대금 등**: `value={amount}`, `change={변동값}` → 범용 활용 가능

### 6. 부가 기능

- **초기화**: 모든 필터를 기본값으로 리셋
- **색상 스킴 설정**: 한국/미국 시장 색상 전환
- **무한 스크롤**: 마지막 항목이 화면에 표시되면 자동으로 다음 페이지 로드 (25개씩)
- **결과 요약**: 전체 종목 수 및 현재 표시 중인 종목 수 표시

## 🔌 API 명세

### API 호출 순서 (캐싱 최적화)

**실행 위치**: Server Action (`api/searchStocks.action.ts`)

```
[사전 준비] 마스터 데이터 캐싱 (매일 아침 1회, 백그라운드)
├─ ka10031 (전일거래량상위요청) - 전체 시장 상위 100개 → 캐시 (24시간)
├─ 전체 종목 시가총액, 상장주식수 → 캐시 (24시간)
└─ 키: `master:prev_volume:20260329`, 만료: 익일 00:00

[검색 실행] 사용자 요청 시
Step 1: 캐시된 마스터 데이터에서 1차 필터링 (API 호출 0회)
├─ 시가총액 필터 적용 (메모리 연산)
├─ 전일 거래대금 필터 적용 (캐시 조회)
└─ 후보군 압축: 100개 → 10~30개

Step 2: 실시간 데이터만 API 조회 (후보군 기준, 병렬 처리)
├─ ka10030 (당일거래량상위요청) - 상위 100개
├─ ka10080 (주식분봉차트조회요청) - 후보군 10~30개만
└─ 교집합 계산 → 최종 5~15개

Step 3: 최종 결과 반환
└─ { success: true, results: ScreenerResult[] }
```

**개선 효과**:
- **API 호출 99% 감소**: 7200회 → 1~31회 (후보군 크기에 따라)
- **응답 속도**: 수십 초 → 1~3초
- **Rate Limit 회피**: 개별 종목 조회 최소화
- **민감한 API 키 노출 방지**: 모든 호출은 서버에서 처리

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
 * [A] 시가총액 필터
 */
export const marketCapFilterSchema = z.object({
  /** 필터 활성화 여부 */
  enabled: z.boolean().default(false),
  /** 최소 시가총액 (억원) */
  min: z.number().int().min(0).default(1000),
});

/**
 * [B] 전일 거래대금 필터
 */
export const prevDayVolumeFilterSchema = z.object({
  /** 필터 활성화 여부 */
  enabled: z.boolean().default(true),
  /** 최소 거래대금 (억원) */
  min: z.number().int().min(0).default(50),
  /** 상위 개수 */
  topN: z.number().int().min(1).max(100).default(100),
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

## 🏗️ 기술 스택 및 아키텍처

### 핵심 아키텍처: REST + 캐싱 최적화 모델
본 기능은 키움 API의 초당 호출 제한을 극복하기 위해 **배치 조회(Batch Fetching)**와 **서버 사이드 캐싱**을 극대화한 구조를 채택합니다.

#### 1. 배치 조회 전략 (Batch Fetching)
개별 종목 조회를 최소화하고, 랭킹 API(`ka10030` 등)를 사용하여 한 번의 호출로 100개 종목의 데이터(현재가, 등락률, 거래대금 등)를 뭉치로 확보합니다.

**핵심 원칙**:
- 개별 API 호출(`ka10001`) 금지 → 랭킹 API로 대체
- 한 번에 최대 100개 종목 데이터 확보
- 필요한 데이터가 이미 응답에 포함되므로 추가 호출 불필요

#### 2. 서버 사이드 캐싱 (Server-side Caching)

**마스터 데이터 사전 로딩** (매일 아침 1회 백그라운드 실행):
- **전일 거래대금 상위 100개**: `ka10031` 호출 → Redis 캐시 (키: `master:prev_volume:{YYYYMMDD}`, TTL: 24시간)
- **전체 종목 기본정보**: 시가총액, 상장주식수, 업종 등 → Redis 캐시 (키: `master:stock_info:{YYYYMMDD}`, TTL: 24시간)
- **캐시 갱신 시점**: 익일 00:00 자동 만료, 첫 검색 요청 시 백그라운드 재생성

**검색 시 캐시 활용**:
1. **1차 필터링 (API 호출 0회)**:
   - 시가총액 필터 → 캐시에서 메모리 연산으로 필터링
   - 전일 거래대금 필터 → 캐시 조회로 후보군 확보
   - 후보군 압축: 7200개 → 10~30개

2. **2차 필터링 (실시간 데이터만 API 조회)**:
   - 당일 거래대금: `ka10030` (상위 100개) - 1회
   - 분봉 패턴: `ka10080` (후보군 10~30개만) - 10~30회

**Rate Limiting 방어 로직**:
- 키움 API 제한: 초당 20회
- 배치 크기: 3개씩 병렬 처리
- 배치 간 지연: 200ms (초당 15회로 안전 마진 확보)
- 교집합 크기가 클 경우 처리 시간 증가 (예: 82개 → 약 5~6초)

#### 3. 교집합 연산 (Set Intersection)
각 필터별 100개 후보군의 종목코드를 서버 메모리에서 교집합 연산하여, 상세 검증이 필요한 최종 후보군을 10~20개 내외로 압축합니다.

**연산 순서**:
```
캐시(전일 100개) ∩ API(당일 100개) ∩ 시가총액 필터 → 10~30개
→ 분봉 패턴 검증(10~30회 API) → 최종 5~15개
```

### 상세 기술 스택
- **Backend**: Next.js 15 Server Actions
- **Caching**:
  - **v1.0**: 서버 내부 LRU Cache (커스텀 구현)
  - **v2.0**: Redis (고도화 시 - 다중 서버 환경)
- **Validation**: Zod (폼 및 API 응답 검증)
- **UI**: Shadcn UI + Tailwind CSS
- **무한 스크롤**: react-intersection-observer
- **통신**: REST API 전용 (웹소켓 사용 안 함)

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

#### 백엔드 캐싱 인프라
- [x] 캐싱 시스템 구축
  - [x] `shared/lib/cache/cacheManager.ts` (LRU Cache 래퍼)
  - [x] `shared/lib/cache/masterData.ts` (마스터 데이터 로더)
  - [x] 캐시 키 전략 설계 (`master:prev_volume:{YYYYMMDD}`)
- [x] 마스터 데이터 사전 로딩
  - [x] 전일 거래대금 상위 100개 캐싱 (ka10031)
  - [x] 시가총액 조회 시 개별 캐싱
- [x] Rate Limiting 방어
  - [x] 동시 호출 수 제한 (5개씩 배치)
  - [x] 호출 간격 제어 (100ms 대기)

#### 검색 로직 (캐시 우선)
- [x] Zod 스키마 작성 (`model/screener.schema.ts`)
- [x] TypeScript 타입 정의 (`model/screener.types.ts`)
- [x] Server Action 작성
  - [x] `api/searchStocks.action.ts` (전체 검색 로직, FSD 표준)
  - [x] 1차 필터링: 캐시 기반 (전일 거래대금)
  - [x] 2차 필터링: 실시간 API (ka10030, ka10080)
  - [x] 시가총액 배치 조회 및 캐싱
  - [x] 교집합 계산 및 최종 결과 반환
  - [x] 에러 핸들링 및 로깅
- [x] 유틸리티 함수 작성
  - [x] `lib/intersection.ts` (교집합 계산)
  - [x] `lib/validators.ts` (분봉 패턴 검증)
  - [x] `lib/transformers.ts` (API 응답 → UI 데이터)

#### 프론트엔드 UI
- [x] Shadcn 컴포넌트 설치
- [x] UI 컴포넌트 작성
  - [x] `ui/FilterSection.tsx` (개별 필터 섹션)
  - [x] `ui/TradingVolumeScreenerForm.tsx` (전체 폼)
  - [x] `ui/ScreenerResultTable.tsx` (결과 테이블)
- [x] 페이지 통합
  - [x] `app/stock-discovery/trading-volume/page.tsx` (Server Action 호출)
- [x] 무한 스크롤 구현
  - [x] react-intersection-observer 설치
  - [x] 페이지네이션 상태 관리 (page, hasMore, totalCount)
  - [x] 마지막 항목 감지 및 자동 로드
  - [x] 로딩 상태 표시 (초기 / 추가 로딩)
  - [x] 결과 요약 표시
- [x] 주가 색상 표시 기능
  - [x] `shared/ui/ColoredValue.tsx` (범용 색상 래퍼 컴포넌트)
  - [x] `shared/model/priceColorScheme.store.ts` (전역 색상 스킴 Zustand 스토어)
  - [x] 결과 테이블에 ColoredValue 적용 (현재가, 등락률)
- [ ] 에러 핸들링 개선
  - [x] API 에러 처리 (return_code 체크)
  - [x] 폼 검증 에러 표시
  - [x] 빈 결과 처리
  - [ ] 사용자 친화적 에러 메시지
- [ ] 로딩 상태 개선
  - [ ] Skeleton UI 구현
  - [x] 로딩 스피너 (초기 + 추가 로딩)

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

| 지표 | 목표 | 캐싱 + 페이지네이션 적용 후 |
|:-----|:-----|:----------------------------|
| **API 호출 횟수** | 7200회 (전체 종목) | **1~11회** (99.8% 감소) |
| **초기 응답 시간** | < 3초 | **< 2초** (첫 25개) |
| **추가 페이지 로드** | - | **< 1.5초** (다음 25개) |
| **UI 렌더링** | < 500ms | < 500ms |
| **폼 검증** | < 100ms | < 100ms |
| **캐시 적중률** | - | **> 90%** (1차 필터링) |

**기본 설정 (캐싱 + 페이지네이션)**:
1. **1차 필터링 (캐시 기반, API 0회)**:
   - 전일 거래대금 상위 100개: 캐시 조회
   - 교집합 계산: 전체 종목 수 확인 (예: 82개)

2. **2차 필터링 (첫 페이지 25개만 API 호출)**:
   - 당일 거래대금 상위 100개: 1회 (`ka10030`)
   - 시가총액 배치 조회: 최대 9회 (25개 ÷ 3 = 9배치)
   - 분봉 패턴 검증: 최대 9회 (`ka10080`, 25개 ÷ 3 = 9배치)
   - **첫 페이지 총 1~19회 API 호출**

3. **추가 페이지 로드 (25개씩)**:
   - 시가총액 + 분봉 패턴: 최대 18회 (캐싱된 교집합 활용)
   - 스크롤 시 자동 로드

**예시 시나리오 (교집합 82개)**:
- 첫 페이지 (1~25): 1.5초
- 2페이지 (26~50): 1.0초 (스크롤 시 자동)
- 3페이지 (51~75): 1.0초
- 4페이지 (76~82): 0.5초 (7개만)
- **총 소요 시간: 4초** (사용자는 첫 1.5초 후 결과 확인 가능)

## 🚨 주의사항

### 캐싱 관련
1. **캐시 만료 시점**: 익일 00:00 자동 만료, 첫 요청 시 백그라운드 재생성
2. **캐시 워밍업**: 서버 재시작 후 첫 검색은 느릴 수 있음 (캐시 미스)
3. **캐시 일관성**: 전일 데이터는 장 마감 후 확정되므로, 장 중 조회 시 전날 데이터 사용
4. **메모리 관리**: LRU Cache 크기 제한 설정 (기본 100MB)

### API 호출 제한
5. **Rate Limiting 방어**:
   - 키움 API 제한: 초당 20회
   - 배치 크기: 3개씩 병렬 처리
   - 배치 간 지연: 200ms (초당 15회로 안전 마진 확보)
   - 페이지네이션: 25개씩 처리로 초기 응답 시간 개선
6. **API 제한**: ka10031 최대 100개, 연속조회 시 `cont-yn` 처리 필요
7. **교집합 크기**: 조건이 엄격할수록 결과 0개 가능 → 사용자에게 안내

### 페이지네이션
8. **페이지 크기**: 25개 고정 (Rate Limiting 고려)
9. **무한 스크롤**: 마지막 항목이 화면에 표시되면 자동으로 다음 페이지 로드
10. **상태 관리**: 현재 페이지, 총 종목 수, 더 보기 가능 여부 추적

### 데이터 정확성
8. **분봉 거래대금 계산**: `거래량 × 종가` 근사치 사용 (정확한 거래대금 필드 없음)
9. **시가총액 필터**: 순위 API 없으므로 캐시 기반 후처리로 필터링
10. **실시간 데이터 지연**: 분봉 데이터는 최대 1분 지연 가능

## 🔗 관련 문서

- [API 가이드](../../api/README.md)
- [아키텍처](../../architecture.md)
- [코딩 규칙](../../coding-standards.md)
- [개발 가이드](../../development.md)

## 📝 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|:-----|:-----|:----------|:-------|
| v1.0 | 2026-03-29 | 초기 작성 - 배치 조회 + 서버 캐싱 전략 기반 아키텍처 | Claude |
