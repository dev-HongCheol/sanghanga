import { DollarSign, Sparkles, Search } from "lucide-react";
import type { Route } from "./routes.types";

/**
 * 메인 페이지 라우트
 */
export const MAIN_ROUTE = {
	label: "Sanghanga",
	href: "/",
} as const;

/**
 * 애플리케이션 메뉴 라우트 목록
 */
export const ROUTES: Route[] = [
	{
		label: "종목 발굴",
		href: "/stock-discovery",
		icon: Search,
		children: [
			{
				label: "거래대금 기반",
				href: "/stock-discovery/trading-volume",
				icon: DollarSign,
			},
			{
				label: "테마 대장주",
				href: "/stock-discovery/theme-leader",
				icon: Sparkles,
			},
		],
	},
];
