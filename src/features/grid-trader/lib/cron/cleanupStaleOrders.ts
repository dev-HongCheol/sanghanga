/**
 * @fileoverview 미체결 주문 정리 Cron 로직
 * @description 전날 PENDING 상태로 남은 주문을 CANCELLED로 일괄 처리
 *
 * **배경**:
 * 한국 주식시장 지정가 주문은 장 마감 시 거래소에서 자동 취소된다.
 * DB는 이를 자동으로 반영하지 못하므로, 매일 08:00에 전날 PENDING 주문을 정리한다.
 *
 * **미처리 시 문제**:
 * - `checkRebalance`가 존재하지 않는 주문을 보고 "주문 있음"으로 판단
 * - 서버 재시작 시 자동 그리드 배치가 스킵됨
 */

import { cancelStalePendingOrders } from "@/entities/grid-trader";
import { logger } from "@/shared/lib/logger";

/**
 * 미체결 주문 정리 비즈니스 로직
 * @description Cron과 Route Handler에서 공용으로 사용
 */
export async function cleanupStaleOrdersLogic() {
	try {
		const cancelled = await cancelStalePendingOrders(true);

		if (cancelled > 0) {
			logger.info(
				"CronCleanupOrders",
				`전날 미체결 주문 정리 완료: ${cancelled}건 CANCELLED 처리`,
				undefined,
				true
			);
		}

		return {
			success: true,
			cancelled,
		};
	} catch (error) {
		logger.error("CronCleanupOrders", "미체결 주문 정리 오류", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "미체결 주문 정리 중 오류 발생",
		};
	}
}
