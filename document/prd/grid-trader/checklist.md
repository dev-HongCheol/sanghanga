# Grid Trader 구현 체크리스트

> 상태: 🚧 구현중 | PRD: [prd.md](./prd.md) | 구현 패턴: [implementation-patterns.md](./implementation-patterns.md) | 향후 개선: [future-improvements.md](./future-improvements.md) | 버전: v1.6.5

## 📁 파일 구조 및 핵심 역할

### Database Schemas

**위치**: `database/schemas/grid-trader/`

- [x] `01-schema.sql` — 전체 스키마 정의 (sh_grid_strategies, sh_grid_orders, sh_fill_events)
- [x] `02-migration.sql` — 마이그레이션 스크립트
- [x] `03-reset.sql` — 개발/테스트용 리셋 스크립트

**위치**: `database/schemas/mutex/`

- [x] `01-schema.sql` — DB 기반 Mutex 함수 (sh_try_acquire_lock, sh_release_lock, sh_release_all_locks)
- [x] `03-reset.sql` — Mutex 함수 삭제 스크립트

---

### Entities Layer (도메인 모델 & DB 접근)

**위치**: `src/entities/grid-trader/`

#### Model
- [x] `model/gridTrader.types.ts` — DB 타입 정의 (GridStrategy, GridOrder, FillEvent, OrderType, OrderStatus)
- [x] `model/gridTrader.schema.ts` — Zod 스키마 (폼 검증용)

#### API (DB 접근 함수 - 18개)
- [x] `api/gridStrategy.api.ts` — DB CRUD 함수
  - 전략: createStrategy, updateStrategy, deleteStrategy, getStrategyById, getAllStrategies, getActiveStrategies, toggleStrategyActive
  - 주문: createOrder, updateOrderStatus, getOrdersByStrategy, getPendingOrders, cancelOrder, cancelOrders, cancelStalePendingOrders
  - 체결: createFillEvent, getFillEventsByStrategy, getFillEventsByDateRange

#### Public API
- [x] `index.ts` — Entity 레이어 Public API

---

### Features Layer (비즈니스 로직)

**위치**: `src/features/grid-trader/`

#### Server Actions (10개)
- [x] `api/createStrategy.action.ts` — 전략 생성
- [x] `api/updateStrategy.action.ts` — 전략 수정
- [x] `api/deleteStrategy.action.ts` — 전략 삭제
- [x] `api/toggleStrategy.action.ts` — 전략 활성화/비활성화 토글
- [x] `api/deployGrid.action.ts` — 초기 그리드 배치 (kt10000/kt10001)
- [x] `api/rebalanceGrid.action.ts` — 수동 리밸런싱
- [x] `api/searchStock.action.ts` — 종목 검색 (ka10099)
- [x] `api/getCurrentPrice.action.ts` — 현재가 조회 (ka10001)
- [x] `api/getAccountBalance.action.ts` — 계좌 잔고 조회 (kt00018)
- [x] `api/placeOrder.action.ts` — 주문 접수 (kt10000 매수 / kt10001 매도)
- [x] `api/modifyOrder.action.ts` — 주문 정정 (kt10002)
- [x] `api/cancelOrder.action.ts` — 주문 취소 (kt10003)
- [x] `api/getOrders.action.ts` — 미체결/체결 조회 (ka10075 미체결 / ka10076 체결)

#### 그리드 엔진 (Core Logic)
- [x] `lib/adjustToTickSize.ts` — 호가 단위 조정 함수 (매수 내림/매도 올림)
- [x] `lib/calculateGrid.ts` — 현재가 기준 그리드 가격 배열 계산
- [x] `lib/deployGrid.ts` — 초기 그리드 배치 로직 (예수금/보유수량 체크)
- [x] `lib/handleFillEvent.ts` — 체결 이벤트 처리 및 카운터 주문 생성
- [x] `lib/rebalanceGrid.ts` — 리밸런싱 로직 (미체결 취소 + 재배치)
- [x] `lib/pollFills.ts` — 체결 감지 폴링 (DB vs 키움 API 비교)
- [x] `lib/matchStockCode.ts` — 종목코드 매칭 유틸리티 (6자리 정규화)

