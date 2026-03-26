/**
 * @fileoverview 로딩 페이지
 * @description 페이지 로딩 중 표시되는 스피너 컴포넌트
 */

/**
 * 로딩 페이지
 */
export default function Loading() {
	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
		</div>
	);
}
