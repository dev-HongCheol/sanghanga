import { DollarSign, Sparkles, TrendingUp } from "lucide-react";
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
		label: "실시간 주도주",
		href: "/stock-ranking",
		icon: TrendingUp,
		children: [
			{
				label: "거래대금 상위 기업",
				href: "/stock-ranking/trading-value",
				icon: DollarSign,
			},
			{
				label: "테마 대장주",
				href: "/stock-ranking/theme-leader",
				icon: Sparkles,
			},
		],
	},
];
