"use server";

import { kiwoomClient } from "@/shared/lib/kiwoom/client";
import { logger } from "@/shared/lib/logger";

/**
 * 종목 정보
 */
export interface StockInfo {
	/**
	 * 종목코드 (6자리)
	 */
	code: string;
	/**
	 * 종목명
	 */
	name: string;
	/**
	 * 시장구분코드
	 */
	marketCode: string;
	/**
	 * 시장명
	 */
	marketName: string;
}

/**
 * 종목 리스트 응답
 */
interface StockListResponse {
	return_code: number;
	return_msg: string;
	list: Array<{
		code: string;
		name: string;
		marketCode: string;
		marketName: string;
		listCount?: string;
		auditInfo?: string;
		regDay?: string;
		lastPrice?: string;
		state?: string;
		upName?: string;
		upSizeName?: string;
		orderWarning?: string;
		companyClassName?: string;
		nxtEnable?: string;
	}>;
}

/**
 * Server Action: 종목 검색
 * @param keyword - 검색어 (종목명 또는 종목코드)
 * @param market - 시장구분 ("0": 코스피, "10": 코스닥, "ALL": 전체)
 * @returns 검색 결과
 */
export async function searchStockAction(
	keyword: string,
	market: "0" | "10" | "ALL" = "ALL"
): Promise<{ success: true; stocks: StockInfo[] } | { success: false; error: string }> {
	try {
		logger.info("SearchStockAction", "종목 검색 시작", {
			keyword,
			market,
		});

		if (!keyword || keyword.trim().length === 0) {
			return { success: false, error: "검색어를 입력하세요" };
		}

		const normalizedKeyword = keyword.trim().toUpperCase();

		// 시장별로 API 호출
		const markets = market === "ALL" ? ["0", "10"] : [market];
		const promises = markets.map((mrkt_tp) =>
			kiwoomClient.request<StockListResponse>("/api/dostk/stkinfo", {
				method: "POST",
				headers: { "api-id": "ka10099" },
				body: JSON.stringify({ mrkt_tp }),
			})
		);

		const responses = await Promise.all(promises);

		// 응답 병합 및 필터링
		const allStocks: StockInfo[] = [];

		for (const response of responses) {
			if (response.list && Array.isArray(response.list)) {
				const filtered = response.list
					.filter(
						(stock) =>
							stock.name.toUpperCase().includes(normalizedKeyword) ||
							stock.code.includes(normalizedKeyword)
					)
					.map((stock) => ({
						code: stock.code,
						name: stock.name,
						marketCode: stock.marketCode,
						marketName: stock.marketName,
					}));

				allStocks.push(...filtered);
			}
		}

		// 중복 제거 (종목코드 기준)
		const uniqueStocks = Array.from(
			new Map(allStocks.map((stock) => [stock.code, stock])).values()
		);

		// 최대 20개로 제한
		const limitedStocks = uniqueStocks.slice(0, 20);

		logger.info("SearchStockAction", "종목 검색 완료", {
			keyword,
			resultCount: limitedStocks.length,
		});

		return { success: true, stocks: limitedStocks };
	} catch (error) {
		logger.error("SearchStockAction", "종목 검색 실패", {
			keyword,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "종목 검색 중 오류가 발생했습니다.",
		};
	}
}
