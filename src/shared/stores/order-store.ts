/**
 * @fileoverview 주문 목록 전역 상태 관리 (Zustand)
 * @description 전략별 주문 목록을 전역으로 관리하고 모든 컴포넌트에서 접근 가능
 *
 * **사용 예시**:
 * ```typescript
 * // 특정 전략의 주문 목록 조회
 * const orders = useOrderStore((state) => state.ordersByStrategy['strategy-id']);
 *
 * // 모든 전략의 주문 목록
 * const allOrders = useOrderStore((state) => state.ordersByStrategy);
 * ```
 */

import type { GridOrder } from "@/entities/grid-trader";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface OrderStore {
	/** 전략별 주문 목록 (전략 ID → GridOrder[]) */
	ordersByStrategy: Record<string, GridOrder[]>;
	/** 로딩 상태 */
	isLoading: boolean;
	/** SSE 연결 상태 */
	isConnected: boolean;

	/** 주문 목록 업데이트 (특정 전략) */
	setOrders: (strategyId: string, orders: GridOrder[]) => void;
	/** 로딩 상태 설정 */
	setLoading: (isLoading: boolean) => void;
	/** 연결 상태 설정 */
	setConnected: (isConnected: boolean) => void;
	/** 특정 전략의 주문 목록 조회 */
	getOrders: (strategyId: string) => GridOrder[];
	/** 초기화 */
	reset: () => void;
}

/**
 * 주문 목록 전역 상태 Store
 */
export const useOrderStore = create<OrderStore>()(
	devtools(
		(set, get) => ({
			ordersByStrategy: {},
			isLoading: true,
			isConnected: false,

			setOrders: (strategyId, orders) =>
				set(
					(state) => ({
						ordersByStrategy: {
							...state.ordersByStrategy,
							[strategyId]: orders,
						},
						isLoading: false,
					}),
					false,
					"setOrders"
				),

			setLoading: (isLoading) => set({ isLoading }, false, "setLoading"),

			setConnected: (isConnected) => set({ isConnected }, false, "setConnected"),

			getOrders: (strategyId) => {
				const { ordersByStrategy } = get();
				return ordersByStrategy[strategyId] ?? [];
			},

			reset: () =>
				set({ ordersByStrategy: {}, isLoading: true, isConnected: false }, false, "reset"),
		}),
		{ name: "OrderStore" }
	)
);
