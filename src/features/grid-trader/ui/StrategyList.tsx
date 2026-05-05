"use client";

import { useState } from "react";
import type { GridStrategy } from "@/entities/grid-trader";
import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/ui/dialog";
import { GridStrategyForm } from "./GridStrategyForm";
import { StrategyCard } from "./StrategyCard";

interface StrategyListProps {
	/** 전략 목록 (페이지에서 서버 측 조회 후 전달) */
	strategies: GridStrategy[];
}

/**
 * 그리드 전략 목록
 *
 * 전략 카드 그리드와 새 전략 추가 다이얼로그를 렌더링한다.
 */
export function StrategyList({ strategies }: StrategyListProps) {
	const [open, setOpen] = useState(false);

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>+ 새 전략 추가</Button>
					</DialogTrigger>
					<DialogContent className="max-w-lg">
						<DialogHeader>
							<DialogTitle>그리드 전략 생성</DialogTitle>
						</DialogHeader>
						<GridStrategyForm onSuccess={() => setOpen(false)} />
					</DialogContent>
				</Dialog>
			</div>

			{strategies.length === 0 ? (
				<div className="rounded-lg border border-dashed p-12 text-center">
					<p className="text-muted-foreground">등록된 전략이 없습니다.</p>
					<p className="mt-1 text-sm text-muted-foreground">
						+ 새 전략 추가 버튼으로 시작하세요.
					</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{strategies.map((strategy) => (
						<StrategyCard key={strategy.id} strategy={strategy} />
					))}
				</div>
			)}
		</div>
	);
}
