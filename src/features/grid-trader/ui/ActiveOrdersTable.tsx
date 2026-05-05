import type { GridOrder } from "@/entities/grid-trader";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table";

interface ActiveOrdersTableProps {
	/** 활성 주문 목록 (PENDING 상태) */
	orders: GridOrder[];
	/** 현재가 (원) */
	currentPrice: number;
}

/**
 * 활성 주문 테이블
 *
 * 현재가 기준으로 매도 주문(위)과 매수 주문(아래)을 구분해 표시한다.
 *
 * ```
 * ↑ 매도 주문 (grid_price 높은 순)
 * ━━━━━━ 현재가 ━━━━━━
 * ↓ 매수 주문 (grid_price 높은 순)
 * ```
 */
export function ActiveOrdersTable({ orders, currentPrice }: ActiveOrdersTableProps) {
	const sellOrders = orders
		.filter((o) => o.order_type === "SELL")
		.sort((a, b) => b.grid_price - a.grid_price);

	const buyOrders = orders
		.filter((o) => o.order_type === "BUY")
		.sort((a, b) => b.grid_price - a.grid_price);

	if (orders.length === 0) {
		return (
			<p className="py-8 text-center text-sm text-muted-foreground">활성 주문이 없습니다.</p>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>구분</TableHead>
					<TableHead className="text-right">호가</TableHead>
					<TableHead className="text-right">수량</TableHead>
					<TableHead className="text-right">현재가 대비</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{sellOrders.map((order) => (
					<OrderRow key={order.id} order={order} currentPrice={currentPrice} />
				))}

				{/* 현재가 구분선 */}
				<TableRow>
					<TableCell colSpan={4} className="p-0">
						<div className="flex items-center gap-2 bg-muted/50 px-4 py-2">
							<Separator className="flex-1" />
							<span className="text-sm font-semibold">
								현재가 {currentPrice.toLocaleString()}원
							</span>
							<Separator className="flex-1" />
						</div>
					</TableCell>
				</TableRow>

				{buyOrders.map((order) => (
					<OrderRow key={order.id} order={order} currentPrice={currentPrice} />
				))}
			</TableBody>
		</Table>
	);
}

interface OrderRowProps {
	order: GridOrder;
	currentPrice: number;
}

function OrderRow({ order, currentPrice }: OrderRowProps) {
	const isSell = order.order_type === "SELL";
	const diff = order.grid_price - currentPrice;
	const diffText = `${diff >= 0 ? "+" : ""}${diff.toLocaleString()}원`;

	return (
		<TableRow>
			<TableCell>
				<Badge variant={isSell ? "destructive" : "default"}>
					{isSell ? "매도" : "매수"}
				</Badge>
			</TableCell>
			<TableCell className="text-right font-mono font-semibold">
				{order.grid_price.toLocaleString()}원
			</TableCell>
			<TableCell className="text-right font-mono">{order.quantity}주</TableCell>
			<TableCell
				className={`text-right text-xs ${diff >= 0 ? "text-red-500" : "text-blue-500"}`}
			>
				{diffText}
			</TableCell>
		</TableRow>
	);
}
