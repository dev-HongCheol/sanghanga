import type { Tables, Enums } from "@/shared/lib/supabase/database.types";

/**
 * 그리드 트레이딩 전략
 * @description sh_grid_strategies 테이블 Row 타입
 */
export type GridStrategy = Tables<"sh_grid_strategies">;

/**
 * 그리드 전략 생성 입력값
 */
export type GridStrategyInsert = Omit<GridStrategy, "id" | "created_at" | "updated_at">;

/**
 * 그리드 전략 수정 입력값
 */
export type GridStrategyUpdate = Partial<GridStrategyInsert>;

/**
 * 그리드 주문
 * @description sh_grid_orders 테이블 Row 타입
 */
export type GridOrder = Tables<"sh_grid_orders">;

/**
 * 그리드 주문 생성 입력값
 */
export type GridOrderInsert = Omit<GridOrder, "id" | "created_at">;

/**
 * 체결 이벤트
 * @description sh_fill_events 테이블 Row 타입
 */
export type FillEvent = Tables<"sh_fill_events">;

/**
 * 체결 이벤트 생성 입력값
 */
export type FillEventInsert = Omit<FillEvent, "id" | "created_at">;

/**
 * 주문 유형
 * @example "BUY" | "SELL"
 */
export type OrderType = Enums<"sh_order_type">;

/**
 * 주문 상태
 * @example "PENDING" | "FILLED" | "CANCELLED"
 */
export type OrderStatus = Enums<"sh_order_status">;
