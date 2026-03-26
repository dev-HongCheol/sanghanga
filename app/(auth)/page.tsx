/**
 * @fileoverview 메인 페이지
 * @description 애플리케이션의 메인 대시보드 페이지
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "대시보드 - Sanghanga",
	description: "실시간 주식 거래 대시보드",
};

/**
 * 메인 대시보드 페이지
 */
export default function HomePage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold">대시보드</h1>
				<p className="text-muted-foreground">
					키움증권 REST API를 활용한 실시간 웹 트레이딩 플랫폼
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{/* 향후 위젯 추가 예정 */}</div>
		</div>
	);
}
