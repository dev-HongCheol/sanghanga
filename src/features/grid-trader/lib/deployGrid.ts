import { createOrder } from "@/entities/grid-trader";
import type { GridStrategy } from "@/entities/grid-trader";
import { logger } from "@/shared/lib/logger";
import { getAccountBalanceAction } from "../api/getAccountBalance.action";
import { getCurrentPriceAction } from "../api/getCurrentPrice.action";
import { placeOrderAction } from "../api/placeOrder.action";
import { calculateGrid } from "./calculateGrid";
import { matchStockCode } from "./matchStockCode";

/** Rate limiting: 주문 간 대기 시간 (ms) */
const ORDER_INTERVAL_MS = 500;

/**
 * 지정 시간(ms) 대기
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 초기 그리드 배치 결과
 */
export interface DeployGridResult {
	/** 성공적으로 배치된 주문 수 */
	placed: number;
	/** 실패한 주문 수 */
	failed: number;
}

/**
 * 전략 기준으로 초기 그리드 주문을 배치한다
 *
 * - 현재가 조회 → 그리드 가격 계산 → 매수/매도 주문 배치
 * - 예수금 부족 시 매수 주문 생략
 * - 보유 수량 ≤ minHoldingLimit 시 매도 주문 생성 중단
 * - 목표가 미만 매도 주문 생성 금지
 * - 주문 간 500ms 간격 적용
 *
 * @param strategy - 배치할 그리드 전략
 * @param useAdminClient - Admin Client 사용 여부 (Cron 등 백그라운드 작업용, 기본값: false)
 * @returns 배치 결과 (성공/실패 주문 수)
 */
export async function deployGrid(strategy: GridStrategy, useAdminClient = false): Promise<DeployGridResult> {
	logger.info("DeployGrid", "그리드 배치 시작", {
		strategyId: strategy.id,
		stockCode: strategy.stock_code,
	});

	const [priceResult, balanceResult] = await Promise.all([
		getCurrentPriceAction(strategy.stock_code),
		getAccountBalanceAction(),
	]);

	if (!priceResult.success) {
		throw new Error(`현재가 조회 실패: ${priceResult.error}`);
	}
	if (!balanceResult.success) {
		throw new Error(`계좌 잔고 조회 실패: ${balanceResult.error}`);
	}

	const currentPrice = priceResult.priceInfo.currentPrice;
	const { buyPrices, sellPrices } = calculateGrid(
		currentPrice,
		strategy.grid_gap,
		strategy.upper_grid_count,
		strategy.lower_grid_count
	);

	const holding = balanceResult.balance.holdings.find((h) =>
		matchStockCode(h.stockCode, strategy.stock_code)
	);
	const totalQty = holding?.quantity ?? 0;
	let availableDeposit = balanceResult.balance.estimatedDepositAsset;

	// 매도 가능 수량 = 총 보유 수량 - Core 물량
	let sellableQty = Math.max(0, totalQty - strategy.min_holding_limit);

	let placed = 0;
	let failed = 0;

	// 매수 주문: 높은 가격 순(현재가에 가까운 것 먼저)
	// calculateGrid에서 이미 호가 단위로 조정된 가격을 사용
	for (const price of buyPrices) {
		const requiredDeposit = price * strategy.quantity_per_grid;
		if (availableDeposit < requiredDeposit) {
			logger.warn("DeployGrid", "예수금 부족으로 매수 주문 생략", {
				price,
				requiredDeposit,
				availableDeposit,
			});
			break;
		}

		const result = await placeOrderAction({
			stockCode: strategy.stock_code,
			orderType: "BUY",
			price,
			quantity: strategy.quantity_per_grid,
			priceType: "LIMIT",
		});

		if (result.success) {
			await createOrder({
				strategy_id: strategy.id,
				stock_code: strategy.stock_code,
				order_id: result.result.orderNo,
				order_type: "BUY",
				grid_price: price,
				quantity: strategy.quantity_per_grid,
				status: "PENDING",
				filled_at: null,
			}, useAdminClient);
			availableDeposit -= requiredDeposit;
			placed++;
		} else {
			logger.error("DeployGrid", "매수 주문 실패", { price, error: result.error });
			failed++;
		}

		await sleep(ORDER_INTERVAL_MS);
	}

	// 매도 주문: 낮은 가격 순(현재가에 가까운 것 먼저)
	// calculateGrid에서 이미 호가 단위로 조정된 가격을 사용
	for (const price of sellPrices) {
		if (sellableQty < strategy.quantity_per_grid) {
			logger.warn("DeployGrid", "보유 수량 부족으로 매도 주문 중단", {
				price,
				totalQty,
				sellableQty,
				minHoldingLimit: strategy.min_holding_limit,
				quantityPerGrid: strategy.quantity_per_grid,
			});
			break;
		}
		// 목표가 미만 매도 금지
		if (strategy.target_price !== null && price < strategy.target_price) {
			logger.info("DeployGrid", "목표가 미만 매도 주문 생략", {
				price,
				targetPrice: strategy.target_price,
			});
			continue;
		}

		const result = await placeOrderAction({
			stockCode: strategy.stock_code,
			orderType: "SELL",
			price,
			quantity: strategy.quantity_per_grid,
			priceType: "LIMIT",
		});

		if (result.success) {
			await createOrder({
				strategy_id: strategy.id,
				stock_code: strategy.stock_code,
				order_id: result.result.orderNo,
				order_type: "SELL",
				grid_price: price,
				quantity: strategy.quantity_per_grid,
				status: "PENDING",
				filled_at: null,
			}, useAdminClient);
			sellableQty -= strategy.quantity_per_grid;
			placed++;
		} else {
			logger.error("DeployGrid", "매도 주문 실패", { price, error: result.error });
			failed++;
		}

		await sleep(ORDER_INTERVAL_MS);
	}

	logger.info("DeployGrid", "그리드 배치 완료", { strategyId: strategy.id, placed, failed });
	return { placed, failed };
}
