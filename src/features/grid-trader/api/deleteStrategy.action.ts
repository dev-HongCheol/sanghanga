"use server";

import { logger } from "@/shared/lib/logger";
import { deleteStrategy as deleteStrategyDb } from "@/entities/grid-trader";

/**
 * Server Action: 그리드 전략 삭제
 * @param id - 전략 ID
 * @returns 삭제 결과
 */
export async function deleteStrategyAction(
	id: string,
): Promise<{ success: true } | { success: false; error: string }> {
	try {
		logger.info("DeleteStrategyAction", "전략 삭제 시작", {
			strategyId: id,
		});

		// DB에서 삭제
		await deleteStrategyDb(id);

		logger.info("DeleteStrategyAction", "전략 삭제 완료", {
			strategyId: id,
		});

		return { success: true };
	} catch (error) {
		logger.error("DeleteStrategyAction", "전략 삭제 실패", {
			strategyId: id,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "전략 삭제 중 오류가 발생했습니다.",
		};
	}
}
