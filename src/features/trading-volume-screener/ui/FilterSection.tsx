"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Slider } from "@/shared/ui/slider";
import type { ReactNode } from "react";

interface FilterSectionProps {
	/** 섹션 제목 */
	title: string;
	/** 필터 활성화 여부 */
	enabled: boolean;
	/** 활성화 토글 핸들러 */
	onEnabledChange: (enabled: boolean) => void;
	/** 섹션 내용 */
	children: ReactNode;
}

/**
 * 필터 섹션 컴포넌트
 *
 * 체크박스로 활성화/비활성화할 수 있는 필터 섹션입니다.
 */
export function FilterSection({ title, enabled, onEnabledChange, children }: FilterSectionProps) {
	return (
		<Card className={!enabled ? "opacity-50" : ""}>
			<CardHeader>
				<div className="flex items-center space-x-2">
					<Checkbox id={`filter-${title}`} checked={enabled} onCheckedChange={onEnabledChange} />
					<CardTitle className="text-base">
						<label htmlFor={`filter-${title}`} className="cursor-pointer">
							{title}
						</label>
					</CardTitle>
				</div>
			</CardHeader>
			<CardContent>
				<fieldset disabled={!enabled} className="space-y-4">
					{children}
				</fieldset>
			</CardContent>
		</Card>
	);
}

interface NumberInputFieldProps {
	/** 라벨 */
	label: string;
	/** 값 */
	value: number;
	/** 변경 핸들러 */
	onChange: (value: number) => void;
	/** 최소값 */
	min?: number;
	/** 최대값 */
	max?: number;
	/** 단위 (표시용) */
	unit?: string;
	/** 크기 변경 사이즈 */
	step?: number;
}

/**
 * 숫자 입력 필드
 */
export function NumberInputField({
	label,
	value,
	onChange,
	min = 0,
	max,
	unit,
	step = 1,
}: NumberInputFieldProps) {
	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<div className="flex items-center gap-2">
				<Input
					type="number"
					value={value}
					onChange={(e) => onChange(Number(e.target.value))}
					min={min}
					max={max}
					className="flex-1"
					step={step}
				/>
				{unit && <span className="text-sm text-muted-foreground">{unit}</span>}
			</div>
		</div>
	);
}

interface SelectFieldProps<T extends string> {
	/** 라벨 */
	label: string;
	/** 값 */
	value: T;
	/** 변경 핸들러 */
	onChange: (value: T) => void;
	/** 옵션 리스트 */
	options: { value: T; label: string }[];
}

/**
 * 선택 필드
 */
export function SelectField<T extends string>({
	label,
	value,
	onChange,
	options,
}: SelectFieldProps<T>) {
	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

interface SliderFieldProps {
	/** 라벨 */
	label: string;
	/** 값 */
	value: number;
	/** 변경 핸들러 */
	onChange: (value: number) => void;
	/** 최소값 */
	min: number;
	/** 최대값 */
	max: number;
	/** 단계 */
	step?: number;
}

/**
 * 슬라이더 필드
 */
export function SliderField({ label, value, onChange, min, max, step = 1 }: SliderFieldProps) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label>{label}</Label>
				<span className="text-sm text-muted-foreground">{value}</span>
			</div>
			<Slider
				value={[value]}
				onValueChange={([newValue]) => onChange(newValue)}
				min={min}
				max={max}
				step={step}
			/>
		</div>
	);
}
