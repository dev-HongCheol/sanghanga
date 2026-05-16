/**
 * @fileoverview 가격 동기화 로직
 * @description 활성 전략의 종목 현재가 조회 → 메모리 캐시 + SSE push
 */

import { getActiveStrategies } from "@/entities/grid-trader";
import { updatePrice } from "@/shared/lib/cache/price-cache";
import { kiwoomClient } from "@/shared/lib/kiwoom/client";
import { logger } from "@/shared/lib/logger";
import { broadcastPrice } from "@/shared/lib/sse/sse-manager";
import { isMarketOpen } from "@/shared/lib/time/market-hours";
import type { CurrentPrice } from "../../api/getCurrentPrice.action";

/**
 * 주식 기본 정보 응답
 */
interface StockBasicInfoResponse {
	return_code: number;
	return_msg: string;
	stk_cd: string;
	stk_nm: string;
	cur_prc: string;
	pred_pre: string;
	flu_rt: string;
	high_pric: string;
	low_pric: string;
	open_pric: string;
	trde_qty: string;
	base_pric: string;
	mac: string;
}

/**
 * 현재가 조회 (Server Action 없이 직접 호출)
 */
async function getCurrentPrice(stockCode: string): Promise<CurrentPrice | null> {
	try {
		// 키움 API 호출
		const response = await kiwoomClient.request<StockBasicInfoResponse>("/api/dostk/stkinfo", {
			method: "POST",
			headers: { "api-id": "ka10001" },
			body: JSON.stringify({ stk_cd: stockCode }),
		});

		// 응답 데이터 파싱
		const priceInfo: CurrentPrice = {
			stockCode: response.stk_cd,
			stockName: response.stk_nm,
			currentPrice: Math.abs(Number.parseFloat(response.cur_prc)) || 0,
			change: Number.parseFloat(response.pred_pre) || 0,
			changeRate: Number.parseFloat(response.flu_rt) || 0,
			highPrice: Math.abs(Number.parseFloat(response.high_pric)) || 0,
			lowPrice: Math.abs(Number.parseFloat(response.low_pric)) || 0,
			openPrice: Math.abs(Number.parseFloat(response.open_pric)) || 0,
			volume: Math.abs(Number.parseFloat(response.trde_qty)) || 0,
			basePrice: Math.abs(Number.parseFloat(response.base_pric)) || 0,
			marketCap: Math.abs(Number.parseFloat(response.mac)) || 0,
		};

		return priceInfo;
	} catch (error) {
		logger.error("GetCurrentPrice", "현재가 조회 실패", {
			stockCode,
			error: error instanceof Error ? error.message : String(error),
		});
		return null;
	}
}

/**
 * 가격 동기화 비즈니스 로직
 * @description Cron과 Route Handler에서 공용으로 사용
 */
export async function syncPricesLogic() {
	try {
		// 장시간 체크 (평일 09:00~15:30)
		// - Cron에서 호출 시: scheduler.ts에서 이미 체크 (캐시 hit)
		// - HTTP GET 수동 호출 시: 여기서 체크 필요
		if (!isMarketOpen()) {
			return {
				success: false,
				error: "장 마감 시간 (평일 09:00~15:30만 실행)",
			};
		}

		// 활성 전략 목록 조회 (entities API 사용, Admin Client)
		const activeStrategies = await getActiveStrategies(true);

		if (activeStrategies.length === 0) {
			return {
				success: true,
				message: "활성 전략 없음",
				updated: 0,
			};
		}

		// 중복 제거 (같은 종목이 여러 전략에 있을 수 있음)
		const uniqueStockCodes = Array.from(new Set(activeStrategies.map((s) => s.stock_code)));

		const results = [];

		// 각 종목 현재가 조회
		for (const stockCode of uniqueStockCodes) {
			try {
				const priceInfo = await getCurrentPrice(stockCode);

				if (priceInfo) {
					// 메모리 캐시 업데이트
					updatePrice(stockCode, priceInfo);

					// SSE 브로드캐스트
					await broadcastPrice(stockCode, priceInfo);

					results.push({
						stockCode,
						stockName: priceInfo.stockName,
						currentPrice: priceInfo.currentPrice,
						success: true,
					});
				} else {
					results.push({
						stockCode,
						success: false,
						error: "가격 조회 실패",
					});
				}
			} catch (error) {
				logger.error("CronSyncPrices", `현재가 조회 오류: ${stockCode}`, {
					error: error instanceof Error ? error.message : String(error),
				});

				results.push({
					stockCode,
					success: false,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		const successCount = results.filter((r) => r.success).length;

		logger.info(
			"CronSyncPrices",
			`가격 동기화 완료: ${successCount}/${uniqueStockCodes.length}개`,
			undefined,
			true
		);

		return {
			success: true,
			updated: successCount,
			total: uniqueStockCodes.length,
			results,
		};
	} catch (error) {
		logger.error("CronSyncPrices", "가격 동기화 오류", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "가격 동기화 중 오류 발생",
		};
	}
}
