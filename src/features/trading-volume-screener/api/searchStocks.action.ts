"use server";

import { getMarketCapBatch, loadPrevDayVolumeMaster } from "@/shared/lib/cache/masterData";
import { kiwoomClient } from "@/shared/lib/kiwoom/client";
import { logger } from "@/shared/lib/logger";
import { calculateIntersectionByFilters } from "../lib/intersection";
import { parsePrice, transformChangeRateRanking, transformCurrentDayVolumeRanking } from "../lib/transformers";
import { validateCandleVolume, validateTrendPattern } from "../lib/validators";
import type { StockScreenerFormValues } from "../model/screener.schema";
import type {
	CandleChartResponse,
	ChangeRateRankingResponse,
	CurrentDayVolumeRankingResponse,
	ScreenerResult,
	StockIntersection,
} from "../model/screener.types";

/**
 * 시장 구분을 API 형식으로 변환
 */
function getMarketCode(market: StockScreenerFormValues["market"]): "000" | "001" | "101" {
	switch (market) {
		case "ALL":
			return "000";
		case "KOSPI":
			return "001";
		case "KOSDAQ":
			return "101";
		default:
			return "000";
	}
}

/**
 * Server Action: 주식 스크리너 검색
 *
 * 모든 API 호출과 비즈니스 로직을 서버에서 처리하여 클라이언트 호출을 최소화합니다.
 * 페이지네이션을 지원하여 25개씩 처리합니다.
 *
 * @param values - 검색 필터 조건
 * @param page - 페이지 번호 (1부터 시작, 기본값: 1)
 * @param pageSize - 페이지당 결과 수 (기본값: 25)
 * @returns 검색 결과
 */
export async function searchStocksAction(
	values: StockScreenerFormValues,
	page = 1,
	pageSize = 25
): Promise<
	| { success: true; results: ScreenerResult[]; totalCount: number; hasMore: boolean }
	| { success: false; error: string }
