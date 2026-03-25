import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Tailwind CSS 설정 검증", () => {
	const tailwindPath = path.resolve(process.cwd(), "tailwind.config.ts");

	it("프로젝트 루트에 tailwind.config.ts 파일이 존재해야 한다", () => {
		expect(fs.existsSync(tailwindPath)).toBe(true);
	});

	it("FSD 아키텍처의 모든 레이어가 content 대상에 포함되어 있어야 한다", () => {
		const content = fs.readFileSync(tailwindPath, "utf-8");
		// 각 레이어의 파일들이 Tailwind 스캔 대상인지 문자열 포함 여부로 확인합니다.
		expect(content).toContain("./src/app/**/*.{js,ts,jsx,tsx,mdx}");
		expect(content).toContain("./src/widgets/**/*.{js,ts,jsx,tsx,mdx}");
		expect(content).toContain("./src/features/**/*.{js,ts,jsx,tsx,mdx}");
		expect(content).toContain("./src/entities/**/*.{js,ts,jsx,tsx,mdx}");
		expect(content).toContain("./src/shared/**/*.{js,ts,jsx,tsx,mdx}");
	});

	it("프로젝트 테마(Colors) 설정이 포함되어 있어야 한다", () => {
		const content = fs.readFileSync(tailwindPath, "utf-8");
		expect(content).toContain("background");
		expect(content).toContain("foreground");
	});
});
