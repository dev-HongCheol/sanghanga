/**
 * Route Handler: 가격 동기화
 *
 * **주기**: 1초
 * **용도**: 활성 전략의 종목 현재가 조회 → 메모리 캐시 + SSE push
 * **키움 API**: ka10001 (주식기본정보)
 *
 * **호출**: Cron 스케줄러가 1초마다 호출
 */

import { NextResponse } from "next/server";
import { syncPricesLogic } from "@/features/grid-trader/lib/cron/syncPrices";

/**
 * Route Handler: HTTP 엔드포인트
 */
export async function GET() {
	const result = await syncPricesLogic();

	if (!result.success) {
		return NextResponse.json(result, { status: 500 });
	}

	return NextResponse.json(result);
}
