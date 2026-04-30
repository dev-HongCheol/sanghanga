import { PageHeader } from "@/shared/ui";

/**
 * 테마 대장주 발굴 페이지
 *
 * 테마주 분석을 통해 대장주를 발굴합니다.
 */
export default function ThemeLeaderPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="테마 대장주"
				description="주도 테마를 파악하고 그 중 대장주를 판별합니다."
			/>

			{/* TODO: 테마 대장주 스캔 기능 구현 */}
			<div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
				<p>테마 대장주 기능 구현 예정</p>
				<p className="mt-2 text-sm">개발 예정 기능:</p>
				<ul className="mt-2 space-y-1 text-sm">
					<li>• 주도 테마주 판단</li>
					<li>• 그 중 대장주 판별</li>
					<li>• 거래대금 급증 확인</li>
					<li>• 프로그램 매수 확인</li>
					<li>• 과매수 구간 여부 확인</li>
				</ul>
			</div>
		</div>
	);
}
