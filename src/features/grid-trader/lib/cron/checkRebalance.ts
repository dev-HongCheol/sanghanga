/**
 * @fileoverview 자동 리밸런싱 체크 로직
 * @description 활성 전략의 그리드 이탈 여부를 체크하고 필요 시 리밸런싱 실행
 *
 * **실행 주기** (scheduler.ts에서 제어):
 * - 09:00~10:00 KST: 1분 간격 (장 초반 급변동 대응)
 * - 10:00~18:00 KST: 10분 간격
 *
 * **서버 재시작 대응**:
 * - 활성 전략인데 미체결 주문이 없으면 자동으로 초기 그리드 배치 실행
 * - 서버 장애 후 재구동 시에도 자동으로 주문이 걸리도록 보장
 *
 * **주문 불균형 감지** (v1.6.7):
 * - 매수/매도 주문 0개 시 자원(예수금/보유수량) 체크
 * - 자원 충분하면 리밸런싱 (체결로 인한 부재)
 * - 자원 부족하면 스킵 (무한 리밸런싱 방지)
 *
 * **동시 실행 방지**:
 * - DB 기반 mutex (PostgreSQL advisory lock) 사용
 * - 멀티 프로세스 환경에서도 중복 실행 방지
 */

import { getActiveStrategies, getPendingOrders } from "@/entities/grid-trader";
import type { GridOrder, GridStrategy } from "@/entities/grid-trader";
import { getBalance } from "@/shared/lib/cache/balance-cache";
import { getPrice } from "@/shared/lib/cache/price-cache";
import { logger } from "@/shared/lib/logger";
import { withMutex } from "@/shared/lib/mutex/db-mutex";
import { adjustToTickSize, getTickSize } from "../adjustToTickSize";
import { deployGrid } from "../deployGrid";
import { matchStockCode } from "../matchStockCode";
import { rebalanceGrid } from "../rebalanceGrid";

/**
 * 잔고 정보 인터페이스
 */
interface BalanceInfo {
	/** 예수금 */
	availableDeposit: number;
	/** 총 보유 수량 */
	totalQty: number;
}

/**
 * 그리드 이탈 여부 체크 (v1.6.7)
 * @description 현재가가 상단/하단 그리드 범위를 벗어났는지 또는 주문 불균형인지 확인
 *
 * **리밸런싱 조건**:
 * 1. 현재가 > 최상단 매도 주문가 (상단 이탈)
 * 2. 현재가 < 최하단 매수 주문가 (하단 이탈)
 * 3. 매도 주문 0개 + sellableQty > 0 (체결로 인한 주문 부재)
 * 4. 매수 주문 0개 + 예수금 충분 (체결로 인한 주문 부재)
 *
 * **자원 체크로 무한 리밸런싱 방지**:
 * - 매도 주문 0개 + sellableQty = 0 → 리밸런싱 스킵 (보유 수량 부족)
 * - 매수 주문 0개 + 예수금 부족 → 리밸런싱 스킵 (예수금 부족)
 *
 * @param currentPrice - 현재가
 * @param pendingOrders - 미체결 주문 배열
 * @param strategy - 전략 설정
 * @param balance - 잔고 정보 (예수금, 보유 수량)
 * @returns 이탈 여부 (true = 리밸런싱 필요)
 */
