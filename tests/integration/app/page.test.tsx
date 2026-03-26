import { render, screen } from "@testing-library/react";
import HomePage from "app/(auth)/page";
import { describe, expect, it } from "vitest";

/**
 * @fileoverview 메인 대시보드 페이지 통합 테스트
 * @description 대시보드의 기본 레이아웃 및 필수 텍스트 렌더링을 검증합니다.
 *
 * [학습 포인트]
 * - 이 테스트는 layout-sidebar 도입 이후 변경된 대시보드 구조를 반영합니다.
 * - getByRole("heading")을 통해 시맨틱한 HTML 구조를 검증합니다.
 */

describe("메인 대시보드 페이지", () => {
	it("페이지가 에러 없이 렌더링된다", () => {
		const { container } = render(<HomePage />);
		expect(container).toBeInTheDocument();
	});

	it("'대시보드' 제목(h1)이 정상적으로 표시된다", () => {
		render(<HomePage />);
		const heading = screen.getByRole("heading", { level: 1, name: "대시보드" });
		expect(heading).toBeInTheDocument();
	});

	it("플랫폼 설명 문구가 포함되어야 한다", () => {
		render(<HomePage />);
		const description = screen.getByText(/키움증권 REST API를 활용한 실시간 웹 트레이딩 플랫폼/i);
		expect(description).toBeInTheDocument();
	});

	it("위젯을 위한 그리드 컨테이너가 존재해야 한다", () => {
		const { container } = render(<HomePage />);
		const gridContainer = container.querySelector(".grid");
		expect(gridContainer).toBeInTheDocument();
	});
});
