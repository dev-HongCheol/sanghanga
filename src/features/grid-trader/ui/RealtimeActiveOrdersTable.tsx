"use client";

/**
 * @fileoverview 실시간 활성 주문 테이블
 * @description Zustand Store에서 실시간 현재가 및 주문 목록을 구독하여 표시
 */

import type { GridOrder } from "@/entities/grid-trader";
import { useOrderStore } from "@/shared/stores/order-store";
import { usePriceStore } from "@/shared/stores/price-store";
import { useEffect } from "react";
import { ActiveOrdersTable } from "./ActiveOrdersTable";

interface RealtimeActiveOrdersTableProps {
	/** 전략 ID */
	strategyId: string;
	/** 종목코드 */
	stockCode: string;
	/** 초기 주문 목록 (SSR props) */
	initialOrders: GridOrder[];
}

/**
 * 실시간 활성 주문 테이블
 */
export function RealtimeActiveOrdersTable({
	strategyId,
	stockCode,
	initialOrders,
}: RealtimeActiveOrdersTableProps) {
	// Zustand Store에서 현재가 구독
	const currentPrice = usePriceStore((state) => state.prices[stockCode]?.currentPrice ?? 0);

	// Zustand Store에서 주문 목록 구독
	const orders = useOrderStore((state) => state.ordersByStrategy[strategyId] ?? initialOrders);

	// SSR props를 store 초기값으로 설정
	useEffect(() => {
		if (initialOrders.length > 0) {
			useOrderStore.getState().setOrders(strategyId, initialOrders);
		}
	}, [strategyId, initialOrders]);

	return <ActiveOrdersTable orders={orders} currentPrice={currentPrice} />;
}
