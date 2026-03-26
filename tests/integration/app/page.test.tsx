import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
// app/page를 사용하여 소스 파일 참조 (루트 app/ 디렉토리)
import HomePage from "app/page";

describe("홈 페이지 기본 구조", () => {
	// TC-INT-002: 구조 검증 중심 (텍스트 내용은 검증하지 않음)
	
	it("페이지가 에러 없이 렌더링된다", () => {
		const { container } = render(<HomePage />);
		expect(container).toBeInTheDocument();
	});

	it("메인 제목(h1) 요소가 존재한다", () => {
		render(<HomePage />);
		// getByRole: 구체적인 텍스트 대신 'heading' 역할을 가진 level 1(h1) 요소를 찾습니다.
		const heading = screen.getByRole("heading", { level: 1 });
		expect(heading).toBeInTheDocument();
	});

	it("내비게이션 링크가 최소 1개 이상 존재한다", () => {
		render(<HomePage />);
		// 'link' 역할을 가진 모든 요소를 찾아 개수를 확인합니다.
		const links = screen.getAllByRole("link");
		expect(links.length).toBeGreaterThan(0);
	});

	it("푸터 영역이 존재한다", () => {
		const { container } = render(<HomePage />);
		// footer 태그 또는 'contentinfo' 역할을 가진 푸터 요소를 찾습니다.
		const footer = container.querySelector("footer") || screen.queryByRole("contentinfo");
		expect(footer).toBeTruthy();
	});
});
