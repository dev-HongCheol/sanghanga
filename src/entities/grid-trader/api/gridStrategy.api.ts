/**
 * @fileoverview Grid Trader DB API
 * @description Supabase를 통한 그리드 트레이딩 전략 CRUD
 */

import { createServerClient, getSupabaseClient } from "@/shared/lib/supabase/server";
import type {
	FillEvent,
	FillEventInsert,
	GridOrder,
	GridOrderInsert,
	GridStrategy,
	GridStrategyInsert,
	GridStrategyUpdate,
	OrderStatus,
} from "../model/gridTrader.types";

// ============================================================================
// 전략 관련 API
// ============================================================================

/**
 * 그리드 전략 생성
 * @param data - 전략 생성 데이터
 * @returns 생성된 전략
 * @throws {Error} DB 오류 시
 */
export async function createStrategy(data: GridStrategyInsert): Promise<GridStrategy> {
	const supabase = await createServerClient();

	const { data: strategy, error } = await supabase
		.from("sh_grid_strategies")
		.insert(data)
		.select()
		.single();

	if (error) {
		throw new Error(`전략 생성 실패: ${error.message}`);
	}

	return strategy;
}

/**
 * 그리드 전략 수정
 * @param id - 전략 ID
 * @param data - 수정할 데이터
 * @returns 수정된 전략
 * @throws {Error} DB 오류 시
 */
export async function updateStrategy(id: string, data: GridStrategyUpdate): Promise<GridStrategy> {
	const supabase = await createServerClient();

	const { data: strategy, error } = await supabase
		.from("sh_grid_strategies")
		.update(data)
		.eq("id", id)
		.select()
		.single();

	if (error) {
		throw new Error(`전략 수정 실패: ${error.message}`);
	}

	return strategy;
}

/**
 * 그리드 전략 삭제
 * @param id - 전략 ID
 * @throws {Error} DB 오류 시
 */
export async function deleteStrategy(id: string): Promise<void> {
	const supabase = await createServerClient();

	const { error } = await supabase.from("sh_grid_strategies").delete().eq("id", id);

	if (error) {
		throw new Error(`전략 삭제 실패: ${error.message}`);
	}
}

/**
 * 그리드 전략 조회 (단일)
 * @param id - 전략 ID
 * @returns 전략 데이터 또는 null
 * @throws {Error} DB 오류 시
 */
export async function getStrategyById(id: string): Promise<GridStrategy | null> {
	const supabase = await createServerClient();

	const { data, error } = await supabase.from("sh_grid_strategies").select().eq("id", id).single();

	if (error) {
		if (error.code === "PGRST116") {
			// Not found
			return null;
		}
		throw new Error(`전략 조회 실패: ${error.message}`);
	}

	return data;
}

/**
 * 모든 그리드 전략 목록 조회
 * @returns 전략 목록
 * @throws {Error} DB 오류 시
 */
export async function getAllStrategies(): Promise<GridStrategy[]> {
	const supabase = await createServerClient();

	const { data, error } = await supabase
		.from("sh_grid_strategies")
		.select()
		.order("created_at", { ascending: false });

	if (error) {
		throw new Error(`전략 목록 조회 실패: ${error.message}`);
	}

	return data;
}

/**
 * 활성 전략 목록 조회
 * @param useAdminClient - Admin Client 사용 여부 (Cron 등 백그라운드 작업용, 기본값: false)
 * @returns 활성 전략 목록
 * @throws {Error} DB 오류 시
 */
export async function getActiveStrategies(useAdminClient = false): Promise<GridStrategy[]> {
	const supabase = await getSupabaseClient(useAdminClient);

	const { data, error } = await supabase
		.from("sh_grid_strategies")
		.select()
		.eq("is_active", true)
		.order("created_at", { ascending: false });

	if (error) {
		throw new Error(`활성 전략 조회 실패: ${error.message}`);
	}

	return data;
}

/**
 * 전략 활성화/비활성화 토글
 * @param id - 전략 ID
 * @param isActive - 활성화 여부
 * @returns 수정된 전략
 * @throws {Error} DB 오류 시
 */
export async function toggleStrategyActive(id: string, isActive: boolean): Promise<GridStrategy> {
	const supabase = await createServerClient();

	const { data: strategy, error } = await supabase
		.from("sh_grid_strategies")
		.update({ is_active: isActive })
		.eq("id", id)
		.select()
		.single();

	if (error) {
		throw new Error(`전략 활성화 상태 변경 실패: ${error.message}`);
	}

	return strategy;
}

// ============================================================================
// 주문 관련 API
// ============================================================================

/**
 * 그리드 주문 생성
 * @param data - 주문 생성 데이터
 * @param useAdminClient - Admin Client 사용 여부 (Cron 등 백그라운드 작업용, 기본값: false)
 * @returns 생성된 주문
 * @throws {Error} DB 오류 시
 */
export async function createOrder(data: GridOrderInsert, useAdminClient = false): Promise<GridOrder> {
	const supabase = await getSupabaseClient(useAdminClient);

	const { data: order, error } = await supabase
		.from("sh_grid_orders")
		.insert(data)
		.select()
		.single();

	if (error) {
		throw new Error(`주문 생성 실패: ${error.message}`);
	}

	return order;
}

/**
 * 주문 상태 업데이트
 * @param orderId - 키움 API 주문번호
 * @param status - 새로운 상태
 * @param filledAt - 체결 시각 (옵션)
 * @returns 수정된 주문
 * @throws {Error} DB 오류 시
 */
