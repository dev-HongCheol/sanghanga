import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * 서버 환경 Supabase 클라이언트
 * Server Component, Server Action, Route Handler에서 사용
 */
export async function createServerClient() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	// 환경 변수 검증
	if (!supabaseUrl) {
		console.error("❌ NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다.");
		throw new Error("Supabase URL이 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
	}

	if (!supabaseKey) {
		console.error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 환경 변수가 설정되지 않았습니다.");
		throw new Error("Supabase API Key가 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
	}

	const cookieStore = await cookies();

	return createSupabaseServerClient<Database>(supabaseUrl, supabaseKey, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(cookiesToSet) {
				for (const { name, value, options } of cookiesToSet) {
					cookieStore.set(name, value, options);
				}
			},
		},
	});
}

/**
 * 컨텍스트에 따라 적절한 Supabase 클라이언트 생성
 * @param useAdmin - Admin 클라이언트 사용 여부 (기본값: false)
 * @returns Supabase 클라이언트
 *
 * **사용 시나리오**:
 * - useAdmin=false: Server Component, Server Action, Route Handler (일반)
 * - useAdmin=true: Cron, Background Jobs (cookies 사용 불가)
 */
export async function getSupabaseClient(useAdmin = false) {
	return useAdmin ? createAdminClient() : await createServerClient();
}

/**
 * Supabase Admin 클라이언트 (Service Role)
 * RLS 우회, 서버 사이드 전용 (Cron, Background Jobs 등)
 *
 * ⚠️ 주의: Service Role Key는 모든 데이터 접근 권한이 있으므로 절대 클라이언트에 노출하지 마세요.
 */
export function createAdminClient() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	// 환경 변수 검증
	if (!supabaseUrl) {
		console.error("❌ NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다.");
		throw new Error("Supabase URL이 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
	}

	if (!supabaseServiceKey) {
		console.error("❌ SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.");
		throw new Error(
			"Supabase Service Role Key가 설정되지 않았습니다. .env.local 파일을 확인해주세요."
		);
	}

	return createClient<Database>(supabaseUrl, supabaseServiceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}
