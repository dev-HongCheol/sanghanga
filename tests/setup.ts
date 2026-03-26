// @testing-library/jest-dom/vitest: Vitest 환경에서 DOM 요소 검증을 위한 커스텀 매처(Matcher)를 추가합니다.
// 예: expect(element).toBeInTheDocument(), expect(element).toHaveClass() 등을 사용할 수 있게 됩니다.
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

/**
 * [학습 포인트]
 * Vitest(JSDOM) 환경은 실제 브라우저가 아니므로 window.matchMedia와 같은 특정 브라우저 API가 구현되어 있지 않습니다.
 * 따라서 테스트 실행 시 이 API를 사용하는 컴포넌트나 훅에서 오류가 발생할 수 있으므로,
 * 전역 설정 파일(setup.ts)에서 이를 모킹하여 테스트 환경을 안정화합니다.
 */
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // Deprecated
		removeListener: vi.fn(), // Deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});
