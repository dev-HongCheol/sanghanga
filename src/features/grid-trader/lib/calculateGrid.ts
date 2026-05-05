/**
 * 그리드 가격 배열 계산 결과
 */
export interface GridPrices {
	/**
	 * 매수 호가 배열 (현재가 아래, 높은 가격 순)
	 * e.g. [29500, 29000, 28500]
	 */
	buyPrices: number[];
	/**
	 * 매도 호가 배열 (현재가 위, 낮은 가격 순)
	 * e.g. [30500, 31000, 31500]
	 */
	sellPrices: number[];
}

/**
 * 현재가 기준으로 그리드 가격 배열을 계산한다
 *
 * @param currentPrice - 기준 현재가 (원)
 * @param gridGap - 그리드 간격 (원)
 * @param upperGridCount - 상단 (매도) 그리드 개수
 * @param lowerGridCount - 하단 (매수) 그리드 개수
 * @returns 매수/매도 호가 배열
 */
export function calculateGrid(
	currentPrice: number,
	gridGap: number,
	upperGridCount: number,
	lowerGridCount: number,
): GridPrices {
	const buyPrices = Array.from(
		{ length: lowerGridCount },
		(_, i) => currentPrice - (i + 1) * gridGap,
	).filter((p) => p > 0);

	const sellPrices = Array.from(
		{ length: upperGridCount },
		(_, i) => currentPrice + (i + 1) * gridGap,
	);

	return { buyPrices, sellPrices };
}
