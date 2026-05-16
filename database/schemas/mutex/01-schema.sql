-- ============================================================================
-- 분산 Mutex 스키마 (PostgreSQL Advisory Lock)
-- ============================================================================
-- 작성일: 2026-05-13
-- 용도: Next.js 멀티 프로세스 환경에서 Cron 작업 동시 실행 방지
-- ============================================================================

-- 락 획득 함수 (비블로킹)
CREATE OR REPLACE FUNCTION sh_try_acquire_lock(lock_key BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN pg_try_advisory_lock(lock_key);
END;
$$;

COMMENT ON FUNCTION sh_try_acquire_lock IS '분산 락 획득 시도 (비블로킹)';

-- 락 해제 함수
CREATE OR REPLACE FUNCTION sh_release_lock(lock_key BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN pg_advisory_unlock(lock_key);
END;
$$;

COMMENT ON FUNCTION sh_release_lock IS '분산 락 해제';

-- 모든 락 강제 해제 (개발/디버깅용)
CREATE OR REPLACE FUNCTION sh_release_all_locks()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM pg_advisory_unlock_all();
END;
$$;

COMMENT ON FUNCTION sh_release_all_locks IS '모든 세션 레벨 락 해제 (디버깅용)';
