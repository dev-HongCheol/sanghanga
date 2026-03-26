/**
 * @fileoverview 거래대금 상위 기업 페이지
 * @description 거래대금 기준 상위 종목 조회
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "거래대금 상위 기업 - Sanghanga",
	description: "거래대금 기준 실시간 주도주 조회",
};

/**
 * 거래대금 상위 기업 페이지
 */
export default function TradingValuePage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold">거래대금 상위 기업</h1>
				<p className="text-muted-foreground">거래대금 기준 실시간 주도주를 확인하세요</p>
			</div>

			<div>
				{/* 향후 StockRankingWidget 추가 예정 */}
				<p className="text-sm text-muted-foreground">위젯 구현 예정</p>
			</div>
		</div>
	);
}
