/**
 * 주가/등락률 색상 표시 컴포넌트
 *
 * 한국/미국 시장별 색상 규칙에 따라 상승/하락을 색상으로 표시합니다.
 */

"use client";

import { usePriceColorScheme, type PriceColorScheme } from "../model/priceColorScheme.store";
import { cn } from "../lib/utils";

/**
 * ColoredValue 컴포넌트 Props
 */
interface ColoredValueProps {
	/** 표시할 값 (숫자) */
	value: number;
	/** 등락 방향 (value의 부호로 자동 판단, 선택적) */
	change?: number;
	/** 부호 표시 여부 (기본값: false) */
	showSign?: boolean;
	/** 색상 스킴 (선택적, 기본값: 전역 설정) */
	colorScheme?: PriceColorScheme;
	/** 추가 className */
	className?: string;
}

/**
 * 주가/등락률 색상 표시 컴포넌트
 *
 * @example
 * // 현재가 (항상 양수, 색상만)
 * <ColoredValue value={170000} change={changeRate} />
 *
 * @example
 * // 등락률 (부호 + 색상)
 * <ColoredValue value={-35} showSign />
 *
 * @example
 * // 거래대금 (부호 없이 색상만)
 * <ColoredValue value={5000} change={changeFromPrevDay} />
 */
export function ColoredValue({
	value,
	change,
	showSign = false,
	colorScheme,
	className,
}: ColoredValueProps) {
	const globalScheme = usePriceColorScheme((state) => state.scheme);
	const scheme = colorScheme ?? globalScheme;

	// 상승/하락 판단
	const changeValue = change !== undefined ? change : value;
	const isPositive = changeValue > 0;
	const isNegative = changeValue < 0;

	// 색상 결정
	let colorClass = "";
	if (scheme === "korea") {
		// 한국: 상승=빨강, 하락=파랑
		if (isPositive) colorClass = "text-red-500";
		if (isNegative) colorClass = "text-blue-500";
	} else {
		// 미국: 상승=초록, 하락=빨강
		if (isPositive) colorClass = "text-green-500";
		if (isNegative) colorClass = "text-red-500";
	}

	// 부호 추가
	const displayValue = Math.abs(value);
	const sign = showSign ? (isPositive ? "+" : isNegative ? "-" : "") : "";

	return <span className={cn(colorClass, className)}>{`${sign}${displayValue.toLocaleString()}`}</span>;
}
