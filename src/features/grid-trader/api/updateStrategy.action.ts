"use server";

import {
	type GridStrategy,
	type GridStrategyUpdate,
	updateStrategy as updateStrategyDb,
} from "@/entities/grid-trader";
import { gridStrategyUpdateSchema } from "@/entities/grid-trader";
import { logger } from "@/shared/lib/logger";
import { rebalanceGrid } from "../lib/rebalanceGrid";

/**
 * Server Action: 그리드 전략 수정
 * @param id - 전략 ID
 * @param data - 수정할 데이터
 * @returns 수정 결과
 */
export async function updateStrategyAction(
	id: string,
	data: GridStrategyUpdate
): Promise<{ success: true; strategy: GridStrategy } | { success: false; error: string }> {
	try {
		logger.info("UpdateStrategyAction", "전략 수정 시작", {
			strategyId: id,
		});

		// Zod 검증
		const validationResult = gridStrategyUpdateSchema.safeParse(data);
		if (!validationResult.success) {
			const errorMessage = validationResult.error.issues
				.map((e) => `${String(e.path.join("."))}: ${e.message}`)
				.join(", ");
			logger.warn("UpdateStrategyAction", "입력값 검증 실패", {
				errors: validationResult.error.issues,
			});
			return { success: false, error: `입력값 검증 실패: ${errorMessage}` };
		}

		// DB 업데이트
		const strategy = await updateStrategyDb(id, data);

		// 활성 상태인 전략이면 리밸런싱 (기존 주문 취소 + 신규 그리드 배치)
		if (strategy.is_active) {
			logger.info("UpdateStrategyAction", "활성 전략 수정 → 리밸런싱 시작", {
				strategyId: strategy.id,
			});

			const rebalanceResult = await rebalanceGrid(strategy);

			logger.info("UpdateStrategyAction", "리밸런싱 완료", {
				strategyId: strategy.id,
				cancelled: rebalanceResult.cancelled,
				placed: rebalanceResult.placed,
				failed: rebalanceResult.failed,
			});
		}

		logger.info("UpdateStrategyAction", "전략 수정 완료", {
			strategyId: strategy.id,
		});

		return { success: true, strategy };
	} catch (error) {
		logger.error("UpdateStrategyAction", "전략 수정 실패", {
			strategyId: id,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "전략 수정 중 오류가 발생했습니다.",
		};
	}
}
