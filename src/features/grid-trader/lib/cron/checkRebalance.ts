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
 */

import { getActiveStrategies, getPendingOrders } from "@/entities/grid-trader";
import { logger } from "@/shared/lib/logger";
import { getPrice } from "@/shared/lib/cache/price-cache";
import { rebalanceGrid } from "../rebalanceGrid";
import { deployGrid } from "../deployGrid";

/**
 * 그리드 이탈 여부 체크
 * @description 현재가가 상단/하단 그리드 범위를 벗어났는지 확인
 *
 * **이탈 조건**:
 * - 현재가 > 최상단 그리드 가격 (모든 매도 주문 위로)
 * - 현재가 < 최하단 그리드 가격 (모든 매수 주문 아래로)
 *
 * @param currentPrice - 현재가
 * @param gridPrices - 미체결 주문의 그리드 가격 배열
 * @returns 이탈 여부
 */
function isGridOutOfRange(currentPrice: number, gridPrices: number[]): boolean {
	if (gridPrices.length === 0) return false;

	const maxPrice = Math.max(...gridPrices);
	const minPrice = Math.min(...gridPrices);

	// 현재가가 그리드 범위를 벗어남
	if (currentPrice > maxPrice || currentPrice < minPrice) {
		return true;
	}

	return false;
}

/**
 * 자동 리밸런싱 체크 비즈니스 로직
 * @description Cron과 Route Handler에서 공용으로 사용
 */
export async function checkRebalanceLogic() {
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

				// 2. 미체결 주문 조회
				const pendingOrders = await getPendingOrders(strategy.id, true);

				// 2-1. 미체결 주문이 없으면 자동으로 그리드 배치 (서버 재시작 대응)
				if (pendingOrders.length === 0) {
					logger.info(
						"CronCheckRebalance",
						"활성 전략인데 주문 없음 - 자동 그리드 배치 실행",
						{
							strategyId: strategy.id,
							stockCode: strategy.stock_code,
						}
					);

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

				// 3. 그리드 이탈 여부 체크
				const gridPrices = pendingOrders.map((o) => o.grid_price);
				const isOutOfRange = isGridOutOfRange(priceInfo.currentPrice, gridPrices);

				if (!isOutOfRange) {
					results.push({
						strategyId: strategy.id,
						stockCode: strategy.stock_code,
						rebalanced: false,
						reason: "그리드 범위 내",
					});
					continue;
				}

				// 4. 리밸런싱 실행
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
