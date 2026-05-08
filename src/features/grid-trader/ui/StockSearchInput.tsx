"use client";

import { Input } from "@/shared/ui/input";
import { useEffect, useRef, useState } from "react";
import type { StockInfo } from "../api/searchStock.action";
import { searchStockAction } from "../api/searchStock.action";

interface StockSearchInputProps {
	/** 현재 선택된 종목명 (표시용) */
	value?: string;
	/** 종목 선택 콜백 */
	onSelect: (code: string, name: string) => void;
	/** 추가 className */
	className?: string;
}

/**
 * 종목 검색 인풋 (자동완성 콤보박스)
 *
 * 300ms 디바운스로 searchStockAction(ka10099)을 호출하고
 * 드롭다운에 검색 결과를 표시한다. 선택 시 onSelect 콜백을 호출한다.
 */
export function StockSearchInput({ value, onSelect, className }: StockSearchInputProps) {
	const [query, setQuery] = useState(value ?? "");
	const [results, setResults] = useState<StockInfo[]>([]);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// 외부 클릭 시 드롭다운 닫기
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// 디바운스 검색
	useEffect(() => {
		if (query.trim().length < 1) {
			setResults([]);
			setOpen(false);
			return;
		}

		const timer = setTimeout(async () => {
			setLoading(true);
			const result = await searchStockAction(query);
			setLoading(false);
			if (result.success) {
				setResults(result.stocks);
				setOpen(result.stocks.length > 0);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [query]);

	/**
	 * 종목 선택 처리
	 */
	function handleSelect(stock: StockInfo) {
		setQuery(stock.name);
		setResults([]);
		setOpen(false);
		onSelect(stock.code, stock.name);
	}

	return (
		<div ref={containerRef} className={`relative ${className ?? ""}`}>
			<Input
				placeholder="종목명 또는 코드 입력"
				value={query}
				onChange={(e) => {
					setQuery(e.target.value);
					if (!e.target.value) onSelect("", "");
				}}
				autoComplete="off"
			/>
			{loading && (
				<p className="absolute right-3 top-2.5 text-xs text-muted-foreground">검색중...</p>
			)}
			{open && results.length > 0 && (
				<ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md">
					{results.map((stock) => (
						<li
							key={stock.code}
							className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-accent"
							onMouseDown={() => handleSelect(stock)}
						>
							<span className="font-medium">{stock.name}</span>
							<span className="text-muted-foreground">{stock.code}</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
