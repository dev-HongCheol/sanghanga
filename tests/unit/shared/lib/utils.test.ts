import { describe, expect, it } from "vitest";
// @/를 사용하여 src 경로를 참조합니다. (vitest.config.ts의 alias 설정 활용)
import { cn } from "@/shared/lib/utils";

describe("cn() 유틸리티 함수", () => {
	it("여러 클래스 문자열을 공백으로 구분하여 병합한다", () => {
		expect(cn("class1", "class2", "class3")).toBe("class1 class2 class3");
	});

	it("false, null, undefined 등 falsy 값을 무시하고 truthy 값만 포함한다", () => {
		expect(cn("class1", false, "class2", null, "class3", undefined)).toBe(
			"class1 class2 class3",
		);
	});

	it("중복된 클래스가 있을 경우 중복을 제거한다", () => {
		expect(cn("p-4", "p-4", "m-2")).toBe("p-4 m-2");
	});

	it("충돌하는 Tailwind 클래스는 마지막에 오는 것을 우선 적용한다", () => {
		expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
		expect(cn("text-sm", "text-lg")).toBe("text-lg");
	});

	it("배열 형태의 입력을 받아도 정상적으로 처리한다", () => {
		expect(cn(["class1", "class2"], "class3")).toBe("class1 class2 class3");
	});

	it("객체 형태로 조건부 클래스를 전달받아 처리한다", () => {
		expect(cn({ "class1": true, "class2": false, "class3": true })).toBe(
			"class1 class3",
		);
	});

	it("입력이 비어 있거나 유효하지 않으면 빈 문자열을 반환한다", () => {
		expect(cn()).toBe("");
		expect(cn("", null, undefined)).toBe("");
	});
});