#### Cron Jobs (5개)
- [x] `lib/cron/syncPrices.ts` — 가격 동기화 Cron (1초 주기, 장중만, ka10001)
- [x] `lib/cron/syncBalance.ts` — 잔고 동기화 Cron (3초 주기, 항상, kt00018)
- [x] `lib/cron/checkFills.ts` — 체결 감지 Cron (2초 주기, 장중만, ka10075/ka10076)
- [x] `lib/cron/checkRebalance.ts` — 자동 리밸런싱 체크 Cron (1분@09-10시 / 10분 이후, 장중만)
- [x] `lib/cron/cleanupStaleOrders.ts` — 미체결 주문 정리 Cron (매일 08:00 평일, PENDING → CANCELLED)

#### UI Components (8개)
- [x] `ui/StrategyList.tsx` — 전략 목록 렌더링 (Server Component)
- [x] `ui/StrategyCard.tsx` — 개별 전략 카드 (Client Component - 토글/배치 버튼)
- [x] `ui/GridStrategyForm.tsx` — 전략 생성/수정 폼 (Client Component - Zod + React Hook Form)
- [x] `ui/StockSearchInput.tsx` — 종목 검색 입력 (Client Component - 자동완성)
- [x] `ui/AccountBalance.tsx` — 계좌 잔고 패널 (Client Component)
- [x] `ui/ActiveOrdersTable.tsx` — 활성 주문 테이블 (매도 위/현재가/매수 아래)
- [x] `ui/FillHistoryTable.tsx` — 체결 히스토리 테이블 (최근 10개)
- [x] `ui/RebalanceButton.tsx` — 수동 리밸런싱 버튼 (Client Component)

#### 실시간 UI Components (3개)
- [x] `ui/RealtimePriceDisplay.tsx` — 실시간 현재가 표시 (Zustand price-store 구독)
- [x] `ui/RealtimeBalanceDisplay.tsx` — 실시간 잔고 표시 (Zustand balance-store 구독)
- [x] `ui/RealtimeActiveOrdersTable.tsx` — 실시간 주문 테이블 (Zustand order-store + price-store 구독, v1.6.5)

#### Providers
- [x] `providers/SSEProvider.tsx` — SSE 연결 Provider (단일 EventSource → Zustand 업데이트)

#### Public API
- [x] `index.ts` — Feature 레이어 Public API

---

### Shared Layer (공통 인프라)

**위치**: `src/shared/`

#### 메모리 캐시
- [x] `lib/cache/price-cache.ts` — 현재가 메모리 캐시 (Map, 휘발성)
- [x] `lib/cache/balance-cache.ts` — 잔고 메모리 캐시 (단일 객체, 휘발성)

#### SSE (Server-Sent Events)
- [x] `lib/sse/sse-manager.ts` — SSE 연결 관리 및 브로드캐스트 (registerClient, broadcastPrice, broadcastBalance)

#### Cron 스케줄러
- [x] `lib/cron/scheduler.ts` — node-cron 스케줄러 (장시간 제어, 5개 Cron Job 등록)

#### 분산 Mutex
- [x] `lib/mutex/db-mutex.ts` — DB 기반 Mutex (PostgreSQL advisory lock, withMutex 함수)

#### 시간 유틸리티
- [x] `lib/time/market-hours.ts` — 장시간 체크 유틸리티 (평일 09:00~18:00, 공휴일 미지원)

#### Zustand Stores
- [x] `stores/price-store.ts` — 현재가 전역 상태 (Zustand, SSE로 업데이트)
- [x] `stores/balance-store.ts` — 잔고 전역 상태 (Zustand, SSE로 업데이트)
- [x] `stores/order-store.ts` — 주문 전역 상태 (Zustand, SSE로 업데이트, v1.6.5)

---

### App Layer (페이지 & API Routes)

**위치**: `app/`

#### Pages
- [x] `trading-system/grid-trader/page.tsx` — 전략 목록 페이지 (Server Component)
- [x] `trading-system/grid-trader/[strategyId]/page.tsx` — 전략 상세 페이지 (Server Component, SSR props)

#### API Routes - SSE
- [x] `api/sse/realtime/route.ts` — SSE 스트림 엔드포인트 (가격/잔고 통합)

#### API Routes - Cron Manual Trigger (개발/디버깅용)
- [x] `api/cron/sync-prices/route.ts` — 가격 동기화 수동 트리거
- [x] `api/cron/sync-balance/route.ts` — 잔고 동기화 수동 트리거
- [x] `api/cron/check-fills/route.ts` — 체결 감지 수동 트리거
- [x] `api/cron/check-rebalance/route.ts` — 리밸런싱 체크 수동 트리거
- [x] `api/cron/cleanup-stale-orders/route.ts` — 미체결 정리 수동 트리거

