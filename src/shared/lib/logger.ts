/**
 * @fileoverview 서버 사이드 로깅 래퍼
 * @description console 기반 로깅 (향후 pino로 교체 가능)
 */

const isDev = process.env.NODE_ENV === "development";

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
		console.error(formatLog("ERROR", context, message), meta ? { ...meta } : "");
	},

	/**
	 * 경고 로그 (항상 출력)
	 * @param context - 발생 위치
	 * @param message - 경고 메시지
	 * @param meta - 추가 정보
	 */
	warn(context: string, message: string, meta?: LogMeta): void {
		console.warn(formatLog("WARN", context, message), meta ? { ...meta } : "");
	},

	/**
	 * 정보 로그 (개발 환경에서만 출력)
	 * @param context - 발생 위치
	 * @param message - 정보 메시지
	 * @param meta - 추가 정보
	 */
	info(context: string, message: string, meta?: LogMeta): void {
		if (!isDev) return;
		console.log(formatLog("INFO", context, message), meta ? { ...meta } : "");
	},

	/**
	 * 디버그 로그 (개발 환경에서만 출력)
	 * @param context - 발생 위치
	 * @param message - 디버그 메시지
	 * @param meta - 추가 정보
	 */
	debug(context: string, message: string, meta?: LogMeta): void {
		if (!isDev) return;
		console.debug(formatLog("DEBUG", context, message), meta ? { ...meta } : "");
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
