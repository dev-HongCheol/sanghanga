/**
 * @fileoverview 키움 API 인증 및 토큰 관리 단위 테스트
 * @description 토큰 발급, 캐싱, 상태 확인 로직을 검증합니다.
 */

import { clearTokenCache, getAccessToken, getTokenStatus } from "@/shared/lib/kiwoom/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock: 환경변수 검증 모듈을 모킹하여 테스트용 값을 반환하게 합니다.
vi.mock("@/shared/lib/kiwoom/env.schema", () => ({
	validateKiwoomEnv: vi.fn(() => ({
		KIWOOM_APP_KEY: "test_key",
		KIWOOM_APP_SECRET: "test_secret",
		KIWOOM_API_BASE_URL: "https://test.api.com",
	})),
}));

describe("auth (토큰 관리)", () => {
	// 각 테스트 전 캐시를 초기화하고 모든 mock을 초기 상태로 되돌립니다.
	beforeEach(() => {
		clearTokenCache();
		vi.clearAllMocks();

		// global.fetch: 전역 fetch 함수를 가짜 함수로 대체합니다.
		global.fetch = vi.fn();
	});

	it("최초 호출 시 API를 통해 토큰을 발급받는다", async () => {
		// Arrange: fetch 응답 모킹 (TokenResponse 타입에 맞게)
		// 미래 시간으로 설정 (1시간 후)
		const futureDate = new Date(Date.now() + 3600 * 1000);
		const expires_dt =
			futureDate.getFullYear().toString() +
			(futureDate.getMonth() + 1).toString().padStart(2, '0') +
			futureDate.getDate().toString().padStart(2, '0') +
			futureDate.getHours().toString().padStart(2, '0') +
			futureDate.getMinutes().toString().padStart(2, '0') +
			futureDate.getSeconds().toString().padStart(2, '0');

		const mockResponse = {
			token: "mock_access_token",
			token_type: "Bearer",
			expires_dt, // YYYYMMDDHHMMSS 형식
			return_code: 0,
			return_msg: "Success",
		};
		(global.fetch as any).mockResolvedValue({
			ok: true,
			headers: {
				get: (name: string) => (name === "content-type" ? "application/json" : null),
			},
			json: () => Promise.resolve(mockResponse),
		});

		// Act
		const token = await getAccessToken();

		// Assert
		expect(token).toBe("mock_access_token");
		expect(global.fetch).toHaveBeenCalledTimes(1);
		expect(global.fetch).toHaveBeenCalledWith(
			"https://test.api.com/oauth2/token",
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
			}),
		);
	});

	it("두 번째 호출 시 캐시된 토큰을 반환하며 API를 호출하지 않는다", async () => {
		// Arrange
		const futureDate = new Date(Date.now() + 3600 * 1000);
		const expires_dt =
			futureDate.getFullYear().toString() +
			(futureDate.getMonth() + 1).toString().padStart(2, '0') +
			futureDate.getDate().toString().padStart(2, '0') +
			futureDate.getHours().toString().padStart(2, '0') +
			futureDate.getMinutes().toString().padStart(2, '0') +
			futureDate.getSeconds().toString().padStart(2, '0');

		const mockResponse = {
			token: "cached_token",
			token_type: "Bearer",
			expires_dt,
			return_code: 0,
			return_msg: "Success",
		};
		(global.fetch as any).mockResolvedValue({
			ok: true,
			headers: {
				get: (name: string) => (name === "content-type" ? "application/json" : null),
			},
			json: () => Promise.resolve(mockResponse),
		});

		// Act
		await getAccessToken(); // 첫 번째 호출
		const token = await getAccessToken(); // 두 번째 호출 (캐시 사용)

		// Assert
		expect(token).toBe("cached_token");
		expect(global.fetch).toHaveBeenCalledTimes(1); // API는 한 번만 호출됨
	});

	it("forceRefresh=true일 경우 캐시를 무시하고 강제로 재발급받는다", async () => {
		// Arrange
		const futureDate = new Date(Date.now() + 3600 * 1000);
		const expires_dt =
			futureDate.getFullYear().toString() +
			(futureDate.getMonth() + 1).toString().padStart(2, '0') +
			futureDate.getDate().toString().padStart(2, '0') +
			futureDate.getHours().toString().padStart(2, '0') +
			futureDate.getMinutes().toString().padStart(2, '0') +
			futureDate.getSeconds().toString().padStart(2, '0');

		(global.fetch as any).mockResolvedValue({
			ok: true,
			headers: {
				get: (name: string) => (name === "content-type" ? "application/json" : null),
			},
			json: () =>
				Promise.resolve({
					token: "new_token",
					token_type: "Bearer",
					expires_dt,
					return_code: 0,
					return_msg: "Success",
				}),
		});

		// Act
		await getAccessToken(); // 첫 번째 호출
		const token = await getAccessToken(true); // 강제 재발급

		// Assert
		expect(token).toBe("new_token");
		expect(global.fetch).toHaveBeenCalledTimes(2); // API가 두 번 호출됨
	});

	it("API 응답이 실패(ok=false)할 경우 에러를 발생시킨다", async () => {
		// Arrange
		(global.fetch as any).mockResolvedValue({
			ok: false,
			statusText: "Unauthorized",
			headers: {
				get: (name: string) => (name === "content-type" ? "application/json" : null),
			},
			json: () => Promise.resolve({ code: "AUTH_FAILED", message: "Invalid credentials" }),
		});

		// Act & Assert
		await expect(getAccessToken()).rejects.toThrow("Failed to get access token");
	});

	it("getTokenStatus는 현재 토큰의 유효 상태를 반환한다", async () => {
		// Arrange: 토큰 없음
		expect(getTokenStatus().isValid).toBe(false);

		// 토큰 발급
		const futureDate = new Date(Date.now() + 3600 * 1000);
		const expires_dt =
			futureDate.getFullYear().toString() +
			(futureDate.getMonth() + 1).toString().padStart(2, '0') +
			futureDate.getDate().toString().padStart(2, '0') +
			futureDate.getHours().toString().padStart(2, '0') +
			futureDate.getMinutes().toString().padStart(2, '0') +
			futureDate.getSeconds().toString().padStart(2, '0');

		(global.fetch as any).mockResolvedValue({
			ok: true,
			headers: {
				get: (name: string) => (name === "content-type" ? "application/json" : null),
			},
			json: () =>
				Promise.resolve({
					token: "test_token",
					token_type: "Bearer",
					expires_dt,
					return_code: 0,
					return_msg: "Success",
				}),
		});
		await getAccessToken();

		// Act
		const status = getTokenStatus();

		// Assert
		expect(status.isValid).toBe(true);
		expect(status.expiresAt).toBeDefined();
	});

	it("clearTokenCache는 캐시된 토큰을 삭제한다", async () => {
		// Arrange
		const futureDate = new Date(Date.now() + 3600 * 1000);
		const expires_dt =
			futureDate.getFullYear().toString() +
			(futureDate.getMonth() + 1).toString().padStart(2, '0') +
			futureDate.getDate().toString().padStart(2, '0') +
			futureDate.getHours().toString().padStart(2, '0') +
			futureDate.getMinutes().toString().padStart(2, '0') +
			futureDate.getSeconds().toString().padStart(2, '0');

		(global.fetch as any).mockResolvedValue({
			ok: true,
			headers: {
				get: (name: string) => (name === "content-type" ? "application/json" : null),
			},
			json: () =>
				Promise.resolve({
					token: "test_token",
					token_type: "Bearer",
					expires_dt,
					return_code: 0,
					return_msg: "Success",
				}),
		});
		await getAccessToken();
		expect(getTokenStatus().isValid).toBe(true);

		// Act
		clearTokenCache();

		// Assert
		expect(getTokenStatus().isValid).toBe(false);
	});
});
