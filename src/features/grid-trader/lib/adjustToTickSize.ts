/**
 * 한국 주식시장 호가 단위
 *
 * @see https://securities.miraeasset.com/hki/hki3018/r01.do
 */
const TICK_SIZE_RULES = [
	{ max: 1000, tick: 1 },
	{ max: 5000, tick: 5 },
	{ max: 10000, tick: 10 },
	{ max: 50000, tick: 50 },
	{ max: 100000, tick: 100 },
	{ max: 500000, tick: 500 },
	{ max: Number.POSITIVE_INFINITY, tick: 1000 },
] as const;

/**
 * 주어진 가격을 호가 단위에 맞춰 조정한다
 *
 * 키움증권 API는 호가 단위에 맞지 않는 가격을 거부하므로,
 * 모든 주문 가격은 이 함수를 거쳐야 한다.
 *
 * @param price - 원본 가격 (원)
 * @param direction - 조정 방향 (up: 올림, down: 내림, round: 반올림)
 * @returns 호가 단위에 맞춘 가격
 *
 * @example
 * adjustToTickSize(12345, "down") // 12300 (50원 단위)
 * adjustToTickSize(12345, "up")   // 12350 (50원 단위)
 * adjustToTickSize(523000, "down") // 522000 (1000원 단위)
 */
export function adjustToTickSize(
	price: number,
	direction: "up" | "down" | "round" = "round"
): number {
	// 가격대별 호가 단위 찾기
	const rule = TICK_SIZE_RULES.find((r) => price < r.max);
	if (!rule) {
		throw new Error(`Invalid price: ${price}`);
	}

	const tick = rule.tick;

	switch (direction) {
		case "up":
			return Math.ceil(price / tick) * tick;
		case "down":
			return Math.floor(price / tick) * tick;
		case "round":
			return Math.round(price / tick) * tick;
	}
}

/**
 * 호가 단위에 맞는 가격인지 검증한다
 *
 * @param price - 검증할 가격
 * @returns 호가 단위에 맞으면 true
 */
export function isValidTickSize(price: number): boolean {
	return adjustToTickSize(price) === price;
}
