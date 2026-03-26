/**
 * @fileoverview 토큰 재발급 API 통합 테스트
 * @description Route Handler가 라이브러리와 연동되어 토큰을 강제로 갱신하는지 검증합니다.
 */

import { POST } from "app/api/kiwoom/auth/refresh/route";
import { describe, expect, it, vi } from "vitest";

// vi.mock: getAccessToken을 모킹하여 실제 API 호출을 방지합니다.
vi.mock("@/shared/lib/kiwoom", () => ({
	getAccessToken: vi.fn(),
}));

describe("POST /api/kiwoom/auth/refresh", () => {
	it("토큰 재발급 성공 시 성공 메시지를 반환한다", async () => {
		// Arrange: getAccessToken이 성공하도록 설정
		const { getAccessToken } = await import("@/shared/lib/kiwoom");
		vi.mocked(getAccessToken).mockResolvedValue("new_token");

		// Act: POST 핸들러 직접 호출
		const response = await POST();
		const data = await response.json();

		// Assert
		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.message).toBe("Token refreshed successfully");

		// forceRefresh=true로 호출되었는지 검증
		expect(getAccessToken).toHaveBeenCalledWith(true);
	});

	it("재발급 실패 시 500 상태 코드와 에러 메시지를 반환한다", async () => {
		// Arrange: getAccessToken이 에러를 던지도록 설정
		const { getAccessToken } = await import("@/shared/lib/kiwoom");
		vi.mocked(getAccessToken).mockRejectedValue(new Error("Network failure"));

		// Act
		const response = await POST();
		const data = await response.json();

		// Assert
		expect(response.status).toBe(500);
		expect(data.success).toBe(false);
		expect(data.error).toBe("Network failure");
	});
});
