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

### entities/grid-trader
- [x] 타입 정의 (`model/gridTrader.types.ts`)
- [ ] Zod 스키마 (`model/gridTrader.schema.ts`)
- [ ] DB API 함수 (`api/gridStrategy.api.ts`)

### Server Actions (features/grid-trader/api/)
- [ ] `createStrategy.action.ts`
- [ ] `updateStrategy.action.ts`
- [ ] `deleteStrategy.action.ts`
- [ ] `toggleStrategy.action.ts`
- [ ] `searchStock.action.ts` (ka10001)
- [ ] `getCurrentPrice.action.ts` (ka10001)
- [ ] `placeOrder.action.ts` (ka30001)
- [ ] `cancelOrder.action.ts` (ka30003)
- [ ] `getOrders.action.ts` (ka10075/ka10076)
- [ ] `getAccountBalance.action.ts` (ka30007)

### 그리드 엔진 (features/grid-trader/lib/)
- [ ] `calculateGrid.ts` — 그리드 가격 배열 계산
- [ ] `deployGrid.ts` — 초기 그리드 배치
- [ ] `handleFillEvent.ts` — 체결 이벤트 처리
- [ ] `rebalanceGrid.ts` — 리밸런싱 로직
- [ ] `pollFills.ts` — 체결 감지 Polling

### Cron Jobs
- [ ] 08:00 토큰 갱신
- [ ] 08:30 사전 세팅
- [ ] 08:50 초기 그리드 배치
- [ ] 09:00~15:30 체결 Polling
- [ ] 15:30 마감 처리
- [ ] 매시간 리밸런싱 체크

### UI (features/grid-trader/ui/)
- [ ] `StrategyList.tsx`
- [ ] `StrategyCard.tsx`
- [ ] `GridStrategyForm.tsx`
- [ ] `StockSearchInput.tsx`
- [ ] `AccountBalance.tsx`
- [ ] `ActiveOrdersTable.tsx`
- [ ] `FillHistoryTable.tsx`

### Pages
- [ ] `app/trading-system/grid-trader/page.tsx`
- [ ] `app/trading-system/grid-trader/[strategyId]/page.tsx`
- [ ] 라우트 등록 (`shared/config/routes.ts`)
- [ ] 실시간 업데이트 (1초 polling)

## Phase 2: 알림 및 모니터링 (v2.0)

- [ ] 텔레그램 Bot 연동 (체결/에러/일일 리포트)
- [ ] P&L 차트 (일별/주별)
- [ ] 체결 통계 (승률, 평균 수익률)

## Phase 3: 다중 종목 지원 (v3.0)

- [ ] 다중 전략 동시 실행
- [ ] 전략 복사 / 템플릿
- [ ] 동적 그리드 간격 조정
- [ ] 백테스팅 시뮬레이터
