/**
 * @fileoverview 현재가 전역 상태 관리 (Zustand)
 * @description 종목별 현재가를 전역으로 관리하고 모든 컴포넌트에서 접근 가능
 *
 * **사용 예시**:
 * ```typescript
 * // 특정 종목 현재가 조회
 * const priceInfo = usePriceStore((state) => state.prices['005930']);
 * const currentPrice = usePriceStore((state) => state.prices['005930']?.currentPrice);
 *
 * // 모든 종목 현재가
 * const allPrices = usePriceStore((state) => state.prices);
 * ```
 */

import type { CurrentPrice } from "@/features/grid-trader";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface PriceStore {
	/** 종목별 현재가 정보 (종목코드 → CurrentPrice) */
	prices: Record<string, CurrentPrice>;
	/** 로딩 상태 */
	isLoading: boolean;
	/** SSE 연결 상태 */
	isConnected: boolean;

	/** 현재가 업데이트 (단일 종목) */
	setPrice: (stockCode: string, priceInfo: CurrentPrice) => void;
	/** 로딩 상태 설정 */
	setLoading: (isLoading: boolean) => void;
	/** 연결 상태 설정 */
	setConnected: (isConnected: boolean) => void;
	/** 특정 종목 현재가 조회 */
	getPrice: (stockCode: string) => CurrentPrice | null;
	/** 초기화 */
	reset: () => void;
}

/**
 * 현재가 전역 상태 Store
 */
export const usePriceStore = create<PriceStore>()(
	devtools(
		(set, get) => ({
			prices: {},
			isLoading: true,
			isConnected: false,

			setPrice: (stockCode, priceInfo) =>
				set(
					(state) => ({
						prices: {
							...state.prices,
							[stockCode]: priceInfo,
						},
						isLoading: false,
					}),
					false,
					"setPrice"
				),

			setLoading: (isLoading) => set({ isLoading }, false, "setLoading"),

			setConnected: (isConnected) => set({ isConnected }, false, "setConnected"),

			getPrice: (stockCode) => {
				const { prices } = get();
				return prices[stockCode] ?? null;
			},

			reset: () => set({ prices: {}, isLoading: true, isConnected: false }, false, "reset"),
		}),
		{ name: "PriceStore" }
	)
);
