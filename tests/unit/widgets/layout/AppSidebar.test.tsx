import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/widgets/layout/ui/AppSidebar";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { ROUTES } from "@/shared/config/routes";

/**
 * @fileoverview AppSidebar 컴포넌트 단위 테스트
 * @description 사이드바의 렌더링, 메뉴 구조, 경로 기반 활성화를 검증합니다.
 *
 * [학습 포인트]
 * - next/navigation과 같은 프레임워크 훅은 vi.mock()을 통해 동작을 시뮬레이션할 수 있습니다.
 * - Sidebar 컴포넌트는 SidebarProvider 내부에서 렌더링되어야 정상 동작합니다.
 * - isActive와 같은 데이터 속성은 렌더링된 요소의 attributes를 통해 검증할 수 있습니다.
 */

// 1. next/navigation 모킹
vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
}));

// 2. lucide-react 아이콘 모킹 (테스트 속도 및 복잡도 감소)
vi.mock("lucide-react", async () => {
	const actual = await vi.importActual("lucide-react");
	return {
		...actual,
		TrendingUp: () => <div data-testid="icon-trending-up" />,
		DollarSign: () => <div data-testid="icon-dollar-sign" />,
		Sparkles: () => <div data-testid="icon-sparkles" />,
		ChevronDown: () => <div data-testid="icon-chevron-down" />,
	};
});

describe("AppSidebar 컴포넌트", () => {
	const renderSidebar = (pathname: string = "/") => {
		(usePathname as any).mockReturnValue(pathname);
		return render(
			<SidebarProvider defaultOpen={true}>
				<AppSidebar />
			</SidebarProvider>
		);
	};

	// 한글 텍스트 상수 (깨짐 방지 및 재사용)
	const LABELS = {
		LOGO: "sanghanga",
		PARENT: "실시간 주도주",
		CHILD: "거래대금 상위 기업",
	};

	describe("1. 렌더링", () => {
		it("사이드바가 정상적으로 렌더링되어야 한다", () => {
			const { container } = renderSidebar();
			const sidebar = container.querySelector('[data-sidebar="sidebar"]');
			expect(sidebar).toBeInTheDocument();
		});

		it("'sanghanga' 로고가 표시되어야 한다", () => {
			renderSidebar();
			expect(screen.getByText(LABELS.LOGO)).toBeInTheDocument();
		});

		it("로고는 메인 페이지('/') 링크를 가져야 한다", () => {
			renderSidebar();
			const logoLink = screen.getByRole("link", { name: LABELS.LOGO });
			expect(logoLink).toHaveAttribute("href", "/");
		});
	});

	describe("2. 메뉴 구조", () => {
		it("ROUTES 배열의 모든 1depth 메뉴가 렌더링되어야 한다", () => {
			renderSidebar();
			ROUTES.forEach((route) => {
				// 텍스트가 여러 요소로 나뉠 수 있으므로 함수형 매처 사용
				const elements = screen.getAllByText((content) => content.includes(route.label));
				expect(elements.length).toBeGreaterThan(0);
			});
		});

		it("2depth 메뉴가 있는 경우 하위 메뉴들도 렌더링되어야 한다", async () => {
			renderSidebar("/stock-ranking/trading-value"); // 하위 메뉴가 활성화된 경로로 렌더링하여 열린 상태 보장
			
			const childMenu = screen.queryByText((content) => content.includes(LABELS.CHILD));
			expect(childMenu).toBeInTheDocument();
		});

		it("아이콘이 설정된 메뉴는 아이콘을 표시해야 한다", () => {
			renderSidebar();
			expect(screen.getByTestId("icon-trending-up")).toBeInTheDocument();
		});
	});

	describe("3. 현재 경로 하이라이트 (isActive)", () => {
		it("현재 경로와 메뉴 href가 일치하면 해당 메뉴가 활성화되어야 한다", () => {
			const targetPath = "/stock-ranking/trading-value";
			renderSidebar(targetPath);

			// 하위 메뉴 링크 찾기
			const subMenuLink = screen.getByRole("link", { name: (n) => n.includes(LABELS.CHILD) });
			expect(subMenuLink).toHaveAttribute("data-active", "true");
		});

		it("현재 경로가 부모 메뉴의 href로 시작하면 부모 메뉴도 활성화되어야 한다", () => {
			const targetPath = "/stock-ranking/trading-value";
			renderSidebar(targetPath);

			const parentMenuButton = screen.getByText((c) => c.includes(LABELS.PARENT)).closest("button");
			expect(parentMenuButton).toHaveAttribute("data-active", "true");
		});
	});

	describe("4. Collapsible 동작", () => {
		it("현재 활성 메뉴를 포함하는 부모 메뉴는 기본으로 펼쳐져 있어야 한다 (data-state='open')", () => {
			const targetPath = "/stock-ranking/trading-value";
			renderSidebar(targetPath);

			const collapsible = screen.getByText((c) => c.includes(LABELS.PARENT)).closest("[data-state]");
			expect(collapsible).toHaveAttribute("data-state", "open");
		});
	});
});