---

### Configuration

- [x] `instrumentation.ts` — Next.js Instrumentation Hook (서버 시작 시 Cron 자동 실행)
- [x] `next.config.ts` — instrumentationHook 활성화
- [x] `.env.example` — ENABLE_CRON 환경변수 추가
- [x] `package.json` — node-cron 설치

---

## 🚀 구현 완료 기능

### Phase 1.0 - 핵심 기능
- ✅ 전략 CRUD (생성, 수정, 삭제, 활성화/비활성화)
- ✅ 초기 그리드 배치 (자동 + 수동)
- ✅ 호가 단위 자동 조정 (매수 내림, 매도 올림)
- ✅ Core 물량 보호 (minHoldingLimit 이하 매도 금지)
- ✅ 목표가 제약 (목표가 설정 시 미만 매도 불가)
- ✅ 예수금 확인 (매수 전 잔고 체크)
- ✅ Rate Limiting (주문 간 500ms 간격)

### Phase 1.4 - 실시간 데이터 동기화
- ✅ 메모리 캐시 (현재가, 잔고)
- ✅ SSE 브로드캐스트 (가격, 잔고)
- ✅ Zustand Store (가격, 잔고)
- ✅ 클라이언트 폴링 제거 (SSEProvider로 대체)
- ✅ Cron 스케줄러 (5개 Job, 장시간 제어)

### Phase 1.7 - 실시간 갱신 완성
- ✅ order-store 추가 (주문 전역 상태)
- ✅ broadcastOrders 연결 (체결/배치/리밸런싱 후)
- ✅ RealtimeActiveOrdersTable order-store 구독
- ✅ router.refresh() 제거 (깜빡임 없는 UI)

### Phase 1.5 - 체결 감지 & 자동 리밸런싱
- ✅ 체결 감지 Cron (2초 주기, ka10075/ka10076)
- ✅ 카운터 주문 자동 생성 (매수 체결 → 위 매도, 매도 체결 → 아래 매수)
- ✅ 자동 리밸런싱 (그리드 이탈 감지 → 재배치)
- ✅ 서버 재시작 자동 복구 (활성 전략 미체결 0개 감지 → 그리드 배치)
- ✅ 장시간 확장 (09:00~18:00, 시간외 거래 포함)
- ✅ 미체결 주문 정리 (매일 08:00, 전날 PENDING → CANCELLED)
- ✅ DB 기반 Mutex (멀티 프로세스 중복 실행 방지)
- ✅ 리밸런싱 주기 개선 (09:00~10:00 1분 간격, 이후 10분 간격)

### Phase 1.6 - 버그 수정
- ✅ 체결 감지 cookies() 오류 (useAdminClient 패턴 적용)
- ✅ 주문번호 0 패딩 매칭 오류 (정규화 함수)
- ✅ 무한 리밸런싱 버그 (매도 주문 부재 시 이론적 최대값 사용)
- ✅ 카운터 매도 수량 계산 버그 (minHoldingLimit 적용)
- ✅ 체결 시각 파싱 버그 (HHmmss → ISO 8601 변환)

---

## 🔄 미완성 기능 및 향후 개선

**상세 계획 및 구현 가이드**: [future-improvements.md](./future-improvements.md)

### 우선순위 요약

**📊 중간 (Phase 2)**:
- [ ] 실시간 잔고 패널 개선 - 오늘의 손익/전체 손익 표시
- [ ] 체결 히스토리 페이지네이션
- [ ] 알림 및 모니터링 (텔레그램, P&L 차트, 통계)

**🔧 낮음 (Phase 3+)**:
- [ ] 공휴일 포함 장시간 체크
- [ ] 다중 종목 지원
- [ ] 백테스팅 시뮬레이터

---

## 📝 참고

- **파일 개수**: 40+ 파일
- **총 코드 라인**: 약 8,000+ 줄
- **Cron Job**: 5개 (가격, 잔고, 체결, 리밸런싱, 미체결 정리)
- **Server Actions**: 13개
- **UI 컴포넌트**: 11개 (일반 8개 + 실시간 3개)
- **DB 함수**: 18개
- **키움 API 호출량**: 활성 전략 N개당 초당 N + 0.83회
- **실전 운영 준비도**: 80~85% (손익 계산 부정확, 주문/체결 실시간 갱신 미완, 공휴일 미지원)
