import type { AccountBalance, AccountHolding } from "../api/getAccountBalance.action";
import { matchStockCode } from "../lib/matchStockCode";

interface AccountBalanceProps {
	/** 계좌 잔고 정보 */
	balance: AccountBalance;
	/** 조회할 종목코드 */
	stockCode: string;
}

/**
 * 실시간 잔고 패널
 *
 * 해당 종목의 보유 수량/평균단가/평가손익과 예수금을 표시한다.
 */
export function AccountBalancePanel({ balance, stockCode }: AccountBalanceProps) {
	const holding: AccountHolding | undefined = balance.holdings.find((h) =>
		matchStockCode(h.stockCode, stockCode)
	);

	return (
		<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
			<BalanceItem label="예수금" value={`${balance.estimatedDepositAsset.toLocaleString()}원`} />
			<BalanceItem
				label="보유 수량"
				value={holding ? `${holding.quantity.toLocaleString()}주` : "—"}
			/>
			<BalanceItem
				label="평균단가"
				value={holding ? `${holding.purchasePrice.toLocaleString()}원` : "—"}
			/>
			<BalanceItem
				label="평가손익"
				value={
					holding ? (
						<span className={holding.profitLoss >= 0 ? "text-red-500" : "text-blue-500"}>
							{holding.profitLoss >= 0 ? "+" : ""}
							{holding.profitLoss.toLocaleString()}원
						</span>
					) : (
						"—"
					)
				}
			/>
		</div>
	);
}

interface BalanceItemProps {
	label: string;
	value: React.ReactNode;
}

function BalanceItem({ label, value }: BalanceItemProps) {
	return (
		<div className="rounded-lg border p-3">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-1 text-sm font-semibold">{value}</p>
		</div>
	);
}
