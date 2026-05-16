# Grid Trader 구현 패턴

> PRD: [prd.md](./prd.md) | 체크리스트: [checklist.md](./checklist.md)

이 문서는 Grid Trader의 **안정적인 동작을 보장하는 핵심 구현 패턴**을 설명합니다.

---

## 1. 그리드 이탈 판정 (리밸런싱 트리거)

### 필요성

매도 주문이 없을 때 단순히 `Math.max(...[])`를 사용하면 `-Infinity`가 반환되어 **무한 리밸런싱**이 발생합니다.

### 발생 시나리오

```
전략 설정:
- minHoldingLimit: 10주
- 보유 수량: 10주 (매도 불가 상태)
- upper_grid_count: 3개
- grid_gap: 5,000원

현재 그리드:
- 매수: 295,000원, 290,000원, 285,000원 (3개)
- 매도: 없음 (보유 수량 부족)
- 현재가: 298,000원
```

**버그 발생 과정**:
1. `isGridOutOfRange()`에서 `maxPrice` 계산 시도
2. 매도 주문이 없어 `Math.max(...[])` = `-Infinity`
3. `currentPrice (298,000) > maxPrice (-Infinity)` → 항상 `true`
4. 리밸런싱 실행 → 미체결 취소 → 재배치
5. 다시 매도 주문 못 걸림 → 1분 후 다시 체크 → **무한 반복**

### 올바른 패턴

```typescript
function isGridOutOfRange(
  currentPrice: number,
  pendingOrders: GridOrder[],
  strategy: GridStrategy
): boolean {
  if (pendingOrders.length === 0) return false;

  const allPrices = pendingOrders.map((o) => o.grid_price);
  const minPrice = Math.min(...allPrices);

  // 매도 주문이 있는지 확인
  const sellOrders = pendingOrders.filter((o) => o.order_type === "SELL");

  let maxPrice: number;
  if (sellOrders.length > 0) {
    // ✅ 매도 주문이 있으면 실제 최대값 사용
    maxPrice = Math.max(...sellOrders.map((o) => o.grid_price));
  } else {
    // ✅ 매도 주문이 없으면 이론적 최대값 계산
    const maxBuyPrice = Math.max(...allPrices);

    // 호가 단위로 조정된 grid_gap 계산
    const baseTick = getTickSize(maxBuyPrice);
    const adjustedGap = Math.round(strategy.grid_gap / baseTick) * baseTick;

    // 이론적 최대값 = 최고 매수가 + gap * (upper_grid_count + 1)
    // 예: 295,000 + 5,000 * (3 + 1) = 315,000
    maxPrice = maxBuyPrice + adjustedGap * (strategy.upper_grid_count + 1);

    logger.info("매도 주문 없음 - 이론적 최대값 사용", {
      maxBuyPrice,
      theoreticalMax: maxPrice,
      upperGridCount: strategy.upper_grid_count,
      adjustedGap,
    });
  }

  // 현재가가 그리드 범위를 벗어남
  return currentPrice > maxPrice || currentPrice < minPrice;
}
```

### 결과

- 현재가 298,000원 < 이론적 최대값 315,000원 → 그리드 범위 내
- 리밸런싱 스킵 → 무한 루프 해결

### 참조

- `features/grid-trader/lib/cron/checkRebalance.ts:56-84`

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