> {
	const startTime = Date.now();

	try {
		logger.info("SearchStocksAction", "검색 시작", { filters: values });

		// 시가총액만 활성화된 경우 에러 반환
		const hasRankingFilter =
			values.prevDayVolume.enabled || values.realtimeVolume.enabled || values.trend.enabled;

		if (!hasRankingFilter) {
			logger.warn("SearchStocksAction", "순위 필터가 하나도 활성화되지 않음");
			return {
				success: false,
				error:
					"시가총액 필터만으로는 검색할 수 없습니다. 전일 거래대금, 실시간 수급, 상승 지속성 필터 중 최소 1개를 활성화하세요.",
			};
		}

		// Step 1: 각 필터별 상위 N개 조회 (병렬)
		const promises: Promise<any>[] = [];
		const allLists: Record<string, StockIntersection[]> = {};
		const enabledFilters: string[] = [];

		const marketCode = getMarketCode(values.market);

		// [B] 전일 거래대금 (캐시 우선)
		if (values.prevDayVolume.enabled) {
			enabledFilters.push("prevDayVolume");
			promises.push(
				loadPrevDayVolumeMaster(values.market).then((masterData) => {
					// 상위 topN개 필터링
					const filtered = masterData
						.filter((item) => item.prevDayVolume >= values.prevDayVolume.min)
						.slice(0, values.prevDayVolume.topN);

					allLists.prevDayVolume = filtered.map((item) => ({
						stockCode: item.stockCode,
						stockName: item.stockName,
						currentPrice: item.currentPrice,
						prevDayVolume: item.prevDayVolume,
					}));

					logger.info("SearchStocksAction", "[B] 전일 거래대금 캐시 조회 완료", {
						count: allLists.prevDayVolume.length,
					});
				})
			);
		}

		// [C] 실시간 수급
		if (values.realtimeVolume.enabled) {
			enabledFilters.push("realtimeVolume");
			const volumeCode = String(values.realtimeVolume.min * 10); // 억원 → 백만원
			promises.push(
				kiwoomClient
					.request<CurrentDayVolumeRankingResponse>("/api/dostk/rkinfo", {
						method: "POST",
						headers: { "api-id": "ka10030" },
						body: JSON.stringify({
							mrkt_tp: marketCode,
							sort_tp: "3", // 3: 거래대금
							mang_stk_incls: "0",
							crd_tp: "0",
							trde_qty_tp: "0",
							pric_tp: "0",
							trde_prica_tp: volumeCode,
							mrkt_open_tp: "0",
							stex_tp: "3",
						}),
					})
					.then((response) => {
						allLists.realtimeVolume = transformCurrentDayVolumeRanking(response);
						logger.info("SearchStocksAction", "[C] 실시간 수급 조회 완료", {
							count: allLists.realtimeVolume.length,
						});
					})
			);
		}

		// [D] 상승 지속성
		if (values.trend.enabled) {
			enabledFilters.push("trend");
			const volumeCode = String(values.trend.topN * 10);
			promises.push(
				kiwoomClient
					.request<ChangeRateRankingResponse>("/api/dostk/rkinfo", {
						method: "POST",
						headers: { "api-id": "ka10027" },
						body: JSON.stringify({
							mrkt_tp: marketCode,
							sort_tp: "1", // 1: 상승률
							trde_qty_cnd: "0000",
							stk_cnd: "0",
							crd_cnd: "0",
							updown_incls: "1",
							pric_cnd: "0",
							trde_prica_cnd: volumeCode,
							stex_tp: "3",
						}),
					})
					.then((response) => {
						allLists.trend = transformChangeRateRanking(response);
						logger.info("SearchStocksAction", "[D] 상승 지속성 조회 완료", {
							count: allLists.trend.length,
						});
					})
			);
		}

		await Promise.all(promises);

		// Step 2: 교집합 계산
		const intersection = calculateIntersectionByFilters(allLists, enabledFilters);
		const totalCount = intersection.length;
		logger.info("SearchStocksAction", "교집합 계산 완료", {
			totalCount,
			requestedPage: page,
		});

		if (totalCount === 0) {
			logger.warn("SearchStocksAction", "교집합이 비어있음");
			return { success: true, results: [], totalCount: 0, hasMore: false };
		}

		// Step 2-1: 페이지네이션 적용 (해당 페이지만 처리)
		const startIndex = (page - 1) * pageSize;
		const endIndex = startIndex + pageSize;
		const pagedIntersection = intersection.slice(startIndex, endIndex);
		const hasMore = endIndex < totalCount;

		logger.info("SearchStocksAction", "페이지 슬라이싱 완료", {
			startIndex,
			endIndex,
			pageSize: pagedIntersection.length,
			hasMore,
		});

		if (pagedIntersection.length === 0) {
			logger.warn("SearchStocksAction", "요청한 페이지가 범위를 벗어남");
			return { success: true, results: [], totalCount, hasMore: false };
		}

		// Step 3-1: 시가총액 배치 조회 (Rate Limiting 방어)
		const marketCapMap = new Map<string, number>();
		if (values.marketCap.enabled && pagedIntersection.length > 0) {
			const stockCodes = pagedIntersection.map((s) => s.stockCode);
			const batchResult = await getMarketCapBatch(stockCodes, 3, 200);
			batchResult.forEach((cap, code) => marketCapMap.set(code, cap));
			logger.info("SearchStocksAction", "시가총액 배치 조회 완료", {
				count: marketCapMap.size,
			});
		}

		// Step 3-2: 분봉 패턴 검증 (배치 처리로 Rate Limiting 방어)
		const batchSize = 3; // 동시 호출 수 제한 (초당 20회 제한 준수)
		const delayMs = 200; // 배치 간 지연 (ms)
		const finalResults: ScreenerResult[] = [];

		for (let i = 0; i < pagedIntersection.length; i += batchSize) {
			const batch = pagedIntersection.slice(i, i + batchSize);

			const batchPromises = batch.map(async (stock) => {
				try {
					// intersection에서 받은 데이터 사용 (기본값: 0 또는 sideways)
					let marketCap = 0;
					const changeRate = stock.changeRate ?? 0;
					const prevDayVolume = stock.prevDayVolume ?? 0;
					let currentDayVolume = stock.currentDayVolume ?? 0;
					let trendPattern: "up" | "down" | "sideways" = "sideways";

					// [A] 시가총액 검증 (캐시된 배치 결과 사용)
					if (values.marketCap.enabled) {
						marketCap = marketCapMap.get(stock.stockCode) ?? 0;

						if (marketCap < values.marketCap.min) {
							logger.debug("SearchStocksAction", "시가총액 필터 실패", {
								stock: stock.stockName,
								marketCap,
								min: values.marketCap.min,
							});
							return null;
						}
					}

					// [D] 상승 지속성 검증
					if (values.trend.enabled) {
						const candleData = await kiwoomClient.request<CandleChartResponse>("/api/dostk/chart", {
							method: "POST",
							headers: { "api-id": "ka10080" },
							body: JSON.stringify({
								stk_cd: stock.stockCode,
								tic_scope: String(values.trend.period),
								upd_stkpc_tp: "1",
							}),
						});

						const isValidPattern = validateTrendPattern(
							candleData.stk_min_pole_chart_qry,
							values.trend.consecutiveBars,
							values.trend.direction,
							values.trend.priceType
						);

						if (!isValidPattern) {
							logger.debug("SearchStocksAction", "패턴 필터 실패", {
								stock: stock.stockName,
							});
							return null;
						}

						trendPattern = values.trend.direction === "up" ? "up" : "down";

						// [C] 실시간 수급 검증 (분봉 데이터로)
						if (values.realtimeVolume.enabled) {
							const isValidVolume = validateCandleVolume(
								candleData.stk_min_pole_chart_qry,
								values.realtimeVolume.candleOffset,
								values.realtimeVolume.min
							);

							if (!isValidVolume) {
								logger.debug("SearchStocksAction", "실시간 수급 필터 실패", {
									stock: stock.stockName,
								});
								return null;
							}

							// 거래대금 계산
							const candle = candleData.stk_min_pole_chart_qry[values.realtimeVolume.candleOffset];
							if (candle) {
								const price = parsePrice(candle.cur_prc);
								const quantity = parsePrice(candle.trde_qty);
								currentDayVolume = (price * quantity) / 100000000; // 억원
							}
						}
					}

					// trend 필터가 비활성화된 경우 등락률로 패턴 판단
					if (!values.trend.enabled && changeRate !== 0) {
						trendPattern = changeRate > 0 ? "up" : "down";
					}

					// 성공
					logger.debug("SearchStocksAction", "종목 검증 성공", {
						stock: stock.stockName,
					});

					return {
						stockCode: stock.stockCode,
						stockName: stock.stockName,
						currentPrice: stock.currentPrice,
						changeRate,
						marketCap,
						prevDayVolume,
						currentDayVolume,
						trendPattern,
					} satisfies ScreenerResult;
				} catch (error) {
					logger.error("SearchStocksAction", "종목 검증 실패", {
						stock: stock.stockName,
						error: error instanceof Error ? error.message : String(error),
					});
					return null;
				}
			});

			const batchResults = await Promise.all(batchPromises);
			const validResults = batchResults.filter((r): r is ScreenerResult => r !== null);
			finalResults.push(...validResults);

			// 다음 배치 전 대기 (마지막 배치 제외)
			if (i + batchSize < pagedIntersection.length) {
				await new Promise((resolve) => setTimeout(resolve, delayMs));
			}
		}

		const duration = Date.now() - startTime;
		logger.info("SearchStocksAction", "검색 완료", {
			page,
			pageResults: finalResults.length,
			totalCount,
			hasMore,
			duration: `${duration}ms`,
		});

		return { success: true, results: finalResults, totalCount, hasMore };
	} catch (error) {
		const duration = Date.now() - startTime;
		logger.error("SearchStocksAction", "검색 실패", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			duration: `${duration}ms`,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "검색 중 오류가 발생했습니다.",
		};
	}
}
