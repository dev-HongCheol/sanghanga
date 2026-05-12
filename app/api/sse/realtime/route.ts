/**
 * SSE Endpoint: 실시간 데이터 스트림
 *
 * **경로**: `/api/sse/realtime`
 * **프로토콜**: Server-Sent Events (SSE)
 *
 * **이벤트 타입**:
 * - `price`: 종목 현재가 업데이트
 * - `balance`: 계좌 잔고 업데이트
 * - `fill`: 체결 이벤트
 * - `orders`: 주문 상태 변경
 * - `heartbeat`: 연결 유지 (30초마다)
 *
 * **클라이언트 사용법**:
 * ```typescript
 * const eventSource = new EventSource('/api/sse/realtime');
 *
 * eventSource.addEventListener('price', (event) => {
 *   const { stockCode, priceInfo } = JSON.parse(event.data);
 *   console.log(`${stockCode} 현재가:`, priceInfo.currentPrice);
 * });
 * ```
 */

import { registerClient, sendHeartbeat, unregisterClient } from "@/shared/lib/sse/sse-manager";
import { logger } from "@/shared/lib/logger";
import { getAllPrices } from "@/shared/lib/cache/price-cache";
import { getBalance } from "@/shared/lib/cache/balance-cache";
import { startCronScheduler } from "@/shared/lib/cron/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	// 첫 SSE 연결 시 Cron 스케줄러 시작 (한 번만 실행됨)
	startCronScheduler();
	// SSE 스트림 생성
	const stream = new TransformStream();
	const writer = stream.writable.getWriter();
	const encoder = new TextEncoder();

	// 클라이언트 고유 ID 생성
	const clientId = crypto.randomUUID();

	// 클라이언트 등록
	registerClient(clientId, writer);

	// SSE 응답 헤더
	const headers = new Headers({
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache, no-transform",
		Connection: "keep-alive",
		"X-Accel-Buffering": "no", // Nginx 버퍼링 비활성화
	});

	// 초기 데이터 전송 (비동기 실행)
	(async () => {
		try {
			// 초기 연결 확인 메시지 전송 (SSE 연결 성공 확인용)
			const connectMessage = `event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now() })}\n\n`;
			await writer.write(encoder.encode(connectMessage));

			// 현재가 캐시 전송
			const cachedPrices = getAllPrices();
			for (const [stockCode, priceInfo] of cachedPrices.entries()) {
				const message = `event: price\ndata: ${JSON.stringify({ stockCode, priceInfo })}\n\n`;
				await writer.write(encoder.encode(message));
			}

			// 잔고 캐시 전송
			const cachedBalance = getBalance();
			if (cachedBalance) {
				const message = `event: balance\ndata: ${JSON.stringify({ accountId: "default", balance: cachedBalance })}\n\n`;
				await writer.write(encoder.encode(message));
			}

			logger.info("SSEEndpoint", `클라이언트 ${clientId} 초기 데이터 전송 완료`, undefined, true);
		} catch (error) {
			logger.error("SSEEndpoint", `초기 데이터 전송 실패: ${clientId}`, {
				error: error instanceof Error ? error.message : String(error),
			});
		}
	})();

	// Heartbeat (30초마다)
	const heartbeatInterval = setInterval(async () => {
		try {
			await sendHeartbeat();
		} catch (error) {
			clearInterval(heartbeatInterval);
		}
	}, 30000);

	// 연결 해제 처리
	request.signal.addEventListener("abort", () => {
		clearInterval(heartbeatInterval);
		unregisterClient(clientId);
	});

	return new Response(stream.readable, { headers });
}
