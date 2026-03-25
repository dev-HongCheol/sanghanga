/**
 * @fileoverview 공통 유틸리티 함수
 * @description Tailwind CSS 클래스 병합 등 프로젝트 전반에서 사용하는 유틸리티 함수
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS 클래스 이름을 병합합니다
 * @param inputs - 병합할 클래스 이름들
 * @returns 병합된 클래스 이름
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
