/**
 * @fileoverview Next.js Instrumentation Hook
 * @description 서버 시작 시 자동으로 실행되는 초기화 함수
 *
 * **실행 시기**: Next.js 서버 시작 시 (개발/프로덕션 공통)
 * **용도**: Cron 스케줄러 자동 시작
 *
 * **참고**: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
	// Node.js 런타임에서만 실행 (Edge Runtime 제외)
	if (process.env.NEXT_RUNTIME === "nodejs") {
		const { startCronScheduler } = await import("./src/shared/lib/cron/scheduler");

		// Cron 스케줄러 시작
		startCronScheduler();

		console.log("✅ [Instrumentation] 초기화 완료");
	}
}
