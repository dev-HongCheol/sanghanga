-- ============================================================================
-- Grid Trader 리셋 (전체 데이터 삭제)
-- ============================================================================
-- 용도: 개발/테스트 환경에서 데이터베이스를 초기화할 때 사용
-- ⚠️  경고: 모든 데이터가 삭제됩니다 (운영 환경에서 사용 금지)
-- 프로젝트: Sanghanga (sh_ prefix)
-- 생성일: 2026-04-30
-- ============================================================================

BEGIN;

-- 테이블 삭제 (의존성 순서 주의: 자식 → 부모)
-- ============================================================================

-- sh_fill_events 삭제 (sh_grid_orders 외래키 참조)
DROP TABLE IF EXISTS sh_fill_events CASCADE;

-- sh_grid_orders 삭제 (sh_grid_strategies 외래키 참조)
DROP TABLE IF EXISTS sh_grid_orders CASCADE;

-- sh_grid_strategies 삭제
DROP TABLE IF EXISTS sh_grid_strategies CASCADE;

-- 트리거 삭제 (테이블 삭제 시 자동 삭제되지만 명시)
-- ============================================================================

DROP TRIGGER IF EXISTS sh_set_updated_at_grid_strategies ON sh_grid_strategies;

-- 함수 삭제
-- ============================================================================

DROP FUNCTION IF EXISTS sh_update_updated_at() CASCADE;

-- ENUM 타입 삭제
-- ============================================================================

DROP TYPE IF EXISTS sh_order_type CASCADE;
DROP TYPE IF EXISTS sh_order_status CASCADE;

-- 완료 메시지
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Grid Trader 리셋 완료';
  RAISE NOTICE '   ⚠️  삭제된 항목:';
  RAISE NOTICE '      - 테이블: sh_grid_strategies, sh_grid_orders, sh_fill_events';
  RAISE NOTICE '      - ENUM: sh_order_type, sh_order_status';
  RAISE NOTICE '      - 함수: sh_update_updated_at()';
  RAISE NOTICE '      - 트리거: sh_set_updated_at_grid_strategies';
  RAISE NOTICE '   ⚠️  모든 데이터가 삭제되었습니다.';
END $$;

COMMIT;
