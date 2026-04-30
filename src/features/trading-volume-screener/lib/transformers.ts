import type {
	ChangeRateRankingResponse,
	CurrentDayVolumeRankingResponse,
	PrevDayVolumeRankingResponse,
	StockIntersection,
} from "../model/screener.types";

/**
 * 문자열 숫자를 Number로 안전하게 변환합니다.
 * @param value - 변환할 문자열
 * @returns 숫자 (파싱 실패 시 0)
 */
function safeParseNumber(value: string): number {
	const parsed = parseFloat(value);
	return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * 키움 API 가격 필드를 파싱합니다 (절댓값).
 * 키움 API의 cur_prc 필드는 등락 부호가 포함되어 있습니다 (예: "-152000").
 * @param value - 가격 문자열
 * @returns 가격 (양수, 파싱 실패 시 0)
 */
function parsePrice(value: string): number {
	return Math.abs(safeParseNumber(value));
}

/**
 * 전일 거래량 상위 API 응답을 StockIntersection 배열로 변환
 */
export function transformPrevDayVolumeRanking(
	response: PrevDayVolumeRankingResponse,
): StockIntersection[] {
	return response.pred_trde_qty_upper.map((item) => {
		const currentPrice = parsePrice(item.cur_prc);
		const tradeQty = safeParseNumber(item.trde_qty);
		// 전일 거래대금 = 현재가 × 거래량 ÷ 100,000,000 (억원)
		const prevDayVolume = (currentPrice * tradeQty) / 100000000;

		return {
			stockCode: item.stk_cd,
			stockName: item.stk_nm,
			currentPrice,
			prevDayVolume,
		};
	});
}

/**
 * 당일 거래량 상위 API 응답을 StockIntersection 배열로 변환
 */
export function transformCurrentDayVolumeRanking(
	response: CurrentDayVolumeRankingResponse,
): StockIntersection[] {
	return response.tdy_trde_qty_upper.map((item) => {
		const currentPrice = parsePrice(item.cur_prc);
		const changeRate = safeParseNumber(item.flu_rt);
		// 거래대금은 백만원 단위이므로 억원으로 변환
		const currentDayVolume = safeParseNumber(item.trde_amt) / 100;

		return {
			stockCode: item.stk_cd,
			stockName: item.stk_nm,
			currentPrice,
			changeRate,
			currentDayVolume,
		};
	});
}

/**
 * 등락률 상위 API 응답을 StockIntersection 배열로 변환
 */
export function transformChangeRateRanking(
	response: ChangeRateRankingResponse,
): StockIntersection[] {
	return response.pred_pre_flu_rt_upper.map((item) => {
		const currentPrice = parsePrice(item.cur_prc);
		const changeRate = safeParseNumber(item.flu_rt);

		return {
			stockCode: item.stk_cd,
			stockName: item.stk_nm,
			currentPrice,
			changeRate,
		};
	});
}

/**
 * 거래대금을 억원 단위로 변환
 * @param volumeInMillions - 거래대금 (백만원 단위)
 * @returns 거래대금 (억원 단위)
 */
export function convertToHundredMillion(volumeInMillions: number): number {
	return volumeInMillions / 100;
}

/**
 * 등락률 문자열을 숫자로 변환
 * @param changeRate - 등락률 문자열 (예: "+2.5", "-1.3")
 * @returns 등락률 숫자
 */
export function parseChangeRate(changeRate: string): number {
	return safeParseNumber(changeRate);
}
