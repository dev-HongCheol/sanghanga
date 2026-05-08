import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
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
