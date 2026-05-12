"use client";

/**
 * @fileoverview 실시간 활성 주문 테이블
 * @description Zustand Store에서 실시간 현재가를 구독하고 주문 목록과 함께 표시
 */

import type { GridOrder } from "@/entities/grid-trader";
import { usePriceStore } from "@/shared/stores/price-store";
import { ActiveOrdersTable } from "./ActiveOrdersTable";

interface RealtimeActiveOrdersTableProps {
	/** 활성 주문 목록 */
	orders: GridOrder[];
	/** 종목코드 */
	stockCode: string;
}

/**
 * 실시간 활성 주문 테이블
 */
export function RealtimeActiveOrdersTable({ orders, stockCode }: RealtimeActiveOrdersTableProps) {
	// Zustand Store에서 현재가만 구독
	const currentPrice = usePriceStore((state) => state.prices[stockCode]?.currentPrice ?? 0);

	return <ActiveOrdersTable orders={orders} currentPrice={currentPrice} />;
}
