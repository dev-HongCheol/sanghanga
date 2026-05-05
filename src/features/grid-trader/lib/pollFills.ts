import { getActiveStrategies, getPendingOrders } from "@/entities/grid-trader";
import type { GridStrategy } from "@/entities/grid-trader";
import { logger } from "@/shared/lib/logger";
import { getFilledOrdersAction } from "../api/getOrders.action";
import { handleFillEvent } from "./handleFillEvent";

/**
 * 단일 전략의 체결 이벤트를 감지하고 처리한다
 *
 * DB의 PENDING 주문과 키움 API 체결 목록을 비교해 새 체결을 감지한다
 *
 * @param strategy - 감지할 그리드 전략
 * @returns 처리된 체결 수
 */
async function pollFillsForStrategy(strategy: GridStrategy): Promise<number> {
	const [pendingOrders, fillsResult] = await Promise.all([
		getPendingOrders(strategy.id),
		getFilledOrdersAction(strategy.stock_code),
	]);

	if (!fillsResult.success) {
		logger.error("PollFills", "체결 목록 조회 실패", {
			strategyId: strategy.id,
			stockCode: strategy.stock_code,
			error: fillsResult.error,
		});
		return 0;
	}

	if (pendingOrders.length === 0) return 0;

	// DB 미체결 주문번호 → order 매핑
	const pendingMap = new Map(pendingOrders.map((o) => [o.order_id, o]));

	let processed = 0;
	for (const fill of fillsResult.orders) {
		const dbOrder = pendingMap.get(fill.orderNo);
		if (!dbOrder) continue; // 우리 주문이 아닌 체결

		logger.info("PollFills", "신규 체결 감지", {
			orderId: fill.orderNo,
			orderType: fill.orderType,
			filledPrice: fill.filledPrice,
		});

		try {
			await handleFillEvent(dbOrder, strategy, fill.filledPrice, fill.orderTime);
			processed++;
		} catch (err) {
			logger.error("PollFills", "체결 이벤트 처리 실패", {
				orderId: fill.orderNo,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}

	return processed;
}

/**
 * 활성 전략 전체의 체결을 1회 폴링한다
 *
 * 09:00~15:30 사이 1초 간격으로 호출됨 (Cron Job에서 관리)
 *
 * @returns 처리된 총 체결 수
 */
export async function pollFills(): Promise<number> {
	let totalProcessed = 0;

	let strategies: GridStrategy[];
	try {
		strategies = await getActiveStrategies();
	} catch (err) {
		logger.error("PollFills", "활성 전략 조회 실패", {
			error: err instanceof Error ? err.message : String(err),
		});
		return 0;
	}

	for (const strategy of strategies) {
		const count = await pollFillsForStrategy(strategy);
		totalProcessed += count;
	}

	if (totalProcessed > 0) {
		logger.info("PollFills", "폴링 완료", { totalProcessed });
	}

	return totalProcessed;
}
