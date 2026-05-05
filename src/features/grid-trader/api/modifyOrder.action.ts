"use server";

import { kiwoomClient } from "@/shared/lib/kiwoom/client";
import { logger } from "@/shared/lib/logger";

/**
 * 주문 정정 결과
 */
export interface ModifyOrderResult {
	/**
	 * 정정 주문번호
	 */
	orderNo: string;
	/**
	 * 모주문번호
	 */
	baseOrigOrderNo: string;
	/**
	 * 정정 수량
	 */
	modifyQty: string;
	/**
	 * 국내거래소구분
	 */
	exchange: string;
}

/**
 * kt10002 주식 정정주문 API 응답
 */
interface ModifyOrderResponse {
	return_code: number;
	return_msg: string;
	ord_no: string;
	base_orig_ord_no: string;
	mdfy_qty: string;
	dmst_stex_tp: string;
}

/**
 * Server Action: 주문 정정
 *
 * API ID: kt10002 (주식 정정주문)
 * URL: /api/dostk/ordr
 *
 * @param orderNo - 정정할 원주문번호 (7자리)
 * @param stockCode - 종목코드 (6자리)
 * @param modifyQty - 정정 수량
 * @param modifyPrice - 정정 단가
 * @param exchange - 국내거래소구분 (기본값: KRX)
 * @returns 정정 결과
 */
export async function modifyOrderAction(
	orderNo: string,
	stockCode: string,
	modifyQty: number,
	modifyPrice: number,
	exchange: "KRX" | "NXT" | "SOR" = "KRX"
): Promise<{ success: true; result: ModifyOrderResult } | { success: false; error: string }> {
	try {
		logger.info("ModifyOrderAction", "주문 정정 시작", {
			orderNo,
			stockCode,
			modifyQty,
			modifyPrice,
		});

		if (!orderNo) {
			return { success: false, error: "주문번호를 입력하세요" };
		}

		if (!stockCode || stockCode.length !== 6) {
			return { success: false, error: "유효한 종목코드를 입력하세요 (6자리)" };
		}

		if (modifyQty <= 0) {
			return { success: false, error: "정정 수량은 0보다 커야 합니다" };
		}

		if (modifyPrice <= 0) {
			return { success: false, error: "정정 단가는 0보다 커야 합니다" };
		}

		const response = await kiwoomClient.request<ModifyOrderResponse>("/api/dostk/ordr", {
			method: "POST",
			headers: { "api-id": "kt10002" },
			body: JSON.stringify({
				dmst_stex_tp: exchange,
				orig_ord_no: orderNo,
				stk_cd: stockCode,
				mdfy_qty: String(modifyQty),
				mdfy_uv: String(modifyPrice),
				mdfy_cond_uv: "",
			}),
		});

		const result: ModifyOrderResult = {
			orderNo: response.ord_no,
			baseOrigOrderNo: response.base_orig_ord_no,
			modifyQty: response.mdfy_qty,
			exchange: response.dmst_stex_tp,
		};

		logger.info("ModifyOrderAction", "주문 정정 완료", {
			orderNo,
			newOrderNo: result.orderNo,
		});

		return { success: true, result };
	} catch (error) {
		logger.error("ModifyOrderAction", "주문 정정 실패", {
			orderNo,
			stockCode,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "주문 정정 중 오류가 발생했습니다.",
		};
	}
}
