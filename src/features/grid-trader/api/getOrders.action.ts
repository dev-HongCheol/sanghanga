"use server";

import { kiwoomClient } from "@/shared/lib/kiwoom/client";
import { logger } from "@/shared/lib/logger";

/**
 * 미체결 주문 정보
 */
export interface PendingOrder {
	/**
	 * 주문번호
	 */
	orderNo: string;
	/**
	 * 종목코드
	 */
	stockCode: string;
	/**
	 * 종목명
	 */
	stockName: string;
	/**
	 * 주문구분 (매수/매도)
	 */
	orderType: string;
	/**
	 * 주문가격
	 */
	orderPrice: number;
	/**
	 * 주문수량
	 */
	orderQty: number;
	/**
	 * 미체결수량
	 */
	pendingQty: number;
	/**
	 * 주문상태
	 */
	orderStatus: string;
	/**
	 * 주문시간
	 */
	orderTime: string;
}

/**
 * 체결 주문 정보
 */
export interface FilledOrder {
	/**
	 * 주문번호
	 */
	orderNo: string;
	/**
	 * 종목코드
	 */
	stockCode: string;
	/**
	 * 종목명
	 */
	stockName: string;
	/**
	 * 주문구분 (매수/매도)
	 */
	orderType: string;
	/**
	 * 주문가격
	 */
	orderPrice: number;
	/**
	 * 주문수량
	 */
	orderQty: number;
	/**
	 * 체결가
	 */
	filledPrice: number;
	/**
	 * 체결량
	 */
	filledQty: number;
	/**
	 * 주문상태
	 */
	orderStatus: string;
	/**
	 * 주문시간
	 */
	orderTime: string;
}

/**
 * 미체결 API 응답
 */
interface PendingOrdersResponse {
	return_code: number;
	return_msg: string;
	oso: Array<{
		ord_no: string;
		stk_cd: string;
		stk_nm: string;
		io_tp_nm: string;
		ord_pric: string;
		ord_qty: string;
		oso_qty: string;
		ord_stt: string;
		tm: string;
	}>;
}

/**
 * 체결 API 응답
 */
interface FilledOrdersResponse {
	return_code: number;
	return_msg: string;
	cntr: Array<{
		ord_no: string;
		stk_cd: string;
		stk_nm: string;
		io_tp_nm: string;
		ord_pric: string;
		ord_qty: string;
		cntr_pric: string;
		cntr_qty: string;
		ord_stt: string;
		ord_tm: string;
	}>;
}

/**
 * Server Action: 미체결 주문 조회
 * @param stockCode - 종목코드 (옵션, 전체 조회 시 생략)
 * @returns 미체결 주문 목록
 */
export async function getPendingOrdersAction(
	stockCode?: string
): Promise<{ success: true; orders: PendingOrder[] } | { success: false; error: string }> {
	try {
		logger.info(
			"GetPendingOrdersAction",
			"미체결 주문 조회 시작",
			{
				stockCode: stockCode || "전체",
			},
			true
		);

		// 키움 API 호출 (ka10075)
		const response = await kiwoomClient.request<PendingOrdersResponse>("/api/dostk/acnt", {
			method: "POST",
			headers: { "api-id": "ka10075" },
			body: JSON.stringify({
				all_stk_tp: stockCode ? "1" : "0", // 0:전체, 1:종목
				trde_tp: "0", // 0:전체, 1:매도, 2:매수
				stk_cd: stockCode || "",
				stex_tp: "0", // 0:통합
			}),
		});

		// 응답 데이터 파싱
		const orders: PendingOrder[] = (response.oso || []).map((order) => ({
			orderNo: order.ord_no,
			stockCode: order.stk_cd,
			stockName: order.stk_nm,
			orderType: order.io_tp_nm,
			orderPrice: Number.parseFloat(order.ord_pric) || 0,
			orderQty: Number.parseFloat(order.ord_qty) || 0,
			pendingQty: Number.parseFloat(order.oso_qty) || 0,
			orderStatus: order.ord_stt,
			orderTime: order.tm,
		}));

		logger.info(
			"GetPendingOrdersAction",
			"미체결 주문 조회 완료",
			{
				count: orders.length,
			},
			true
		);

		return { success: true, orders };
	} catch (error) {
		logger.error("GetPendingOrdersAction", "미체결 주문 조회 실패", {
			stockCode,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "미체결 주문 조회 중 오류가 발생했습니다.",
		};
	}
}

/**
 * Server Action: 체결 주문 조회
 * @param stockCode - 종목코드 (옵션, 전체 조회 시 생략)
 * @returns 체결 주문 목록
 */
export async function getFilledOrdersAction(
	stockCode?: string
): Promise<{ success: true; orders: FilledOrder[] } | { success: false; error: string }> {
	try {
		logger.info(
			"GetFilledOrdersAction",
			"체결 주문 조회 시작",
			{
				stockCode: stockCode || "전체",
			},
			true
		);

		// 키움 API 호출 (ka10076)
		const response = await kiwoomClient.request<FilledOrdersResponse>("/api/dostk/acnt", {
			method: "POST",
			headers: { "api-id": "ka10076" },
			body: JSON.stringify({
				stk_cd: stockCode || "",
				qry_tp: stockCode ? "1" : "0", // 0:전체, 1:종목
				sell_tp: "0", // 0:전체, 1:매도, 2:매수
				ord_no: "",
				stex_tp: "0", // 0:통합
			}),
		});

		// 응답 데이터 파싱
		const orders: FilledOrder[] = (response.cntr || []).map((order) => ({
			orderNo: order.ord_no,
			stockCode: order.stk_cd,
			stockName: order.stk_nm,
			orderType: order.io_tp_nm,
			orderPrice: Number.parseFloat(order.ord_pric) || 0,
			orderQty: Number.parseFloat(order.ord_qty) || 0,
			filledPrice: Number.parseFloat(order.cntr_pric) || 0,
			filledQty: Number.parseFloat(order.cntr_qty) || 0,
			orderStatus: order.ord_stt,
			orderTime: order.ord_tm,
		}));

		logger.info(
			"GetFilledOrdersAction",
			"체결 주문 조회 완료",
			{
				count: orders.length,
			},
			true
		);

		return { success: true, orders };
	} catch (error) {
		logger.error("GetFilledOrdersAction", "체결 주문 조회 실패", {
			stockCode,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "체결 주문 조회 중 오류가 발생했습니다.",
		};
	}
}
