"use server";

import { kiwoomClient } from "@/shared/lib/kiwoom/client";
import { logger } from "@/shared/lib/logger";

/**
 * 주식 기본 정보 응답
 */
interface StockBasicInfoResponse {
	return_code: number;
	return_msg: string;
	stk_cd: string;
	stk_nm: string;
	cur_prc: string;
	pred_pre: string;
	flu_rt: string;
	high_pric: string;
	low_pric: string;
	open_pric: string;
	trde_qty: string;
	base_pric: string;
	mac: string;
	// ... 기타 필드
}

/**
 * 현재가 정보
 */
export interface CurrentPrice {
	/**
	 * 종목코드
	 */
	stockCode: string;
	/**
	 * 종목명
	 */
	stockName: string;
	/**
	 * 현재가 (원)
	 */
	currentPrice: number;
	/**
	 * 전일대비 (원)
	 */
	change: number;
	/**
	 * 등락율 (%)
	 */
	changeRate: number;
	/**
	 * 고가 (원)
	 */
	highPrice: number;
	/**
	 * 저가 (원)
	 */
	lowPrice: number;
	/**
	 * 시가 (원)
	 */
	openPrice: number;
	/**
	 * 거래량
	 */
	volume: number;
	/**
	 * 기준가 (원)
	 */
	basePrice: number;
	/**
	 * 시가총액 (억원)
	 */
	marketCap: number;
}

/**
 * Server Action: 현재가 조회
 * @param stockCode - 종목코드 (6자리)
 * @returns 현재가 정보
 */
export async function getCurrentPriceAction(
	stockCode: string,
): Promise<
	| { success: true; priceInfo: CurrentPrice }
	| { success: false; error: string }
> {
	try {
		logger.info("GetCurrentPriceAction", "현재가 조회 시작", {
			stockCode,
		});

		// 종목코드 검증
		if (!stockCode || stockCode.length !== 6) {
			return { success: false, error: "유효한 종목코드를 입력하세요 (6자리)" };
		}

		// 키움 API 호출
		const response = await kiwoomClient.request<StockBasicInfoResponse>(
			"/api/dostk/stkinfo",
			{
				method: "POST",
				headers: { "api-id": "ka10001" },
				body: JSON.stringify({ stk_cd: stockCode }),
			},
		);

		// 응답 데이터 파싱
		const priceInfo: CurrentPrice = {
			stockCode: response.stk_cd,
			stockName: response.stk_nm,
			currentPrice: parseFloat(response.cur_prc) || 0,
			change: parseFloat(response.pred_pre) || 0,
			changeRate: parseFloat(response.flu_rt) || 0,
			highPrice: parseFloat(response.high_pric) || 0,
			lowPrice: parseFloat(response.low_pric) || 0,
			openPrice: parseFloat(response.open_pric) || 0,
			volume: parseFloat(response.trde_qty) || 0,
			basePrice: parseFloat(response.base_pric) || 0,
			marketCap: parseFloat(response.mac) || 0,
		};

		logger.info("GetCurrentPriceAction", "현재가 조회 완료", {
			stockCode,
			stockName: priceInfo.stockName,
			currentPrice: priceInfo.currentPrice,
		});

		return { success: true, priceInfo };
	} catch (error) {
		logger.error("GetCurrentPriceAction", "현재가 조회 실패", {
			stockCode,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "현재가 조회 중 오류가 발생했습니다.",
		};
	}
}
