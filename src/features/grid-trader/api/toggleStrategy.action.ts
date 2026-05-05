"use server";

import { logger } from "@/shared/lib/logger";
import {
	toggleStrategyActive as toggleStrategyActiveDb,
	type GridStrategy,
} from "@/entities/grid-trader";

/**
 * Server Action: 그리드 전략 활성화/비활성화 토글
 * @param id - 전략 ID
 * @param isActive - 활성화 여부
 * @returns 토글 결과
 */
export async function toggleStrategyAction(
	id: string,
	isActive: boolean,
): Promise<
	| { success: true; strategy: GridStrategy }
	| { success: false; error: string }
> {
	try {
		logger.info("ToggleStrategyAction", "전략 활성화 상태 변경 시작", {
			strategyId: id,
			isActive,
		});

		// DB 업데이트
		const strategy = await toggleStrategyActiveDb(id, isActive);

		logger.info("ToggleStrategyAction", "전략 활성화 상태 변경 완료", {
			strategyId: strategy.id,
			isActive: strategy.is_active,
		});

		return { success: true, strategy };
	} catch (error) {
		logger.error("ToggleStrategyAction", "전략 활성화 상태 변경 실패", {
			strategyId: id,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "전략 활성화 상태 변경 중 오류가 발생했습니다.",
		};
	}
}