function isGridOutOfRange(
	currentPrice: number,
	pendingOrders: GridOrder[],
	strategy: GridStrategy,
	balance: BalanceInfo
): boolean {
	if (pendingOrders.length === 0) return false;

	const buyOrders = pendingOrders.filter((o) => o.order_type === "BUY");
	const sellOrders = pendingOrders.filter((o) => o.order_type === "SELL");

	// ✅ 매도 주문 0개: 자원 체크
	if (sellOrders.length === 0) {
		const sellableQty = Math.max(0, balance.totalQty - strategy.min_holding_limit);

		if (sellableQty > 0) {
			// 매도 가능 수량 있음 → 체결로 인한 부재 → 리밸런싱 필요
			logger.info(
				"CronCheckRebalance",
				"매도 주문 없음 (체결) - 리밸런싱 필요",
				{
					currentPrice,
					sellableQty,
					buyOrderCount: buyOrders.length,
				},
				true
			);
			return true;
		}

		// 보유 수량 부족 → 자원 부족 → 리밸런싱 불필요
		logger.info(
			"CronCheckRebalance",
			"매도 주문 없음 (자원 부족) - 리밸런싱 스킵",
			{
				totalQty: balance.totalQty,
				minHoldingLimit: strategy.min_holding_limit,
			},
			true
		);
		return false;
	}

	// ✅ 매수 주문 0개: 자원 체크
	if (buyOrders.length === 0) {
		// 매수 1개 걸기 위한 최소 예수금 계산
		const baseTick = getTickSize(currentPrice);
		const adjustedGap = Math.round(strategy.grid_gap / baseTick) * baseTick;
		const buyPrice = adjustToTickSize(currentPrice - adjustedGap, "down");
		const requiredDeposit = buyPrice * strategy.quantity_per_grid;

		if (balance.availableDeposit >= requiredDeposit) {
			// 예수금 충분 → 체결로 인한 부재 → 리밸런싱 필요
			logger.info(
				"CronCheckRebalance",
				"매수 주문 없음 (체결) - 리밸런싱 필요",
				{
					currentPrice,
					availableDeposit: balance.availableDeposit,
					sellOrderCount: sellOrders.length,
				},
				true
			);
			return true;
		}

		// 예수금 부족 → 자원 부족 → 리밸런싱 불필요
		logger.info(
			"CronCheckRebalance",
			"매수 주문 없음 (자원 부족) - 리밸런싱 스킵",
			{
				availableDeposit: balance.availableDeposit,
				requiredDeposit,
			},
			true
		);
		return false;
	}

	// ✅ 정상 상태: 매수/매도 주문 모두 존재
	const minPrice = Math.min(...buyOrders.map((o) => o.grid_price));
	const maxPrice = Math.max(...sellOrders.map((o) => o.grid_price));

	// 가격 그리드 이탈 체크
	return currentPrice > maxPrice || currentPrice < minPrice;
}

/**
 * 리밸런싱 체크 내부 로직 (mutex 없이)
 */
