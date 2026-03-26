/**
 * @fileoverview 키움 API 토큰 재발급 엔드포인트
 * @description 강제로 새 토큰을 발급받는 API (선택사항)
 */

import { getAccessToken } from "@/shared/lib/kiwoom";
import { NextResponse } from "next/server";

/**
 * POST /api/kiwoom/auth/refresh
 * 토큰 강제 재발급
 * @returns { success: boolean, expiresAt: string }
 */
export async function POST() {
	try {
		// 강제 재발급 (forceRefresh = true)
		await getAccessToken(true);

		return NextResponse.json({
			success: true,
			message: "Token refreshed successfully",
		});
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Failed to refresh token",
			},
			{ status: 500 }
		);
	}
}
