import { z } from "zod";

/**
 * 시장 구분
 */
export const marketSchema = z.enum(["ALL", "KOSPI", "KOSDAQ"]);

/**
 * 분봉 주기
 */
export const candlePeriodSchema = z.union([
	z.literal(1),
	z.literal(3),
	z.literal(5),
	z.literal(10),
	z.literal(15),
	z.literal(30),
	z.literal(60),
]);

/**
 * [A] 시가총액 필터
 */
export const marketCapFilterSchema = z.object({
	/** 필터 활성화 여부 */
	enabled: z.boolean(),
	/** 최소 시가총액 (억원) */
	min: z.number().int().min(0),
});

/**
 * [B] 전일 거래대금 필터
 */
export const prevDayVolumeFilterSchema = z.object({
	/** 필터 활성화 여부 */
	enabled: z.boolean(),
	/** 최소 거래대금 (억원) */
	min: z.number().int().min(0),
	/** 상위 개수 */
	topN: z.number().int().min(1).max(100),
});

/**
 * [C] 실시간 수급 필터
 */
export const realtimeVolumeFilterSchema = z.object({
	/** 필터 활성화 여부 */
	enabled: z.boolean(),
	/** 분봉 주기 */
	period: candlePeriodSchema,
	/** 봉 오프셋 (몇 봉전) */
	candleOffset: z.number().int().min(0),
	/** 최소 거래대금 (억원) */
	min: z.number().int().min(0),
	/** 상위 개수 */
	topN: z.number().int().min(1).max(100),
});

/**
 * [D] 상승 지속성 필터
 */
export const trendFilterSchema = z.object({
	/** 필터 활성화 여부 */
	enabled: z.boolean(),
	/** 분봉 주기 */
	period: candlePeriodSchema,
	/** 연속 봉 개수 */
	consecutiveBars: z.number().int().min(2).max(10),
	/** 방향 (상승/하락) */
	direction: z.enum(["up", "down"]),
	/** 가격 기준 (종가/고가/저가) */
	priceType: z.enum(["close", "high", "low"]),
	/** 상위 개수 */
	topN: z.number().int().min(1).max(100),
});

/**
 * 전체 스크리너 필터 폼
 */
export const stockScreenerFormSchema = z.object({
	/** 시장 선택 */
	market: marketSchema,

	/** [A] 시가총액 필터 */
	marketCap: marketCapFilterSchema,

	/** [B] 전일 거래대금 필터 */
	prevDayVolume: prevDayVolumeFilterSchema,

	/** [C] 실시간 수급 필터 */
	realtimeVolume: realtimeVolumeFilterSchema,

	/** [D] 상승 지속성 필터 */
	trend: trendFilterSchema,
});

export type Market = z.infer<typeof marketSchema>;
export type CandlePeriod = z.infer<typeof candlePeriodSchema>;
export type MarketCapFilter = z.infer<typeof marketCapFilterSchema>;
export type PrevDayVolumeFilter = z.infer<typeof prevDayVolumeFilterSchema>;
export type RealtimeVolumeFilter = z.infer<typeof realtimeVolumeFilterSchema>;
export type TrendFilter = z.infer<typeof trendFilterSchema>;
export type StockScreenerFormValues = z.infer<typeof stockScreenerFormSchema>;
