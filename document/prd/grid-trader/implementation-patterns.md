# Grid Trader 구현 패턴

> PRD: [prd.md](./prd.md) | 체크리스트: [checklist.md](./checklist.md)

이 문서는 Grid Trader의 **안정적인 동작을 보장하는 핵심 구현 패턴**을 설명합니다.

---

## 1. 그리드 이탈 판정 (리밸런싱 트리거) - v1.6.7

### 필요성

주문 불균형(매수 또는 매도 주문 0개)이 발생했을 때, **체결로 인한 것**인지 **자원 부족**인지 구분하지 않으면 **무한 리밸런싱**이 발생합니다.

### 발생 시나리오 1: 자원 부족 (보유 수량)

```
전략 설정:
- minHoldingLimit: 10주
- 현재 보유: 10주 (Core 물량만 남음)
- sellableQty: 0주

현재 그리드:
- 매수: 295,000원, 290,000원, 285,000원 (3개)
- 매도: 없음 (보유 수량 부족으로 못 걸림)
- 현재가: 298,000원
```

**무한 리밸런싱 발생**:
1. 매도 주문 0개 감지 → 리밸런싱 트리거
2. 미체결 취소 → 재배치
3. 여전히 `sellableQty = 0` → 매도 주문 0개
4. 10분 후 다시 체크 → **무한 반복**

### 발생 시나리오 2: 체결로 인한 주문 부재

```
전략 설정:
- minHoldingLimit: 10주
- 현재 보유: 15주
- sellableQty: 5주 (매도 가능)

현재 그리드:
- 매수: [34,000, 33,000, 32,000] (3개)
- 매도: [] (3개 모두 체결됨)
- 현재가: 35,650원
```

**리밸런싱 필요**:
- 매도 주문 0개지만 `sellableQty = 5주` → 체결로 인한 부재
- 즉시 리밸런싱하여 새 매도 주문 생성 필요

### 올바른 패턴 (v1.6.7)

```typescript
interface BalanceInfo {
  availableDeposit: number;  // 예수금
  totalQty: number;          // 총 보유 수량
}

function isGridOutOfRange(
  currentPrice: number,
  pendingOrders: GridOrder[],
  strategy: GridStrategy,
  balance: BalanceInfo
): boolean {
  if (pendingOrders.length === 0) return false;

  const buyOrders = pendingOrders.filter((o) => o.order_type === "BUY");
  const sellOrders = pendingOrders.filter((o) => o.order_type === "SELL");

  // ✅ 매도 주문 0개: 자원 체크
  if (sellOrders.length === 0) {
    const sellableQty = Math.max(0, balance.totalQty - strategy.min_holding_limit);

    if (sellableQty > 0) {
      // 매도 가능 수량 있음 → 체결로 인한 부재 → 리밸런싱 필요
      logger.info("매도 주문 없음 (체결) - 리밸런싱 필요", {
        currentPrice,
        sellableQty,
        buyOrderCount: buyOrders.length,
      });
      return true;
    } else {
      // 보유 수량 부족 → 자원 부족 → 리밸런싱 불필요
      logger.info("매도 주문 없음 (자원 부족) - 리밸런싱 스킵", {
        totalQty: balance.totalQty,
        minHoldingLimit: strategy.min_holding_limit,
      });
      return false;
    }
  }

  // ✅ 매수 주문 0개: 자원 체크
  if (buyOrders.length === 0) {
    // 매수 1개 걸기 위한 최소 예수금 계산
    const baseTick = getTickSize(currentPrice);
    const adjustedGap = Math.round(strategy.grid_gap / baseTick) * baseTick;
    const buyPrice = adjustToTickSize(currentPrice - adjustedGap, "BUY");
    const requiredDeposit = buyPrice * strategy.quantity_per_grid;

    if (balance.availableDeposit >= requiredDeposit) {
      // 예수금 충분 → 체결로 인한 부재 → 리밸런싱 필요
      logger.info("매수 주문 없음 (체결) - 리밸런싱 필요", {
        currentPrice,
        availableDeposit: balance.availableDeposit,
        sellOrderCount: sellOrders.length,
      });
      return true;
    } else {
      // 예수금 부족 → 자원 부족 → 리밸런싱 불필요
      logger.info("매수 주문 없음 (자원 부족) - 리밸런싱 스킵", {
        availableDeposit: balance.availableDeposit,
        requiredDeposit,
      });
      return false;
    }
  }

  // ✅ 정상 상태: 매수/매도 주문 모두 존재
  const minPrice = Math.min(...buyOrders.map((o) => o.grid_price));
  const maxPrice = Math.max(...sellOrders.map((o) => o.grid_price));

  // 가격 그리드 이탈 체크
  return currentPrice > maxPrice || currentPrice < minPrice;
}
```

### 결과

**시나리오 1 (자원 부족)**:
- `sellableQty = 0` → 리밸런싱 스킵 → **무한 루프 방지**

**시나리오 2 (체결)**:
- `sellableQty = 5주 > 0` → 리밸런싱 실행 → 새 매도 주문 생성 ✅

### 참조

