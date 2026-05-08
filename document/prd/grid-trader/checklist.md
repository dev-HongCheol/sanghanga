# Grid Trader 구현 체크리스트

> 상태: 🚧 구현중 | PRD: [prd.md](./prd.md)

## Phase 1: 단일 종목 핵심 기능 (v1.0)

### Database
- [x] SQL 스키마 작성 (`database/schemas/grid-trader/`)
- [x] 스키마 실행 (Supabase Self-Hosting)
- [ ] Seed 데이터 생성

### 인프라
- [x] Supabase 클라이언트 (`shared/lib/supabase/client.ts`, `server.ts`)
- [x] DB 타입 자동 생성 (`shared/lib/supabase/database.types.ts` — `pnpm db:types`)
- [x] Sonner 토스트 알림 (`app/providers/Providers.tsx`)

### entities/grid-trader
- [x] 타입 정의 (`model/gridTrader.types.ts`)
- [x] Zod 스키마 (`model/gridTrader.schema.ts`)
- [x] DB API 함수 (`api/gridStrategy.api.ts`)

### Server Actions (features/grid-trader/api/)
- [x] `createStrategy.action.ts` — 전략 생성
- [x] `updateStrategy.action.ts` — 전략 수정
- [x] `deleteStrategy.action.ts` — 전략 삭제
- [x] `toggleStrategy.action.ts` — 전략 활성화/비활성화 토글
- [x] `deployGrid.action.ts` — 그리드 배치
- [x] `rebalanceGrid.action.ts` — 수동 리밸런싱
- [x] `searchStock.action.ts` — 종목 검색 (ka10099)
- [x] `getCurrentPrice.action.ts` — 현재가 조회 (ka10001)
- [x] `placeOrder.action.ts` — 주문 접수 (kt10000/kt10001)
- [x] `modifyOrder.action.ts` — 주문 정정 (kt10002)
- [x] `cancelOrder.action.ts` — 주문 취소 (kt10003)
- [x] `getOrders.action.ts` — 미체결/체결 조회 (ka10075/ka10076)
- [x] `getAccountBalance.action.ts` — 계좌 잔고 조회 (kt00018)

### 그리드 엔진 (features/grid-trader/lib/)
- [x] `adjustToTickSize.ts` — 호가 단위 조정 함수
- [x] `calculateGrid.ts` — 그리드 가격 배열 계산
- [x] `deployGrid.ts` — 초기 그리드 배치 로직
- [x] `handleFillEvent.ts` — 체결 이벤트 처리
- [x] `rebalanceGrid.ts` — 리밸런싱 로직
- [x] `pollFills.ts` — 체결 감지 Polling
- [x] `matchStockCode.ts` — 종목코드 매칭 유틸리티

### Cron Jobs
- [ ] 08:00 토큰 갱신
- [ ] 08:30 사전 세팅
- [ ] 08:50 초기 그리드 배치
- [ ] 09:00~15:30 체결 Polling
- [ ] 15:30 마감 처리
- [ ] 매시간 리밸런싱 체크

### UI (features/grid-trader/ui/)
- [x] `StrategyList.tsx` — 전략 목록
- [x] `StrategyCard.tsx` — 전략 카드
- [x] `GridStrategyForm.tsx` — 전략 설정 폼
- [x] `StockSearchInput.tsx` — 종목 검색 입력
- [x] `AccountBalance.tsx` — 계좌 잔고 패널
- [x] `ActiveOrdersTable.tsx` — 활성 주문 테이블
- [x] `FillHistoryTable.tsx` — 체결 히스토리 테이블
- [x] `RebalanceButton.tsx` — 수동 리밸런싱 버튼

### Pages
- [x] `app/trading-system/grid-trader/page.tsx` — 전략 목록 페이지
- [x] `app/trading-system/grid-trader/[strategyId]/page.tsx` — 전략 상세 페이지
- [x] 라우트 등록 (`shared/config/routes.ts`)
- [x] 실시간 업데이트 (PollingRefresher 컴포넌트)

## Phase 2: 알림 및 모니터링 (v2.0)

- [ ] 텔레그램 Bot 연동 (체결/에러/일일 리포트)
- [ ] P&L 차트 (일별/주별)
- [ ] 체결 통계 (승률, 평균 수익률)

## Phase 3: 다중 종목 지원 (v3.0)

- [ ] 다중 전략 동시 실행
- [ ] 전략 복사 / 템플릿
- [ ] 동적 그리드 간격 조정
- [ ] 백테스팅 시뮬레이터
