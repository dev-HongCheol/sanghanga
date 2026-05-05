"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
	gridStrategyCreateSchema,
	type GridStrategyCreateFormData,
} from "@/entities/grid-trader";
import type { GridStrategy } from "@/entities/grid-trader";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { createStrategyAction } from "../api/createStrategy.action";
import { updateStrategyAction } from "../api/updateStrategy.action";
import { StockSearchInput } from "./StockSearchInput";

interface GridStrategyFormProps {
	/** 수정 시 기존 전략 데이터 (없으면 생성 모드) */
	strategy?: GridStrategy;
	/** 완료 후 콜백 */
	onSuccess?: (strategy: GridStrategy) => void;
}

/**
 * 그리드 전략 생성/수정 폼
 *
 * 생성 모드: `strategy` prop 없이 사용
 * 수정 모드: `strategy` prop을 전달
 */
export function GridStrategyForm({ strategy, onSuccess }: GridStrategyFormProps) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const isEdit = !!strategy;

	const form = useForm<GridStrategyCreateFormData>({
		resolver: zodResolver(gridStrategyCreateSchema),
		defaultValues: {
			stock_code: strategy?.stock_code ?? "",
			stock_name: strategy?.stock_name ?? "",
			grid_gap: strategy?.grid_gap ?? 5000,
			upper_grid_count: strategy?.upper_grid_count ?? 5,
			lower_grid_count: strategy?.lower_grid_count ?? 5,
			quantity_per_grid: strategy?.quantity_per_grid ?? 10,
			min_holding_limit: strategy?.min_holding_limit ?? 0,
			target_price: strategy?.target_price ?? undefined,
			is_active: strategy?.is_active ?? true,
		},
	});

	async function onSubmit(data: GridStrategyCreateFormData) {
		setError(null);

		// target_price: undefined → null 변환 (DB 타입 맞춤)
		const payload = { ...data, target_price: data.target_price ?? null };

		const result =
			isEdit && strategy
				? await updateStrategyAction(strategy.id, payload)
				: await createStrategyAction(payload);

		if (!result.success) {
			setError(result.error);
			return;
		}

		onSuccess?.(result.strategy);
		if (!onSuccess) {
			router.push(`/trading-system/grid-trader/${result.strategy.id}`);
			router.refresh();
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{/* 종목 검색 */}
				<FormField
					control={form.control}
					name="stock_code"
					render={({ field }) => (
						<FormItem>
							<FormLabel>종목</FormLabel>
							<FormControl>
								<StockSearchInput
									value={form.watch("stock_name")}
									onSelect={(code, name) => {
										field.onChange(code);
										form.setValue("stock_name", name);
									}}
								/>
							</FormControl>
							{field.value && (
								<p className="text-xs text-muted-foreground">선택된 코드: {field.value}</p>
							)}
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* 그리드 간격 */}
				<FormField
					control={form.control}
					name="grid_gap"
					render={({ field }) => (
						<FormItem>
							<FormLabel>그리드 간격 (원)</FormLabel>
							<FormControl>
								<Input
									type="number"
									min={1000}
									max={100000}
									step={500}
									{...field}
									onChange={(e) => field.onChange(e.target.valueAsNumber)}
								/>
							</FormControl>
							<FormDescription>1,000 ~ 100,000원</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* 상단/하단 그리드 수 */}
				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="upper_grid_count"
						render={({ field }) => (
							<FormItem>
								<FormLabel>매도 그리드 수</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1}
										max={20}
										{...field}
										onChange={(e) => field.onChange(e.target.valueAsNumber)}
									/>
								</FormControl>
								<FormDescription>1 ~ 20개</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="lower_grid_count"
						render={({ field }) => (
							<FormItem>
								<FormLabel>매수 그리드 수</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1}
										max={20}
										{...field}
										onChange={(e) => field.onChange(e.target.valueAsNumber)}
									/>
								</FormControl>
								<FormDescription>1 ~ 20개</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* 그리드당 수량 */}
				<FormField
					control={form.control}
					name="quantity_per_grid"
					render={({ field }) => (
						<FormItem>
							<FormLabel>그리드당 수량 (주)</FormLabel>
							<FormControl>
								<Input
									type="number"
									min={1}
									{...field}
									onChange={(e) => field.onChange(e.target.valueAsNumber)}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Core 물량 (최소 보유 한도) */}
				<FormField
					control={form.control}
					name="min_holding_limit"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Core 물량 (주)</FormLabel>
							<FormControl>
								<Input
									type="number"
									min={0}
									{...field}
									onChange={(e) => field.onChange(e.target.valueAsNumber)}
								/>
							</FormControl>
							<FormDescription>이 수량 이하로 떨어지면 매도 주문 생성 중단</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* 목표가 (선택) */}
				<FormField
					control={form.control}
					name="target_price"
					render={({ field }) => (
						<FormItem>
							<FormLabel>목표가 (원, 선택)</FormLabel>
							<FormControl>
								<Input
									type="number"
									min={1}
									placeholder="설정 시 목표가 미만 매도 불가"
									value={field.value ?? ""}
									onChange={(e) =>
										field.onChange(
											e.target.value === "" ? undefined : e.target.valueAsNumber,
										)
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* 활성화 */}
				<FormField
					control={form.control}
					name="is_active"
					render={({ field }) => (
						<FormItem className="flex items-center justify-between rounded-lg border p-3">
							<div>
								<FormLabel>전략 활성화</FormLabel>
								<FormDescription>활성화 시 거래 시간 동안 자동 매매 실행</FormDescription>
							</div>
							<FormControl>
								<Switch checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
						</FormItem>
					)}
				/>

				<Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
					{form.formState.isSubmitting ? "처리 중..." : isEdit ? "전략 수정" : "전략 생성"}
				</Button>
			</form>
		</Form>
	);
}
