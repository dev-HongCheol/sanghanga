"use client";

/**
 * @fileoverview 실시간 잔고 표시 컴포넌트
 * @description Zustand Store에서 실시간 잔고를 구독하고 표시
 */

import { useBalanceStore } from "@/shared/stores/balance-store";
import { AccountBalancePanel } from "./AccountBalance";

interface RealtimeBalanceDisplayProps {
	/** 종목코드 (특정 종목 보유 정보 표시용) */
	stockCode: string;
}

/**
 * 실시간 잔고 표시 컴포넌트
 */
export function RealtimeBalanceDisplay({ stockCode }: RealtimeBalanceDisplayProps) {
	// Zustand Store에서 선택적 구독
	const balance = useBalanceStore((state) => state.balance);
	const isLoading = useBalanceStore((state) => state.isLoading);
	const isConnected = useBalanceStore((state) => state.isConnected);

	if (isLoading) {
		return <p className="text-sm text-muted-foreground">잔고 로딩 중...</p>;
	}

	if (!isConnected) {
		return <p className="text-sm text-destructive">연결 끊김 (재연결 중...)</p>;
	}

	if (!balance) {
		return <p className="text-sm text-muted-foreground">잔고 조회 실패</p>;
	}

	return <AccountBalancePanel balance={balance} stockCode={stockCode} />;
}
