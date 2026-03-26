/**
 * @fileoverview 키움 API 클라이언트 단위 테스트
 * @description API 요청, 자동 재시도, 에러 핸들링, Rate Limiting을 검증합니다.
 */

import { KiwoomClient } from "@/shared/lib/kiwoom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock: 관련 모듈들을 모킹합니다.
vi.mock("@/shared/lib/kiwoom/auth", () => ({
	getAccessToken: vi.fn(() => Promise.resolve("test_token")),
}));

vi.mock("@/shared/lib/kiwoom/env.schema", () => ({
	validateKiwoomEnv: vi.fn(() => ({
		KIWOOM_API_BASE_URL: "https://test.api.com",
	})),
}));

vi.mock("@/shared/lib/logger", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

describe("KiwoomClient", () => {
	let client: KiwoomClient;

	beforeEach(() => {
		client = new KiwoomClient();
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	it("GET 요청 시 Authorization 헤더가 포함된다", async () => {
		// Arrange
		(global.fetch as any).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ data: "success" }),
		});

		// Act
		const result = await client.get("/v1/test");

		// Assert
		expect(result).toEqual({ data: "success" });
		expect(global.fetch).toHaveBeenCalledWith(
			"https://test.api.com/v1/test",
			expect.objectContaining({
				method: "GET",
				headers: expect.objectContaining({
					Authorization: "Bearer test_token",
				}),
			}),
		);
	});

	it("POST 요청 시 Body가 JSON으로 변환되어 전송된다", async () => {
		// Arrange
		(global.fetch as any).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ success: true }),
		});
		const body = { key: "value" };

		// Act
		await client.post("/v1/test", body);

		// Assert
		expect(global.fetch).toHaveBeenCalledWith(
			"https://test.api.com/v1/test",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify(body),
			}),
		);
	});

	it("401 에러 발생 시 토큰을 재발급받고 1회 재시도한다", async () => {
		// Arrange: 첫 번째 호출은 401, 두 번째 호출은 200 응답 모킹
		const { getAccessToken } = await import("@/shared/lib/kiwoom/auth");
		(global.fetch as any)
			.mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: () => Promise.resolve({ message: "Token expired" }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ data: "retry success" }),
			});

		// Act
		const result = await client.get("/v1/test");

		// Assert
		expect(result).toEqual({ data: "retry success" });
		expect(getAccessToken).toHaveBeenCalledWith(true); // 강제 재발급 호출 확인
		expect(global.fetch).toHaveBeenCalledTimes(2); // 두 번 호출됨
	});

	it("403 에러 발생 시 IP 미등록 안내 에러를 던진다", async () => {
		// Arrange
		(global.fetch as any).mockResolvedValue({
			ok: false,
			status: 403,
			headers: {
				get: (name: string) => (name === "content-type" ? "application/json" : null),
			},
			json: () => Promise.resolve({}),
		});

		// Act & Assert
		await expect(client.get("/v1/test")).rejects.toThrow("IP not whitelisted");
	});

	it("429 에러 발생 시 Rate limit 초과 에러를 던진다", async () => {
		// Arrange
		(global.fetch as any).mockResolvedValue({
			ok: false,
			status: 429,
			headers: {
				get: (name: string) => (name === "content-type" ? "application/json" : null),
			},
			json: () => Promise.resolve({}),
		});

		// Act & Assert
		await expect(client.get("/v1/test")).rejects.toThrow("Rate limit exceeded");
	});

	it("500 에러 발생 시 서버 오류 에러를 던진다", async () => {
		// Arrange
		(global.fetch as any).mockResolvedValue({
			ok: false,
			status: 500,
			headers: {
				get: (name: string) => (name === "content-type" ? "application/json" : null),
			},
			json: () => Promise.resolve({}),
		});

		// Act & Assert
		await expect(client.get("/v1/test")).rejects.toThrow("Kiwoom server error");
	});

	it("동시 요청 시 p-limit에 의해 처리된다", async () => {
		// Arrange: 5개의 요청 동시 실행
		(global.fetch as any).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({}),
		});

		// Act
		const requests = Array.from({ length: 5 }, () => client.get("/v1/test"));
		await Promise.all(requests);

		// Assert: 모든 요청이 성공적으로 완료됨
		expect(global.fetch).toHaveBeenCalledTimes(5);
	});
});
