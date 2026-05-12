/**
 * @fileoverview SSE (Server-Sent Events) 연결 관리자
 * @description 클라이언트 SSE 연결을 관리하고 실시간 데이터를 브로드캐스트
 *
 * **사용 시나리오**:
 * - 클라이언트가 `/api/sse/realtime`에 연결
 * - Cron Job이 데이터 업데이트 시 broadcastXXX 함수 호출
 * - 연결된 모든 클라이언트에게 즉시 push
 *
 * **특징**:
 * - 메모리 기반 연결 관리
 * - 자동 연결 해제 처리
 * - 타입별 메시지 브로드캐스트
 *
 * @example
 * ```typescript
 * // Cron에서 사용
 * const priceInfo = await getCurrentPriceAction('005930');
 * broadcastPrice('005930', priceInfo);
 * ```
 */

import type { AccountBalance, CurrentPrice } from "@/features/grid-trader";
import { logger } from "@/shared/lib/logger";

/**
 * SSE 클라이언트 정보
 */
interface SSEClient {
	/** 클라이언트 고유 ID */
	id: string;
	/** WritableStreamDefaultWriter */
	writer: WritableStreamDefaultWriter<Uint8Array>;
	/** 연결 시각 */
	connectedAt: Date;
}

/**
 * 연결된 SSE 클라이언트 목록
 */
const connectedClients = new Map<string, SSEClient>();

/**
 * Text Encoder (SSE 메시지 인코딩용)
 */
const encoder = new TextEncoder();

/**
 * SSE 클라이언트 등록
 * @param clientId - 클라이언트 고유 ID
 * @param writer - WritableStreamDefaultWriter
 */
export function registerClient(
	clientId: string,
	writer: WritableStreamDefaultWriter<Uint8Array>
): void {
	connectedClients.set(clientId, {
		id: clientId,
		writer,
		connectedAt: new Date(),
	});

	logger.info("SSEManager", `클라이언트 연결: ${clientId} (총 ${connectedClients.size}개)`, undefined, true);
}

/**
 * SSE 클라이언트 연결 해제
 * @param clientId - 클라이언트 고유 ID
 */
export function unregisterClient(clientId: string): void {
	const client = connectedClients.get(clientId);
	if (client) {
		try {
			client.writer.close();
		} catch (error) {
			// 이미 닫힌 연결
		}
		connectedClients.delete(clientId);

		logger.info(
			"SSEManager",
			`클라이언트 연결 해제: ${clientId} (남은 ${connectedClients.size}개)`,
			undefined,
			true
		);
	}
}

/**
 * 연결된 클라이언트 수 조회
 */
export function getConnectedClientCount(): number {
	return connectedClients.size;
}

/**
 * SSE 메시지 전송 (내부 함수)
 * @param event - 이벤트 타입
 * @param data - 데이터 객체
 */
async function sendSSE(event: string, data: unknown): Promise<void> {
	const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
	const encoded = encoder.encode(message);

	// 연결이 끊긴 클라이언트 목록
	const disconnectedClients: string[] = [];

	// 모든 클라이언트에게 브로드캐스트
	for (const [clientId, client] of connectedClients.entries()) {
		try {
			await client.writer.write(encoded);
		} catch (error) {
			logger.warn("SSEManager", `클라이언트 전송 실패: ${clientId}`, { error }, true);
			disconnectedClients.push(clientId);
		}
	}

	// 연결 끊긴 클라이언트 제거
	for (const clientId of disconnectedClients) {
		unregisterClient(clientId);
	}
}

/**
 * 현재가 브로드캐스트
 * @param stockCode - 종목코드
 * @param priceInfo - 현재가 정보
 */
export async function broadcastPrice(stockCode: string, priceInfo: CurrentPrice): Promise<void> {
	await sendSSE("price", { stockCode, priceInfo });
}

/**
 * 잔고 브로드캐스트
 * @param balance - 계좌 잔고 정보
 * @param accountId - 계좌 ID
 */
export async function broadcastBalance(balance: AccountBalance, accountId = "default"): Promise<void> {
	await sendSSE("balance", { accountId, balance });
}

/**
 * 체결 이벤트 브로드캐스트
 * @param strategyId - 전략 ID
 * @param fillEvent - 체결 이벤트 정보
 */
export async function broadcastFillEvent(strategyId: string, fillEvent: unknown): Promise<void> {
	await sendSSE("fill", { strategyId, fillEvent });
}

/**
 * 주문 상태 변경 브로드캐스트
 * @param strategyId - 전략 ID
 * @param orders - 주문 목록
 */
export async function broadcastOrders(strategyId: string, orders: unknown[]): Promise<void> {
	await sendSSE("orders", { strategyId, orders });
}

/**
 * Heartbeat 전송 (연결 유지)
 * @description 주기적으로 호출하여 연결 유지
 */
export async function sendHeartbeat(): Promise<void> {
	await sendSSE("heartbeat", { timestamp: Date.now() });
}

/**
 * 모든 클라이언트 연결 해제
 * @description 서버 종료 시 사용
 */
export function disconnectAll(): void {
	for (const clientId of connectedClients.keys()) {
		unregisterClient(clientId);
	}
}
