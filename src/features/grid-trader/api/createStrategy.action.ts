"use server";

import { logger } from "@/shared/lib/logger";
import {
	createStrategy as createStrategyDb,
	type GridStrategyInsert,
	type GridStrategy,
} from "@/entities/grid-trader";
import { gridStrategyCreateSchema } from "@/entities/grid-trader";

/**
 * Server Action: 그리드 전략 생성
 * @param data - 전략 생성 데이터
 * @returns 생성 결과
 */
export async function createStrategyAction(
	data: GridStrategyInsert,
): Promise<
	| { success: true; strategy: GridStrategy }
	| { success: false; error: string }
> {
	try {
		logger.info("CreateStrategyAction", "전략 생성 시작", {
			stockCode: data.stock_code,
			stockName: data.stock_name,
		});

		// Zod 검증
		const validationResult = gridStrategyCreateSchema.safeParse(data);
		if (!validationResult.success) {
			const errorMessage = validationResult.error.errors
				.map((e) => `${e.path.join(".")}: ${e.message}`)
				.join(", ");
			logger.warn("CreateStrategyAction", "입력값 검증 실패", {
				errors: validationResult.error.errors,
			});
			return { success: false, error: `입력값 검증 실패: ${errorMessage}` };
		}

		// DB에 저장
		const strategy = await createStrategyDb(data);

		logger.info("CreateStrategyAction", "전략 생성 완료", {
			strategyId: strategy.id,
			stockCode: strategy.stock_code,
		});

		return { success: true, strategy };
	} catch (error) {
		logger.error("CreateStrategyAction", "전략 생성 실패", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "전략 생성 중 오류가 발생했습니다.",
		};
	}
}
