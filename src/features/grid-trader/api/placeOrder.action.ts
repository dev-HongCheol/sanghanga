"use server";

import { kiwoomClient } from "@/shared/lib/kiwoom/client";
import { logger } from "@/shared/lib/logger";

/**
 * 주문 유형
 */
export type OrderType = "BUY" | "SELL";

/**
 * 호가 유형 (trde_tp)
 * 0:보통(지정가), 3:시장가
 */
export type PriceType = "LIMIT" | "MARKET";

/**
 * 주문 요청 파라미터
 */
export interface PlaceOrderRequest {
	/**
	 * 종목코드 (6자리)
	 */
	stockCode: string;
	/**
	 * 주문 유형 (매수/매도)
	 */
	orderType: OrderType;
	/**
	 * 주문 가격 (지정가 시 필수, 시장가 시 빈 문자열)
	 */
	price: number;
	/**
	 * 주문 수량
	 */
	quantity: number;
	/**
	 * 호가 유형 (LIMIT:지정가/보통, MARKET:시장가)
	 */
	priceType: PriceType;
	/**
	 * 국내거래소구분 (기본값: KRX)
	 */
	exchange?: "KRX" | "NXT" | "SOR";
}

/**
 * 주문 결과
 */
export interface PlaceOrderResult {
	/**
	 * 주문번호
	 */
	orderNo: string;
	/**
	 * 국내거래소구분
	 */
	exchange: string;
}

/**
 * kt10000/kt10001 주문 API 응답
 */
interface PlaceOrderResponse {
	return_code: number;
	return_msg: string;
	ord_no: string;
	dmst_stex_tp: string;
}

/**
 * Server Action: 주식 주문 (매수/매도)
 *
 * 매수: kt10000, 매도: kt10001 (URL 동일, api-id 헤더로 구분)
 * URL: /api/dostk/ordr
 *
 * @param request - 주문 요청 정보
 * @returns 주문 결과
 */
export async function placeOrderAction(
	request: PlaceOrderRequest
): Promise<{ success: true; result: PlaceOrderResult } | { success: false; error: string }> {
	try {
		logger.info("PlaceOrderAction", "주문 시작", {
			stockCode: request.stockCode,
			orderType: request.orderType,
			price: request.price,
			quantity: request.quantity,
		});

		if (!request.stockCode || request.stockCode.length !== 6) {
			return { success: false, error: "유효한 종목코드를 입력하세요 (6자리)" };
		}

		if (request.quantity <= 0) {
			return { success: false, error: "주문 수량은 0보다 커야 합니다" };
		}

		if (request.priceType === "LIMIT" && request.price <= 0) {
			return { success: false, error: "지정가 주문 시 가격은 0보다 커야 합니다" };
		}

		const apiId = request.orderType === "BUY" ? "kt10000" : "kt10001";
		const exchange = request.exchange ?? "KRX";

		const response = await kiwoomClient.request<PlaceOrderResponse>("/api/dostk/ordr", {
			method: "POST",
			headers: { "api-id": apiId },
			body: JSON.stringify({
				dmst_stex_tp: exchange,
				stk_cd: request.stockCode,
				ord_qty: String(request.quantity),
				ord_uv: request.priceType === "LIMIT" ? String(request.price) : "",
				trde_tp: request.priceType === "LIMIT" ? "0" : "3",
				cond_uv: "",
			}),
		});

		const result: PlaceOrderResult = {
			orderNo: response.ord_no,
			exchange: response.dmst_stex_tp,
		};

		logger.info("PlaceOrderAction", "주문 완료", {
			orderNo: result.orderNo,
			orderType: request.orderType,
		});

		return { success: true, result };
	} catch (error) {
		logger.error("PlaceOrderAction", "주문 실패", {
			stockCode: request.stockCode,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "주문 중 오류가 발생했습니다.",
		};
	}
}