export async function updateOrderStatus(
	orderId: string,
	status: OrderStatus,
	filledAt?: string
): Promise<GridOrder> {
	const supabase = await createServerClient();

	const updateData: Partial<GridOrder> = { status };
	if (filledAt) {
		updateData.filled_at = filledAt;
	}

	const { data: order, error } = await supabase
		.from("sh_grid_orders")
		.update(updateData)
		.eq("order_id", orderId)
		.select()
		.single();

	if (error) {
		throw new Error(`주문 상태 업데이트 실패: ${error.message}`);
	}

	return order;
}

/**
 * 전략별 주문 목록 조회
 * @param strategyId - 전략 ID
 * @param status - 주문 상태 필터 (옵션)
 * @returns 주문 목록
 * @throws {Error} DB 오류 시
 */
export async function getOrdersByStrategy(
	strategyId: string,
	status?: OrderStatus
): Promise<GridOrder[]> {
	const supabase = await createServerClient();

	let query = supabase.from("sh_grid_orders").select().eq("strategy_id", strategyId);

	if (status) {
		query = query.eq("status", status);
	}

	const { data, error } = await query.order("grid_price", { ascending: false });

	if (error) {
		throw new Error(`주문 목록 조회 실패: ${error.message}`);
	}

	return data;
}

/**
 * 미체결 주문 목록 조회
 * @param strategyId - 전략 ID (옵션)
 * @param useAdminClient - Admin Client 사용 여부 (Cron 등 백그라운드 작업용, 기본값: false)
 * @returns 미체결 주문 목록
 * @throws {Error} DB 오류 시
 */
export async function getPendingOrders(
	strategyId?: string,
	useAdminClient = false
): Promise<GridOrder[]> {
	const supabase = await getSupabaseClient(useAdminClient);

	let query = supabase.from("sh_grid_orders").select().eq("status", "PENDING");

	if (strategyId) {
		query = query.eq("strategy_id", strategyId);
	}

	const { data, error } = await query.order("created_at", { ascending: false });

	if (error) {
		throw new Error(`미체결 주문 조회 실패: ${error.message}`);
	}

	return data;
}

/**
 * 주문 취소 (상태를 CANCELLED로 변경)
 * @param orderId - 키움 API 주문번호
 * @returns 취소된 주문
 * @throws {Error} DB 오류 시
 */
export async function cancelOrder(orderId: string): Promise<GridOrder> {
	return updateOrderStatus(orderId, "CANCELLED");
}

/**
 * 여러 주문 일괄 취소
 * @param orderIds - 취소할 주문번호 배열
 * @param useAdminClient - Admin Client 사용 여부 (Cron 등 백그라운드 작업용, 기본값: false)
 * @throws {Error} DB 오류 시
 */
export async function cancelOrders(orderIds: string[], useAdminClient = false): Promise<void> {
	const supabase = await getSupabaseClient(useAdminClient);

	const { error } = await supabase
		.from("sh_grid_orders")
		.update({ status: "CANCELLED" })
		.in("order_id", orderIds);

	if (error) {
		throw new Error(`주문 일괄 취소 실패: ${error.message}`);
	}
}

// ============================================================================
// 체결 이벤트 관련 API
// ============================================================================

/**
 * 체결 이벤트 생성
 * @param data - 체결 이벤트 데이터
 * @returns 생성된 체결 이벤트
 * @throws {Error} DB 오류 시
 */
export async function createFillEvent(data: FillEventInsert): Promise<FillEvent> {
	const supabase = await createServerClient();

	const { data: fillEvent, error } = await supabase
		.from("sh_fill_events")
		.insert(data)
		.select()
		.single();

	if (error) {
		throw new Error(`체결 이벤트 생성 실패: ${error.message}`);
	}

	return fillEvent;
}

/**
 * 전략별 체결 이벤트 목록 조회
 * @param strategyId - 전략 ID
 * @param limit - 조회할 개수 (기본값: 10)
 * @returns 체결 이벤트 목록
 * @throws {Error} DB 오류 시
 */
export async function getFillEventsByStrategy(
	strategyId: string,
	limit = 10
): Promise<FillEvent[]> {
	const supabase = await createServerClient();

	const { data, error } = await supabase
		.from("sh_fill_events")
		.select()
		.eq("strategy_id", strategyId)
		.order("fill_time", { ascending: false })
		.limit(limit);

	if (error) {
		throw new Error(`체결 이벤트 조회 실패: ${error.message}`);
	}

	return data;
}

/**
 * 특정 기간 체결 이벤트 조회
 * @param strategyId - 전략 ID
 * @param startDate - 시작 날짜 (ISO 8601)
 * @param endDate - 종료 날짜 (ISO 8601)
 * @returns 체결 이벤트 목록
 * @throws {Error} DB 오류 시
 */
export async function getFillEventsByDateRange(
	strategyId: string,
	startDate: string,
	endDate: string
): Promise<FillEvent[]> {
	const supabase = await createServerClient();

	const { data, error } = await supabase
		.from("sh_fill_events")
		.select()
		.eq("strategy_id", strategyId)
		.gte("fill_time", startDate)
		.lte("fill_time", endDate)
		.order("fill_time", { ascending: false });

	if (error) {
		throw new Error(`기간별 체결 이벤트 조회 실패: ${error.message}`);
	}

	return data;
}
