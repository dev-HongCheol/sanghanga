import { describe, expect, it } from "vitest";
import { ROUTES, MAIN_ROUTE } from "@/shared/config/routes";

/**
 * @fileoverview 라우트 설정 객체 단위 테스트
 * @description 라우트 데이터의 정합성과 필수 속성을 검증합니다.
 *
 * [학습 포인트]
 * - 'as const'가 적용된 객체는 타입 추론이 엄격해지며, 런타임에 값이 변경되지 않음을 보장합니다.
 * - 재귀적인 구조(children)를 가진 객체를 테스트할 때는 모든 계층을 검사하는 것이 중요합니다.
 */

describe("라우트 설정 (shared/config/routes)", () => {
	describe("MAIN_ROUTE 객체", () => {
		it("label은 'Sanghanga'여야 한다", () => {
			expect(MAIN_ROUTE.label).toBe("Sanghanga");
		});

		it("href는 '/'여야 한다", () => {
			expect(MAIN_ROUTE.href).toBe("/");
		});
	});

	describe("ROUTES 배열", () => {
		it("ROUTES는 배열로 정의되어 있어야 한다", () => {
			expect(Array.isArray(ROUTES)).toBe(true);
		});

		it("모든 메뉴 아이템은 label과 href 속성을 필수적으로 가져야 한다", () => {
			const validateRoute = (route: any) => {
				expect(route).toHaveProperty("label");
				expect(route).toHaveProperty("href");
				expect(typeof route.label).toBe("string");
				expect(typeof route.href).toBe("string");

				if (route.children) {
					expect(Array.isArray(route.children)).toBe(true);
					route.children.forEach(validateRoute);
				}
			};

			ROUTES.forEach(validateRoute);
		});

		it("children이 있는 경우 각 자식 아이템도 Route 인터페이스를 준수해야 한다", () => {
			ROUTES.forEach((route) => {
				if (route.children) {
					route.children.forEach((child) => {
						expect(child.label).toBeDefined();
						expect(child.href).toBeDefined();
					});
				}
			});
		});
	});
});
