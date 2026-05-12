/**
 * @fileoverview 서버 사이드 로깅 래퍼
 * @description
 * console 기반 로깅 (향후 pino로 교체 가능)
 *
 * **폴링 로그 제어 시스템**:
 * - 폴링 API 호출 로그는 기본적으로 숨김 처리 (과도한 로그 출력 방지)
 * - `logger.info(context, message, meta, true)` 형태로 폴링 로그 플래그 전달
 * - 런타임에서 `logger.setShowPollingLogs(true/false)`로 가시성 토글 가능
 * - 환경변수 `SHOW_POLLING_LOGS=true`로 기본값 설정 가능
 * - API 엔드포인트: `GET /api/debug/polling-logs?show=true|false`
 *
 * @example
 * // 일반 로그 (항상 표시)
 * logger.info("Context", "메시지", { key: "value" });
 *
 * @example
 * // 폴링 로그 (showPollingLogs=true일 때만 표시)
 * logger.info("GetAccountBalance", "조회 완료", { amount: 1000 }, true);
 */

const isDev = process.env.NODE_ENV === "development";

/**
 * 폴링 로그 표시 여부 (실시간 변경 가능)
 * 환경변수 SHOW_POLLING_LOGS=true로 기본값 설정 가능
 */
let showPollingLogs = process.env.SHOW_POLLING_LOGS === "true";

/**
 * 로그 메타데이터 타입
 */
type LogMeta = Record<string, unknown>;

/**
 * 포맷된 로그 출력
 */
function formatLog(level: string, context: string, message: string, _meta?: LogMeta): string {
	const timestamp = new Date().toISOString();
	return `[${timestamp}] [${level}] ${context}: ${message}`;
}

/**
 * 로거 객체
 * 향후 pino 적용 시 이 객체만 교체하면 됨
 */
export const logger = {
	/**
	 * 에러 로그 (항상 출력)
	 * @param context - 발생 위치 (예: "KiwoomAuth", "StockRankingAPI")
	 * @param message - 에러 메시지
	 * @param meta - 추가 정보 (statusCode, error, stack 등)
	 */
	error(context: string, message: string, meta?: LogMeta): void {
		console.error(formatLog("🔴", context, message), meta ? { ...meta } : "");
	},

	/**
	 * 경고 로그 (항상 출력)
	 * @param context - 발생 위치
	 * @param message - 경고 메시지
	 * @param meta - 추가 정보
	 */
	warn(context: string, message: string, meta?: LogMeta, isPolling = false): void {
		if (isPolling && !showPollingLogs) return;
		console.warn(formatLog("🟡", context, message), meta ? { ...meta } : "");
	},

	/**
	 * 정보 로그 (항상 출력)
	 * @param context - 발생 위치
	 * @param message - 정보 메시지
	 * @param meta - 추가 정보
	 * @param isPolling - 폴링 로그 여부 (true면 플래그 체크, 기본값: false)
	 */
	info(context: string, message: string, meta?: LogMeta, isPolling = false): void {
		if (isPolling && !showPollingLogs) return;
		console.log(formatLog("🟢", context, message), meta ? { ...meta } : "");
	},

	/**
	 * 디버그 로그 (개발 환경에서만 출력)
	 * @param context - 발생 위치
	 * @param message - 디버그 메시지
	 * @param meta - 추가 정보
	 */
	debug(context: string, message: string, meta?: LogMeta): void {
		if (!isDev) return;
		console.debug(formatLog("🟣", context, message), meta ? { ...meta } : "");
	},

	/**
	 * 폴링 로그 표시 여부 설정 (실시간 변경)
	 * @param value - true: 표시, false: 숨김
	 */
	setShowPollingLogs(value: boolean): void {
		showPollingLogs = value;
		console.log(formatLog("INFO", "Logger", `폴링 로그 표시: ${value ? "활성화" : "비활성화"}`));
	},

	/**
	 * 현재 폴링 로그 표시 여부 조회
	 * @returns 폴링 로그 표시 여부
	 */
	getShowPollingLogs(): boolean {
		return showPollingLogs;
	},
};

/**
 * pino 적용 예시 (나중에 교체 시):
 *
 * import pino from 'pino';
 *
 * const pinoLogger = pino({
 *   level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
 *   transport: isDev ? { target: 'pino-pretty' } : undefined,
 * });
 *
 * export const logger = {
 *   error: (context: string, message: string, meta?: LogMeta) =>
 *     pinoLogger.error({ context, ...meta }, message),
 *   warn: (context: string, message: string, meta?: LogMeta) =>
 *     pinoLogger.warn({ context, ...meta }, message),
 *   info: (context: string, message: string, meta?: LogMeta) =>
 *     pinoLogger.info({ context, ...meta }, message),
 *   debug: (context: string, message: string, meta?: LogMeta) =>
 *     pinoLogger.debug({ context, ...meta }, message),
 * };
 */
