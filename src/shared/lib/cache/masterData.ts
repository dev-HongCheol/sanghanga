/**
 * 마스터 데이터 사전 로딩
 *
 * 전일 거래대금 등 확정된 데이터를 사전에 캐싱하여
 * 검색 시 API 호출을 최소화합니다.
 */

import { kiwoomClient } from "../kiwoom/client";
import { logger } from "../logger";
import { CacheKeys, cacheManager } from "./cacheManager";

/**
 * 마스터 데이터 종목 정보
 */
export interface MasterStockData {
	/** 종목코드 */
	stockCode: string;
	/** 종목명 */
	stockName: string;
	/** 현재가 */
	currentPrice: number;
	/** 전일 거래대금 (억원) */
	prevDayVolume: number;
	/** 시가총액 (억원) - 선택적 */
	marketCap?: number;
}

/**
 * API 응답 타입 - ka10031 (전일거래량상위요청)
 */
interface PrevDayVolumeRankingResponse {
	pred_trde_qty_upper: Array<{
		stk_cd: string;
		stk_nm: string;
		cur_prc: string;
		trde_qty: string;
	}>;
	return_code: number;
	return_msg: string;
}

/**
 * 오늘 날짜를 YYYYMMDD 형식으로 반환
 */
function getTodayDateString(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}${month}${day}`;
}

/**
 * 문자열 숫자를 Number로 안전하게 변환
 */
function safeParseNumber(value: string): number {
	const parsed = Number.parseFloat(value);
	return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * 키움 API 가격 필드 파싱 (절댓값)
 */
function parsePrice(value: string): number {
	return Math.abs(safeParseNumber(value));
}

/**
 * 전일 거래대금 마스터 데이터 로드
 *
 * 시장별 상위 100개 종목의 전일 거래대금 데이터를 캐싱합니다.
 *
 * @param market - 시장 구분 ("ALL" | "KOSPI" | "KOSDAQ")
 * @param forceRefresh - 강제 갱신 여부
 * @returns 마스터 데이터 배열
 */
export async function loadPrevDayVolumeMaster(
	market: "ALL" | "KOSPI" | "KOSDAQ" = "ALL",
	forceRefresh = false
): Promise<MasterStockData[]> {
	const today = getTodayDateString();
	const cacheKey = CacheKeys.prevDayVolume(today, market);

	// 캐시 확인
	if (!forceRefresh) {
		const cached = cacheManager.get<MasterStockData[]>(cacheKey);
		if (cached) {
			logger.info("MasterData", "전일 거래대금 캐시 히트", { market, count: cached.length });
			return cached;
		}
	}

	// API 호출
	const startTime = Date.now();
	logger.info("MasterData", "전일 거래대금 마스터 로딩 시작", { market });

	const marketCode = market === "KOSPI" ? "001" : market === "KOSDAQ" ? "101" : "000";

	try {
		const response = await kiwoomClient.request<PrevDayVolumeRankingResponse>("/api/dostk/rkinfo", {
			method: "POST",
			headers: { "api-id": "ka10031" },
			body: JSON.stringify({
				mrkt_tp: marketCode,
				qry_tp: "2", // 2: 전일거래대금
				rank_strt: "0",
				rank_end: "100", // 상위 100개
				stex_tp: "3",
			}),
		});

		// 데이터 변환
		const masterData: MasterStockData[] = response.pred_trde_qty_upper.map((item) => {
			const currentPrice = parsePrice(item.cur_prc);
			const tradeQty = safeParseNumber(item.trde_qty);
			const prevDayVolume = (currentPrice * tradeQty) / 100000000; // 억원

			return {
				stockCode: item.stk_cd,
				stockName: item.stk_nm,
				currentPrice,
				prevDayVolume,
			};
		});

		// 캐시 저장 (익일 00:00까지 유효)
		const now = new Date();
		const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
		const ttlSeconds = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);

		cacheManager.set(cacheKey, masterData, ttlSeconds);

		const duration = Date.now() - startTime;
		logger.info("MasterData", "전일 거래대금 마스터 로딩 완료", {
			market,
			count: masterData.length,
			duration: `${duration}ms`,
		});

		return masterData;
	} catch (error) {
		const duration = Date.now() - startTime;
		logger.error("MasterData", "전일 거래대금 마스터 로딩 실패", {
			market,
			error: error instanceof Error ? error.message : String(error),
			duration: `${duration}ms`,
		});

		throw error;
	}
}

/**
 * 특정 종목의 시가총액 조회 (캐싱)
 *
 * @param stockCode - 종목코드
 * @returns 시가총액 (억원)
 */
export async function getMarketCap(stockCode: string): Promise<number> {
	const today = getTodayDateString();
	const cacheKey = `stock:${stockCode}:market_cap:${today}`;

	// 캐시 확인
	const cached = cacheManager.get<number>(cacheKey);
	if (cached !== null) {
		return cached;
	}

	// API 호출
	try {
		const response = await kiwoomClient.request<{
			mac: string;
			return_code: number;
			return_msg: string;
		}>("/api/dostk/stkinfo", {
			method: "POST",
			headers: { "api-id": "ka10001" },
			body: JSON.stringify({ stk_cd: stockCode }),
		});

		const marketCap = Math.abs(Number.parseFloat(response.mac || "0"));

		// 캐시 저장 (익일 00:00까지)
		const now = new Date();
		const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
		const ttlSeconds = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);

		cacheManager.set(cacheKey, marketCap, ttlSeconds);

		return marketCap;
	} catch (error) {
		logger.error("MasterData", "시가총액 조회 실패", {
			stockCode,
			error: error instanceof Error ? error.message : String(error),
		});

		throw error;
	}
}

/**
 * 배치 단위로 시가총액 조회 (Rate Limiting 방어)
 *
 * @param stockCodes - 종목코드 배열
 * @param batchSize - 배치 크기 (기본 3개)
 * @param delayMs - 배치 간 지연 시간 (기본 200ms)
 * @returns 종목코드별 시가총액 맵
 */
export async function getMarketCapBatch(
	stockCodes: string[],
	batchSize = 3,
	delayMs = 200
): Promise<Map<string, number>> {
	const result = new Map<string, number>();

	// 배치 단위로 처리
	for (let i = 0; i < stockCodes.length; i += batchSize) {
		const batch = stockCodes.slice(i, i + batchSize);

		// 배치 내 병렬 처리
		const promises = batch.map(async (code) => {
			try {
				const marketCap = await getMarketCap(code);
				result.set(code, marketCap);
			} catch (error) {
				logger.warn("MasterData", "시가총액 조회 실패 (배치)", { stockCode: code });
				result.set(code, 0);
			}
		});

		await Promise.all(promises);

		// 다음 배치 전 대기 (마지막 배치 제외)
		if (i + batchSize < stockCodes.length) {
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}

	return result;
}
