import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("TypeScript 설정 검증", () => {
	const tsconfigPath = path.resolve(process.cwd(), "tsconfig.json");

	it("프로젝트 루트에 tsconfig.json 파일이 존재해야 한다", () => {
		expect(fs.existsSync(tsconfigPath)).toBe(true);
	});

	it("엄격한 타입 체크(strict mode)가 활성화되어 있어야 한다", () => {
		const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
		expect(tsconfig.compilerOptions.strict).toBe(true);
	});

	it("경로 별칭(@/*)이 올바르게 설정되어 있어야 한다", () => {
		const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
		// @/* 경로가 ./src/*로 매핑되어 있는지 확인합니다.
		expect(tsconfig.compilerOptions.paths["@/*"]).toEqual(["./src/*"]);
	});

	it("Next.js 프레임워크에 맞는 JSX와 모듈 설정이 되어 있어야 한다", () => {
		const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
		expect(tsconfig.compilerOptions.jsx).toBe("preserve");
		expect(tsconfig.compilerOptions.module).toBe("esnext");
	});
});
