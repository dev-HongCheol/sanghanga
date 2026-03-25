import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ErrorPage from "@/app/error";

describe("에러 페이지", () => {
	const mockError = new Error("테스트 에러 메시지");
	const mockReset = vi.fn();

	it("에러 페이지가 정상적으로 렌더링된다", () => {
		render(<ErrorPage error={mockError} reset={mockReset} />);
		expect(screen.getByText("문제가 발생했습니다")).toBeInTheDocument();
	});

	it("에러 메시지가 표시된다", () => {
		render(<ErrorPage error={mockError} reset={mockReset} />);
		expect(screen.getByText("테스트 에러 메시지")).toBeInTheDocument();
	});

	it("'다시 시도' 버튼 클릭 시 reset 함수가 호출된다", async () => {
		const user = userEvent.setup();
		render(<ErrorPage error={mockError} reset={mockReset} />);

		const button = screen.getByRole("button", { name: "다시 시도" });
		await user.click(button);

		expect(mockReset).toHaveBeenCalledTimes(1);
	});

	it("console.error에 에러가 기록된다", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		render(<ErrorPage error={mockError} reset={mockReset} />);
		expect(consoleSpy).toHaveBeenCalledWith(mockError);
		consoleSpy.mockRestore();
	});
});
