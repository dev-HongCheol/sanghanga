import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Loading from "app/loading";

describe("로딩 페이지", () => {
	it("로딩 페이지가 정상적으로 렌더링된다", () => {
		const { container } = render(<Loading />);
		expect(container.firstChild).toBeInTheDocument();
	});

	it("스피너 요소가 존재한다", () => {
		const { container } = render(<Loading />);
		const spinner = container.querySelector(".animate-spin");
		expect(spinner).toBeInTheDocument();
	});

	it("스피너가 올바른 스타일을 가진다", () => {
		const { container } = render(<Loading />);
		const spinner = container.querySelector(".animate-spin");
		expect(spinner).toHaveClass("rounded-full", "border-b-2", "border-gray-900");
	});

	it("컨테이너가 중앙 정렬된다", () => {
		const { container } = render(<Loading />);
		const wrapper = container.firstChild;
		expect(wrapper).toHaveClass("flex", "items-center", "justify-center");
	});
});
