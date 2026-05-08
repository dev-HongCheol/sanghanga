import { logger } from "@/shared/lib/logger";
import { NextResponse } from "next/server";

/**
 * GET /api/debug/polling-logs
 *
 * 폴링 로그 가시성 제어 엔드포인트
 *
 * @example
 * GET /api/debug/polling-logs
 * → 현재 상태 반환
 *
 * @example
 * GET /api/debug/polling-logs?show=true
 * → 폴링 로그 활성화 후 상태 반환
 *
 * @example
 * GET /api/debug/polling-logs?show=false
 * → 폴링 로그 비활성화 후 상태 반환
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const showParam = searchParams.get("show");

	// show 파라미터가 있으면 설정
	if (showParam !== null) {
		const show = showParam === "true";
		logger.setShowPollingLogs(show);
	}

	// 현재 상태 반환
	const currentState = logger.getShowPollingLogs();

	return NextResponse.json({
		pollingLogsEnabled: currentState,
	});
}
