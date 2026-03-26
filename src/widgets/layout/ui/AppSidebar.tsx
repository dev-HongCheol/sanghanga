/**
 * @fileoverview 애플리케이션 사이드바 컴포넌트
 * @description Shadcn UI Sidebar 기반 네비게이션 메뉴
 */

"use client";

import { MAIN_ROUTE, ROUTES } from "@/shared/config";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/shared/ui/sidebar";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 애플리케이션 사이드바
 */
export function AppSidebar() {
	const pathname = usePathname();

	return (
		<Sidebar>
			{/* 로고 헤더 */}
			<SidebarGroup>
				<Link href={MAIN_ROUTE.href} className="block px-4 py-6">
					<h1 className="text-2xl font-bold tracking-tight">sanghanga</h1>
				</Link>
			</SidebarGroup>

			{/* 메뉴 */}
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>메뉴</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{ROUTES.map((route) => {
								const isActive = pathname.startsWith(route.href);

								// 2depth 메뉴가 있는 경우
								if (route.children && route.children.length > 0) {
									return (
										<Collapsible
											key={route.href}
											defaultOpen={isActive}
											className="group/collapsible"
										>
											<SidebarMenuItem>
												<CollapsibleTrigger asChild>
													<SidebarMenuButton tooltip={route.label} isActive={isActive}>
														{route.icon && <route.icon className="h-4 w-4" />}
														<span>{route.label}</span>
														<ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
													</SidebarMenuButton>
												</CollapsibleTrigger>
												<CollapsibleContent>
													<SidebarMenuSub>
														{route.children.map((child) => {
															const isChildActive = pathname === child.href;
															return (
																<SidebarMenuSubItem key={child.href}>
																	<SidebarMenuSubButton asChild isActive={isChildActive}>
																		<Link href={child.href}>
																			{child.icon && <child.icon className="h-4 w-4" />}
																			<span>{child.label}</span>
																		</Link>
																	</SidebarMenuSubButton>
																</SidebarMenuSubItem>
															);
														})}
													</SidebarMenuSub>
												</CollapsibleContent>
											</SidebarMenuItem>
										</Collapsible>
									);
								}

								// 1depth만 있는 경우
								return (
									<SidebarMenuItem key={route.href}>
										<SidebarMenuButton asChild tooltip={route.label} isActive={isActive}>
											<Link href={route.href}>
												{route.icon && <route.icon className="h-4 w-4" />}
												<span>{route.label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
