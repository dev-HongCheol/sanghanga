"use client";

import type { GridStrategy } from "@/entities/grid-trader";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Switch } from "@/shared/ui/switch";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { deployGridAction } from "../api/deployGrid.action";
import { toggleStrategyAction } from "../api/toggleStrategy.action";

interface StrategyCardProps {
	/** 표시할 그리드 전략 */
	strategy: GridStrategy;
}

/**
 * 그리드 전략 카드
 *
 * 종목명, 그리드 설정, 활성/비활성 토글, 상세 링크를 표시한다.
 */
export function StrategyCard({ strategy }: StrategyCardProps) {
	const [isActive, setIsActive] = useState(strategy.is_active);
	const [toggling, setToggling] = useState(false);
	const [deploying, setDeploying] = useState(false);

	async function handleToggle(checked: boolean) {
		setToggling(true);
		setIsActive(checked); // optimistic update
		const result = await toggleStrategyAction(strategy.id, checked);
		if (!result.success) {
			setIsActive(!checked); // rollback
			setToggling(false);
			return;
		}
		setToggling(false);

		// 활성화 시 자동으로 그리드 배치
		if (checked) {
			toast.info("전략 활성화", {
				description: "그리드 주문을 배치합니다...",
			});
			await handleDeployGrid();
		}
	}

	async function handleDeployGrid() {
		setDeploying(true);
		const result = await deployGridAction(strategy.id);
		setDeploying(false);

		if (result.success) {
			toast.success("그리드 배치 완료", {
				description: `${result.result?.placed}개 주문 배치 완료, ${result.result?.failed}개 실패`,
			});
		} else {
			toast.error("그리드 배치 실패", {
				description: result.error,
			});
		}
	}

	return (
		<Card>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between">
					<div>
						<CardTitle className="text-base">{strategy.stock_name}</CardTitle>
						<p className="text-xs text-muted-foreground">{strategy.stock_code}</p>
					</div>
					<Badge variant={isActive ? "default" : "secondary"}>{isActive ? "활성" : "중지"}</Badge>
				</div>
			</CardHeader>

			<CardContent className="space-y-1 text-sm">
				<GridInfoRow label="그리드 간격" value={`${strategy.grid_gap.toLocaleString()}원`} />
				<GridInfoRow
					label="매도 / 매수"
					value={`${strategy.upper_grid_count}개 / ${strategy.lower_grid_count}개`}
				/>
				<GridInfoRow label="그리드당 수량" value={`${strategy.quantity_per_grid}주`} />
				<GridInfoRow label="Core 물량" value={`${strategy.min_holding_limit}주`} />
				{strategy.target_price !== null && (
					<GridInfoRow label="목표가" value={`${strategy.target_price?.toLocaleString()}원`} />
				)}
			</CardContent>

			<CardFooter className="flex flex-col gap-2 pt-2">
				<div className="flex w-full items-center justify-between">
					<div className="flex items-center gap-2">
						<Switch
							checked={isActive}
							onCheckedChange={handleToggle}
							disabled={toggling}
							aria-label="전략 활성화"
						/>
						<span className="text-xs text-muted-foreground">{toggling ? "변경 중..." : ""}</span>
					</div>
					<Button asChild size="sm" variant="outline">
						<Link href={`/trading-system/grid-trader/${strategy.id}`}>상세 보기</Link>
					</Button>
				</div>
				{isActive && (
					<Button
						className="w-full"
						size="sm"
						variant="secondary"
						onClick={handleDeployGrid}
						disabled={deploying}
					>
						{deploying ? "배치 중..." : "그리드 배치"}
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}

interface GridInfoRowProps {
	label: string;
	value: string;
}

function GridInfoRow({ label, value }: GridInfoRowProps) {
	return (
		<div className="flex justify-between">
			<span className="text-muted-foreground">{label}</span>
			<span className="font-medium">{value}</span>
		</div>
	);
}
