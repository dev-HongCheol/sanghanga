import { cancelOrders, getPendingOrders } from "@/entities/grid-trader";
import type { GridStrategy } from "@/entities/grid-trader";
import { logger } from "@/shared/lib/logger";
import { cancelOrderAction } from "../api/cancelOrder.action";
import { deployGrid } from "./deployGrid";

/**
 * 리밸런싱 결과
 */
export interface RebalanceResult {
	/** 취소된 미체결 주문 수 */
	cancelled: number;
	/** 새로 배치된 주문 수 */
	placed: number;
	/** 배치 실패한 주문 수 */
	failed: number;
}

/**
 * 그리드를 현재가 기준으로 재구성한다
 *
 * - 미체결 주문 전체 취소 (API + DB)
 * - 현재가 기준으로 그리드 재계산 및 신규 주문 배치
 *
 * 트리거: 1시간 주기 / 가격 그리드 이탈 / 수동 버튼
 *
 * @param strategy - 리밸런싱할 그리드 전략
 * @returns 리밸런싱 결과
 */
export async function rebalanceGrid(strategy: GridStrategy): Promise<RebalanceResult> {
	logger.info("RebalanceGrid", "리밸런싱 시작", {
		strategyId: strategy.id,
		stockCode: strategy.stock_code,
	});

	// 1. 미체결 주문 목록 조회
	const pendingOrders = await getPendingOrders(strategy.id);
	logger.info("RebalanceGrid", "미체결 주문 조회 완료", { count: pendingOrders.length });

	// 2. 각 주문 API 취소 (실패해도 계속 진행)
	const cancelledOrderIds: string[] = [];
	for (const order of pendingOrders) {
		const result = await cancelOrderAction(order.order_id, order.stock_code, 0);
		if (result.success) {
			cancelledOrderIds.push(order.order_id);
		} else {
			logger.warn("RebalanceGrid", "주문 취소 실패 (DB 취소 계속 진행)", {
				orderId: order.order_id,
				error: result.error,
			});
			// API 취소 실패해도 DB에서는 취소 처리
			cancelledOrderIds.push(order.order_id);
		}
	}

	// 3. DB에서 일괄 취소 처리
	if (cancelledOrderIds.length > 0) {
		await cancelOrders(cancelledOrderIds);
	}

	logger.info("RebalanceGrid", "미체결 주문 취소 완료", { cancelled: cancelledOrderIds.length });

	// 4. 신규 그리드 배치
	const deployResult = await deployGrid(strategy);

	logger.info("RebalanceGrid", "리밸런싱 완료", {
		strategyId: strategy.id,
		cancelled: cancelledOrderIds.length,
		...deployResult,
	});

	return {
		cancelled: cancelledOrderIds.length,
		placed: deployResult.placed,
		failed: deployResult.failed,
	};
}
