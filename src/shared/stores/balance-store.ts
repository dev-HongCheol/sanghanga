/**
 * @fileoverview 잔고 전역 상태 관리 (Zustand)
 * @description 계좌 잔고를 전역으로 관리하고 모든 컴포넌트에서 접근 가능
 *
 * **사용 예시**:
 * ```typescript
 * // 전체 잔고 조회
 * const balance = useBalanceStore((state) => state.balance);
 *
 * // 선택적 구독 (totalEvaluationAmount만)
 * const totalAmount = useBalanceStore((state) => state.balance?.totalEvaluationAmount);
 *
 * // 특정 종목 보유 정보
 * const holding = useBalanceStore((state) => state.getHolding('005930'));
 * ```
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AccountBalance } from "@/features/grid-trader";

interface BalanceStore {
	/** 계좌 잔고 정보 */
	balance: AccountBalance | null;
	/** 로딩 상태 */
	isLoading: boolean;
	/** SSE 연결 상태 */
	isConnected: boolean;

	/** 잔고 업데이트 */
	setBalance: (balance: AccountBalance) => void;
	/** 로딩 상태 설정 */
	setLoading: (isLoading: boolean) => void;
	/** 연결 상태 설정 */
	setConnected: (isConnected: boolean) => void;
	/** 특정 종목 보유 정보 조회 */
	getHolding: (stockCode: string) => AccountBalance["holdings"][0] | null;
	/** 초기화 */
	reset: () => void;
}

/**
 * 잔고 전역 상태 Store
 */
export const useBalanceStore = create<BalanceStore>()(
	devtools(
		(set, get) => ({
			balance: null,
			isLoading: true,
			isConnected: false,

			setBalance: (balance) =>
				set(
					{ balance, isLoading: false },
					false,
					"setBalance"
				),

			setLoading: (isLoading) =>
				set({ isLoading }, false, "setLoading"),

			setConnected: (isConnected) =>
				set({ isConnected }, false, "setConnected"),

			getHolding: (stockCode) => {
				const { balance } = get();
				if (!balance) return null;
				return balance.holdings.find((h) => h.stockCode === stockCode) ?? null;
			},

			reset: () =>
				set(
					{ balance: null, isLoading: true, isConnected: false },
					false,
					"reset"
				),
		}),
		{ name: "BalanceStore" }
	)
);
