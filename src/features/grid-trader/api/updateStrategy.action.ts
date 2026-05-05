"use server";

import { logger } from "@/shared/lib/logger";
import {
	updateStrategy as updateStrategyDb,
	type GridStrategyUpdate,
	type GridStrategy,
} from "@/entities/grid-trader";
import { gridStrategyUpdateSchema } from "@/entities/grid-trader";

/**
 * Server Action: 그리드 전략 수정
 * @param id - 전략 ID
 * @param data - 수정할 데이터
 * @returns 수정 결과
 */
export async function updateStrategyAction(
	id: string,
	data: GridStrategyUpdate,
): Promise<
	| { success: true; strategy: GridStrategy }
	| { success: false; error: string }
> {
	try {
		logger.info("UpdateStrategyAction", "전략 수정 시작", {
			strategyId: id,
		});

		// Zod 검증
		const validationResult = gridStrategyUpdateSchema.safeParse(data);
		if (!validationResult.success) {
			const errorMessage = validationResult.error.errors
				.map((e) => `${e.path.join(".")}: ${e.message}`)
				.join(", ");
			logger.warn("UpdateStrategyAction", "입력값 검증 실패", {
				errors: validationResult.error.errors,
			});
			return { success: false, error: `입력값 검증 실패: ${errorMessage}` };
		}

		// DB 업데이트
		const strategy = await updateStrategyDb(id, data);

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
