/**
 * @fileoverview 애플리케이션 전역 Providers
 * @description 모든 Provider를 통합하여 제공
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * 애플리케이션 전역 Providers
 * @description 향후 추가되는 모든 Provider는 여기에 통합
 */
export function Providers({ children }: { children: React.ReactNode }) {
	// SSR safe: 각 요청마다 새로운 QueryClient 인스턴스 생성
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// SSR에서 클라이언트 즉시 refetch 방지
						staleTime: 1000 * 60, // 1분
						gcTime: 1000 * 60 * 5, // 5분
						retry: 1,
						refetchOnWindowFocus: false, // 성능: 포커스 시 refetch 비활성화
					},
				},
			})
	);

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
