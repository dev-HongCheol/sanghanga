# 실시간 종목조회순위 조회 PRD

## 개요

키움 REST API의 실시간 종목조회순위(ka00198) API를 호출하여 데이터를 조회하고 화면에 표시하는 기능 구현

## 목표

- 키움 인증 토큰을 사용하여 실시간 종목조회순위 API 호출
- 구분(1분/10분/1시간/당일누적/30초)별 조회 지원
- 조회 결과를 화면에 표시

## 요구사항

### 기능 요구사항

1. **API 호출**
   - 엔드포인트: `/api/dostk/stkinfo`
   - TR명(api-id): `ka00198`
   - 구분(qry_tp): 1(1분), 2(10분), 3(1시간), 4(당일누적), 5(30초)

2. **인증**
   - 키움 인증 토큰 자동 주입 (KiwoomClient 사용)

3. **화면 표시**
   - 조회 결과 테이블 형태로 표시
   - 구분 선택 UI (드롭다운)

### 비기능 요구사항

1. **성능**
   - Rate Limiting 준수 (KiwoomClient)

2. **UX**
   - 로딩 상태 표시
   - 에러 메시지 표시

## 구현 체크리스트

> **중요**: 각 항목을 완료할 때마다 실시간으로 체크 표시 (`- [x]`)를 업데이트하세요.

### 타입 및 스키마
- [x] API 요청/응답 타입 정의 (`entities/stock/model/stock.types.ts` - FSD 준수)
- [x] Zod 스키마 정의 (요청 파라미터 검증) - Route Handler에서 처리

### API 함수
- [x] 종목조회순위 API 함수 (`entities/stock/api/stockRanking.api.ts`)
  - [x] fetchStockRanking 함수 구현
  - [x] JSDoc 주석 추가

### TanStack Query
- [x] 커스텀 훅 (`entities/stock/api/stockRanking.queries.ts`)
  - [x] useStockRanking 훅 구현
  - [x] JSDoc 주석 추가

### 페이지
- [x] 종목조회순위 페이지 (`app/stock-ranking/page.tsx`)
  - [x] Server Component로 구현
  - [x] 메타데이터 설정

### UI 컴포넌트
- [x] 종목조회순위 위젯 (`widgets/stock-ranking/ui/StockRankingWidget.tsx`)
  - [x] Client Component로 구현
  - [x] 구분 선택 드롭다운 (Shadcn UI Select 사용)
  - [x] 조회 결과 표시
  - [x] 로딩/에러 상태 처리 (Shadcn UI Alert 사용)

### Public API
- [x] `entities/stock/index.ts` 생성 (FSD Public API 패턴)
  - [x] fetchStockRanking export
  - [x] useStockRanking export
  - [x] 타입 export (StockRankingRequest, StockRankingResponse)
- [x] `widgets/stock-ranking/index.ts` 생성
  - [x] StockRankingWidget export

### Route Handler
- [x] `app/api/kiwoom/stock-ranking/route.ts` 구현
  - [x] POST 메서드 구현
  - [x] Zod 검증
  - [x] KiwoomClient 사용
  - [x] 로깅 추가

### FSD 아키텍처 준수
- [x] 도메인 로직을 entities/stock으로 이동 (shared에서 분리)
- [x] widgets 구조화 (슬라이스 패턴 적용)
- [x] Public API 패턴 적용
- [x] import 경로 수정 완료

### 문서 업데이트
- [ ] `document/index.md`에 PRD 등록
- [ ] PRD 상태 업데이트 (📝 → 🚧 → ✅)

## 기술 스택

- **Server Component**: 페이지 (app/stock-ranking/page.tsx)
- **Client Component**: 위젯 (useStockRanking 훅 사용)
- **API**: KiwoomClient 사용
- **상태 관리**: TanStack Query
- **검증**: Zod

## API 명세

### Request

**Headers:**
- `api-id`: `ka00198` (고정)
- `authorization`: `Bearer {token}` (KiwoomClient 자동 주입)
- `cont-yn`: 연속조회여부 (Optional)
- `next-key`: 연속조회키 (Optional)

**Body:**
```json
{
  "qry_tp": "1"  // 1:1분, 2:10분, 3:1시간, 4:당일누적, 5:30초
}
```

### Response

*(키움 API 응답 형식에 따라 추가 예정)*

## 파일 구조 (FSD 준수)

```
src/
├── app/
│   ├── stock-ranking/
│   │   └── page.tsx                         # 페이지
│   └── api/
│       └── kiwoom/
│           └── stock-ranking/
│               └── route.ts                  # API Route Handler
│
├── entities/
│   └── stock/                                # 주식 도메인 엔티티
│       ├── api/
│       │   ├── stockRanking.api.ts          # API 함수
│       │   └── stockRanking.queries.ts      # TanStack Query 훅
│       ├── model/
│       │   └── stock.types.ts               # 도메인 타입
│       └── index.ts                         # Public API
│
├── widgets/
│   └── stock-ranking/                       # 종목조회순위 위젯
│       ├── ui/
│       │   └── StockRankingWidget.tsx       # 위젯 컴포넌트
│       └── index.ts                         # Public API
│
└── shared/
    └── lib/
        └── kiwoom/                           # 키움 공통 인프라만 유지
            ├── auth.ts                       # 인증
            ├── client.ts                     # API 클라이언트
            ├── env.schema.ts                 # 환경변수 검증
            ├── types.ts                      # 공통 타입
            └── index.ts                      # Public API
```

## 테스트 시나리오

1. 구분 선택 → API 호출 → 결과 표시
2. 로딩 상태 표시 확인
3. 에러 발생 시 메시지 표시
4. 인증 토큰 자동 주입 확인

## 주의사항

1. **인증**: 키움 인증 구현 완료 후 작업
2. **Rate Limiting**: KiwoomClient가 자동 처리
3. **에러 처리**: 401, 403, 429, 500 에러 핸들링

## 참고 문서

- [kiwoom-auth PRD](../kiwoom-auth/prd.md) - 인증 구현
- [api-guide.md](../../api-guide.md) - 키움 API 가이드
