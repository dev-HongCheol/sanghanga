import {
	getFillEventsByStrategy,
	getOrdersByStrategy,
	getStrategyById,
} from "@/entities/grid-trader";
import {
	FillHistoryTable,
	GridStrategyForm,
	RealtimeActiveOrdersTable,
	RealtimeBalanceDisplay,
	RealtimePriceDisplay,
	RebalanceButton,
	SSEProvider,
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
 * 실시간 데이터(현재가, 잔고)는 Client Component에서 SSE로 구독한다.
 */
export default async function GridTraderDetailPage({ params }: Props) {
	const { strategyId } = await params;

	// 전략 존재 여부 확인
	const strategy = await getStrategyById(strategyId);
	if (!strategy) notFound();

	// 정적 데이터만 Server에서 조회 (주문, 체결)
	const [pendingOrders, fillEvents] = await Promise.all([
		getOrdersByStrategy(strategyId, "PENDING"),
		getFillEventsByStrategy(strategyId, 10),
	]);

	return (
		<SSEProvider>
			<div className="space-y-6">
				{/* 페이지 헤더 */}
				<div className="flex items-center justify-between">
					{/* 실시간 현재가 (Client Component, SSE 구독) */}
					<RealtimePriceDisplay stockCode={strategy.stock_code} stockName={strategy.stock_name} />
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
						{/* 실시간 잔고 (Client Component, SSE 구독) */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base">실시간 잔고</CardTitle>
							</CardHeader>
							<CardContent>
								<RealtimeBalanceDisplay stockCode={strategy.stock_code} />
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
								<RealtimeActiveOrdersTable orders={pendingOrders} stockCode={strategy.stock_code} />
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
		</SSEProvider>
	);
}
