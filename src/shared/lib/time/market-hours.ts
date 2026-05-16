/**
 * @fileoverview 한국 주식시장 장시간 체크 유틸리티
 * @description 로컬 시스템 시간 기반으로 장시간(09:00~18:00) 여부 판단
 *
 * **시간 소스**: 로컬 서버 시간 (Asia/Seoul 시간대로 변환)
 *
 * **장시간**:
 * - 평일 09:00 ~ 18:00 (KST)
 * - 정규장 09:00~15:30, 시간외 종가 15:40~16:00, 시간외 단일가 16:00~18:00
 * - 주말/공휴일 제외 (현재는 요일만 체크, 추후 공휴일 API 연동 가능)
 */

import { logger } from "@/shared/lib/logger";

/**
 * 장시간 정보
 */
interface MarketHours {
	/** 장시간 여부 */
	isMarketOpen: boolean;
	/** 현재 시간 (KST) */
	currentTime: Date;
	/** 요일 (0: 일요일 ~ 6: 토요일) */
	dayOfWeek: number;
}

/**
 * 장시간 설정
 */
const MARKET_CONFIG = {
	/** 장 시작 시간 (09:00) */
	OPEN_HOUR: 9,
	OPEN_MINUTE: 0,
	/** 장 마감 시간 (18:00 - 시간외 거래 종료) */
	CLOSE_HOUR: 18,
	CLOSE_MINUTE: 0,
	/** 평일 (월요일=1 ~ 금요일=5) */
	WEEKDAYS: [1, 2, 3, 4, 5],
};

/**
 * 로컬 시간을 한국 시간으로 변환
 * @returns KST 시간
 */
function getKoreanTime(): Date {
	// 로컬 시간을 한국 시간대로 변환
	const now = new Date();
	const koreanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
	return koreanTime;
}

/**
 * 주어진 시간이 장시간인지 판단
 * @param date - 체크할 시간 (KST)
 * @returns 장시간 여부
 */
function isWithinMarketHours(date: Date): boolean {
	const dayOfWeek = date.getDay(); // 0 (일요일) ~ 6 (토요일)

	// 주말 체크
	if (!MARKET_CONFIG.WEEKDAYS.includes(dayOfWeek)) {
		return false;
	}

	const hour = date.getHours();
	const minute = date.getMinutes();

	// 시간 체크 (09:00 ~ 18:00)
	const openTime = MARKET_CONFIG.OPEN_HOUR * 60 + MARKET_CONFIG.OPEN_MINUTE;
	const closeTime = MARKET_CONFIG.CLOSE_HOUR * 60 + MARKET_CONFIG.CLOSE_MINUTE;
	const currentTime = hour * 60 + minute;

	return currentTime >= openTime && currentTime < closeTime;
}

/**
 * 현재 장시간 여부 조회
 * @returns 장시간 정보
 */
export function checkMarketHours(): MarketHours {
	const time = getKoreanTime();
	const isMarketOpen = isWithinMarketHours(time);
	const dayOfWeek = time.getDay();

	return {
		isMarketOpen,
		currentTime: time,
		dayOfWeek,
	};
}

/**
 * 장시간 체크 (간단 버전 - boolean만 반환)
 * @description 순수 날짜 산술이므로 캐시 없이 매번 체크 (경계 시각 정확도 보장)
 * @returns 장시간 여부
 */
export function isMarketOpen(): boolean {
	return checkMarketHours().isMarketOpen;
}

/**
 * 장시간 정보 로깅
 */
export function logMarketHours(): void {
	const marketHours = checkMarketHours();

	logger.info(
		"MarketHours",
		`장시간 체크: ${marketHours.isMarketOpen ? "✅ 장중" : "❌ 장 마감"}`,
		{
			currentTime: marketHours.currentTime.toLocaleString("ko-KR", {
				timeZone: "Asia/Seoul",
			}),
			dayOfWeek: ["일", "월", "화", "수", "목", "금", "토"][marketHours.dayOfWeek],
		},
		true
	);
}
