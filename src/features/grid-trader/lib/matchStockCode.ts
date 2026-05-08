/**
 * 종목 코드 매칭 (키움 API의 'A' prefix 처리)
 *
 * 키움 API는 국내 종목 코드에 'A' prefix를 붙여서 반환함
 * 예: '319400' → 'A319400'
 *
 * @param apiStockCode - 키움 API에서 받은 종목 코드 (예: 'A319400')
 * @param targetStockCode - 비교할 종목 코드 (예: '319400')
 * @returns 매칭 여부
 *
 * @example
 * matchStockCode('A319400', '319400') // true
 * matchStockCode('319400', '319400') // true
 * matchStockCode('A123456', '654321') // false
 */
export function matchStockCode(apiStockCode: string, targetStockCode: string): boolean {
	return apiStockCode.includes(targetStockCode);
}
