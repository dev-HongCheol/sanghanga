import { createFillEvent, createOrder, updateOrderStatus } from "@/entities/grid-trader";
import type { GridOrder, GridStrategy } from "@/entities/grid-trader";
import { logger } from "@/shared/lib/logger";
import { getAccountBalanceAction } from "../api/getAccountBalance.action";
import { placeOrderAction } from "../api/placeOrder.action";

/**
 * 체결 이벤트를 처리하고 반대 방향 카운터 주문을 생성한다
 *
 * - 매수 체결 → 한 칸 위 매도 주문 생성 (minHoldingLimit / 목표가 제약 확인)
 * - 매도 체결 → 한 칸 아래 매수 주문 생성 (예수금 확인)
 * - DB에 체결 이벤트 기록 및 주문 상태 FILLED 갱신
 *
 * @param filledOrder - 체결된 DB 주문 레코드
 * @param strategy - 해당 그리드 전략
 * @param fillPrice - 실제 체결가 (원)
 * @param fillTime - 체결 시각 (ISO 8601)
 */
export async function handleFillEvent(
	filledOrder: GridOrder,
	strategy: GridStrategy,
	fillPrice: number,
	fillTime: string,
): Promise<void> {
	logger.info("HandleFillEvent", "체결 이벤트 처리 시작", {
		orderId: filledOrder.order_id,
		orderType: filledOrder.order_type,
		fillPrice,
	});

	// 1. 주문 상태 FILLED 갱신
	await updateOrderStatus(filledOrder.order_id, "FILLED", fillTime);

	// 2. 체결 이벤트 DB 기록
	const profitLoss =
		filledOrder.order_type === "SELL"
			? strategy.grid_gap * filledOrder.quantity // 매도 시 grid_gap * 수량 = 회당 수익
			: null;

	await createFillEvent({
		strategy_id: strategy.id,
		stock_code: filledOrder.stock_code,
		order_id: filledOrder.order_id,
		fill_price: fillPrice,
		fill_quantity: filledOrder.quantity,
		fill_time: fillTime,
		order_type: filledOrder.order_type,
		profit_loss: profitLoss,
	});

	// 3. 카운터 주문 생성
	if (filledOrder.order_type === "BUY") {
		await handleBuyFill(filledOrder, strategy, fillPrice);
	} else {
		await handleSellFill(filledOrder, strategy, fillPrice);
	}
}

/**
 * 매수 체결 처리: 한 칸 위 매도 주문 생성
 */
async function handleBuyFill(
	filledOrder: GridOrder,
	strategy: GridStrategy,
	fillPrice: number,
): Promise<void> {
	const sellPrice = fillPrice + strategy.grid_gap;

	// 목표가 미만 매도 금지
	if (strategy.target_price !== null && sellPrice < strategy.target_price) {
		logger.info("HandleFillEvent", "목표가 미만으로 카운터 매도 주문 생략", {
			sellPrice,
			targetPrice: strategy.target_price,
		});
		return;
	}

	// 보유 수량 확인 (minHoldingLimit 제약)
	const balanceResult = await getAccountBalanceAction();
	if (!balanceResult.success) {
		logger.error("HandleFillEvent", "잔고 조회 실패로 카운터 매도 주문 생략", { error: balanceResult.error });
		return;
	}

	const holding = balanceResult.balance.holdings.find(
		(h) => h.stockCode === filledOrder.stock_code,
	);
	const currentQty = holding?.tradableQuantity ?? 0;
	if (currentQty - strategy.quantity_per_grid <= strategy.min_holding_limit) {
		logger.warn("HandleFillEvent", "보유 수량 부족으로 카운터 매도 주문 생략", {
			currentQty,
			minHoldingLimit: strategy.min_holding_limit,
		});
		return;
	}

	const result = await placeOrderAction({
		stockCode: filledOrder.stock_code,
		orderType: "SELL",
		price: sellPrice,
		quantity: strategy.quantity_per_grid,
		priceType: "LIMIT",
	});

	if (result.success) {
		await createOrder({
			strategy_id: strategy.id,
			stock_code: filledOrder.stock_code,
			order_id: result.result.orderNo,
			order_type: "SELL",
			grid_price: sellPrice,
			quantity: strategy.quantity_per_grid,
			status: "PENDING",
			filled_at: null,
		});
		logger.info("HandleFillEvent", "카운터 매도 주문 완료", { sellPrice, orderNo: result.result.orderNo });
	} else {
		logger.error("HandleFillEvent", "카운터 매도 주문 실패", { sellPrice, error: result.error });
	}
}

/**
 * 매도 체결 처리: 한 칸 아래 매수 주문 생성
 */
async function handleSellFill(
	filledOrder: GridOrder,
	strategy: GridStrategy,
	fillPrice: number,
): Promise<void> {
	const buyPrice = fillPrice - strategy.grid_gap;
	if (buyPrice <= 0) return;

	// 예수금 확인
	const balanceResult = await getAccountBalanceAction();
	if (!balanceResult.success) {
		logger.error("HandleFillEvent", "잔고 조회 실패로 카운터 매수 주문 생략", { error: balanceResult.error });
		return;
	}

	const requiredDeposit = buyPrice * strategy.quantity_per_grid;
	if (balanceResult.balance.estimatedDepositAsset < requiredDeposit) {
		logger.warn("HandleFillEvent", "예수금 부족으로 카운터 매수 주문 생략", {
			required: requiredDeposit,
			available: balanceResult.balance.estimatedDepositAsset,
		});
		return;
	}

	const result = await placeOrderAction({
		stockCode: filledOrder.stock_code,
		orderType: "BUY",
		price: buyPrice,
		quantity: strategy.quantity_per_grid,
		priceType: "LIMIT",
	});

	if (result.success) {
		await createOrder({
			strategy_id: strategy.id,
			stock_code: filledOrder.stock_code,
			order_id: result.result.orderNo,
			order_type: "BUY",
			grid_price: buyPrice,
			quantity: strategy.quantity_per_grid,
			status: "PENDING",
			filled_at: null,
		});
		logger.info("HandleFillEvent", "카운터 매수 주문 완료", { buyPrice, orderNo: result.result.orderNo });
	} else {
		logger.error("HandleFillEvent", "카운터 매수 주문 실패", { buyPrice, error: result.error });
	}
}
