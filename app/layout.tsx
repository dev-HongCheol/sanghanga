/**
 * @fileoverview 루트 레이아웃
 * @description 애플리케이션의 최상위 레이아웃으로 모든 페이지에 공통으로 적용됩니다
 */

import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import "@/app/styles/globals.css";

export const metadata: Metadata = {
	title: "상한가 - 키움증권 트레이딩 플랫폼",
	description: "키움증권 REST API를 활용한 실시간 웹 트레이딩 플랫폼",
};

/**
 * 루트 레이아웃
 */
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ko" className="dark">
			<body className="antialiased">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
