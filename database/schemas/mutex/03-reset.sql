-- ============================================================================
-- 분산 Mutex 리셋 (PostgreSQL Advisory Lock)
-- ============================================================================
-- 작성일: 2026-05-15
-- 용도: 개발/테스트 환경에서 Mutex 함수 삭제
-- ⚠️ 주의: 운영 환경에서 사용 금지
-- ============================================================================

-- 모든 락 해제 함수 삭제
DROP FUNCTION IF EXISTS sh_release_all_locks();

-- 락 해제 함수 삭제
DROP FUNCTION IF EXISTS sh_release_lock(BIGINT);

-- 락 획득 함수 삭제
DROP FUNCTION IF EXISTS sh_try_acquire_lock(BIGINT);
