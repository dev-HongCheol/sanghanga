/**
 * @fileoverview 실시간 종목조회순위 페이지
 * @description 키움 API를 통한 실시간 종목조회순위 조회 페이지
 */

import { StockRankingWidget } from "@/widgets/stock-ranking";

export const metadata = {
	title: "실시간 종목조회순위 - 상한가",
	description: "키움증권 API를 통한 실시간 종목조회순위 조회",
};

/**
 * 실시간 종목조회순위 페이지
 */
export default function StockRankingPage() {
	return (
		<main className="min-h-screen">
			<StockRankingWidget />
		</main>
	);
}
