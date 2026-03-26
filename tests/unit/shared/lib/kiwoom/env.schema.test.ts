/**
 * @fileoverview 키움 API 환경변수 검증 단위 테스트
 * @description Zod 스키마를 통한 환경변수 유효성 검사 로직을 검증합니다.
 */

import { validateKiwoomEnv } from "@/shared/lib/kiwoom/env.schema";
import { beforeEach, describe, expect, it } from "vitest";

describe("validateKiwoomEnv", () => {
	// 각 테스트 실행 전 환경변수를 초기화하여 테스트 간 간섭을 방지합니다.
	beforeEach(() => {
		delete process.env.KIWOOM_APP_KEY;
		delete process.env.KIWOOM_APP_SECRET;
		delete process.env.KIWOOM_API_BASE_URL;
	});

	it("KIWOOM_APP_KEY가 누락되면 에러가 발생한다", () => {
		// Arrange: APP_SECRET만 설정
		process.env.KIWOOM_APP_SECRET = "test_secret";

		// Act & Assert: 에러 메시지에 필드명이 포함되어 있는지 확인
		expect(() => validateKiwoomEnv()).toThrow(/KIWOOM_APP_KEY/);
	});

	it("KIWOOM_APP_SECRET이 누락되면 에러가 발생한다", () => {
		// Arrange: APP_KEY만 설정
		process.env.KIWOOM_APP_KEY = "test_key";

		// Act & Assert
		expect(() => validateKiwoomEnv()).toThrow(/KIWOOM_APP_SECRET/);
	});

	it("KIWOOM_API_BASE_URL이 누락되면 기본값이 사용된다", () => {
		// Arrange: 필수 값만 설정
		process.env.KIWOOM_APP_KEY = "test_key";
		process.env.KIWOOM_APP_SECRET = "test_secret";

		// Act
		const env = validateKiwoomEnv();

		// Assert: 기본값 확인 (env.schema.ts의 default 값과 일치)
		expect(env.KIWOOM_API_BASE_URL).toBe("https://api.kiwoom.com");
	});

	it("모든 환경변수가 올바르게 설정되면 정상적으로 파싱된다", () => {
		// Arrange
		process.env.KIWOOM_APP_KEY = "test_key";
		process.env.KIWOOM_APP_SECRET = "test_secret";
		process.env.KIWOOM_API_BASE_URL = "https://custom.api.com";

		// Act
		const env = validateKiwoomEnv();

		// Assert
		expect(env.KIWOOM_APP_KEY).toBe("test_key");
		expect(env.KIWOOM_APP_SECRET).toBe("test_secret");
		expect(env.KIWOOM_API_BASE_URL).toBe("https://custom.api.com");
	});

	it("KIWOOM_API_BASE_URL이 잘못된 형식의 URL이면 에러가 발생한다", () => {
		// Arrange
		process.env.KIWOOM_APP_KEY = "test_key";
		process.env.KIWOOM_APP_SECRET = "test_secret";
		process.env.KIWOOM_API_BASE_URL = "invalid-url";

		// Act & Assert: URL 형식이 아님을 검증
		expect(() => validateKiwoomEnv()).toThrow();
	});
});
