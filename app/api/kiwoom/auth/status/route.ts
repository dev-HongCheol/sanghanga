/**
 * @fileoverview 키움 API 토큰 상태 확인 엔드포인트
 * @description 현재 캐시된 토큰의 유효성을 확인하는 API
 */

import { getTokenStatus } from "@/shared/lib/kiwoom";
import { NextResponse } from "next/server";

/**
 * GET /api/kiwoom/auth/status
 * 토큰 상태 확인
 * @returns { isValid: boolean, expiresAt?: string }
 */
export async function GET() {
	try {
		const status = getTokenStatus();

		return NextResponse.json(status);
	} catch (error) {
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to check token status",
			},
			{ status: 500 }
		);
	}
}
