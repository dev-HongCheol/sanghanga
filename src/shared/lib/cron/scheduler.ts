/**
 * @fileoverview Cron 스케줄러
 * @description Next.js 서버 내부에서 실행되는 실시간 데이터 동기화 스케줄러
 *
 * **실행 주기**:
 * - 가격 동기화: 1초마다 (활성 전략 종목 현재가)
 * - 잔고 동기화: 3초마다 (계좌 잔고)
 * - 체결 감지: 2초마다 (체결 이벤트 감지 및 카운터 주문 생성)
 * - 리밸런싱 체크: 09:00~10:00 KST 1분, 이후 10분 간격 (그리드 이탈 시 자동 리밸런싱)
 * - 미체결 주문 정리: 매일 08:00 평일 (전날 PENDING 주문 CANCELLED 처리)
 *
 * **장중 제어**:
 * - ENABLE_CRON=true 환경변수 필수
 * - 장시간(평일 09:00~18:00)만 실행 (로컬 시간 기준)
 * - 정규장(09:00~15:30) + 시간외 거래(15:40~18:00) 모두 포함
 * - 미체결 주문 정리는 장시간 체크 없이 항상 실행
 */

import { checkFillsLogic } from "@/features/grid-trader/lib/cron/checkFills";
import { checkRebalanceLogic } from "@/features/grid-trader/lib/cron/checkRebalance";
import { cleanupStaleOrdersLogic } from "@/features/grid-trader/lib/cron/cleanupStaleOrders";
import { syncBalanceLogic } from "@/features/grid-trader/lib/cron/syncBalance";
import { syncPricesLogic } from "@/features/grid-trader/lib/cron/syncPrices";
import cron, { type ScheduledTask } from "node-cron";
import { logger } from "../logger";
import { isMarketOpen } from "../time/market-hours";

// 환경변수
const IS_CRON_ENABLED = process.env.ENABLE_CRON === "true";

// Cron 실행 여부 플래그 (한 번만 실행)
let isStarted = false;

// 리밸런싱 마지막 실행 시각 (09:00~10:00 외 시간대의 10분 간격 제어용)
let lastRebalanceRunAt = 0;

/**
 * 가격 동기화 Cron (1초마다)
 */
function startPriceSyncCron(): ScheduledTask {
	const task = cron.schedule("* * * * * *", async () => {
		if (!IS_CRON_ENABLED) return;

		// 장시간 체크
		if (!isMarketOpen()) {
			return;
		}

		await syncPricesLogic();
	});

	logger.info("CronScheduler", "가격 동기화 Cron 시작 (1초 주기, 장중만)", undefined, true);
	return task;
}

/**
 * 잔고 동기화 Cron (3초마다)
 * @description 잔고는 장 마감 후에도 조회 가능하므로 장시간 체크 없음
 */
function startBalanceSyncCron(): ScheduledTask {
	const task = cron.schedule("*/3 * * * * *", async () => {
		if (!IS_CRON_ENABLED) return;

		await syncBalanceLogic();
	});

	logger.info("CronScheduler", "잔고 동기화 Cron 시작 (3초 주기, 항상)", undefined, true);
	return task;
}

/**
 * 체결 감지 Cron (2초마다)
 * @description 체결 이벤트 감지 및 카운터 주문 생성 (장중만)
 */
function startFillCheckCron(): ScheduledTask {
	const task = cron.schedule("*/2 * * * * *", async () => {
		if (!IS_CRON_ENABLED) return;

		// 장시간 체크
		if (!isMarketOpen()) {
			return;
		}

		await checkFillsLogic();
	});

	logger.info("CronScheduler", "체결 감지 Cron 시작 (2초 주기, 장중만)", undefined, true);
	return task;
}

/**
 * 리밸런싱 체크 Cron (09:00~10:00 KST 1분, 이후 10분 간격)
 * @description 장 초반 급변동 대응을 위해 09:00~10:00은 1분 간격으로 체크
 */
function startRebalanceCheckCron(): ScheduledTask {
	const task = cron.schedule("* * * * *", async () => {
		if (!IS_CRON_ENABLED) return;
		if (!isMarketOpen()) return;

		// KST 기준 현재 시각의 시(hour) 추출
		const nowKST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
		const hour = nowKST.getHours();

		// 09:00~10:00 장 초반은 1분 간격으로 체크
		const isVolatileHour = hour === 9;

		if (!isVolatileHour) {
			// 그 외 시간대는 10분 이상 경과 시에만 실행
			const elapsed = Date.now() - lastRebalanceRunAt;
			if (elapsed < 10 * 60 * 1000) return;
		}

		lastRebalanceRunAt = Date.now();
		await checkRebalanceLogic();
	});

	logger.info(
		"CronScheduler",
		"리밸런싱 체크 Cron 시작 (09:00~10:00 1분, 이후 10분 주기, 장중만)",
		undefined,
		true
	);
	return task;
}

/**
 * 미체결 주문 정리 Cron (매일 08:00, 평일)
 * @description 전날 PENDING 주문을 CANCELLED로 일괄 처리 (장시간 체크 없음)
 */
function startCleanupStaleOrdersCron(): ScheduledTask {
	// 초 분 시 일 월 요일
	const task = cron.schedule("0 0 8 * * 1-5", async () => {
		if (!IS_CRON_ENABLED) return;

		await cleanupStaleOrdersLogic();
	});

	logger.info("CronScheduler", "미체결 주문 정리 Cron 시작 (평일 08:00)", undefined, true);
	return task;
}

/**
 * Cron 스케줄러 시작 (한 번만 실행)
 */
export function startCronScheduler(): void {
	// 이미 시작되었으면 무시
	if (isStarted) {
		return;
	}

	isStarted = true;

	logger.info("CronScheduler", "========================================", undefined, true);
	logger.info("CronScheduler", "Grid Trader Cron Scheduler", undefined, true);
	logger.info(
		"CronScheduler",
		`ENABLE_CRON: ${IS_CRON_ENABLED ? "활성" : "비활성"}`,
		undefined,
		true
	);
	logger.info("CronScheduler", "장시간 제어: 평일 09:00~18:00 (KST)", undefined, true);
	logger.info("CronScheduler", "정규장 + 시간외 거래 모두 포함", undefined, true);
	logger.info("CronScheduler", "========================================", undefined, true);

	if (!IS_CRON_ENABLED) {
		logger.warn(
			"CronScheduler",
			"Cron이 비활성화되어 있습니다. 활성화하려면 ENABLE_CRON=true 설정",
			undefined,
			true
		);
		return;
	}

	// 현재 장시간 상태 로깅
	const marketOpen = isMarketOpen();
	logger.info(
		"CronScheduler",
		`현재 시각 장시간: ${marketOpen ? "✅ 장중 (Cron 실행됨)" : "❌ 장 마감 (Cron 대기 중)"}`,
		undefined,
		true
	);

	// Cron Jobs 시작
	startPriceSyncCron();
	startBalanceSyncCron();
	startFillCheckCron();
	startRebalanceCheckCron();
	startCleanupStaleOrdersCron();

	logger.info("CronScheduler", "모든 Cron Jobs 시작 완료", undefined, true);
}
