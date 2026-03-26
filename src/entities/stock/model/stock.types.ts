/**
 * @fileoverview 주식 도메인 타입 정의
 * @description 주식 관련 API 요청/응답 타입
 */

/**
 * 실시간 종목조회순위 요청
 */
export interface StockRankingRequest {
	/** 구분: 1(1분), 2(10분), 3(1시간), 4(당일누적), 5(30초) */
	qry_tp: "1" | "2" | "3" | "4" | "5";
}

/**
 * 실시간 종목조회순위 응답
 */
export interface StockRankingResponse {
	/** 응답 데이터 (키움 API 응답 구조에 따라 추가 예정) */
	data: unknown;
	/** 에러 메시지 (있을 경우) */
	error?: string;
}
