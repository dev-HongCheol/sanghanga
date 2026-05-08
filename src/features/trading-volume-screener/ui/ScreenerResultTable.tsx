"use client";

import { ColoredValue } from "@/shared/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { ScreenerResult } from "../model/screener.types";

interface ScreenerResultTableProps {
	/** 검색 결과 */
	results: ScreenerResult[];
}

/**
 * 스크리너 검색 결과 테이블
 */
export function ScreenerResultTable({ results }: ScreenerResultTableProps) {
	if (results.length === 0) {
		return (
			<Card>
				<CardContent className="p-12 text-center text-muted-foreground">
					<p>검색 결과가 없습니다.</p>
					<p className="mt-2 text-sm">필터 조건을 조정해보세요.</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">검색 결과 ({results.length}개 종목)</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b text-sm text-muted-foreground">
								<th className="px-4 py-3 text-left font-medium">종목코드</th>
								<th className="px-4 py-3 text-left font-medium">종목명</th>
								<th className="px-4 py-3 text-right font-medium">현재가</th>
								<th className="px-4 py-3 text-right font-medium">등락률</th>
								<th className="px-4 py-3 text-right font-medium">시가총액</th>
								<th className="px-4 py-3 text-right font-medium">전일 거래대금</th>
								<th className="px-4 py-3 text-right font-medium">당일 거래대금</th>
								<th className="px-4 py-3 text-center font-medium">패턴</th>
							</tr>
						</thead>
						<tbody>
							{results.map((result) => (
								<tr key={result.stockCode} className="border-b transition-colors hover:bg-muted/50">
									<td className="px-4 py-3 font-mono text-sm">{result.stockCode}</td>
									<td className="px-4 py-3 font-medium">{result.stockName}</td>
									<td className="px-4 py-3 text-right font-mono">
										<ColoredValue value={result.currentPrice} change={result.changeRate} />원
									</td>
									<td className="px-4 py-3 text-right font-mono">
										<ColoredValue value={result.changeRate} showSign />%
									</td>
									<td className="px-4 py-3 text-right font-mono">
										{result.marketCap.toLocaleString()}억
									</td>
									<td className="px-4 py-3 text-right font-mono">
										{result.prevDayVolume.toLocaleString()}억
									</td>
									<td className="px-4 py-3 text-right font-mono">
										{result.currentDayVolume.toLocaleString()}억
									</td>
									<td className="px-4 py-3 text-center">
										<TrendPatternIcon pattern={result.trendPattern} />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * 트렌드 패턴 아이콘
 */
function TrendPatternIcon({
	pattern,
}: {
	pattern: "up" | "down" | "sideways";
}) {
	if (pattern === "up") {
		return (
			<div className="inline-flex items-center gap-1 text-green-500">
				<ArrowUp className="h-4 w-4" />
				<span className="text-xs">상승</span>
			</div>
		);
	}

	if (pattern === "down") {
		return (
			<div className="inline-flex items-center gap-1 text-red-500">
				<ArrowDown className="h-4 w-4" />
				<span className="text-xs">하락</span>
			</div>
		);
	}

	return (
		<div className="inline-flex items-center gap-1 text-muted-foreground">
			<Minus className="h-4 w-4" />
			<span className="text-xs">횡보</span>
		</div>
	);
}
