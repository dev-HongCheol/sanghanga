/**
 * @fileoverview 인증 영역 레이아웃
 * @description 사이드바가 포함된 메인 레이아웃
 */

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/shared/ui/sidebar";
import { AppSidebar } from "@/widgets/layout";

/**
 * 인증 영역 레이아웃 (사이드바 포함)
 */
export default function AuthLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger aria-label="사이드바 토글" className="-ml-1" />
					<div className="flex-1" />
					{/* 향후 헤더 우측 컨텐츠 (사용자 메뉴 등) */}
				</header>
				<main className="flex flex-1 flex-col gap-4 p-4 md:p-8">{children}</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
