/**
 * @fileoverview 실시간 종목조회순위 API
 * @description Next.js API Route를 통해 키움 API 호출
 */

import type { StockRankingRequest, StockRankingResponse } from "../model/stock.types";

/**
 * 실시간 종목조회순위 조회
 * @param request - 조회 요청 (구분)
 * @returns 종목조회순위 데이터
 * @throws {Error} API 요청 실패 시
 */
export async function fetchStockRanking(
	request: StockRankingRequest
): Promise<StockRankingResponse> {
	const response = await fetch("/api/kiwoom/stock-ranking", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(request),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => null);
		const errorMessage = errorData?.error || `API request failed: ${response.statusText}`;
		throw new Error(errorMessage);
	}

	return response.json();
}
