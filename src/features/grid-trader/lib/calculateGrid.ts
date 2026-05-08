import { adjustToTickSize } from "./adjustToTickSize";

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
 * 가격대별 호가 단위 반환
 */
function getTickSize(price: number): number {
	if (price < 1000) return 1;
	if (price < 5000) return 5;
	if (price < 10000) return 10;
	if (price < 50000) return 50;
	if (price < 100000) return 100;
	if (price < 500000) return 500;
	return 1000;
}

/**
 * 현재가 기준으로 그리드 가격 배열을 계산한다
 *
 * **호가 단위 조정 방식:**
 * 1. 현재가를 호가 단위로 반올림하여 기준가 설정
 * 2. 그리드 간격을 현재가 기준 호가 단위의 배수로 조정
 * 3. 각 그리드 가격을 해당 가격대의 호가 단위로 재조정
 *
 * @param currentPrice - 기준 현재가 (원)
 * @param gridGap - 그리드 간격 (원) - 호가 단위 배수로 자동 조정됨
 * @param upperGridCount - 상단 (매도) 그리드 개수
 * @param lowerGridCount - 하단 (매수) 그리드 개수
 * @returns 매수/매도 호가 배열 (모두 호가 단위에 맞춰짐)
 *
 * @example
 * calculateGrid(123456, 5000, 2, 2)
 * // 1. 현재가 123,456원 → 123,500원 (호가 단위 500원)
 * // 2. 간격 5,000원 → 5,000원 (이미 500원 배수)
 * // 3. 매수: [118,500, 113,500] / 매도: [128,500, 133,500]
 */
export function calculateGrid(
	currentPrice: number,
	gridGap: number,
	upperGridCount: number,
	lowerGridCount: number
): GridPrices {
	// 1. 현재가를 호가 단위로 조정 (기준가)
	const basePrice = adjustToTickSize(currentPrice, "round");

	// 2. 그리드 간격을 현재가 기준 호가 단위의 배수로 조정
	const baseTick = getTickSize(basePrice);
	const adjustedGap = Math.round(gridGap / baseTick) * baseTick;

	const buyPrices: number[] = [];
	const sellPrices: number[] = [];

	// 3. 매수 그리드 계산 (높은 가격 순)
	for (let i = 1; i <= lowerGridCount; i++) {
		const price = basePrice - adjustedGap * i;
		if (price <= 0) break;
		// 가격대가 바뀌면 해당 호가 단위로 재조정
		buyPrices.push(adjustToTickSize(price, "down"));
	}

	// 4. 매도 그리드 계산 (낮은 가격 순)
	for (let i = 1; i <= upperGridCount; i++) {
		const price = basePrice + adjustedGap * i;
		// 가격대가 바뀌면 해당 호가 단위로 재조정
		sellPrices.push(adjustToTickSize(price, "up"));
	}

	return { buyPrices, sellPrices };
}
