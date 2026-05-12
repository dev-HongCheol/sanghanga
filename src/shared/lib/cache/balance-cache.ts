/**
 * @fileoverview 계좌 잔고 메모리 캐시
 * @description 계좌 잔고 정보를 메모리에 저장하고 조회하는 캐시
 *
 * **사용 시나리오**:
 * - Cron Job이 키움 API 조회 후 메모리 캐시 업데이트
 * - 클라이언트가 초기 로드 시 메모리에서 최신 잔고 조회
 * - SSE로 실시간 업데이트 push
 *
 * **특징**:
 * - 휘발성 데이터 (서버 재시작 시 초기화)
 * - DB 저장 불필요 (최신값만 필요)
 * - 3초 단위 업데이트 (가격보다 덜 빈번)
 */

import type { AccountBalance } from "@/features/grid-trader";

/**
 * 계좌 잔고 메모리 캐시
 * Key: 계좌 ID (단일 계좌인 경우 'default')
 * Value: AccountBalance 객체
 */
const balanceCache = new Map<string, AccountBalance>();

/**
 * 잔고 업데이트
 * @param accountId - 계좌 ID (기본값: 'default')
 * @param balance - 잔고 정보
 */
export function updateBalance(balance: AccountBalance, accountId = "default"): void {
	balanceCache.set(accountId, balance);
}

/**
 * 잔고 조회
 * @param accountId - 계좌 ID (기본값: 'default')
 * @returns 잔고 정보 또는 null (캐시 미스)
 */
export function getBalance(accountId = "default"): AccountBalance | null {
	return balanceCache.get(accountId) ?? null;
}

/**
 * 특정 종목 보유 정보 조회
 * @param stockCode - 종목코드
 * @param accountId - 계좌 ID (기본값: 'default')
 * @returns 보유 정보 또는 null
 */
export function getHolding(stockCode: string, accountId = "default") {
	const balance = balanceCache.get(accountId);
	if (!balance) return null;

	return balance.holdings.find((h) => h.stockCode === stockCode) ?? null;
}

/**
 * 전체 캐시 조회
 * @returns 모든 계좌의 잔고 Map
 */
export function getAllBalances(): Map<string, AccountBalance> {
	return new Map(balanceCache);
}

/**
 * 캐시 초기화
 * @description 서버 재시작 시 또는 장 마감 후 사용
 */
export function clearBalanceCache(): void {
	balanceCache.clear();
}

/**
 * 특정 계좌 캐시 삭제
 * @param accountId - 계좌 ID
 */
export function removeBalance(accountId: string): void {
	balanceCache.delete(accountId);
}

/**
 * 캐시 크기 조회
 * @returns 캐시된 계좌 수
 */
export function getBalanceCacheSize(): number {
	return balanceCache.size;
}
