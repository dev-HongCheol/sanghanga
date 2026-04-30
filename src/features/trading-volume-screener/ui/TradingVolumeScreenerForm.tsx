"use client";

import { Button } from "@/shared/ui/button";
import { Form } from "@/shared/ui/form";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type StockScreenerFormValues, stockScreenerFormSchema } from "../model/screener.schema";
import { FilterSection, NumberInputField, SelectField, SliderField } from "./FilterSection";

interface TradingVolumeScreenerFormProps {
	/** 검색 실행 핸들러 */
	onSubmit: (values: StockScreenerFormValues) => void | Promise<void>;
	/** 로딩 상태 */
	isLoading?: boolean;
}

/**
 * 거래대금 기반 스크리너 폼ㄱ
 *
 * 사용자가 다양한 필터 조건을 설정하여 종목을 검색할 수 있는 폼입니다.
 */
export function TradingVolumeScreenerForm({
	onSubmit,
	isLoading = false,
}: TradingVolumeScreenerFormProps) {
	const form = useForm<StockScreenerFormValues>({
		resolver: zodResolver(stockScreenerFormSchema),
		defaultValues: {
			market: "ALL",
			marketCap: {
				enabled: true, // 기본: 비활성화 (선택적 사용)
				min: 100,
			},
			prevDayVolume: {
				enabled: true,
				min: 50, // 50억으로 완화
				topN: 100, // 상위 100개로 확대
			},
			realtimeVolume: {
				enabled: true,
				period: 1,
				candleOffset: 0,
				min: 5, // 5억으로 완화
				topN: 100, // 상위 100개로 확대
			},
			trend: {
				enabled: false, // 기본: 비활성화 (매우 엄격한 조건)
				period: 1,
				consecutiveBars: 3,
				direction: "up",
				priceType: "close",
				topN: 50,
			},
		},
	});

	const handleReset = () => {
		form.reset();
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				{/* 시장 선택 */}
				<div className="space-y-2">
					<h3 className="text-sm font-medium">시장 선택</h3>
					<Tabs
						value={form.watch("market")}
						onValueChange={(value) =>
							form.setValue("market", value as StockScreenerFormValues["market"])
						}
					>
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="ALL">전체</TabsTrigger>
							<TabsTrigger value="KOSPI">코스피</TabsTrigger>
							<TabsTrigger value="KOSDAQ">코스닥</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				{/* [A] 시가총액 필터 */}
				<FilterSection
					title="[A] 시가총액"
					enabled={form.watch("marketCap.enabled")}
					onEnabledChange={(enabled) => form.setValue("marketCap.enabled", enabled)}
				>
					<NumberInputField
						label="최소 시가총액"
						value={form.watch("marketCap.min")}
						onChange={(value) => form.setValue("marketCap.min", value)}
						min={0}
						unit="억원"
					/>
				</FilterSection>

				{/* [B] 전일 거래대금 필터 */}
				<FilterSection
					title="[B] 전일 거래대금"
					enabled={form.watch("prevDayVolume.enabled")}
					onEnabledChange={(enabled) => form.setValue("prevDayVolume.enabled", enabled)}
				>
					<NumberInputField
						label="최소 거래대금"
						value={form.watch("prevDayVolume.min")}
						onChange={(value) => form.setValue("prevDayVolume.min", value)}
						min={0}
						unit="억원"
					/>
					<SliderField
						label="상위 개수"
						value={form.watch("prevDayVolume.topN")}
						onChange={(value) => form.setValue("prevDayVolume.topN", value)}
						min={1}
						max={100}
						step={10}
					/>
				</FilterSection>

				{/* [C] 실시간 수급 필터 */}
				<FilterSection
					title="[C] 실시간 수급"
					enabled={form.watch("realtimeVolume.enabled")}
					onEnabledChange={(enabled) => form.setValue("realtimeVolume.enabled", enabled)}
				>
					<SelectField
						label="분봉 주기"
						value={String(form.watch("realtimeVolume.period"))}
						onChange={(value) => form.setValue("realtimeVolume.period", Number(value) as 1)}
						options={[
							{ value: "1", label: "1분" },
							{ value: "3", label: "3분" },
							{ value: "5", label: "5분" },
							{ value: "10", label: "10분" },
							{ value: "15", label: "15분" },
							{ value: "30", label: "30분" },
							{ value: "60", label: "60분" },
						]}
					/>
					<NumberInputField
						label="봉 오프셋"
						value={form.watch("realtimeVolume.candleOffset")}
						onChange={(value) => form.setValue("realtimeVolume.candleOffset", value)}
						min={0}
						unit="봉전"
					/>
					<NumberInputField
						label="최소 거래대금"
						value={form.watch("realtimeVolume.min")}
						onChange={(value) => form.setValue("realtimeVolume.min", value)}
						min={0}
						unit="억원"
					/>
					<SliderField
						label="상위 개수"
						value={form.watch("realtimeVolume.topN")}
						onChange={(value) => form.setValue("realtimeVolume.topN", value)}
						min={1}
						max={100}
						step={10}
					/>
				</FilterSection>

				{/* [D] 상승 지속성 필터 */}
				<FilterSection
					title="[D] 상승 지속성"
					enabled={form.watch("trend.enabled")}
					onEnabledChange={(enabled) => form.setValue("trend.enabled", enabled)}
				>
					<SelectField
						label="분봉 주기"
						value={String(form.watch("trend.period"))}
						onChange={(value) => form.setValue("trend.period", Number(value) as 1)}
						options={[
							{ value: "1", label: "1분" },
							{ value: "3", label: "3분" },
							{ value: "5", label: "5분" },
							{ value: "10", label: "10분" },
							{ value: "15", label: "15분" },
							{ value: "30", label: "30분" },
							{ value: "60", label: "60분" },
						]}
					/>
					<NumberInputField
						label="연속 봉 개수"
						value={form.watch("trend.consecutiveBars")}
						onChange={(value) => form.setValue("trend.consecutiveBars", value)}
						min={2}
						max={10}
						unit="봉"
					/>
					<SelectField
						label="방향"
						value={form.watch("trend.direction")}
						onChange={(value) => form.setValue("trend.direction", value)}
						options={[
							{ value: "up", label: "상승" },
							{ value: "down", label: "하락" },
						]}
					/>
					<SelectField
						label="가격 기준"
						value={form.watch("trend.priceType")}
						onChange={(value) => form.setValue("trend.priceType", value)}
						options={[
							{ value: "close", label: "종가" },
							{ value: "high", label: "고가" },
							{ value: "low", label: "저가" },
						]}
					/>
					<SliderField
						label="상위 개수"
						value={form.watch("trend.topN")}
						onChange={(value) => form.setValue("trend.topN", value)}
						min={1}
						max={100}
					/>
				</FilterSection>

				{/* 액션 버튼 */}
				<div className="flex gap-2">
					<Button type="submit" disabled={isLoading} className="flex-1">
						{isLoading ? "검색 중..." : "검색"}
					</Button>
					<Button type="button" variant="outline" onClick={handleReset} disabled={isLoading}>
						초기화
					</Button>
				</div>

				{/* 정보 표시 */}
				<div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
					<p className="font-medium">ℹ️ 교집합 방식</p>
					<p className="mt-1">
						각 필터의 상위 N개를 가져와 교집합을 구합니다. 예상 API 호출: 약 13~43회
					</p>
				</div>
			</form>
		</Form>
	);
}
