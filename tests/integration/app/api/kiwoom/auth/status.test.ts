/**
 * @fileoverview 토큰 상태 확인 API 통합 테스트
 * @description Route Handler가 라이브러리와 올바르게 연동되어 토큰 상태를 반환하는지 검증합니다.
 */

import { GET } from "app/api/kiwoom/auth/status/route";
import { describe, expect, it, vi } from "vitest";

// vi.mock: shared 라이브러리의 함수를 모킹하여 API 엔드포인트의 독립적인 동작을 테스트합니다.
vi.mock("@/shared/lib/kiwoom", () => ({
	getTokenStatus: vi.fn(),
}));

describe("GET /api/kiwoom/auth/status", () => {
	it("토큰이 유효하지 않으면 isValid: false를 반환한다", async () => {
		// Arrange: getTokenStatus가 거짓을 반환하도록 설정
		const { getTokenStatus } = await import("@/shared/lib/kiwoom");
		vi.mocked(getTokenStatus).mockReturnValue({ isValid: false });

		// Act: Route Handler의 GET 함수 직접 호출
		const response = await GET();
		const data = await response.json();

		// Assert
		expect(response.status).toBe(200);
		expect(data).toEqual({ isValid: false });
	});

	it("토큰이 유효하면 isValid: true와 만료 시간을 반환한다", async () => {
		// Arrange
		const { getTokenStatus } = await import("@/shared/lib/kiwoom");
		const mockStatus = {
			isValid: true,
			expiresAt: new Date().toISOString(),
		};
		vi.mocked(getTokenStatus).mockReturnValue(mockStatus);

		// Act
		const response = await GET();
		const data = await response.json();

		// Assert
		expect(response.status).toBe(200);
		expect(data).toEqual(mockStatus);
	});

	it("내부 로직에서 에러 발생 시 500 상태 코드를 반환한다", async () => {
		// Arrange
		const { getTokenStatus } = await import("@/shared/lib/kiwoom");
		vi.mocked(getTokenStatus).mockImplementation(() => {
			throw new Error("Internal failure");
		});

		// Act
		const response = await GET();
		const data = await response.json();

		// Assert
		expect(response.status).toBe(500);
		expect(data.error).toBe("Internal failure");
	});
});
