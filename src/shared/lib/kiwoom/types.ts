/**
 * @fileoverview 키움증권 REST API 타입 정의
 * @description 키움 API 요청/응답 타입 및 에러 타입
 */

/**
 * 키움 API 공통 응답 구조
 * @description 모든 키움 API 응답에 포함되는 기본 필드
 */
export interface KiwoomBaseResponse {
	/** 응답 코드 (0: 성공, 그 외: 실패) */
	return_code: number;
	/** 응답 메시지 */
	return_msg: string;
}

/**
 * OAuth 2.0 토큰 요청 인터페이스
 */
export interface TokenRequest {
	/** OAuth 2.0 grant type (항상 'client_credentials') */
	grant_type: "client_credentials";
	/** 키움 App Key */
	appkey: string;
	/** 키움 App Secret */
	secretkey: string;
}

/**
 * OAuth 2.0 토큰 응답 인터페이스
 * @description KiwoomBaseResponse를 확장하여 공통 응답 필드 포함
 */
export interface TokenResponse extends KiwoomBaseResponse {
	/** Access Token (24시간 유효) */
	token: string;
	/** 토큰 타입 (Bearer) */
	token_type: string;
	/** 토큰 만료 일시 (YYYYMMDDHHMMSS 형식, 예: 20260326154407) */
	expires_dt: string;
}

/**
 * 키움 API 에러 인터페이스
 */
export interface KiwoomError {
	/** 에러 코드 */
	code: string;
	/** 에러 메시지 */
	message: string;
	/** 추가 에러 정보 */
	details?: unknown;
}

/**
 * 캐시된 토큰 정보
 */
export interface CachedToken {
	/** Access Token */
	token: string;
	/** 토큰 만료 시간 (Unix timestamp, ms) */
	expiresAt: number;
}

/**
 * API 요청 옵션
 */
export interface KiwoomRequestOptions extends RequestInit {
	/** 요청 경로 */
	endpoint: string;
	/** 자동 토큰 재발급 여부 (기본값: true) */
	autoRetry?: boolean;
}