- `features/grid-trader/lib/cron/checkRebalance.ts:27-93`
- PRD: [prd.md - 4. 리밸런싱](./prd.md#4-리밸런싱)

---

## 2. 보유 수량 체크 일관성

### 필요성

`deployGrid`와 `handleFillEvent`에서 매도 가능 수량 계산 로직이 다르면 `minHoldingLimit` 아래로 떨어지는 매도 주문이 생성됩니다.

### 발생 시나리오

```
전략 설정:
- minHoldingLimit: 2주
- 현재 보유: 3주

잘못된 구현:
- deployGrid: sellableQty = totalHolding - minHoldingLimit = 1주 ✅
- handleFillEvent: 단순히 체결 수량(2주)만큼 매도 주문 ❌

결과:
- 매수 2주 체결 → 카운터 매도 2주 주문
- 총 보유 5주 - 매도 2주 = 3주 남음 (괜찮음처럼 보임)
- 하지만 실제로는 minHoldingLimit(2주) 위반 가능
```

### 올바른 패턴

**deployGrid.ts와 handleFillEvent.ts 모두 동일한 로직 적용**:

```typescript
// ✅ deployGrid.ts
const sellableQty = Math.max(0, totalHolding - strategy.min_holding_limit);

if (sellableQty === 0) {
  logger.warn("보유 수량이 minHoldingLimit 이하 - 매도 주문 생성 안 함", {
    totalHolding,
    minHoldingLimit: strategy.min_holding_limit,
  });
  return;
}

// 매도 주문 수량
const sellQty = Math.min(strategy.qty_per_grid, sellableQty);
```

```typescript
// ✅ handleFillEvent.ts (카운터 매도 주문)
const sellableQty = Math.max(0, totalHolding - strategy.min_holding_limit);

if (sellableQty === 0) {
  logger.warn("보유 수량이 minHoldingLimit 이하 - 카운터 매도 주문 생성 안 함", {
    totalHolding,
    minHoldingLimit: strategy.min_holding_limit,
  });
  return;
}

// 카운터 매도 주문 수량 (체결 수량 vs 매도 가능 수량 중 작은 값)
const counterQty = Math.min(filledQty, sellableQty);
```

### 참조

- `features/grid-trader/lib/deployGrid.ts` (초기 배치)
- `features/grid-trader/lib/handleFillEvent.ts` (카운터 주문)

---

## 3. 호가 단위 조정 일관성

### 필요성

모든 주문 가격은 한국 주식시장 호가 단위에 맞춰야 하며, 키움증권 API는 호가 단위에 맞지 않는 주문을 거부합니다.

### 올바른 패턴

**모든 주문 가격 계산 시 호가 단위 조정 필수**:

```typescript
import { adjustToTickSize } from "@/features/grid-trader/lib/adjustToTickSize";

// 매수 주문: 호가 단위로 내림 (유리한 방향)
const buyPrice = adjustToTickSize(calculatedPrice, "BUY");

// 매도 주문: 호가 단위로 올림 (유리한 방향)
const sellPrice = adjustToTickSize(calculatedPrice, "SELL");
```

### 적용 위치

- `calculateGrid.ts`: 초기 그리드 가격 계산
- `deployGrid.ts`: 주문 생성 전 가격 조정
- `handleFillEvent.ts`: 카운터 주문 가격 계산

### 참조

- `features/grid-trader/lib/adjustToTickSize.ts` (핵심 로직)
- [호가 단위 조정 가이드](./tick-size-guide.md) (상세 설명)

---

## 4. Cron 환경 특수 처리

### 필요성

Grid Trader는 Cron에서 가격/잔고/체결 감지를 수행하므로, Cron 환경의 제약사항을 이해해야 합니다.

### 공통 패턴 참조

Grid Trader는 다음 Cron 개발 패턴을 사용합니다:

1. **Admin 클라이언트 필수 사용**: Cron 컨텍스트에서 `cookies()` 호출 불가
2. **DB 기반 Mutex**: Vercel 멀티 프로세스 환경에서 중복 실행 방지
3. **방어적 프로그래밍**: 빈 배열 체크 필수
4. **외부 API 데이터 정규화**: 키움 API 응답 형식 정규화

**상세 내용**: [`document/development.md - Cron 개발 패턴`](../../development.md#cron-개발-패턴-필수)

### Grid Trader 적용 예시

```typescript
// ✅ Admin 클라이언트 사용
export async function checkFillsLogic() {
  const strategies = await getActiveStrategies(true); // useAdmin=true
  // ...
}

// ✅ DB Mutex 사용
export async function checkRebalanceLogic() {
  const result = await withMutex(
    "grid_rebalance_check",
    checkRebalanceInternal,
    100
  );

  if (result === null) {
    logger.warn("다른 프로세스 실행 중 - 스킵");
    return;
  }

  return result;
}

// ✅ 키움 API 주문번호 정규화
const normalizeOrderNo = (no: string) => no.replace(/^0+/, "") || "0";
const dbOrder = dbPendingMap.get(normalizeOrderNo(fill.orderNo));
```

---

## 📝 참고

### 관련 문서

- [PRD](./prd.md) - 기능 요구사항
- [호가 단위 조정 가이드](./tick-size-guide.md) - 호가 단위 상세
- [Cron 개발 패턴](../../development.md#cron-개발-패턴-필수) - 공통 Cron 규칙

### 핵심 구현 파일

| 파일 | 역할 |
|:-----|:-----|
| `checkRebalance.ts:56-84` | 그리드 이탈 판정 |
| `deployGrid.ts` | 초기 배치 시 보유 수량 체크 |
| `handleFillEvent.ts` | 카운터 주문 시 보유 수량 체크 |
| `adjustToTickSize.ts` | 호가 단위 조정 |
