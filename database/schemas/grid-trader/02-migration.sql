-- ============================================================================
-- Grid Trader 마이그레이션 (기존 프로젝트용)
-- ============================================================================
-- 용도: 기존 운영 중인 데이터베이스에 스키마 변경사항을 적용할 때 사용
-- 프로젝트: Sanghanga (sh_ prefix)
-- 생성일: 2026-04-30
-- ============================================================================

BEGIN;

-- ENUM 타입 생성 (존재하지 않을 경우에만)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sh_order_type') THEN
    CREATE TYPE sh_order_type AS ENUM ('BUY', 'SELL');
    COMMENT ON TYPE sh_order_type IS '주문 유형 (BUY: 매수, SELL: 매도)';
    RAISE NOTICE '✅ ENUM sh_order_type 생성 완료';
  ELSE
    RAISE NOTICE '⏭️  ENUM sh_order_type 이미 존재';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sh_order_status') THEN
    CREATE TYPE sh_order_status AS ENUM ('PENDING', 'FILLED', 'CANCELLED');
    COMMENT ON TYPE sh_order_status IS '주문 상태 (PENDING: 대기, FILLED: 체결, CANCELLED: 취소)';
    RAISE NOTICE '✅ ENUM sh_order_status 생성 완료';
  ELSE
    RAISE NOTICE '⏭️  ENUM sh_order_status 이미 존재';
  END IF;
END $$;

-- 테이블 생성 (존재하지 않을 경우에만)
-- ============================================================================

-- 1. 그리드 트레이딩 전략 테이블
CREATE TABLE IF NOT EXISTS sh_grid_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_code VARCHAR(6) NOT NULL,
  stock_name VARCHAR(100) NOT NULL,
  grid_gap INT NOT NULL CHECK (grid_gap >= 1000 AND grid_gap <= 100000),
  upper_grid_count INT NOT NULL CHECK (upper_grid_count >= 1 AND upper_grid_count <= 20),
  lower_grid_count INT NOT NULL CHECK (lower_grid_count >= 1 AND lower_grid_count <= 20),
  quantity_per_grid INT NOT NULL CHECK (quantity_per_grid >= 1),
  min_holding_limit INT NOT NULL CHECK (min_holding_limit >= 0),
  target_price INT CHECK (target_price IS NULL OR target_price > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 테이블 주석
COMMENT ON TABLE sh_grid_strategies IS '그리드 트레이딩 전략';
COMMENT ON COLUMN sh_grid_strategies.id IS '전략 고유 ID';
COMMENT ON COLUMN sh_grid_strategies.stock_code IS '종목코드 (6자리)';
COMMENT ON COLUMN sh_grid_strategies.stock_name IS '종목명';
COMMENT ON COLUMN sh_grid_strategies.grid_gap IS '그리드 간격 (원, 1000~100000)';
COMMENT ON COLUMN sh_grid_strategies.upper_grid_count IS '상단 그리드 개수 (1~20)';
COMMENT ON COLUMN sh_grid_strategies.lower_grid_count IS '하단 그리드 개수 (1~20)';
COMMENT ON COLUMN sh_grid_strategies.quantity_per_grid IS '그리드당 주문 수량 (주)';
COMMENT ON COLUMN sh_grid_strategies.min_holding_limit IS '최소 보유 수량 (Core 물량, 주)';
COMMENT ON COLUMN sh_grid_strategies.target_price IS '목표가 (원, 선택사항)';
COMMENT ON COLUMN sh_grid_strategies.is_active IS '전략 활성화 여부';
COMMENT ON COLUMN sh_grid_strategies.created_at IS '생성 시각';
COMMENT ON COLUMN sh_grid_strategies.updated_at IS '수정 시각';

-- 2. 그리드 주문 테이블
CREATE TABLE IF NOT EXISTS sh_grid_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES sh_grid_strategies(id) ON DELETE CASCADE,
  stock_code VARCHAR(6) NOT NULL,
  order_id VARCHAR(50) NOT NULL UNIQUE,
  order_type sh_order_type NOT NULL,
  grid_price INT NOT NULL CHECK (grid_price > 0),
  quantity INT NOT NULL CHECK (quantity >= 1),
  status sh_order_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  filled_at TIMESTAMPTZ
);

-- 테이블 주석
COMMENT ON TABLE sh_grid_orders IS '그리드 주문';
COMMENT ON COLUMN sh_grid_orders.id IS '주문 고유 ID';
COMMENT ON COLUMN sh_grid_orders.strategy_id IS '전략 ID (외래키)';
COMMENT ON COLUMN sh_grid_orders.stock_code IS '종목코드 (6자리)';
COMMENT ON COLUMN sh_grid_orders.order_id IS '키움 API 주문번호 (고유)';
COMMENT ON COLUMN sh_grid_orders.order_type IS '주문 유형 (BUY: 매수, SELL: 매도)';
COMMENT ON COLUMN sh_grid_orders.grid_price IS '그리드 가격 (지정가, 원)';
COMMENT ON COLUMN sh_grid_orders.quantity IS '주문 수량 (주)';
COMMENT ON COLUMN sh_grid_orders.status IS '주문 상태 (PENDING: 대기, FILLED: 체결, CANCELLED: 취소)';
COMMENT ON COLUMN sh_grid_orders.created_at IS '주문 생성 시각';
COMMENT ON COLUMN sh_grid_orders.filled_at IS '체결 시각';

