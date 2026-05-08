"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface PollingRefresherProps {
	/** 폴링 간격 (ms, 기본값: 1000) */
	intervalMs?: number;
}

/**
 * 서버 컴포넌트 데이터를 주기적으로 새로고침하는 클라이언트 컴포넌트
 *
 * router.refresh()를 intervalMs마다 호출해 서버 컴포넌트를 재실행한다.
 * 실시간 잔고·주문 현황 업데이트에 사용된다.
 */
export function PollingRefresher({ intervalMs = 1000 }: PollingRefresherProps) {
	const router = useRouter();

	useEffect(() => {
		const id = setInterval(() => router.refresh(), intervalMs);
		return () => clearInterval(id);
	}, [router, intervalMs]);

	return null;
}
