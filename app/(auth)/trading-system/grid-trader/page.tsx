import { getAllStrategies } from "@/entities/grid-trader";
import { StrategyList } from "@/features/grid-trader";
import { PageHeader } from "@/shared/ui";

/**
 * 그리드 트레이더 목록 페이지
 *
 * 등록된 전략 목록과 새 전략 추가 기능을 제공한다.
 */
export default async function GridTraderPage() {
	const strategies = await getAllStrategies();

	return (
		<div className="space-y-6">
			<PageHeader
				title="그리드 트레이더"
				description="박스권 자동 매매 전략을 등록하고 관리합니다."
			/>
			<StrategyList strategies={strategies} />
		</div>
	);
}
