/**
 * @fileoverview 차트 데이터 API Route
 * @description 키움 차트 API를 프록시 (ka10080, ka10081 등)
 */

import { kiwoomClient } from "@/shared/lib/kiwoom/client";
import { logger } from "@/shared/lib/logger";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * ka10080 - 주식분봉차트조회요청 스키마
 */
const ka10080Schema = z.object({
	stk_cd: z.string().min(1).max(20), // 키움 API 스펙: 최대 20자리
	tic_scope: z.enum(["1", "3", "5", "10", "15", "30", "60"]),
	upd_stkpc_tp: z.enum(["0", "1"]),
	base_dt: z.string().optional(),
});

/**
 * ka10081 - 주식일봉차트조회요청 스키마
 */
const ka10081Schema = z.object({
	stk_cd: z.string().min(1).max(20), // 키움 API 스펙: 최대 20자리
	base_dt: z.string().length(8),
	upd_stkpc_tp: z.enum(["0", "1"]),
});

/**
 * POST /api/kiwoom/dostk/chart
 * 차트 데이터 조회
 * @param request - Next.js Request
 * @returns 차트 데이터
 */
export async function POST(request: NextRequest) {
	const startTime = Date.now();

	try {
		const body = await request.json();
		const apiId = request.headers.get("api-id");

		if (!apiId) {
			return NextResponse.json(
				{ error: "api-id header is required" },
				{ status: 400 },
			);
		}

		// api-id에 따라 다른 스키마로 검증
		let validatedBody;
		if (apiId === "ka10080") {
			validatedBody = ka10080Schema.parse(body);
		} else if (apiId === "ka10081") {
			validatedBody = ka10081Schema.parse(body);
		} else {
			return NextResponse.json(
				{ error: `Unsupported api-id: ${apiId}` },
				{ status: 400 },
			);
		}

		logger.info("ChartAPI", `Fetching chart data (${apiId})`, {
			apiId,
			stockCode: validatedBody.stk_cd,
		});

		// 키움 API 호출
		const response = await kiwoomClient.request("/api/dostk/chart", {
			method: "POST",
			headers: {
				"api-id": apiId,
			},
			body: JSON.stringify(validatedBody),
		});

		const duration = Date.now() - startTime;
		logger.info("ChartAPI", `Chart data fetched successfully (${apiId})`, {
			stockCode: validatedBody.stk_cd,
			duration: `${duration}ms`,
		});

		return NextResponse.json(response);
	} catch (error) {
		const duration = Date.now() - startTime;

		// Zod 검증 에러
		if (error instanceof z.ZodError) {
			logger.warn("ChartAPI", "Invalid request body", {
				errors: error.issues,
				duration: `${duration}ms`,
			});
			return NextResponse.json(
				{
					error: "Invalid request",
					details: error.issues,
				},
				{ status: 400 },
			);
		}

		// 기타 에러
		logger.error("ChartAPI", "Failed to fetch chart data", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			duration: `${duration}ms`,
		});

		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to fetch chart data",
			},
			{ status: 500 },
		);
	}
}
