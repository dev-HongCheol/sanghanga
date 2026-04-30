/**
 * 간단한 LRU Cache 구현
 *
 * Redis 없이도 서버 메모리에서 캐싱을 지원합니다.
 * 추후 Redis로 마이그레이션 시 인터페이스 유지 가능합니다.
 */

interface CacheEntry<T> {
	/** 캐시된 데이터 */
	value: T;
	/** 만료 시간 (Unix timestamp) */
	expiry: number;
}

class CacheManager {
	private cache = new Map<string, CacheEntry<unknown>>();

	/**
	 * 캐시에 데이터 저장
	 *
	 * @param key - 캐시 키
	 * @param value - 저장할 데이터
	 * @param ttlSeconds - 만료 시간 (초), 기본값: 86400 (24시간)
	 */
	set<T>(key: string, value: T, ttlSeconds = 86400): void {
		const expiry = Date.now() + ttlSeconds * 1000;
		this.cache.set(key, { value, expiry });
	}

	/**
	 * 캐시에서 데이터 조회
	 *
	 * @param key - 캐시 키
	 * @returns 캐시된 데이터 또는 null (만료 또는 미존재)
	 */
	get<T>(key: string): T | null {
		const entry = this.cache.get(key) as CacheEntry<T> | undefined;

		if (!entry) {
			return null;
		}

		// 만료 체크
		if (Date.now() > entry.expiry) {
			this.cache.delete(key);
			return null;
		}

		return entry.value;
	}

	/**
	 * 캐시 키 삭제
	 *
	 * @param key - 캐시 키
	 */
	delete(key: string): void {
		this.cache.delete(key);
	}

	/**
	 * 특정 패턴의 모든 캐시 삭제
	 *
	 * @param pattern - 키 패턴 (예: "master:*")
	 */
	deletePattern(pattern: string): void {
		const regex = new RegExp(pattern.replace("*", ".*"));
		for (const key of this.cache.keys()) {
			if (regex.test(key)) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * 모든 캐시 삭제
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * 현재 캐시 크기 반환
	 */
	size(): number {
		return this.cache.size;
	}

	/**
	 * 만료된 캐시 정리
	 */
	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now > entry.expiry) {
				this.cache.delete(key);
			}
		}
	}
}

/**
 * 전역 캐시 매니저 인스턴스
 */
export const cacheManager = new CacheManager();

/**
 * 캐시 키 생성 유틸리티
 */
export const CacheKeys = {
	/**
	 * 전일 거래대금 마스터 데이터
	 *
	 * @param date - YYYYMMDD 형식
	 * @param market - 시장 구분 (ALL, KOSPI, KOSDAQ)
	 */
	prevDayVolume: (date: string, market: string) => `master:prev_volume:${date}:${market}`,

	/**
	 * 시가총액 마스터 데이터
	 *
	 * @param date - YYYYMMDD 형식
	 */
	marketCap: (date: string) => `master:market_cap:${date}`,
} as const;
