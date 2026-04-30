/**
 * @fileoverview 종목 정보 API Route
 * @description 키움 종목 정보 API를 프록시 (ka10001, ka10100)
 */

import { kiwoomClient } from "@/shared/lib/kiwoom/client";
import { logger } from "@/shared/lib/logger";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * 요청 바디 검증 스키마
 */
const requestSchema = z.object({
	stk_cd: z.string().min(1).max(20), // 키움 API 스펙: 최대 20자리
});

/**
 * POST /api/kiwoom/dostk/stkinfo
 * 종목 정보 조회
 * @param request - Next.js Request
 * @returns 종목 정보 데이터
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

		// 요청 검증
		const validatedBody = requestSchema.parse(body);

		logger.info("StockInfoAPI", `Fetching stock info (${apiId})`, {
			apiId,
			stockCode: validatedBody.stk_cd,
		});

		// 키움 API 호출
		const response = await kiwoomClient.request("/api/dostk/stkinfo", {
			method: "POST",
			headers: {
				"api-id": apiId,
			},
			body: JSON.stringify(validatedBody),
		});

		const duration = Date.now() - startTime;
		logger.info("StockInfoAPI", `Stock info fetched successfully (${apiId})`, {
			stockCode: validatedBody.stk_cd,
			duration: `${duration}ms`,
		});

		return NextResponse.json(response);
	} catch (error) {
		const duration = Date.now() - startTime;

		// Zod 검증 에러
		if (error instanceof z.ZodError) {
			logger.warn("StockInfoAPI", "Invalid request body", {
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
		logger.error("StockInfoAPI", "Failed to fetch stock info", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			duration: `${duration}ms`,
		});

		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to fetch stock info",
			},
			{ status: 500 },
		);
	}
}
