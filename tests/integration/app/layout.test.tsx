import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RootLayout, { metadata } from "app/layout";

describe("루트 레이아웃", () => {
	it("전달된 자식 요소(children)를 정상적으로 렌더링한다", () => {
		render(
			<RootLayout>
				<div>Test Content</div>
			</RootLayout>,
		);
		expect(screen.getByText("Test Content")).toBeInTheDocument();
	});

	it("프로젝트의 메타데이터(SEO)가 올바르게 정의되어 있다", () => {
		expect(metadata.title).toBe("상한가 - 키움증권 트레이딩 플랫폼");
		expect(metadata.description).toContain("키움증권 REST API");
	});
});
