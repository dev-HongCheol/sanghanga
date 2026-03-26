/**
 * @fileoverview 실시간 종목조회순위 API Route
 * @description 키움 API를 프록시하여 클라이언트에서 안전하게 호출 가능하도록 함
 */

import type { StockRankingRequest, StockRankingResponse } from "@/entities/stock";
import { kiwoomClient } from "@/shared/lib/kiwoom/client";
import { logger } from "@/shared/lib/logger";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * 요청 바디 검증 스키마
 */
const requestSchema = z.object({
	qry_tp: z.enum(["1", "2", "3", "4", "5"]),
});

/**
 * POST /api/kiwoom/stock-ranking
 * 실시간 종목조회순위 조회
 * @param request - Next.js Request
 * @returns 종목조회순위 데이터
 */
export async function POST(request: NextRequest) {
	const startTime = Date.now();

	try {
		const body = await request.json();

		// 요청 검증
		const validatedBody = requestSchema.parse(body) as StockRankingRequest;

		logger.info("StockRankingAPI", "Fetching stock ranking", {
			qry_tp: validatedBody.qry_tp,
		});

		// 키움 API 호출 (서버 사이드에서만 실행)
		const response = await kiwoomClient.request<StockRankingResponse>("/api/dostk/stkinfo", {
			method: "POST",
			headers: {
				"api-id": "ka00198",
			},
			body: JSON.stringify(validatedBody),
		});

		const duration = Date.now() - startTime;
		logger.info("StockRankingAPI", "Stock ranking fetched successfully", {
			qry_tp: validatedBody.qry_tp,
			duration: `${duration}ms`,
		});

		return NextResponse.json(response);
	} catch (error) {
		const duration = Date.now() - startTime;

		// Zod 검증 에러
		if (error instanceof z.ZodError) {
			logger.warn("StockRankingAPI", "Invalid request body", {
				errors: error.issues,
				duration: `${duration}ms`,
			});
			return NextResponse.json(
				{
					error: "Invalid request",
					details: error.issues,
				},
				{ status: 400 }
			);
		}

		// 기타 에러
		logger.error("StockRankingAPI", "Failed to fetch stock ranking", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			duration: `${duration}ms`,
		});

		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to fetch stock ranking",
			},
			{ status: 500 }
		);
	}
}
