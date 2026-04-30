/**
 * 스크리너 검색 결과 (단일 종목)
 */
export interface ScreenerResult {
	/** 종목코드 */
	stockCode: string;
	/** 종목명 */
	stockName: string;
	/** 현재가 */
	currentPrice: number;
	/** 등락률 (%) */
	changeRate: number;
	/** 시가총액 (억원) */
	marketCap: number;
	/** 전일 거래대금 (억원) */
	prevDayVolume: number;
	/** 당일 거래대금 (억원) */
	currentDayVolume: number;
	/** 1분봉 패턴 (연속 상승 여부) */
	trendPattern: "up" | "down" | "sideways";
}

/**
 * API 응답 - ka10031 (전일거래량상위요청)
 */
export interface PrevDayVolumeRankingResponse {
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
 * API 응답 - ka10030 (당일거래량상위요청)
 */
export interface CurrentDayVolumeRankingResponse {
	tdy_trde_qty_upper: Array<{
		stk_cd: string;
		stk_nm: string;
		cur_prc: string;
		trde_amt: string;
		flu_rt: string;
	}>;
	return_code: number;
	return_msg: string;
}

/**
 * API 응답 - ka10027 (전일대비등락률상위요청)
 */
export interface ChangeRateRankingResponse {
	pred_pre_flu_rt_upper: Array<{
		stk_cd: string;
		stk_nm: string;
		cur_prc: string;
		flu_rt: string;
	}>;
	return_code: number;
	return_msg: string;
}

/**
 * API 응답 - ka10001 (주식기본정보요청)
 */
export interface StockInfoResponse {
	stk_cd: string;
	stk_nm: string;
	mac: string; // 시가총액
	cur_prc: string;
	return_code: number;
	return_msg: string;
}

/**
 * API 응답 - ka10080 (주식분봉차트조회요청)
 */
export interface CandleChartResponse {
	stk_cd: string;
	stk_min_pole_chart_qry: Array<{
		cur_prc: string; // 종가
		trde_qty: string;
		cntr_tm: string;
		open_pric: string;
		high_pric: string;
		low_pric: string;
	}>;
	return_code: number;
	return_msg: string;
}

/**
 * 교집합 계산용 종목 정보
 */
export interface StockIntersection {
	/** 종목코드 */
	stockCode: string;
	/** 종목명 */
	stockName: string;
	/** 현재가 */
	currentPrice: number;
	/** 등락률 (%) - 선택적 */
	changeRate?: number;
	/** 전일 거래대금 (억원) - 선택적 */
	prevDayVolume?: number;
	/** 당일 거래대금 (억원) - 선택적 */
	currentDayVolume?: number;
}
