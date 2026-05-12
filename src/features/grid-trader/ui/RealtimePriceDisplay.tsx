"use client";

/**
 * @fileoverview 실시간 현재가 표시 컴포넌트
 * @description Zustand Store에서 실시간 현재가를 구독하고 표시
 */

import { usePriceStore } from "@/shared/stores/price-store";

interface RealtimePriceDisplayProps {
	/** 종목코드 */
	stockCode: string;
	/** 종목명 */
	stockName: string;
}

/**
 * 실시간 현재가 표시 컴포넌트
 */
export function RealtimePriceDisplay({ stockCode, stockName }: RealtimePriceDisplayProps) {
	// Zustand Store에서 선택적 구독
	const priceInfo = usePriceStore((state) => state.prices[stockCode]);
	const isLoading = usePriceStore((state) => state.isLoading);
	const isConnected = usePriceStore((state) => state.isConnected);

	const currentPrice = priceInfo?.currentPrice;
	const changeRate = priceInfo?.changeRate;

	if (isLoading) {
		return (
			<div>
				<h1 className="text-2xl font-bold">
					{stockName}
					<span className="ml-2 text-base font-normal text-muted-foreground">{stockCode}</span>
				</h1>
				<p className="text-lg text-muted-foreground">현재가 로딩 중...</p>
			</div>
		);
	}

	if (!isConnected) {
		return (
			<div>
				<h1 className="text-2xl font-bold">
					{stockName}
					<span className="ml-2 text-base font-normal text-muted-foreground">{stockCode}</span>
				</h1>
				<p className="text-lg text-destructive">연결 끊김 (재연결 중...)</p>
			</div>
		);
	}

	return (
		<div>
			<h1 className="text-2xl font-bold">
				{stockName}
				<span className="ml-2 text-base font-normal text-muted-foreground">{stockCode}</span>
			</h1>
			<p className="text-lg font-semibold">
				현재가 {currentPrice?.toLocaleString() ?? "-"}원
				{changeRate !== null && (
					<span className={`ml-2 text-sm ${changeRate >= 0 ? "text-red-500" : "text-blue-500"}`}>
						({changeRate >= 0 ? "+" : ""}
						{changeRate}%)
					</span>
				)}
			</p>
		</div>
	);
}
