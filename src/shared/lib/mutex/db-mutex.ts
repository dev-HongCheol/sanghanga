/**
 * @fileoverview 데이터베이스 기반 분산 Mutex
 * @description PostgreSQL advisory lock을 이용한 프로세스 간 동기화
 *
 * **사용 이유**:
 * - Next.js가 여러 워커 프로세스 실행 시 메모리 변수로는 동시 실행 방지 불가
 * - PostgreSQL advisory lock은 DB 세션 레벨에서 작동하여 프로세스 간 공유됨
 *
 * **특징**:
 * - 자동 만료: DB 연결이 끊어지면 자동으로 락 해제
 * - 성능: 인메모리 락이므로 빠름 (디스크 I/O 없음)
 * - 타임아웃: 지정 시간 내 락 획득 실패 시 포기
 */

import { logger } from "@/shared/lib/logger";
import { createAdminClient } from "@/shared/lib/supabase/server";

/**
 * 락 이름을 정수 해시로 변환
 * @description PostgreSQL advisory lock은 bigint를 키로 사용
 */
function hashLockName(name: string): number {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = (hash << 5) - hash + name.charCodeAt(i);
		hash = hash & hash; // Convert to 32bit integer
	}
	return Math.abs(hash);
}

/**
 * 분산 Mutex 클래스
 */
export class DbMutex {
	private lockKey: number;
	private lockName: string;
	private acquired = false;

	constructor(lockName: string) {
		this.lockName = lockName;
		this.lockKey = hashLockName(lockName);
	}

	/**
	 * 락 획득 시도
	 * @param timeoutMs - 타임아웃 (밀리초, 기본값: 100ms)
	 * @returns 락 획득 성공 여부
	 */
	async tryAcquire(timeoutMs = 100): Promise<boolean> {
		const startTime = Date.now();

		while (Date.now() - startTime < timeoutMs) {
			try {
				const supabase = await createAdminClient();

				// PostgreSQL advisory lock 시도 (sh_try_acquire_lock 함수 호출)
				const { data, error } = await supabase.rpc("sh_try_acquire_lock", {
					lock_key: this.lockKey,
				});

				if (error) {
					logger.error("DbMutex", "락 획득 시도 오류", {
						lockName: this.lockName,
						error: error.message,
					});
					return false;
				}

				// data가 true이면 락 획득 성공
				if (data === true) {
					this.acquired = true;
					logger.info(
						"DbMutex",
						`락 획득 성공: ${this.lockName}`,
						{
							lockKey: this.lockKey,
						},
						true
					);
					return true;
				}

				// 실패 시 잠시 대기 후 재시도
				await new Promise((resolve) => setTimeout(resolve, 10));
			} catch (err) {
				logger.error("DbMutex", "락 획득 예외", {
					lockName: this.lockName,
					error: err instanceof Error ? err.message : String(err),
				});
				return false;
			}
		}

		// 타임아웃
		logger.warn("DbMutex", `락 획득 실패 (타임아웃): ${this.lockName}`, undefined, true);
		return false;
	}

	/**
	 * 락 해제
	 */
	async release(): Promise<void> {
		if (!this.acquired) return;

		try {
			const supabase = await createAdminClient();

			const { error } = await supabase.rpc("sh_release_lock", {
				lock_key: this.lockKey,
			});

			if (error) {
				logger.error("DbMutex", "락 해제 오류", {
					lockName: this.lockName,
					error: error.message,
				});
			} else {
				logger.info(
					"DbMutex",
					`락 해제 완료: ${this.lockName}`,
					{
						lockKey: this.lockKey,
					},
					true
				);
			}
		} catch (err) {
			logger.error("DbMutex", "락 해제 예외", {
				lockName: this.lockName,
				error: err instanceof Error ? err.message : String(err),
			});
		} finally {
			this.acquired = false;
		}
	}
}

/**
 * Mutex를 사용하여 함수를 실행
 * @param lockName - 락 이름
 * @param fn - 실행할 함수
 * @param timeoutMs - 락 획득 타임아웃 (기본값: 100ms)
 * @returns 함수 실행 결과 또는 null (락 획득 실패 시)
 */
export async function withMutex<T>(
	lockName: string,
	fn: () => Promise<T>,
	timeoutMs = 100
): Promise<T | null> {
	const mutex = new DbMutex(lockName);

	const acquired = await mutex.tryAcquire(timeoutMs);
	if (!acquired) {
		return null;
	}

	try {
		return await fn();
	} finally {
		await mutex.release();
	}
}
