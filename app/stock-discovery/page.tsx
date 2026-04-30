import { PageHeader } from "@/shared/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { DollarSign, Sparkles } from "lucide-react";
import Link from "next/link";

/**
 * 종목 발굴 메인 페이지
 */
export default function StockDiscoveryPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="종목 발굴"
				description="다양한 조건과 전략으로 투자 기회를 발굴합니다."
			/>

			<div className="grid gap-6 md:grid-cols-2">
				{/* 거래대금 기반 */}
				<Link href="/stock-discovery/trading-volume">
					<Card className="cursor-pointer transition-colors hover:bg-accent">
						<CardHeader>
							<div className="flex items-center gap-2">
								<DollarSign className="h-5 w-5" />
								<CardTitle>거래대금 기반</CardTitle>
							</div>
							<CardDescription>
								거래대금, 시가총액, 상승 패턴을 조합하여 종목 검색
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
								<li>시가총액 필터링</li>
								<li>전일/실시간 거래대금 조건</li>
								<li>연속 상승 패턴 분석</li>
								<li>교집합 방식으로 빠른 검색</li>
							</ul>
						</CardContent>
					</Card>
				</Link>

				{/* 테마 대장주 */}
				<Link href="/stock-discovery/theme-leader">
					<Card className="cursor-pointer transition-colors hover:bg-accent">
						<CardHeader>
							<div className="flex items-center gap-2">
								<Sparkles className="h-5 w-5" />
								<CardTitle>테마 대장주</CardTitle>
							</div>
							<CardDescription>
								테마주 분석을 통한 대장주 발굴 (개발 예정)
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
								<li>주도 테마주 판단</li>
								<li>그 중 대장주 판별</li>
								<li>거래대금 급증 확인</li>
								<li>프로그램 매수 확인</li>
								<li>과매수 구간 여부 확인</li>
							</ul>
						</CardContent>
					</Card>
				</Link>
			</div>
		</div>
	);
}
