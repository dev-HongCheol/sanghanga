/**
 * @fileoverview 테마 대장주 페이지
 * @description 테마별 대장주 조회
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "테마 대장주 - Sanghanga",
	description: "테마별 대장주 실시간 조회",
};

/**
 * 테마 대장주 페이지
 */
export default function ThemeLeaderPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold">테마 대장주</h1>
				<p className="text-muted-foreground">인기 테마별 대장주를 확인하세요</p>
			</div>

			<div>
				{/* 향후 ThemeLeaderWidget 추가 예정 */}
				<p className="text-sm text-muted-foreground">위젯 구현 예정</p>
			</div>
		</div>
	);
}
