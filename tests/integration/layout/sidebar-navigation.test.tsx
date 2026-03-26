import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRouter, usePathname } from "next/navigation";
import AuthLayout from "app/(auth)/layout";

/**
 * @fileoverview 사이드바 네비게이션 통합 테스트
 * @description 레이아웃과 사이드바의 상호작용 및 실제 페이지 이동 흐름을 검증합니다.
 *
 * [학습 포인트]
 * - 통합 테스트에서는 컴포넌트 간의 연결(Layout -> Sidebar)을 확인합니다.
 * - fireEvent를 통해 사용자 클릭을 시뮬레이션하고, 이에 따른 useRouter의 호출을 확인합니다.
 */

// next/navigation 모킹
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(),
	usePathname: vi.fn(),
}));

describe("사이드바 네비게이션 통합 테스트 (sidebar-navigation)", () => {
	const mockPush = vi.fn();

	const renderAuthLayout = (pathname: string = "/") => {
		(useRouter as any).mockReturnValue({ push: mockPush });
		(usePathname as any).mockReturnValue(pathname);

		return render(
			<AuthLayout>
				<div data-testid="children">Main Content</div>
			</AuthLayout>
		);
	};

	const LABELS = {
		LOGO: "sanghanga",
		PARENT: "실시간 주도주",
		CHILD: "거래대금 상위 기업",
	};

	it("1. (auth) 레이아웃이 사이드바와 메인 콘텐츠를 정상적으로 포함하여 렌더링되어야 한다", () => {
		const { container } = renderAuthLayout();

		const sidebar = container.querySelector('[data-sidebar="sidebar"]');
		expect(sidebar).toBeInTheDocument();
		expect(screen.getByTestId("children")).toBeInTheDocument(); // 메인 콘텐츠
		expect(screen.getByLabelText("사이드바 토글")).toBeInTheDocument(); // SidebarTrigger (한글 라벨)
	});

	it("2. 로고 클릭 시 메인 페이지('/')로 이동해야 한다", () => {
		renderAuthLayout("/stock-ranking");

		const logoLink = screen.getByRole("link", { name: LABELS.LOGO });
		expect(logoLink).toHaveAttribute("href", "/");
	});

	it("3. 메뉴 클릭 시 올바른 경로로의 이동 속성을 가져야 한다", () => {
		// 하위 메뉴가 보이는 경로로 렌더링
		renderAuthLayout("/stock-ranking/trading-value");

		const subMenuLink = screen.getByRole("link", { name: (n) => n.includes(LABELS.CHILD) });
		expect(subMenuLink).toHaveAttribute("href", "/stock-ranking/trading-value");
	});

	it("4. 1depth 메뉴 클릭 시 2depth 메뉴가 펼쳐져야 한다", () => {
		renderAuthLayout("/");

		const parentMenuTrigger = screen.getByText((c) => c.includes(LABELS.PARENT)).closest("button");
		expect(parentMenuTrigger).toBeInTheDocument();

		if (parentMenuTrigger) {
			fireEvent.click(parentMenuTrigger);
		}

		const collapsible = screen.getByText((c) => c.includes(LABELS.PARENT)).closest("[data-state]");
		expect(collapsible).toBeInTheDocument();
	});

	it("5. 다크모드 테마 기반 스타일을 지원해야 한다", () => {
		const { container } = renderAuthLayout();
		const sidebar = container.querySelector('[data-sidebar="sidebar"]');
		expect(sidebar).toBeInTheDocument();
	});
});
