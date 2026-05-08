import {
	getFillEventsByStrategy,
	getOrdersByStrategy,
	getStrategyById,
} from "@/entities/grid-trader";
import {
	AccountBalancePanel,
	ActiveOrdersTable,
	FillHistoryTable,
	GridStrategyForm,
	PollingRefresher,
	RebalanceButton,
	getAccountBalanceAction,
	getCurrentPriceAction,
} from "@/features/grid-trader";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { notFound } from "next/navigation";

interface Props {
	params: Promise<{ strategyId: string }>;
}

/**
 * 그리드 전략 상세 페이지
 *
 * 전략 설정 폼, 실시간 잔고, 활성 주문 테이블, 체결 히스토리를 표시한다.
 * PollingRefresher가 1초마다 서버 컴포넌트를 갱신해 실시간 업데이트를 구현한다.
 */
export default async function GridTraderDetailPage({ params }: Props) {
	const { strategyId } = await params;

	// 전략 존재 여부 확인
	const strategy = await getStrategyById(strategyId);
	if (!strategy) notFound();

	// 나머지 데이터 병렬 조회
	const [pendingOrders, fillEvents, balanceResult, priceResult] = await Promise.all([
		getOrdersByStrategy(strategyId, "PENDING"),
		getFillEventsByStrategy(strategyId, 10),
		getAccountBalanceAction(),
		getCurrentPriceAction(strategy.stock_code),
	]);

	const currentPrice = priceResult.success ? priceResult.priceInfo.currentPrice : 0;
	const balance = balanceResult.success ? balanceResult.balance : null;

	return (
		<div className="space-y-6">
			{/* 실시간 폴링 */}
			<PollingRefresher intervalMs={1000} />

			{/* 페이지 헤더 */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">
						{strategy.stock_name}
						<span className="ml-2 text-base font-normal text-muted-foreground">
							{strategy.stock_code}
						</span>
					</h1>
					{priceResult.success && (
						<p className="text-lg font-semibold">현재가 {currentPrice.toLocaleString()}원</p>
					)}
				</div>
				<Badge variant={strategy.is_active ? "default" : "secondary"} className="text-sm">
					{strategy.is_active ? "활성" : "중지"}
				</Badge>
			</div>

			<Separator />

			<div className="grid gap-6 lg:grid-cols-[360px_1fr]">
				{/* 왼쪽: 전략 설정 폼 */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base">전략 설정</CardTitle>
					</CardHeader>
					<CardContent>
						<GridStrategyForm strategy={strategy} />
					</CardContent>
				</Card>

				{/* 오른쪽: 실시간 데이터 */}
				<div className="space-y-6">
					{/* 실시간 잔고 */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">실시간 잔고</CardTitle>
						</CardHeader>
						<CardContent>
							{balance ? (
								<AccountBalancePanel balance={balance} stockCode={strategy.stock_code} />
							) : (
								<p className="text-sm text-muted-foreground">잔고 조회 실패</p>
							)}
						</CardContent>
					</Card>

					{/* 활성 주문 */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="text-base">
									활성 주문
									<span className="ml-2 text-sm font-normal text-muted-foreground">
										({pendingOrders.length}건)
									</span>
								</CardTitle>
								<RebalanceButton strategyId={strategyId} isActive={strategy.is_active} />
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<ActiveOrdersTable orders={pendingOrders} currentPrice={currentPrice} />
						</CardContent>
					</Card>

					{/* 체결 히스토리 */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">체결 히스토리</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<FillHistoryTable fills={fillEvents} />
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
