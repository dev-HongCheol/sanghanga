import type { Metadata } from "next";
import "./globals.css";

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
		<html lang="ko">
			<body>{children}</body>
		</html>
	);
}
