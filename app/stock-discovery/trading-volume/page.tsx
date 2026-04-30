"use client";

import { useState, useCallback, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { PageHeader } from "@/shared/ui";
import {
	TradingVolumeScreenerForm,
	ScreenerResultTable,
	type StockScreenerFormValues,
	type ScreenerResult,
	searchStocksAction,
} from "@/features/trading-volume-screener";

/**
 * 거래대금 기반 종목 검색 페이지
 *
 * 거래대금, 시가총액, 상승 패턴 조건을 조합하여 종목을 검색합니다.
 * 무한 스크롤을 지원하여 25개씩 자동 로딩합니다.
 */
export default function TradingVolumePage() {
	const [results, setResults] = useState<ScreenerResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const [totalCount, setTotalCount] = useState(0);

	const currentPageRef = useRef(1);
	const currentFiltersRef = useRef<StockScreenerFormValues | null>(null);

	/**
	 * 검색 실행 (초기 검색)
	 */
	const handleSearch = async (values: StockScreenerFormValues) => {
		setIsLoading(true);
		setResults([]);
		setHasMore(false);
		setTotalCount(0);
		currentPageRef.current = 1;
		currentFiltersRef.current = values;

		try {
			const result = await searchStocksAction(values, 1, 25);

			if (result.success) {
				setResults(result.results);
				setHasMore(result.hasMore);
				setTotalCount(result.totalCount);
			} else {
				alert(result.error);
			}
		} catch (error) {
			console.error("검색 실패:", error);
			alert("검색 중 오류가 발생했습니다.");
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * 다음 페이지 로드 (무한 스크롤)
	 */
	const loadMore = useCallback(async () => {
		if (!currentFiltersRef.current || isLoadingMore || !hasMore) {
			return;
		}

		setIsLoadingMore(true);
		const nextPage = currentPageRef.current + 1;

		try {
			const result = await searchStocksAction(currentFiltersRef.current, nextPage, 25);

			if (result.success) {
				setResults((prev) => [...prev, ...result.results]);
				setHasMore(result.hasMore);
				currentPageRef.current = nextPage;
			}
		} catch (error) {
			console.error("추가 로딩 실패:", error);
		} finally {
			setIsLoadingMore(false);
		}
	}, [hasMore, isLoadingMore]);

	/**
	 * Intersection Observer로 마지막 요소 감지
	 */
	const { ref: loadMoreRef } = useInView({
		threshold: 0,
		onChange: (inView) => {
			if (inView && hasMore && !isLoadingMore) {
				loadMore();
			}
		},
	});

	return (
		<div className="space-y-6">
			<PageHeader
				title="거래대금 기반"
				description="거래대금, 시가총액, 상승 패턴 조건을 조합하여 종목을 검색합니다."
			/>

			<div className="grid gap-6 lg:grid-cols-[380px_1fr]">
				{/* 왼쪽: 필터 폼 */}
				<div>
					<TradingVolumeScreenerForm onSubmit={handleSearch} isLoading={isLoading} />
				</div>

				{/* 오른쪽: 결과 테이블 */}
				<div className="space-y-4">
					{isLoading ? (
						<div className="flex h-96 items-center justify-center rounded-lg border border-dashed">
							<p className="text-muted-foreground">검색 중...</p>
						</div>
					) : (
						<>
							{/* 결과 요약 */}
							{totalCount > 0 && (
								<div className="text-sm text-muted-foreground">
									총 {totalCount}개 종목 발견 (현재 {results.length}개 표시)
								</div>
							)}

							{/* 결과 테이블 */}
							<ScreenerResultTable results={results} />

							{/* 무한 스크롤 트리거 */}
							{hasMore && (
								<div ref={loadMoreRef} className="flex justify-center py-4">
									{isLoadingMore && (
										<p className="text-sm text-muted-foreground">
											추가 로딩 중...
										</p>
									)}
								</div>
							)}

							{/* 모든 결과 로드 완료 */}
							{!hasMore && results.length > 0 && (
								<div className="text-center text-sm text-muted-foreground py-4">
									모든 결과를 불러왔습니다.
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
