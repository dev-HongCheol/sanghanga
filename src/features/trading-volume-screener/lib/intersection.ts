import type { StockIntersection } from "../model/screener.types";

/**
 * 여러 종목 리스트의 교집합을 계산하고 데이터를 병합합니다.
 *
 * @param lists - 종목 리스트 배열
 * @returns 모든 리스트에 공통으로 포함된 종목 (데이터 병합됨)
 *
 * @example
 * ```ts
 * const list1 = [{ stockCode: "005930", changeRate: 2.5 }];
 * const list2 = [{ stockCode: "005930", prevDayVolume: 1000 }];
 * const intersection = calculateIntersection([list1, list2]);
 * // 결과: [{ stockCode: "005930", changeRate: 2.5, prevDayVolume: 1000 }]
 * ```
 */
export function calculateIntersection(
	lists: StockIntersection[][],
): StockIntersection[] {
	if (lists.length === 0) {
		return [];
	}

	if (lists.length === 1) {
		return lists[0];
	}

	// 첫 번째 리스트를 기준으로 시작
	const [first, ...rest] = lists;

	// 각 리스트를 Map으로 변환 (종목코드 → 종목 정보)
	const restMaps = rest.map(
		(list) => new Map(list.map((stock) => [stock.stockCode, stock])),
	);

	// 첫 번째 리스트에서 모든 나머지 리스트에 포함된 종목만 필터링 + 데이터 병합
	return first
		.filter((stock) => restMaps.every((map) => map.has(stock.stockCode)))
		.map((stock) => {
			// 모든 리스트의 데이터를 병합
			const merged: StockIntersection = { ...stock };

			for (const map of restMaps) {
				const otherStock = map.get(stock.stockCode);
				if (otherStock) {
					// 선택적 필드들을 병합 (undefined가 아닌 값만)
					if (otherStock.changeRate !== undefined) {
						merged.changeRate = otherStock.changeRate;
					}
					if (otherStock.prevDayVolume !== undefined) {
						merged.prevDayVolume = otherStock.prevDayVolume;
					}
					if (otherStock.currentDayVolume !== undefined) {
						merged.currentDayVolume = otherStock.currentDayVolume;
					}
				}
			}

			return merged;
		});
}

/**
 * 활성화된 필터에 따라 교집합 계산에 사용할 리스트를 선택합니다.
 *
 * @param allLists - 모든 종목 리스트 (키: 필터명)
 * @param enabledFilters - 활성화된 필터 키 배열
 * @returns 교집합 결과
 */
export function calculateIntersectionByFilters(
	allLists: Record<string, StockIntersection[]>,
	enabledFilters: string[],
): StockIntersection[] {
	const activeLists = enabledFilters
		.map((key) => allLists[key])
		.filter((list) => list && list.length > 0);

	return calculateIntersection(activeLists);
}
