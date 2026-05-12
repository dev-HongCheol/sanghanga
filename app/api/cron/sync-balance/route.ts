/**
 * Route Handler: 잔고 동기화
 *
 * **주기**: 3초
 * **용도**: 계좌 잔고 조회 → 메모리 캐시 + SSE push
 * **키움 API**: kt00018 (계좌평가잔고내역요청)
 *
 * **호출**: Cron 스케줄러가 3초마다 호출
 */

import { NextResponse } from "next/server";
import { syncBalanceLogic } from "@/features/grid-trader/lib/cron/syncBalance";

/**
 * Route Handler: HTTP 엔드포인트
 */
export async function GET() {
	const result = await syncBalanceLogic();

	if (!result.success) {
		return NextResponse.json(result, { status: 500 });
	}

	return NextResponse.json(result);
}
