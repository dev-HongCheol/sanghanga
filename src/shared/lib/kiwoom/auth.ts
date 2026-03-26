/**
 * @fileoverview 키움 API 인증 및 토큰 관리
 * @description OAuth 2.0 토큰 발급, 캐싱, 자동 갱신 로직
 */

import { logger } from "@/shared/lib/logger";
import { parse } from "date-fns";
import { validateKiwoomEnv } from "./env.schema";
import type { CachedToken, KiwoomError, TokenRequest, TokenResponse } from "./types";

/**
 * 메모리 캐시 (서버 재시작 시 초기화)
 * 향후 Redis로 전환 가능
 */
let cachedToken: CachedToken | null = null;

/**
 * 키움 API 날짜 형식을 Date 객체로 파싱
 * @param dateString - YYYYMMDDHHMMSS 형식 문자열 (예: "20260326154407")
 * @returns Date 객체
 */
function parseKiwoomDate(dateString: string): Date {
	return parse(dateString, "yyyyMMddHHmmss", new Date());
}

/**
 * Access Token 발급
 * @param forceRefresh - 캐시 무시하고 강제 재발급 여부 (기본값: false)
 * @returns Access Token 문자열
 * @throws {Error} 토큰 발급 실패 시
 */
export async function getAccessToken(forceRefresh = false): Promise<string> {
	// 1. 캐시된 토큰이 유효한지 확인
	if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
		return cachedToken.token;
	}

	// 2. 토큰 재발급
	const newToken = await refreshToken();
	return newToken;
}

/**
 * Access Token 재발급
 * @returns 새로 발급된 Access Token
 * @throws {Error} 토큰 발급 실패 시
 */
export async function refreshToken(): Promise<string> {
	const env = validateKiwoomEnv();

	const requestBody: TokenRequest = {
		grant_type: "client_credentials",
		appkey: env.KIWOOM_APP_KEY,
		secretkey: env.KIWOOM_APP_SECRET,
	};

	const baseUrl = env.KIWOOM_API_BASE_URL ?? "https://api.kiwoom.com";
	const tokenUrl = `${baseUrl}/oauth2/token`;

	logger.info("KiwoomAuth", "Requesting access token", {
		url: tokenUrl,
		grant_type: requestBody.grant_type,
	});

	try {
		const response = await fetch(tokenUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const contentType = response.headers.get("content-type");

			// JSON이 아닌 응답 (HTML 에러 페이지 등)
			if (!contentType?.includes("application/json")) {
				const text = await response.text();
				logger.error("KiwoomAuth", "Non-JSON response received from token endpoint", {
					status: response.status,
					statusText: response.statusText,
					contentType: contentType || "unknown",
					url: tokenUrl,
					bodyPreview: text.substring(0, 500),
				});
				throw new Error(
					`Token refresh failed: Expected JSON but received ${contentType || "unknown content type"} (status: ${response.status})`
				);
			}

			// JSON 응답인 경우
			const error: KiwoomError = await response.json();
			logger.error("KiwoomAuth", "Token refresh API error", {
				status: response.status,
				errorMessage: error.message,
				errorCode: error.code,
			});
			throw new Error(`Failed to get access token: ${error.message || response.statusText}`);
		}

		const data: TokenResponse = await response.json();

		// 토큰 만료 시간 파싱 (YYYYMMDDHHMMSS → Unix timestamp)
		const expiresDate = parseKiwoomDate(data.expires_dt);
		const bufferTime = 5 * 60 * 1000; // 5분 (밀리초)

		cachedToken = {
			token: data.token,
			expiresAt: expiresDate.getTime() - bufferTime,
		};

		logger.info("KiwoomAuth", "Token refreshed successfully", {
			expiresAt: expiresDate.toISOString(),
			returnMsg: data.return_msg,
			tokenPreview: `${data.token.substring(0, 20)}...`,
		});

		return data.token;
	} catch (error) {
		// 네트워크 에러 등
		if (error instanceof Error) {
			logger.error("KiwoomAuth", "Token refresh failed", {
				message: error.message,
				stack: error.stack,
			});
			throw new Error(`Token refresh failed: ${error.message}`);
		}
		logger.error("KiwoomAuth", "Unknown error during token refresh", { error });
		throw new Error("Unknown error occurred while refreshing token");
	}
}

/**
 * 현재 캐시된 토큰의 유효성 확인
 * @returns 토큰이 유효하면 { isValid: true, expiresAt: string }, 아니면 { isValid: false }
 */
export function getTokenStatus(): {
	isValid: boolean;
	expiresAt?: string;
} {
	if (cachedToken && cachedToken.expiresAt > Date.now()) {
		return {
			isValid: true,
			expiresAt: new Date(cachedToken.expiresAt).toISOString(),
		};
	}

	return { isValid: false };
}

/**
 * 캐시된 토큰 삭제 (테스트용)
 */
export function clearTokenCache(): void {
	cachedToken = null;
}
