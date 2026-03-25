/**
 * @fileoverview 공통 타입 정의
 * @description API 응답, 페이지네이션 등 프로젝트 전반에서 사용하는 공통 타입
 */

/**
 * API 응답 타입
 */
export interface ApiResponse<T = unknown> {
	/** 성공 여부 */
	success: boolean;
	/** 응답 데이터 */
	data?: T;
	/** 에러 메시지 */
	error?: string;
}

/**
 * 페이지네이션 메타데이터
 */
export interface PaginationMeta {
	/** 현재 페이지 */
	currentPage: number;
	/** 총 페이지 수 */
	totalPages: number;
	/** 총 아이템 수 */
	totalItems: number;
	/** 페이지당 아이템 수 */
	itemsPerPage: number;
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
	/** 페이지네이션 정보 */
	meta: PaginationMeta;
}
