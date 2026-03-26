/**
 * @fileoverview 에러 페이지
 * @description 애플리케이션에서 에러 발생 시 표시되는 페이지 (Client Component)
 */
"use client";

import { useEffect } from "react";

/**
 * 에러 페이지
 */
export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-8">
			<h2 className="text-2xl font-bold mb-4">문제가 발생했습니다</h2>
			<p className="text-gray-600 mb-8">{error.message}</p>
			<button
				type="button"
				onClick={() => reset()}
				className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
			>
				다시 시도
			</button>
		</div>
	);
}
