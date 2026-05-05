"use server";

import { kiwoomClient } from "@/shared/lib/kiwoom/client";
import { logger } from "@/shared/lib/logger";

/**
 * 주문 취소 결과
 */
export interface CancelOrderResult {
	/**
	 * 취소 주문번호
	 */
	orderNo: string;
	/**
	 * 모주문번호
	 */
	baseOrigOrderNo: string;
	/**
	 * 취소 수량
	 */
	cancelQty: string;
}

/**
 * kt10003 주식 취소주문 API 응답
 */
interface CancelOrderResponse {
	return_code: number;
	return_msg: string;
	ord_no: string;
	base_orig_ord_no: string;
	cncl_qty: string;
}

/**
 * Server Action: 주문 취소
 *
 * API ID: kt10003 (주식 취소주문)
 * URL: /api/dostk/ordr
 *
 * @param orderNo - 취소할 원주문번호 (7자리)
 * @param stockCode - 종목코드 (6자리)
 * @param cancelQty - 취소 수량 ('0' 입력 시 잔량 전부 취소)
 * @param exchange - 국내거래소구분 (기본값: KRX)
 * @returns 취소 결과
 */
export async function cancelOrderAction(
	orderNo: string,
	stockCode: string,
	cancelQty = 0,
	exchange: "KRX" | "NXT" | "SOR" = "KRX"
): Promise<{ success: true; result: CancelOrderResult } | { success: false; error: string }> {
	try {
		logger.info("CancelOrderAction", "주문 취소 시작", {
			orderNo,
			stockCode,
			cancelQty,
		});

		if (!orderNo) {
			return { success: false, error: "주문번호를 입력하세요" };
		}

		if (!stockCode || stockCode.length !== 6) {
			return { success: false, error: "유효한 종목코드를 입력하세요 (6자리)" };
		}

		const response = await kiwoomClient.request<CancelOrderResponse>("/api/dostk/ordr", {
			method: "POST",
			headers: { "api-id": "kt10003" },
			body: JSON.stringify({
				dmst_stex_tp: exchange,
				orig_ord_no: orderNo,
				stk_cd: stockCode,
				cncl_qty: String(cancelQty),
			}),
		});

		const result: CancelOrderResult = {
			orderNo: response.ord_no,
			baseOrigOrderNo: response.base_orig_ord_no,
			cancelQty: response.cncl_qty,
		};

		logger.info("CancelOrderAction", "주문 취소 완료", {
			orderNo,
			newOrderNo: result.orderNo,
		});

		return { success: true, result };
	} catch (error) {
		logger.error("CancelOrderAction", "주문 취소 실패", {
			orderNo,
			stockCode,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "주문 취소 중 오류가 발생했습니다.",
		};
	}
}
