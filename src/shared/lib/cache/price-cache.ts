/**
 * @fileoverview 현재가 메모리 캐시
 * @description 종목별 현재가 정보를 메모리에 저장하고 조회하는 캐시
 *
 * **사용 시나리오**:
 * - Cron Job이 키움 API 조회 후 메모리 캐시 업데이트
 * - 클라이언트가 초기 로드 시 메모리에서 최신 가격 조회
 * - SSE로 실시간 업데이트 push
 *
 * **특징**:
 * - 휘발성 데이터 (서버 재시작 시 초기화)
 * - DB 저장 불필요 (최신값만 필요)
 * - 초 단위 업데이트
 */

import type { CurrentPrice } from "@/features/grid-trader";

/**
 * 현재가 메모리 캐시
 * Key: 종목코드 (6자리)
 * Value: CurrentPrice 객체
 */
const priceCache = new Map<string, CurrentPrice>();

/**
 * 현재가 업데이트
 * @param stockCode - 종목코드
 * @param priceInfo - 현재가 정보
 */
export function updatePrice(stockCode: string, priceInfo: CurrentPrice): void {
	priceCache.set(stockCode, priceInfo);
}

/**
 * 현재가 조회
 * @param stockCode - 종목코드
 * @returns 현재가 정보 또는 null (캐시 미스)
 */
export function getPrice(stockCode: string): CurrentPrice | null {
	return priceCache.get(stockCode) ?? null;
}

/**
 * 여러 종목 현재가 조회
 * @param stockCodes - 종목코드 배열
 * @returns 종목코드별 현재가 Map
 */
export function getPrices(stockCodes: string[]): Map<string, CurrentPrice> {
	const result = new Map<string, CurrentPrice>();

	for (const code of stockCodes) {
		const price = priceCache.get(code);
		if (price) {
			result.set(code, price);
		}
	}

	return result;
}

/**
 * 전체 캐시 조회
 * @returns 모든 종목의 현재가 Map
 */
export function getAllPrices(): Map<string, CurrentPrice> {
	return new Map(priceCache);
}

/**
 * 캐시 초기화
 * @description 서버 재시작 시 또는 장 마감 후 사용
 */
export function clearPriceCache(): void {
	priceCache.clear();
}

/**
 * 특정 종목 캐시 삭제
 * @param stockCode - 종목코드
 */
export function removePrice(stockCode: string): void {
	priceCache.delete(stockCode);
}

/**
 * 캐시 크기 조회
 * @returns 캐시된 종목 수
 */
export function getPriceCacheSize(): number {
	return priceCache.size;
}
