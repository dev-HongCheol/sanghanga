/**
 * @fileoverview 체결 감지 Cron 로직
 * @description 활성 전략의 체결 이벤트 감지 및 카운터 주문 생성
 */

import { logger } from "@/shared/lib/logger";
import { pollFills } from "../pollFills";

/**
 * 체결 감지 비즈니스 로직
 * @description Cron과 Route Handler에서 공용으로 사용
 */
export async function checkFillsLogic() {
	try {
		const processed = await pollFills();

		if (processed > 0) {
			logger.info("CronCheckFills", `체결 감지 완료: ${processed}개 처리`, undefined, true);
		}

		return {
			success: true,
			processed,
		};
	} catch (error) {
		logger.error("CronCheckFills", "체결 감지 오류", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "체결 감지 중 오류 발생",
		};
	}
}
