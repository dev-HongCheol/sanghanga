"use client";

/**
 * @fileoverview SSE Provider - 단일 SSE 연결 관리
 * @description EventSource 연결을 1개만 생성하고 데이터를 Zustand Store에 전달
 *
 * **사용법**:
 * ```tsx
 * // Layout 또는 Page에서 감싸기
 * <SSEProvider>
 *   <YourComponents />
 * </SSEProvider>
 * ```
 */

import type { AccountBalance, CurrentPrice } from "@/features/grid-trader";
import type { GridOrder } from "@/entities/grid-trader";
import { useBalanceStore } from "@/shared/stores/balance-store";
import { useOrderStore } from "@/shared/stores/order-store";
import { usePriceStore } from "@/shared/stores/price-store";
import { type ReactNode, useEffect, useRef } from "react";

interface SSEProviderProps {
	children: ReactNode;
}

/**
 * SSE Provider
 *
 * 단일 SSE 연결을 생성하고 받은 데이터를 Zustand Store에 저장합니다.
 */
export function SSEProvider({ children }: SSEProviderProps) {
	const eventSourceRef = useRef<EventSource | null>(null);

	useEffect(() => {
		// SSE 연결 생성 (단일 연결)
		const eventSource = new EventSource("/api/sse/realtime");
		eventSourceRef.current = eventSource;

		console.log("[SSE] 연결 시작...");

		// 연결 성공
		eventSource.onopen = () => {
			console.log("[SSE] 연결 성공");
			useBalanceStore.getState().setConnected(true);
			usePriceStore.getState().setConnected(true);
			useOrderStore.getState().setConnected(true);
		};

		// 연결 오류
		eventSource.onerror = (error) => {
			console.error("[SSE] 연결 오류:", error);
			useBalanceStore.getState().setConnected(false);
			usePriceStore.getState().setConnected(false);
			useOrderStore.getState().setConnected(false);
		};

		// 연결 확인 이벤트
		eventSource.addEventListener("connected", (event: MessageEvent) => {
			try {
				const data = JSON.parse(event.data);
				console.log("[SSE] 서버 연결 확인:", data);
			} catch (error) {
				console.error("[SSE] 연결 확인 파싱 오류:", error);
			}
		});

		// 가격 이벤트
		eventSource.addEventListener("price", (event: MessageEvent) => {
			try {
				const data: { stockCode: string; priceInfo: CurrentPrice } = JSON.parse(event.data);
				usePriceStore.getState().setPrice(data.stockCode, data.priceInfo);
			} catch (error) {
				console.error("[SSE] 가격 파싱 오류:", error);
			}
		});

		// 잔고 이벤트
		eventSource.addEventListener("balance", (event: MessageEvent) => {
			try {
				const data: { accountId: string; balance: AccountBalance } = JSON.parse(event.data);
				useBalanceStore.getState().setBalance(data.balance);
			} catch (error) {
				console.error("[SSE] 잔고 파싱 오류:", error);
			}
		});

		// 주문 이벤트
		eventSource.addEventListener("orders", (event: MessageEvent) => {
			try {
				const data: { strategyId: string; orders: GridOrder[] } = JSON.parse(event.data);
				useOrderStore.getState().setOrders(data.strategyId, data.orders);
			} catch (error) {
				console.error("[SSE] 주문 파싱 오류:", error);
			}
		});

		// Heartbeat 이벤트 (연결 유지)
		eventSource.addEventListener("heartbeat", () => {
			// Do nothing, just keep connection alive
		});

		// Cleanup
		return () => {
			eventSource.close();
			console.log("[SSE] 연결 종료");
			useBalanceStore.getState().setConnected(false);
			usePriceStore.getState().setConnected(false);
			useOrderStore.getState().setConnected(false);
		};
	}, []);

	return <>{children}</>;
}