async function checkRebalanceInternal() {
	try {
		// 활성 전략 목록 조회
		const activeStrategies = await getActiveStrategies(true);

		if (activeStrategies.length === 0) {
			return {
				success: true,
				message: "활성 전략 없음",
				rebalanced: 0,
			};
		}

		const results = [];

		// 각 전략에 대해 리밸런싱 체크
		for (const strategy of activeStrategies) {
			try {
				// 1. 현재가 조회 (메모리 캐시에서)
				const priceInfo = getPrice(strategy.stock_code);

				if (!priceInfo) {
					logger.warn("CronCheckRebalance", "현재가 캐시 없음 (가격 동기화 대기 중)", {
						stockCode: strategy.stock_code,
					});
					results.push({
						strategyId: strategy.id,
						stockCode: strategy.stock_code,
						rebalanced: false,
						reason: "현재가 캐시 없음",
					});
					continue;
				}

				// 2. 잔고 조회 (메모리 캐시에서)
				const balanceInfo = getBalance();

				if (!balanceInfo) {
					logger.warn("CronCheckRebalance", "잔고 캐시 없음 (잔고 동기화 대기 중)", {
						stockCode: strategy.stock_code,
					});
					results.push({
						strategyId: strategy.id,
						stockCode: strategy.stock_code,
						rebalanced: false,
						reason: "잔고 캐시 없음",
					});
					continue;
				}

				// 3. 미체결 주문 조회
				const pendingOrders = await getPendingOrders(strategy.id, true);

				// 2-1. 미체결 주문이 없으면 자동으로 그리드 배치 (서버 재시작 대응)
				if (pendingOrders.length === 0) {
					logger.info("CronCheckRebalance", "활성 전략인데 주문 없음 - 자동 그리드 배치 실행", {
						strategyId: strategy.id,
						stockCode: strategy.stock_code,
					});

					try {
						const deployResult = await deployGrid(strategy, true);

						logger.info("CronCheckRebalance", "자동 그리드 배치 완료", {
							strategyId: strategy.id,
							placed: deployResult.placed,
							failed: deployResult.failed,
						});

						results.push({
							strategyId: strategy.id,
							stockCode: strategy.stock_code,
							rebalanced: true,
							reason: "주문 없어서 자동 배치",
							result: {
								cancelled: 0,
								placed: deployResult.placed,
								failed: deployResult.failed,
							},
						});
					} catch (error) {
						logger.error("CronCheckRebalance", "자동 그리드 배치 실패", {
							strategyId: strategy.id,
							error: error instanceof Error ? error.message : String(error),
						});

						results.push({
							strategyId: strategy.id,
							stockCode: strategy.stock_code,
							rebalanced: false,
							error: error instanceof Error ? error.message : String(error),
						});
					}

					continue;
				}

				// 4. 보유 수량 계산
				const holding = balanceInfo.holdings.find((h) => matchStockCode(h.stockCode, strategy.stock_code));
				const totalQty = holding?.quantity ?? 0;

				// 5. 잔고 정보 생성
				const balance: BalanceInfo = {
					availableDeposit: balanceInfo.estimatedDepositAsset,
					totalQty,
				};

				// 6. 그리드 이탈 여부 체크
				const isOutOfRange = isGridOutOfRange(
					priceInfo.currentPrice,
					pendingOrders,
					strategy,
					balance
				);

				if (!isOutOfRange) {
					results.push({
						strategyId: strategy.id,
						stockCode: strategy.stock_code,
						rebalanced: false,
						reason: "그리드 범위 내",
					});
					continue;
				}

				// 7. 리밸런싱 실행
				const gridPrices = pendingOrders.map((o) => o.grid_price);
				logger.info("CronCheckRebalance", "그리드 이탈 감지 - 리밸런싱 시작", {
					strategyId: strategy.id,
					stockCode: strategy.stock_code,
					currentPrice: priceInfo.currentPrice,
					gridRange: {
						min: Math.min(...gridPrices),
						max: Math.max(...gridPrices),
					},
				});

				const rebalanceResult = await rebalanceGrid(strategy, true);

				logger.info("CronCheckRebalance", "리밸런싱 완료", {
					strategyId: strategy.id,
					cancelled: rebalanceResult.cancelled,
					placed: rebalanceResult.placed,
					failed: rebalanceResult.failed,
				});

				results.push({
					strategyId: strategy.id,
					stockCode: strategy.stock_code,
					rebalanced: true,
					result: rebalanceResult,
				});
			} catch (error) {
				logger.error("CronCheckRebalance", `전략 리밸런싱 체크 오류: ${strategy.id}`, {
					error: error instanceof Error ? error.message : String(error),
				});

				results.push({
					strategyId: strategy.id,
					stockCode: strategy.stock_code,
					rebalanced: false,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		const rebalancedCount = results.filter((r) => r.rebalanced).length;

		if (rebalancedCount > 0) {
			logger.info(
				"CronCheckRebalance",
				`리밸런싱 체크 완료: ${rebalancedCount}/${activeStrategies.length}개 리밸런싱됨`,
				undefined,
				true
			);
		}

		return {
			success: true,
			rebalanced: rebalancedCount,
			total: activeStrategies.length,
			results,
		};
	} catch (error) {
		logger.error("CronCheckRebalance", "리밸런싱 체크 오류", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "리밸런싱 체크 중 오류 발생",
		};
	}
}

/**
 * 자동 리밸런싱 체크 비즈니스 로직
 * @description Cron과 Route Handler에서 공용으로 사용
 *
 * **동시 실행 방지**: DB 기반 mutex로 멀티 프로세스 환경에서도 중복 실행 방지
 */
export async function checkRebalanceLogic() {
	const result = await withMutex("grid_rebalance_check", checkRebalanceInternal, 100);

	if (result === null) {
		// 락 획득 실패 (다른 프로세스가 실행 중)
		logger.warn("CronCheckRebalance", "이미 다른 프로세스에서 실행 중 - 스킵", undefined, true);
		return {
			success: true,
			message: "이미 실행 중",
			rebalanced: 0,
		};
	}

	return result;
}
