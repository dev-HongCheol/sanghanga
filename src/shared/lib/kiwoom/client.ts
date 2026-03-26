/**
 * @fileoverview 키움 API 클라이언트
 * @description Rate Limiting, 자동 토큰 재발급, 에러 핸들링을 지원하는 키움 API 클라이언트
 */

import { logger } from "@/shared/lib/logger";
import pLimit from "p-limit";
import { getAccessToken } from "./auth";
import { validateKiwoomEnv } from "./env.schema";
import type { KiwoomError } from "./types";

/**
 * Rate Limiter: 1초당 최대 20회 요청
 * 키움 API는 1초당 20회 제한이 있음
 */
const limit = pLimit(20);

/**
 * 키움 API 클라이언트 클래스
 */
export class KiwoomClient {
	private _baseUrl: string | null = null;

	/**
	 * Base URL getter (lazy evaluation)
	 */
	private get baseUrl(): string {
		if (!this._baseUrl) {
			const env = validateKiwoomEnv();
			this._baseUrl = env.KIWOOM_API_BASE_URL ?? "https://api.kiwoom.com";
		}
		return this._baseUrl;
	}

	/**
	 * 키움 API 요청
	 * @param endpoint - API 엔드포인트 (예: '/v1/account')
	 * @param options - fetch 옵션
	 * @param autoRetry - 401 에러 시 자동 재시도 여부 (기본값: true)
	 * @returns API 응답 데이터
	 * @throws {Error} API 요청 실패 시
	 */
	async request<T>(endpoint: string, options?: RequestInit, autoRetry = true): Promise<T> {
		return limit(async () => {
			const token = await getAccessToken();

			const response = await fetch(`${this.baseUrl}${endpoint}`, {
				...options,
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
					...options?.headers,
				},
			});

			// 401 에러: 토큰 만료 → 재발급 후 1회 재시도
			if (response.status === 401 && autoRetry) {
				const newToken = await getAccessToken(true); // 강제 재발급

				const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
					...options,
					headers: {
						Authorization: `Bearer ${newToken}`,
						"Content-Type": "application/json",
						...options?.headers,
					},
				});

				return this.handleResponse<T>(retryResponse);
			}

			return this.handleResponse<T>(response);
		});
	}

	/**
	 * 응답 처리 및 에러 핸들링
	 * @param response - fetch 응답 객체
	 * @returns 파싱된 JSON 데이터
	 * @throws {Error} 응답이 성공(2xx)이 아닐 경우
	 */
	private async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			const contentType = response.headers.get("content-type");

			// JSON이 아닌 응답 (HTML 에러 페이지 등)
			if (!contentType?.includes("application/json")) {
				const text = await response.text();
				logger.error("KiwoomClient", "Non-JSON response from API", {
					status: response.status,
					statusText: response.statusText,
					contentType: contentType || "unknown",
					url: response.url,
					bodyPreview: text.substring(0, 500),
				});
				throw new Error(
					`API request failed: Expected JSON but received ${contentType || "unknown content type"} (status: ${response.status})`
				);
			}

			// JSON 응답 파싱
			const errorData: KiwoomError | unknown = await response.json().catch((parseError) => {
				logger.error("KiwoomClient", "Failed to parse error response JSON", {
					status: response.status,
					parseError: parseError instanceof Error ? parseError.message : String(parseError),
				});
				return null;
			});

			// 403: IP 미등록
			if (response.status === 403) {
				logger.warn("KiwoomClient", "IP not whitelisted", {
					status: response.status,
				});
				throw new Error(
					"IP not whitelisted. Please register your server IP at https://apiportal.kiwoom.com/"
				);
			}

			// 429: Rate Limit 초과
			if (response.status === 429) {
				logger.warn("KiwoomClient", "Rate limit exceeded", {
					status: response.status,
				});
				throw new Error("Rate limit exceeded (20 requests per second). Please try again later.");
			}

			// 500: 서버 오류
			if (response.status === 500) {
				logger.error("KiwoomClient", "Kiwoom server error", {
					status: response.status,
					errorData,
				});
				throw new Error("Kiwoom server error. Please try again later.");
			}

			// 기타 에러
			if (errorData && typeof errorData === "object" && "message" in errorData) {
				const kiwoomError = errorData as KiwoomError;
				logger.error("KiwoomClient", "Kiwoom API error", {
					status: response.status,
					message: kiwoomError.message,
					code: kiwoomError.code,
				});
				throw new Error(`API Error: ${kiwoomError.message}`);
			}

			logger.error("KiwoomClient", "Unknown API error", {
				status: response.status,
				statusText: response.statusText,
			});
			throw new Error(`API request failed: ${response.statusText}`);
		}

		// 응답 파싱
		const data = await response.json();

		// return_code 체크 (키움 API 공통 응답 구조)
		// HTTP 200 OK여도 return_code가 0이 아니면 비즈니스 로직 에러
		if (data && typeof data === "object" && "return_code" in data) {
			const returnCode = data.return_code as number;
			if (returnCode !== 0) {
				const returnMsg = (data as { return_msg?: string }).return_msg || "Unknown error";
				logger.error("KiwoomClient", "Kiwoom API business logic error", {
					return_code: returnCode,
					return_msg: returnMsg,
				});
				throw new Error(`Kiwoom API Error (${returnCode}): ${returnMsg}`);
			}
		}

		return data;
	}

	/**
	 * GET 요청
	 * @param endpoint - API 엔드포인트
	 * @returns API 응답 데이터
	 */
	async get<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, { method: "GET" });
	}

	/**
	 * POST 요청
	 * @param endpoint - API 엔드포인트
	 * @param body - 요청 바디
	 * @returns API 응답 데이터
	 */
	async post<T>(endpoint: string, body?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: "POST",
			body: body ? JSON.stringify(body) : undefined,
		});
	}

	/**
	 * PUT 요청
	 * @param endpoint - API 엔드포인트
	 * @param body - 요청 바디
	 * @returns API 응답 데이터
	 */
	async put<T>(endpoint: string, body?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: "PUT",
			body: body ? JSON.stringify(body) : undefined,
		});
	}

	/**
	 * DELETE 요청
	 * @param endpoint - API 엔드포인트
	 * @returns API 응답 데이터
	 */
	async delete<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, { method: "DELETE" });
	}
}

/**
 * 키움 API 클라이언트 싱글톤 인스턴스
 */
export const kiwoomClient = new KiwoomClient();
