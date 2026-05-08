# Grid Trader 단위 테스트 명세

> 작성일: 2026-05-08 | 대상: Phase 1 핵심 기능

## 개요

Grid Trader의 핵심 로직(그리드 계산, 호가 조정, 리밸런싱)에 대한 단위 테스트 명세.

## 테스트 대상

### 1. `adjustToTickSize.ts` - 호가 단위 조정

**요구사항**: 모든 주문 가격이 한국 주식시장 호가 단위 규칙을 준수해야 함

**테스트 케이스**:
- `adjustToTickSize(매수, 1234원) → 1230원` (호가 단위 10원, 내림)
- `adjustToTickSize(매도, 1234원) → 1240원` (호가 단위 10원, 올림)
- `adjustToTickSize(매수, 9999원) → 9995원` (호가 단위 5원)
- `adjustToTickSize(매수, 50100원) → 50050원` (호가 단위 50원)
- `adjustToTickSize(매수, 500500원) → 500000원` (호가 단위 500원)
- `isValidTickSize(1230원) → true`
- `isValidTickSize(1234원) → false`

**핵심 패턴**:
```typescript
// 가격대별 호가 단위 테이블
const TICK_SIZE_RULES = [
  { max: 1_000, tickSize: 1 },
  { max: 5_000, tickSize: 5 },
  { max: 10_000, tickSize: 10 },
  // ...
];
```

---

### 2. `calculateGrid.ts` - 그리드 가격 계산

**요구사항**: 현재가 기준으로 상/하단 그리드 가격 배열을 생성, 모든 가격은 호가 단위 적용

**테스트 케이스**:
- `calculateGrid(현재가 10000원, 간격 1000원, 상단 3개, 하단 3개)`
  - buyPrices: `[9000, 8000, 7000]` (높은 가격 순)
  - sellPrices: `[11000, 12000, 13000]` (낮은 가격 순)
- `calculateGrid(현재가 1234원, 간격 100원, 상단 2개, 하단 2개)`
  - buyPrices: `[1130, 1030]` (호가 단위 10원 내림 적용)
  - sellPrices: `[1340, 1440]` (호가 단위 10원 올림 적용)
- 간격이 0 이하 → 에러
- 상단/하단 개수가 0 이하 → 에러

**핵심 패턴**:
```typescript
const buyPrices = Array.from({ length: lowerGridCount }, (_, i) =>
  adjustToTickSize(currentPrice - gap * (i + 1), 'BUY')
).reverse();
```

---

### 3. `rebalanceGrid.ts` - 리밸런싱 로직

**요구사항**: 미체결 주문 취소 후 현재가 기준으로 신규 그리드 재배치

**테스트 케이스**:
- 미체결 주문 3개 → 취소 성공 → 신규 그리드 배치
- 미체결 주문 없음 → 취소 0건, 신규 그리드만 배치
- API 취소 실패 시 → DB는 취소 처리 (강제 동기화)
- 예수금 부족 → 매수 주문 일부만 배치
- 보유 수량 부족 → 매도 주문 일부만 배치

**핵심 패턴**:
```typescript
// 1. 미체결 조회
const pendingOrders = await getPendingOrders(strategyId);
// 2. API 취소 (실패해도 계속 진행)
for (const order of pendingOrders) {
  await cancelOrderAction(...);
}
// 3. DB 일괄 취소
await cancelOrders(orderIds);
// 4. 신규 배치
await deployGrid(strategy);
```

---

### 4. `pollFills.ts` - 체결 감지 및 동기화

**요구사항**:
1. 키움 API 체결 목록과 DB PENDING 비교 → 새 체결 감지
2. 키움 API 미체결 목록과 DB PENDING 비교 → 취소된 주문 감지

**테스트 케이스**:

**체결 감지**:
- DB PENDING 주문 3개, 키움 체결 목록 1개 매칭 → handleFillEvent 호출 1회
- DB PENDING 없음 → 0건 처리

**동기화 (키움 앱 수동 취소)**:
- DB PENDING: [A, B, C], 키움 미체결: [A, B] → C를 CANCELLED로 업데이트
- DB PENDING: [A, B], 키움 미체결: [A, B] → 변경 없음
- 키움 API 실패 → 동기화 스킵, 로그 경고

**핵심 패턴**:
```typescript
// 체결 감지
const dbPendingMap = new Map(dbPendingOrders.map(o => [o.order_id, o]));
for (const fill of apiFilledOrders) {
  const dbOrder = dbPendingMap.get(fill.orderNo);
  if (dbOrder) await handleFillEvent(dbOrder, ...);
}

// 취소 동기화
const apiPendingSet = new Set(apiPendingOrders.map(o => o.orderNo));
const cancelledOrderIds = dbPendingOrders
  .filter(dbOrder => !apiPendingSet.has(dbOrder.order_id))
  .map(o => o.order_id);
if (cancelledOrderIds.length > 0) {
  await cancelOrders(cancelledOrderIds);
}
```

---

## 테스트 환경

- **프레임워크**: Vitest
- **Mocking**: 키움 API 호출은 Mock 처리
- **DB**: 테스트용 Supabase 인스턴스 또는 Mock

## 실행

```bash
pnpm test src/features/grid-trader/lib/**/*.test.ts
```