-- 3. 체결 이벤트 테이블
CREATE TABLE IF NOT EXISTS sh_fill_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES sh_grid_strategies(id) ON DELETE CASCADE,
  stock_code VARCHAR(6) NOT NULL,
  order_id VARCHAR(50) NOT NULL UNIQUE REFERENCES sh_grid_orders(order_id) ON DELETE CASCADE,
  fill_price INT NOT NULL CHECK (fill_price > 0),
  fill_quantity INT NOT NULL CHECK (fill_quantity >= 1),
  fill_time TIMESTAMPTZ NOT NULL,
  order_type sh_order_type NOT NULL,
  profit_loss INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 테이블 주석
COMMENT ON TABLE sh_fill_events IS '체결 이벤트';
COMMENT ON COLUMN sh_fill_events.id IS '이벤트 고유 ID';
COMMENT ON COLUMN sh_fill_events.strategy_id IS '전략 ID (외래키)';
COMMENT ON COLUMN sh_fill_events.stock_code IS '종목코드 (6자리)';
COMMENT ON COLUMN sh_fill_events.order_id IS '원 주문번호 (외래키)';
COMMENT ON COLUMN sh_fill_events.fill_price IS '체결가 (원)';
COMMENT ON COLUMN sh_fill_events.fill_quantity IS '체결 수량 (주)';
COMMENT ON COLUMN sh_fill_events.fill_time IS '체결 시각';
COMMENT ON COLUMN sh_fill_events.order_type IS '주문 유형 (BUY: 매수, SELL: 매도)';
COMMENT ON COLUMN sh_fill_events.profit_loss IS '손익 (원, 매도 시에만 계산)';
COMMENT ON COLUMN sh_fill_events.created_at IS '이벤트 기록 시각';

-- 인덱스 생성 (존재하지 않을 경우에만)
-- ============================================================================

-- sh_grid_strategies 인덱스
CREATE INDEX IF NOT EXISTS idx_sh_grid_strategies_stock_code
  ON sh_grid_strategies(stock_code);

CREATE INDEX IF NOT EXISTS idx_sh_grid_strategies_is_active
  ON sh_grid_strategies(is_active);

-- sh_grid_orders 인덱스
CREATE INDEX IF NOT EXISTS idx_sh_grid_orders_strategy_id
  ON sh_grid_orders(strategy_id);

CREATE INDEX IF NOT EXISTS idx_sh_grid_orders_stock_code
  ON sh_grid_orders(stock_code);

CREATE INDEX IF NOT EXISTS idx_sh_grid_orders_order_id
  ON sh_grid_orders(order_id);

CREATE INDEX IF NOT EXISTS idx_sh_grid_orders_strategy_status
  ON sh_grid_orders(strategy_id, status);

-- sh_fill_events 인덱스
CREATE INDEX IF NOT EXISTS idx_sh_fill_events_strategy_id
  ON sh_fill_events(strategy_id);

CREATE INDEX IF NOT EXISTS idx_sh_fill_events_stock_code
  ON sh_fill_events(stock_code);

CREATE INDEX IF NOT EXISTS idx_sh_fill_events_order_id
  ON sh_fill_events(order_id);

CREATE INDEX IF NOT EXISTS idx_sh_fill_events_strategy_time
  ON sh_fill_events(strategy_id, fill_time DESC);

-- 트리거 함수 생성 (존재하지 않거나 변경된 경우 재생성)
-- ============================================================================

CREATE OR REPLACE FUNCTION sh_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sh_update_updated_at() IS 'updated_at 컬럼을 현재 시각으로 자동 업데이트';

-- 트리거 생성 (기존 트리거 삭제 후 재생성)
-- ============================================================================

DROP TRIGGER IF EXISTS sh_set_updated_at_grid_strategies ON sh_grid_strategies;
CREATE TRIGGER sh_set_updated_at_grid_strategies
  BEFORE UPDATE ON sh_grid_strategies
  FOR EACH ROW
  EXECUTE FUNCTION sh_update_updated_at();

COMMENT ON TRIGGER sh_set_updated_at_grid_strategies ON sh_grid_strategies
  IS '전략 수정 시 updated_at 자동 업데이트';

-- 완료 메시지
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Grid Trader 마이그레이션 완료';
  RAISE NOTICE '   - 테이블: sh_grid_strategies, sh_grid_orders, sh_fill_events';
  RAISE NOTICE '   - ENUM: sh_order_type, sh_order_status';
  RAISE NOTICE '   - 인덱스: 10개';
  RAISE NOTICE '   - 트리거: sh_set_updated_at_grid_strategies';
  RAISE NOTICE '   - 기존 데이터는 보존되었습니다.';
END $$;

COMMIT;
