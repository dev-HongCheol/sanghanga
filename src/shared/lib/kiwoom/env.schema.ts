/**
 * @fileoverview 키움 API 환경변수 검증 스키마
 * @description Zod를 사용한 환경변수 검증 및 타입 안전성 보장
 */

import { z } from "zod";

/**
 * 키움 API 환경변수 Zod 스키마
 */
export const kiwoomEnvSchema = z.object({
	/** 키움 App Key (필수) */
	KIWOOM_APP_KEY: z.string().min(1, "KIWOOM_APP_KEY is required"),
	/** 키움 App Secret (필수) */
	KIWOOM_APP_SECRET: z.string().min(1, "KIWOOM_APP_SECRET is required"),
	/** 키움 API Base URL (선택, 기본값: https://api.kiwoom.com) */
	KIWOOM_API_BASE_URL: z.url().default("https://api.kiwoom.com").optional(),
});

/**
 * 키움 API 환경변수 타입
 */
export type KiwoomEnv = z.infer<typeof kiwoomEnvSchema>;

/**
 * 환경변수 검증 및 파싱
 * @returns 검증된 환경변수 객체
 * @throws {ZodError} 환경변수가 유효하지 않을 경우
 */
export function validateKiwoomEnv(): KiwoomEnv {
	const env = {
		KIWOOM_APP_KEY: process.env.KIWOOM_APP_KEY,
		KIWOOM_APP_SECRET: process.env.KIWOOM_APP_SECRET,
		KIWOOM_API_BASE_URL: process.env.KIWOOM_API_BASE_URL,
	};

	return kiwoomEnvSchema.parse(env);
}
