import { describe, expect, it } from "vitest";
import type {
	ApiResponse,
	PaginatedResponse,
	PaginationMeta,
} from "@/shared/types/common.types";

describe("공통 타입 정의", () => {
	it("ApiResponse 타입이 성공과 실패 시나리오를 모두 지원한다", () => {
		const successResponse: ApiResponse<string> = {
			success: true,
			data: "test data",
		};
		const errorResponse: ApiResponse = {
			success: false,
			error: "error message",
		};
		expect(successResponse.success).toBe(true);
		expect(errorResponse.success).toBe(false);
	});

	it("PaginationMeta 타입이 페이지네이션 정보를 올바르게 정의한다", () => {
		const meta: PaginationMeta = {
			currentPage: 1,
			totalPages: 10,
			totalItems: 100,
			itemsPerPage: 10,
		};
		expect(meta.currentPage).toBe(1);
	});

	it("PaginatedResponse 타입이 ApiResponse와 PaginationMeta를 결합한다", () => {
		const response: PaginatedResponse<{ id: number }> = {
			success: true,
			data: [{ id: 1 }],
			meta: {
				currentPage: 1,
				totalPages: 5,
				totalItems: 50,
				itemsPerPage: 10,
			},
		};
		expect(response.data?.length).toBe(1);
		expect(response.meta.totalItems).toBe(50);
	});
});
