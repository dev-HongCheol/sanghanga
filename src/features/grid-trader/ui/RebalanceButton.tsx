"use client";

import { Button } from "@/shared/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { rebalanceGridAction } from "../api/rebalanceGrid.action";

interface RebalanceButtonProps {
	/** 전략 ID */
	strategyId: string;
	/** 전략 활성화 여부 */
	isActive: boolean;
}

/**
 * 그리드 리밸런싱 버튼
 *
 * - 미체결 주문 전체 취소 → 현재가 기준 그리드 재배치
 * - 활성 전략만 실행 가능
 */
export function RebalanceButton({ strategyId, isActive }: RebalanceButtonProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleRebalance = async () => {
		if (!isActive) {
			toast.error("활성 상태인 전략만 리밸런싱할 수 있습니다");
			return;
		}

		setIsLoading(true);
		try {
			const result = await rebalanceGridAction(strategyId);

			if (result.success) {
				toast.success("리밸런싱 완료", {
					description: `취소: ${result.result.cancelled}건 | 신규 배치: ${result.result.placed}건`,
				});
			} else {
				toast.error("리밸런싱 실패", {
					description: result.error,
				});
			}
		} catch (error) {
			toast.error("리밸런싱 중 오류 발생", {
				description: error instanceof Error ? error.message : String(error),
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			onClick={handleRebalance}
			disabled={!isActive || isLoading}
			variant="outline"
			size="sm"
			className="gap-2"
		>
			<RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
			리밸런싱
		</Button>
	);
}
