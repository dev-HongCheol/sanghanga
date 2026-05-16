import { cancelOrders, getActiveStrategies, getPendingOrders } from "@/entities/grid-trader";
import type { GridStrategy } from "@/entities/grid-trader";
import { logger } from "@/shared/lib/logger";
import { getFilledOrdersAction, getPendingOrdersAction } from "../api/getOrders.action";
import { handleFillEvent } from "./handleFillEvent";

/**
 * 키움 API 시각 형식 (HHmmss)을 ISO 8601 형식으로 변환
 * @param hhmmss - "090005" 형식의 시각
 * @returns ISO 8601 형식 문자열 (예: "2026-05-14T09:00:05+09:00")
 */
function parseKiwoomTime(hhmmss: string): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");

	const hh = hhmmss.substring(0, 2);
	const mm = hhmmss.substring(2, 4);
	const ss = hhmmss.substring(4, 6);

	// KST (UTC+9) 타임존 명시
	return `${year}-${month}-${day}T${hh}:${mm}:${ss}+09:00`;
}

/**
 * 단일 전략의 체결 이벤트 감지 및 주문 동기화
 *
 * 1. DB의 PENDING 주문과 키움 API 체결 목록 비교 → 새 체결 감지
 * 2. DB의 PENDING 주문과 키움 API 미체결 목록 비교 → 취소된 주문 감지 (키움 앱에서 수동 취소)
 *
 * @param strategy - 감지할 그리드 전략
 * @returns 처리된 체결 수
 */
async function pollFillsForStrategy(strategy: GridStrategy): Promise<number> {
	const [dbPendingOrders, fillsResult, apiPendingResult] = await Promise.all([
		getPendingOrders(strategy.id, true),
		getFilledOrdersAction(strategy.stock_code),
		getPendingOrdersAction(strategy.stock_code),
	]);

	if (!fillsResult.success) {
		logger.error("PollFills", "체결 목록 조회 실패", {
			strategyId: strategy.id,
			stockCode: strategy.stock_code,
			error: fillsResult.error,
		});
		return 0;
	}

	if (dbPendingOrders.length === 0) return 0;

	// DB 미체결 주문번호 → order 매핑
	// ord_no는 "0000037" 처럼 앞자리 0 패딩 형식으로 올 수 있으므로 양쪽 모두 정규화
	const normalizeOrderNo = (no: string) => no.replace(/^0+/, "") || "0";
	const dbPendingMap = new Map(dbPendingOrders.map((o) => [normalizeOrderNo(o.order_id), o]));

	let processed = 0;

	// 1. 체결된 주문 처리
	for (const fill of fillsResult.orders) {
		const dbOrder = dbPendingMap.get(normalizeOrderNo(fill.orderNo));
		if (!dbOrder) continue; // 우리 주문이 아닌 체결

		logger.info("PollFills", "신규 체결 감지", {
			orderId: fill.orderNo,
			orderType: fill.orderType,
			filledPrice: fill.filledPrice,
			orderTime: fill.orderTime,
		});

		try {
			// 키움 API 시각 형식 (HHmmss) → ISO 8601 변환
			const filledAt = parseKiwoomTime(fill.orderTime);
			await handleFillEvent(
				dbOrder,
				strategy,
				fill.filledPrice,
				filledAt,
				fill.commission,
				fill.tax,
				true
			);
			processed++;
		} catch (err) {
			logger.error("PollFills", "체결 이벤트 처리 실패", {
				orderId: fill.orderNo,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}

	// 2. 취소된 주문 동기화 (키움 앱에서 수동 취소 감지)
	if (apiPendingResult.success) {
		// 키움 API 미체결 주문번호 Set (앞자리 0 정규화)
		const apiPendingSet = new Set(apiPendingResult.orders.map((o) => normalizeOrderNo(o.orderNo)));

		// DB에는 있는데 키움에는 없는 주문 = 취소된 주문
		const cancelledOrderIds = dbPendingOrders
			.filter((dbOrder) => !apiPendingSet.has(normalizeOrderNo(dbOrder.order_id)))
			.map((o) => o.order_id);

		if (cancelledOrderIds.length > 0) {
			logger.info("PollFills", "취소된 주문 감지 (키움 앱에서 수동 취소)", {
				strategyId: strategy.id,
				count: cancelledOrderIds.length,
				orderIds: cancelledOrderIds,
			});

			try {
				await cancelOrders(cancelledOrderIds, true);
				logger.info("PollFills", "취소된 주문 DB 동기화 완료", {
					count: cancelledOrderIds.length,
				});
			} catch (err) {
				logger.error("PollFills", "취소된 주문 DB 동기화 실패", {
					error: err instanceof Error ? err.message : String(err),
				});
			}
		}
	} else {
		logger.warn("PollFills", "키움 API 미체결 조회 실패 - 동기화 스킵", {
			error: apiPendingResult.error,
		});
	}

	return processed;
}

/**
 * 활성 전략 전체의 체결을 1회 폴링한다
 *
 * 09:00~18:00 사이 2초 간격으로 호출됨 (Cron Job에서 관리)
 *
 * @returns 처리된 총 체결 수
 */
export async function pollFills(): Promise<number> {
	let totalProcessed = 0;

	let strategies: GridStrategy[];
	try {
		// Cron 환경이므로 Admin 클라이언트 사용 (cookies() 에러 방지)
		strategies = await getActiveStrategies(true);
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
