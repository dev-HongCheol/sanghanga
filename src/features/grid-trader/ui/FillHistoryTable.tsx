import type { FillEvent } from "@/entities/grid-trader";
import { Badge } from "@/shared/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table";

interface FillHistoryTableProps {
	/** 체결 이벤트 목록 (최근 10개) */
	fills: FillEvent[];
}

/**
 * 체결 히스토리 테이블
 *
 * 최근 체결 이벤트를 시간 역순으로 표시한다.
 * 매도 체결의 손익도 함께 표시한다.
 */
export function FillHistoryTable({ fills }: FillHistoryTableProps) {
	if (fills.length === 0) {
		return (
			<p className="py-8 text-center text-sm text-muted-foreground">체결 내역이 없습니다.</p>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>체결 시각</TableHead>
					<TableHead>구분</TableHead>
					<TableHead className="text-right">체결가</TableHead>
					<TableHead className="text-right">수량</TableHead>
					<TableHead className="text-right">손익</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{fills.map((fill) => (
					<TableRow key={fill.id}>
						<TableCell className="text-xs text-muted-foreground">
							{new Date(fill.fill_time).toLocaleTimeString("ko-KR")}
						</TableCell>
						<TableCell>
							<Badge variant={fill.order_type === "BUY" ? "default" : "destructive"}>
								{fill.order_type === "BUY" ? "매수" : "매도"}
							</Badge>
						</TableCell>
						<TableCell className="text-right font-mono">
							{fill.fill_price.toLocaleString()}원
						</TableCell>
						<TableCell className="text-right font-mono">{fill.fill_quantity}주</TableCell>
						<TableCell className="text-right font-mono">
							{fill.profit_loss !== null && fill.profit_loss !== undefined ? (
								<span className={fill.profit_loss >= 0 ? "text-red-500" : "text-blue-500"}>
									{fill.profit_loss >= 0 ? "+" : ""}
									{fill.profit_loss.toLocaleString()}원
								</span>
							) : (
								<span className="text-muted-foreground">—</span>
							)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
