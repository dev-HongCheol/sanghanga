/**
 * @fileoverview 실시간 종목조회순위 TanStack Query 훅
 * @description useStockRanking 커스텀 훅
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import type { StockRankingRequest } from "../model/stock.types";
import { fetchStockRanking } from "./stockRanking.api";

/**
 * 실시간 종목조회순위 조회 훅
 * @param qry_tp - 구분 (1:1분, 2:10분, 3:1시간, 4:당일누적, 5:30초)
 * @returns TanStack Query 결과
 */
export function useStockRanking(qry_tp: StockRankingRequest["qry_tp"]) {
	return useQuery({
		queryKey: ["stockRanking", qry_tp],
		queryFn: () => fetchStockRanking({ qry_tp }),
		staleTime: 1000 * 30, // 30초
		gcTime: 1000 * 60 * 5, // 5분
		retry: 1,
	});
}
