// fs: Node.js의 파일 시스템 모듈입니다. 파일의 존재 여부나 내용을 확인하는 데 사용됩니다.
import fs from "node:fs";
// path: 파일 경호를 조작하기 위한 유틸리티 모듈입니다.
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Biome 설정 검증", () => {
	// process.cwd(): 현재 작업 디렉토리(프로젝트 루트)를 가져옵니다.
	const biomePath = path.resolve(process.cwd(), "biome.json");

	it("프로젝트 루트에 biome.json 파일이 존재해야 한다", () => {
		expect(fs.existsSync(biomePath)).toBe(true);
	});

	it("linter와 formatter가 활성화되어 있어야 한다", () => {
		const biomeConfig = JSON.parse(fs.readFileSync(biomePath, "utf-8"));
		expect(biomeConfig.linter.enabled).toBe(true);
		expect(biomeConfig.formatter.enabled).toBe(true);
	});

	it("noExplicitAny 등 필수 린트 규칙이 에러로 설정되어 있어야 한다", () => {
		const biomeConfig = JSON.parse(fs.readFileSync(biomePath, "utf-8"));
		// any 타입 사용 금지 규칙 확인
		expect(biomeConfig.linter.rules.suspicious.noExplicitAny).toBe("error");
		// 사용하지 않는 변수 금지 규칙 확인
		expect(biomeConfig.linter.rules.correctness.noUnusedVariables).toBe("error");
	});

	it("탭(Tab) 들여쓰기를 사용하도록 설정되어 있어야 한다", () => {
		const biomeConfig = JSON.parse(fs.readFileSync(biomePath, "utf-8"));
		expect(biomeConfig.formatter.indentStyle).toBe("tab");
	});
});
