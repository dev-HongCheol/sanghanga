/**
 * @fileoverview 실시간 종목조회순위 위젯
 * @description 구분 선택 및 조회 결과 표시 (Shadcn UI 컴포넌트 사용)
 */

"use client";

import { useStockRanking } from "@/entities/stock";
import type { StockRankingRequest } from "@/entities/stock";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";

const QRY_TYPE_OPTIONS: Array<{
	value: StockRankingRequest["qry_tp"];
	label: string;
}> = [
	{ value: "1", label: "1분" },
	{ value: "2", label: "10분" },
	{ value: "3", label: "1시간" },
	{ value: "4", label: "당일 누적" },
	{ value: "5", label: "30초" },
];

/**
 * 실시간 종목조회순위 위젯
 */
export function StockRankingWidget() {
	const [qryType, setQryType] = useState<StockRankingRequest["qry_tp"]>("1");

	const { data, isLoading, error } = useStockRanking(qryType);

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">실시간 종목조회순위</h1>
				<p className="text-muted-foreground mt-2">키움증권 API를 통한 실시간 종목 조회 순위</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>조회 조건</CardTitle>
					<CardDescription>조회할 시간 구분을 선택하세요</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4">
						<label htmlFor="qry-type" className="text-sm font-medium">
							구분
						</label>
						<Select
							value={qryType}
							onValueChange={(value) => setQryType(value as StockRankingRequest["qry_tp"])}
						>
							<SelectTrigger id="qry-type" className="w-[180px]">
								<SelectValue placeholder="구분 선택" />
							</SelectTrigger>
							<SelectContent>
								{QRY_TYPE_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* 로딩 상태 */}
			{isLoading && (
				<Card>
					<CardContent className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						<span className="ml-3 text-muted-foreground">로딩 중...</span>
					</CardContent>
				</Card>
			)}

			{/* 에러 상태 */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>에러 발생</AlertTitle>
					<AlertDescription>
						{error instanceof Error ? error.message : "데이터를 불러올 수 없습니다"}
					</AlertDescription>
				</Alert>
			)}

			{/* 조회 결과 */}
			{data && !isLoading && (
				<Card>
					<CardHeader>
						<CardTitle>조회 결과</CardTitle>
						<CardDescription>종목조회순위 데이터</CardDescription>
					</CardHeader>
					<CardContent>
						<pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
							{JSON.stringify(data, null, 2)}
						</pre>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
