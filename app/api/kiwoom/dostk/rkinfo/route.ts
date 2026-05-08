/**
 * @fileoverview 순위 정보 API Route
 * @description 키움 순위 정보 API를 프록시 (ka10031, ka10030, ka10027)
 */

import { kiwoomClient } from "@/shared/lib/kiwoom/client";
import { logger } from "@/shared/lib/logger";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * ka10031 - 전일거래량상위요청 스키마
 */
const ka10031Schema = z.object({
	mrkt_tp: z.enum(["000", "001", "101"]),
	qry_tp: z.enum(["1", "2"]),
	rank_strt: z.string(),
	rank_end: z.string(),
	stex_tp: z.enum(["1", "2", "3"]),
});

/**
 * ka10030 - 당일거래량상위요청 스키마
 */
const ka10030Schema = z.object({
	mrkt_tp: z.enum(["000", "001", "101"]),
	sort_tp: z.enum(["1", "2", "3"]),
	mang_stk_incls: z.string(),
	crd_tp: z.string(),
	trde_qty_tp: z.string(),
	pric_tp: z.string(),
	trde_prica_tp: z.string(),
	mrkt_open_tp: z.string(),
	stex_tp: z.enum(["1", "2", "3"]),
});

/**
 * ka10027 - 전일대비등락률상위요청 스키마
 */
const ka10027Schema = z.object({
	mrkt_tp: z.enum(["000", "001", "101"]),
	sort_tp: z.enum(["1", "2", "3", "4", "5"]),
	trde_qty_cnd: z.string(),
	stk_cnd: z.string(),
	crd_cnd: z.string(),
	updown_incls: z.string(),
	pric_cnd: z.string(),
	trde_prica_cnd: z.string(),
	stex_tp: z.enum(["1", "2", "3"]),
});

/**
 * POST /api/kiwoom/dostk/rkinfo
 * 순위 정보 조회 (api-id에 따라 다른 API 호출)
 * @param request - Next.js Request
 * @returns 순위 정보 데이터
 */
export async function POST(request: NextRequest) {
	const startTime = Date.now();

	try {
		const body = await request.json();
		const apiId = request.headers.get("api-id");

		if (!apiId) {
			return NextResponse.json({ error: "api-id header is required" }, { status: 400 });
		}

		// api-id에 따라 다른 스키마로 검증
		let validatedBody;
		if (apiId === "ka10031") {
			validatedBody = ka10031Schema.parse(body);
		} else if (apiId === "ka10030") {
			validatedBody = ka10030Schema.parse(body);
		} else if (apiId === "ka10027") {
			validatedBody = ka10027Schema.parse(body);
		} else {
			return NextResponse.json({ error: `Unsupported api-id: ${apiId}` }, { status: 400 });
		}

		logger.info("RankingInfoAPI", `Fetching ranking info (${apiId})`, {
			apiId,
			body: validatedBody,
		});

		// 키움 API 호출
		const response = await kiwoomClient.request("/api/dostk/rkinfo", {
			method: "POST",
			headers: {
				"api-id": apiId,
			},
			body: JSON.stringify(validatedBody),
		});

		const duration = Date.now() - startTime;
		logger.info("RankingInfoAPI", `Ranking info fetched successfully (${apiId})`, {
			duration: `${duration}ms`,
		});

		return NextResponse.json(response);
	} catch (error) {
		const duration = Date.now() - startTime;

		// Zod 검증 에러
		if (error instanceof z.ZodError) {
			logger.warn("RankingInfoAPI", "Invalid request body", {
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
		logger.error("RankingInfoAPI", "Failed to fetch ranking info", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			duration: `${duration}ms`,
		});

		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to fetch ranking info",
			},
			{ status: 500 }
		);
	}
}
