import { z } from "zod";

/**
 * 그리드 트레이딩 전략 생성 스키마
 * @description 새로운 그리드 전략을 생성할 때 사용
 */
export const gridStrategyCreateSchema = z.object({
	/**
	 * 종목코드 (6자리)
	 * @example "005930"
	 */
	stock_code: z
		.string()
		.length(6, "종목코드는 6자리여야 합니다")
		.regex(/^\d{6}$/, "종목코드는 숫자 6자리여야 합니다"),

	/**
	 * 종목명
	 * @example "삼성전자"
	 */
	stock_name: z.string().min(1, "종목명을 입력하세요"),

	/**
	 * 그리드 간격 (원)
	 * @example 5000
	 */
	grid_gap: z
		.number()
		.int("정수를 입력하세요")
		.min(1000, "그리드 간격은 최소 1,000원입니다")
		.max(100000, "그리드 간격은 최대 100,000원입니다"),

	/**
	 * 상단 그리드 개수 (매도 주문)
	 * @example 5
	 */
	upper_grid_count: z
		.number()
		.int("정수를 입력하세요")
		.min(1, "최소 1개 이상이어야 합니다")
		.max(20, "최대 20개까지 가능합니다"),

	/**
	 * 하단 그리드 개수 (매수 주문)
	 * @example 5
	 */
	lower_grid_count: z
		.number()
		.int("정수를 입력하세요")
		.min(1, "최소 1개 이상이어야 합니다")
		.max(20, "최대 20개까지 가능합니다"),

	/**
	 * 그리드당 주문 수량 (주)
	 * @example 10
	 */
	quantity_per_grid: z.number().int("정수를 입력하세요").min(1, "최소 1주 이상이어야 합니다"),

	/**
	 * 최소 보유 수량 (Core 물량)
	 * @description 이 수량 이하로 떨어지면 매도 주문 생성 중단
	 * @example 100
	 */
	min_holding_limit: z.number().int("정수를 입력하세요").min(0, "0 이상이어야 합니다"),

	/**
	 * 목표가 (원, 선택사항)
	 * @description 설정 시 목표가 미만 매도 불가
	 * @example 350000
	 */
	target_price: z
		.number()
		.int("정수를 입력하세요")
		.positive("목표가는 0보다 커야 합니다")
		.nullable()
		.optional(),

	/**
	 * 전략 활성화 여부
	 * @example true
	 */
	is_active: z.boolean(),
});

/**
 * 그리드 전략 수정 스키마
 * @description 기존 전략을 수정할 때 사용 (모든 필드 선택사항)
 */
export const gridStrategyUpdateSchema = gridStrategyCreateSchema.partial();

/**
 * 그리드 주문 생성 스키마
 */

export const gridOrderCreateSchema = z.object({
	/**
	 * 전략 ID
	 */
	strategy_id: z.string().uuid("유효한 UUID가 아닙니다"),

	/**
	 * 종목코드 (6자리)
	 */
	stock_code: z
		.string()
		.length(6, "종목코드는 6자리여야 합니다")
		.regex(/^\d{6}$/, "종목코드는 숫자 6자리여야 합니다"),

	/**
	 * 키움 API 주문번호
	 */
	order_id: z.string().min(1, "주문번호를 입력하세요"),

	/**
	 * 주문 유형
	 */
	order_type: z.enum(["BUY", "SELL"], {
		message: "BUY 또는 SELL이어야 합니다",
	}),

	/**
	 * 그리드 가격 (지정가, 원)
	 */
	grid_price: z.number().int("정수를 입력하세요").positive("가격은 0보다 커야 합니다"),

	/**
	 * 주문 수량 (주)
	 */
	quantity: z.number().int("정수를 입력하세요").min(1, "최소 1주 이상이어야 합니다"),

	/**
	 * 주문 상태
	 */
	status: z
		.enum(["PENDING", "FILLED", "CANCELLED"], {
			message: "PENDING, FILLED, CANCELLED 중 하나여야 합니다",
		})
		.optional(),

	/**
	 * 체결 시각
	 */
	filled_at: z.string().datetime().nullable().optional(),
});

/**
 * 체결 이벤트 생성 스키마
 */
export const fillEventCreateSchema = z.object({
	/**
	 * 전략 ID
	 */
	strategy_id: z.string().uuid("유효한 UUID가 아닙니다"),

	/**
	 * 종목코드 (6자리)
	 */
	stock_code: z
		.string()
		.length(6, "종목코드는 6자리여야 합니다")
		.regex(/^\d{6}$/, "종목코드는 숫자 6자리여야 합니다"),

	/**
	 * 원 주문번호
	 */
	order_id: z.string().min(1, "주문번호를 입력하세요"),

	/**
	 * 체결가 (원)
	 */
	fill_price: z.number().int("정수를 입력하세요").positive("가격은 0보다 커야 합니다"),

	/**
	 * 체결 수량 (주)
	 */
	fill_quantity: z.number().int("정수를 입력하세요").min(1, "최소 1주 이상이어야 합니다"),

	/**
	 * 체결 시각
	 */
	fill_time: z.string().datetime(),

	/**
	 * 주문 유형
	 */
	order_type: z.enum(["BUY", "SELL"], {
		message: "BUY 또는 SELL이어야 합니다",
	}),

	/**
	 * 손익 (원, 매도 시에만 계산)
	 */
	profit_loss: z.number().int("정수를 입력하세요").nullable().optional(),
});

/**
 * 그리드 전략 생성 폼 데이터
 */
export type GridStrategyCreateFormData = z.infer<typeof gridStrategyCreateSchema>;

/**
 * 그리드 전략 수정 폼 데이터
 */
export type GridStrategyUpdateFormData = z.infer<typeof gridStrategyUpdateSchema>;

/**
 * 그리드 주문 생성 폼 데이터
 */
export type GridOrderCreateFormData = z.infer<typeof gridOrderCreateSchema>;

/**
 * 체결 이벤트 생성 폼 데이터
 */
export type FillEventCreateFormData = z.infer<typeof fillEventCreateSchema>;
