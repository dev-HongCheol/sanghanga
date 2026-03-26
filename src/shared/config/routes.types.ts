import type { LucideIcon } from "lucide-react";

/**
 * 메뉴 라우트 정보
 */
export interface Route {
	/** 메뉴 한글명 (라벨) */
	label: string;
	/** 실제 경로 */
	href: string;
	/** 아이콘 컴포넌트 (선택) */
	icon?: LucideIcon;
	/** 하위 메뉴 (2depth) */
	children?: Route[];
}
