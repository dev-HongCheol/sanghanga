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
- [x] 09:00~15:30 체결 Polling (v1.5 - 2초 주기 자동 실행)
- [ ] 15:30 마감 처리
- [x] 리밸런싱 체크 (v1.5 - 10분 주기 자동 실행, 그리드 이탈 감지)

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
- [x] ~~실시간 업데이트 (PollingRefresher 컴포넌트)~~ → v1.4에서 SSE로 대체

## Phase 1.5: 실시간 데이터 동기화 개선 (v1.4)

### 서버 인프라
- [x] `shared/lib/cache/price-cache.ts` — 현재가 메모리 캐시 (Map)
- [x] `shared/lib/cache/balance-cache.ts` — 잔고 메모리 캐시 (Map)
- [x] `shared/lib/sse/sse-manager.ts` — SSE 연결 관리 및 브로드캐스트
- [x] `shared/lib/cron/scheduler.ts` — Cron 스케줄러 (Next.js Instrumentation, 장시간 제어)
- [x] `shared/lib/time/market-hours.ts` — 장시간 체크 유틸리티 (평일 09:00~15:30)
- [x] `instrumentation.ts` — Next.js 서버 시작 시 Cron 자동 실행

### Cron Jobs (실시간 동기화)
- [x] `app/api/cron/sync-prices/route.ts` — 가격 동기화 (1초 주기, 장중만, ka10001)
- [x] `app/api/cron/sync-balance/route.ts` — 잔고 동기화 (3초 주기, 항상, kt00018)
- [x] `features/grid-trader/lib/cron/checkFills.ts` — 체결 감지 (2초 주기, 장중만)
- [x] `features/grid-trader/lib/cron/checkRebalance.ts` — 자동 리밸런싱 체크 (10분 주기, 장중만)
- [x] `features/grid-trader/lib/cron/cleanupStaleOrders.ts` — 미체결 주문 정리 (평일 08:00, 전날 PENDING → CANCELLED)

### SSE Endpoints
- [x] `app/api/sse/realtime/route.ts` — SSE 스트림 (가격/잔고 통합)

### 클라이언트 상태 관리
- [x] `shared/stores/price-store.ts` — 현재가 전역 상태 (Zustand)
- [x] `shared/stores/balance-store.ts` — 잔고 전역 상태 (Zustand)
- [x] `features/grid-trader/providers/SSEProvider.tsx` — SSE 연결 Provider (단일 연결 → Zustand 업데이트)

### 클라이언트 컴포넌트
- [x] `features/grid-trader/ui/RealtimePriceDisplay.tsx` — 실시간 현재가 표시 (Zustand 구독)
- [x] `features/grid-trader/ui/RealtimeBalanceDisplay.tsx` — 실시간 잔고 표시 (Zustand 구독)
- [x] `features/grid-trader/ui/RealtimeActiveOrdersTable.tsx` — 실시간 주문 테이블 (Zustand 구독)
- [x] ~~`features/grid-trader/ui/PollingRefresher.tsx`~~ — 제거 (SSE로 대체)

### 설정
- [x] `next.config.ts` — instrumentationHook 활성화
- [x] `.env.example` — ENABLE_CRON 환경변수 추가
- [x] `package.json` — node-cron 설치

## Phase 1.6: 주문/체결 실시간 갱신 (SSE 확장)

> 현황: `sse-manager.ts`에 `broadcastOrders`, `broadcastFillEvent` 선언되어 있으나 Cron 호출 및 SSEProvider 리스너 모두 미연결
> 문제: 주문 변경 시 `router.refresh()` 수동 호출에 의존 → 깜빡임, 로딩 피드백 없음, Cron 체결 감지 후 UI 자동 갱신 안 됨

### Zustand Store
- [ ] `shared/stores/order-store.ts` — 주문 목록 전역 상태 신규 생성 (strategyId별 orders 관리)

### SSE 연결
- [ ] `features/grid-trader/lib/cron/checkFills.ts` — 체결 감지 후 `broadcastOrders(strategyId, orders)` 호출
- [ ] `features/grid-trader/providers/SSEProvider.tsx` — `orders` 이벤트 리스너 추가 → Zustand order-store 업데이트

### 컴포넌트 수정
- [ ] `features/grid-trader/ui/RealtimeActiveOrdersTable.tsx` — props 대신 Zustand order-store 구독으로 전환
- [ ] `app/.../[strategyId]/page.tsx` — SSR props를 store 초기값으로 주입하는 방식으로 변경

### 정리
- [ ] `StrategyCard.tsx`, `RebalanceButton.tsx` 등 `router.refresh()` 호출 제거

## Phase 2: 알림 및 모니터링 (v2.0)

- [ ] 텔레그램 Bot 연동 (체결/에러/일일 리포트)
- [ ] P&L 차트 (일별/주별)
- [ ] 체결 통계 (승률, 평균 수익률)

## Phase 3: 다중 종목 지원 (v3.0)

- [ ] 다중 전략 동시 실행
- [ ] 전략 복사 / 템플릿
- [ ] 동적 그리드 간격 조정
- [ ] 백테스팅 시뮬레이터
