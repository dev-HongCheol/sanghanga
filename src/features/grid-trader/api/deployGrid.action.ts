"use server";

import { getStrategyById } from "@/entities/grid-trader";
import { deployGrid } from "../lib/deployGrid";

/**
 * 그리드 배치 Server Action 응답
 */
interface DeployGridActionResult {
	/** 성공 여부 */
	success: boolean;
	/** 성공 시 배치 결과 */
	result?: {
		/** 배치된 주문 수 */
		placed: number;
		/** 실패한 주문 수 */
		failed: number;
	};
	/** 실패 시 에러 메시지 */
	error?: string;
}

/**
 * 그리드 전략의 초기 주문을 배치한다
 *
 * - 전략 ID로 DB에서 전략 조회
 * - deployGrid 함수로 그리드 주문 배치
 * - 매수/매도 주문을 현재가 기준으로 배치
 *
 * @param strategyId - 배치할 전략 ID
 * @returns 배치 결과 (성공/실패 주문 수)
 */
export async function deployGridAction(strategyId: string): Promise<DeployGridActionResult> {
	try {
		const strategy = await getStrategyById(strategyId);

		if (!strategy) {
			return {
				success: false,
				error: "전략을 찾을 수 없습니다.",
			};
		}

		if (!strategy.is_active) {
			return {
				success: false,
				error: "활성화된 전략만 그리드를 배치할 수 있습니다.",
			};
		}

		const result = await deployGrid(strategy);

		return {
			success: true,
			result,
		};
	} catch (error) {
		console.error("❌ deployGridAction 에러:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "그리드 배치 실패",
		};
	}
}
