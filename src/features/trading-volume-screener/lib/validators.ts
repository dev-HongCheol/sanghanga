import type { CandleChartResponse } from "../model/screener.types";

/**
 * 시가총액이 최소값 이상인지 검증합니다.
 *
 * @param marketCap - 시가총액 (억원)
 * @param minMarketCap - 최소 시가총액 (억원)
 * @returns 조건 만족 여부
 */
export function validateMarketCap(
	marketCap: number,
	minMarketCap: number,
): boolean {
	return marketCap >= minMarketCap;
}

/**
 * 분봉 데이터에서 연속 상승/하락 패턴을 검증합니다.
 *
 * @param candles - 분봉 데이터 (최신순)
 * @param consecutiveBars - 연속 봉 개수
 * @param direction - 방향 ("up" | "down")
 * @param priceType - 가격 기준 ("close" | "high" | "low")
 * @returns 패턴 만족 여부
 *
 * @example
 * ```ts
 * // 3봉 연속 상승 (종가 기준) 체크
 * const isValid = validateTrendPattern(candles, 3, "up", "close");
 * // candles[0] > candles[1] > candles[2] > candles[3] 인지 확인
 * ```
 */
export function validateTrendPattern(
	candles: CandleChartResponse["stk_min_pole_chart_qry"],
	consecutiveBars: number,
	direction: "up" | "down",
	priceType: "close" | "high" | "low",
): boolean {
	// 필요한 봉 개수보다 데이터가 적으면 false
	if (candles.length < consecutiveBars + 1) {
		return false;
	}

	// 가격 필드 선택
	const priceField =
		priceType === "close"
			? "cur_prc"
			: priceType === "high"
				? "high_pric"
				: "low_pric";

	// 연속 패턴 검증
	for (let i = 0; i < consecutiveBars; i++) {
		const currentPrice = parseFloat(candles[i][priceField]);
		const prevPrice = parseFloat(candles[i + 1][priceField]);

		if (direction === "up") {
			// 상승: 현재가 > 이전가
			if (currentPrice <= prevPrice) {
				return false;
			}
		} else {
			// 하락: 현재가 < 이전가
			if (currentPrice >= prevPrice) {
				return false;
			}
		}
	}

	return true;
}

/**
 * 0봉전 거래대금이 최소값 이상인지 검증합니다.
 *
 * @param candles - 분봉 데이터
 * @param candleOffset - 봉 오프셋 (0 = 현재봉)
 * @param minVolume - 최소 거래대금 (억원)
 * @returns 조건 만족 여부
 */
export function validateCandleVolume(
	candles: CandleChartResponse["stk_min_pole_chart_qry"],
	candleOffset: number,
	minVolume: number,
): boolean {
	if (candles.length <= candleOffset) {
		return false;
	}

	const candle = candles[candleOffset];
	const price = parseFloat(candle.cur_prc);
	const quantity = parseFloat(candle.trde_qty);

	// 거래대금 = 거래량 × 종가 (근사값)
	const volumeInHundredMillion = (price * quantity) / 100000000; // 억원 단위

	return volumeInHundredMillion >= minVolume;
}
