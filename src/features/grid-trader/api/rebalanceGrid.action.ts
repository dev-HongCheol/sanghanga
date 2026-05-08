"use server";

import { getStrategyById } from "@/entities/grid-trader";
import { logger } from "@/shared/lib/logger";
import { type RebalanceResult, rebalanceGrid } from "../lib/rebalanceGrid";

/**
 * Server Action: 그리드 리밸런싱
 *
 * - 미체결 주문 전체 취소 (키움 API + DB)
 * - 현재가 기준으로 그리드 재계산 및 신규 주문 배치
 *
 * 사용 케이스:
 * - 가격이 그리드 범위를 벗어났을 때
 * - 키움 앱에서 수동 취소한 주문이 있을 때
 * - 전략 설정을 변경한 후
 *
 * @param strategyId - 리밸런싱할 전략 ID
 * @returns 리밸런싱 결과
 */
export async function rebalanceGridAction(
	strategyId: string
): Promise<{ success: true; result: RebalanceResult } | { success: false; error: string }> {
	try {
		logger.info("RebalanceGridAction", "리밸런싱 시작", { strategyId });

		// 전략 조회
		const strategy = await getStrategyById(strategyId);
		if (!strategy) {
			return { success: false, error: "전략을 찾을 수 없습니다" };
		}

		if (!strategy.is_active) {
			return { success: false, error: "활성 상태인 전략만 리밸런싱할 수 있습니다" };
		}

		// 리밸런싱 실행
		const result = await rebalanceGrid(strategy);

		logger.info("RebalanceGridAction", "리밸런싱 완료", {
			strategyId,
			cancelled: result.cancelled,
			placed: result.placed,
			failed: result.failed,
		});

		return { success: true, result };
	} catch (error) {
		logger.error("RebalanceGridAction", "리밸런싱 실패", {
			strategyId,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "리밸런싱 중 오류가 발생했습니다.",
		};
	}
}
