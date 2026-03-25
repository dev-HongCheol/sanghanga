# 프로젝트 초기 설정 테스트 명세

## 문서 정보
- **현재 버전**: v1.0
- **최종 수정일**: 2026-03-25
- **PRD 버전**: v1.0 ([prd.md](./prd.md) 참조)
- **테스트 담당**: Gemini
- **구현 담당**: Claude

## 변경 이력
| 버전 | 날짜 | 변경 내용 | 영향받는 테스트 | 담당 |
|------|------|-----------|-----------------|------|
| v1.0 | 2026-03-25 | 초기 작성 | - | Claude |

## 개요

프로젝트 초기 설정의 테스트 명세입니다. 기본 컴포넌트, 유틸리티 함수, 타입 정의, 설정 파일들이 올바르게 동작하는지 검증합니다.

## 테스트 환경

- **테스트 프레임워크**: Vitest
- **테스트 라이브러리**: @testing-library/react
- **테스트 유틸**: @testing-library/jest-dom
- **Node 환경**: Node.js 20+
- **패키지 매니저**: pnpm

### 설치 필요한 패키지
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom @testing-library/user-event
```

### 테스트 폴더 구조
```
tests/
├── unit/                  # 단위 테스트
│   └── shared/
│       ├── lib/
│       │   └── utils.test.ts
│       └── types/
│           └── common.types.test.ts
├── integration/           # 통합 테스트
│   └── app/
│       ├── layout.test.tsx
│       ├── page.test.tsx
│       ├── error.test.tsx
│       └── loading.test.tsx
├── config/               # 설정 검증 테스트
│   ├── biome.test.ts
│   ├── typescript.test.ts
│   └── tailwind.test.ts
└── setup.ts             # 테스트 설정
```

## 테스트 범위

### 단위 테스트 (Unit Tests)
- [x] TC-UNIT-001: `cn()` 유틸리티 함수
- [x] TC-UNIT-002: TypeScript 타입 정의

### 통합 테스트 (Integration Tests)
- [x] TC-INT-001: 루트 레이아웃 렌더링
- [x] TC-INT-002: 홈 페이지 렌더링 및 링크
- [x] TC-INT-003: 에러 페이지 동작
- [x] TC-INT-004: 로딩 페이지 렌더링

### 설정 검증 테스트 (Configuration Tests)
- [x] TC-CFG-001: Biome 설정 유효성
- [x] TC-CFG-002: TypeScript 컴파일 통과
- [x] TC-CFG-003: Tailwind CSS 설정

---

## 테스트 케이스 상세

### TC-UNIT-001: `cn()` 유틸리티 함수
**상태**: 🆕 신규 (v1.0)
**우선순위**: 높음

**요구사항**:
- Tailwind CSS 클래스를 병합해야 한다
- 조건부 클래스를 처리해야 한다
- 중복 클래스를 제거해야 한다
- conflicting 클래스는 마지막 것만 적용해야 한다

**테스트 파일**: `tests/unit/shared/lib/utils.test.ts`

**테스트 케이스**:
1. **기본 병합**: 여러 클래스 문자열을 하나로 병합
2. **조건부 클래스**: falsy 값은 무시하고 truthy 값만 포함
3. **중복 제거**: 같은 클래스가 여러 번 나와도 한 번만 적용
4. **충돌 해결**: `bg-red-500`과 `bg-blue-500`처럼 충돌하는 클래스는 마지막 것만 적용
5. **배열 입력**: 배열로 클래스를 전달해도 동작
6. **객체 입력**: 객체로 조건부 클래스 전달

**예상 코드**:
```typescript
import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn() 유틸리티 함수", () => {
	it("여러 클래스 문자열을 병합한다", () => {
		expect(cn("class1", "class2", "class3")).toBe("class1 class2 class3");
	});

	it("falsy 값을 무시한다", () => {
		expect(cn("class1", false, "class2", null, "class3", undefined)).toBe(
			"class1 class2 class3",
		);
	});

	it("중복 클래스를 제거한다", () => {
		expect(cn("p-4", "p-4", "m-2")).toBe("p-4 m-2");
	});

	it("충돌하는 Tailwind 클래스는 마지막 것만 적용한다", () => {
		expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
		expect(cn("text-sm", "text-lg")).toBe("text-lg");
	});

	it("배열 입력을 처리한다", () => {
		expect(cn(["class1", "class2"], "class3")).toBe("class1 class2 class3");
	});

	it("객체로 조건부 클래스를 처리한다", () => {
		expect(cn({ "class1": true, "class2": false, "class3": true })).toBe(
			"class1 class3",
		);
	});

	it("빈 입력에 대해 빈 문자열을 반환한다", () => {
		expect(cn()).toBe("");
		expect(cn("", null, undefined)).toBe("");
	});
});
```

**Mock 데이터**: 없음 (순수 함수)

---

### TC-UNIT-002: TypeScript 타입 정의
**상태**: 🆕 신규 (v1.0)
**우선순위**: 중간

**요구사항**:
- `ApiResponse<T>` 타입이 올바르게 정의되어야 한다
- `PaginationMeta` 타입이 올바르게 정의되어야 한다
- `PaginatedResponse<T>` 타입이 올바르게 정의되어야 한다

**테스트 파일**: `tests/unit/shared/types/common.types.test.ts`

**테스트 케이스**:
1. **ApiResponse 타입**: success, data, error 프로퍼티 검증
2. **PaginationMeta 타입**: 페이지네이션 정보 프로퍼티 검증
3. **PaginatedResponse 타입**: ApiResponse + meta 프로퍼티 검증
4. **제네릭 타입**: 다양한 타입으로 사용 가능

**예상 코드**:
```typescript
import { describe, expect, it } from "vitest";
import type {
	ApiResponse,
	PaginatedResponse,
	PaginationMeta,
} from "./common.types";

describe("공통 타입 정의", () => {
	it("ApiResponse 타입이 올바르게 정의됨", () => {
		const successResponse: ApiResponse<string> = {
			success: true,
			data: "test data",
		};

		const errorResponse: ApiResponse = {
			success: false,
			error: "error message",
		};

		expect(successResponse.success).toBe(true);
		expect(successResponse.data).toBe("test data");
		expect(errorResponse.success).toBe(false);
		expect(errorResponse.error).toBe("error message");
	});

	it("PaginationMeta 타입이 올바르게 정의됨", () => {
		const meta: PaginationMeta = {
			currentPage: 1,
			totalPages: 10,
			totalItems: 100,
			itemsPerPage: 10,
		};

		expect(meta.currentPage).toBe(1);
		expect(meta.totalPages).toBe(10);
	});

	it("PaginatedResponse 타입이 올바르게 정의됨", () => {
		const response: PaginatedResponse<{ id: number; name: string }> = {
			success: true,
			data: [
				{ id: 1, name: "Item 1" },
				{ id: 2, name: "Item 2" },
			],
			meta: {
				currentPage: 1,
				totalPages: 5,
				totalItems: 50,
				itemsPerPage: 10,
			},
		};

		expect(response.data?.length).toBe(2);
		expect(response.meta.totalItems).toBe(50);
	});

	it("제네릭 타입으로 다양한 데이터 타입 사용 가능", () => {
		// 문자열
		const stringResponse: ApiResponse<string> = {
			success: true,
			data: "test",
		};

		// 숫자
		const numberResponse: ApiResponse<number> = {
			success: true,
			data: 42,
		};

		// 객체
		const objectResponse: ApiResponse<{ id: number }> = {
			success: true,
			data: { id: 1 },
		};

		expect(stringResponse.data).toBe("test");
		expect(numberResponse.data).toBe(42);
		expect(objectResponse.data?.id).toBe(1);
	});
});
```

**Mock 데이터**: 없음 (타입 검증)

---

### TC-INT-001: 루트 레이아웃 렌더링
**상태**: 🆕 신규 (v1.0)
**우선순위**: 높음

**요구사항**:
- 루트 레이아웃이 정상적으로 렌더링되어야 한다
- `<html>` 태그에 `lang="ko"` 속성이 있어야 한다
- children을 정상적으로 렌더링해야 한다
- globals.css가 적용되어야 한다

**테스트 파일**: `tests/integration/app/layout.test.tsx`

**테스트 케이스**:
1. **기본 렌더링**: 레이아웃이 에러 없이 렌더링됨
2. **언어 설정**: html 태그에 lang="ko" 속성 존재
3. **children 렌더링**: 전달된 children이 올바르게 표시됨
4. **메타데이터**: title과 description 확인

**예상 코드**:
```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RootLayout, { metadata } from "./layout";

describe("루트 레이아웃", () => {
	it("children을 정상적으로 렌더링한다", () => {
		render(
			<RootLayout>
				<div>Test Content</div>
			</RootLayout>,
		);

		expect(screen.getByText("Test Content")).toBeInTheDocument();
	});

	it("메타데이터가 올바르게 정의됨", () => {
		expect(metadata.title).toBe("상한가 - 키움증권 트레이딩 플랫폼");
		expect(metadata.description).toContain("키움증권 REST API");
	});
});
```

**Mock 데이터**: 없음

---

### TC-INT-002: 홈 페이지 기본 구조
**상태**: 🆕 신규 (v1.0)
**우선순위**: 높음
**범위**: 구조 검증 (세부 콘텐츠는 "홈 페이지 콘텐츠 PRD"에서 별도 테스트)

**요구사항**:
- 홈 페이지가 에러 없이 렌더링되어야 한다
- 메인 제목(h1) 요소가 존재해야 한다
- 최소 1개 이상의 링크가 존재해야 한다
- 푸터 영역이 존재해야 한다

**테스트하지 않는 것** (나중에 변경될 수 있음):
- ❌ 구체적인 텍스트 내용 ("상한가", "트레이딩 시작하기" 등)
- ❌ 링크의 정확한 개수 및 href 값
- ❌ 스타일 및 레이아웃 세부사항

**테스트 파일**: `tests/integration/app/page.test.tsx`

**테스트 케이스**:
1. **기본 렌더링**: 페이지가 에러 없이 렌더링됨
2. **제목 구조**: h1 요소가 존재함 (내용 무관)
3. **링크 존재**: 최소 1개 이상의 링크가 존재함
4. **푸터 구조**: footer 또는 contentinfo 역할의 요소 존재

**예상 코드**:
```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("홈 페이지 기본 구조", () => {
	it("페이지가 에러 없이 렌더링된다", () => {
		const { container } = render(<HomePage />);
		expect(container).toBeInTheDocument();
	});

	it("메인 제목(h1)이 존재한다", () => {
		render(<HomePage />);
		const heading = screen.getByRole("heading", { level: 1 });
		expect(heading).toBeInTheDocument();
		// 제목 내용은 검증하지 않음 (나중에 변경 가능)
	});

	it("내비게이션 링크가 최소 1개 이상 존재한다", () => {
		render(<HomePage />);
		const links = screen.getAllByRole("link");
		expect(links.length).toBeGreaterThan(0);
		// 구체적인 링크 개수나 href는 검증하지 않음
	});

	it("푸터 영역이 존재한다", () => {
		render(<HomePage />);
		const { container } = render(<HomePage />);
		// footer 태그 또는 푸터 역할의 요소 확인
		const footer = container.querySelector("footer") || screen.queryByRole("contentinfo");
		expect(footer).toBeTruthy();
		// 푸터 내용은 검증하지 않음
	});
});
```

**Mock 데이터**: 없음

---

### TC-INT-003: 에러 페이지 동작
**상태**: 🆕 신규 (v1.0)
**우선순위**: 높음

**요구사항**:
- 에러 페이지가 정상적으로 렌더링되어야 한다
- 에러 메시지가 표시되어야 한다
- "다시 시도" 버튼이 있어야 한다
- 버튼 클릭 시 reset 함수가 호출되어야 한다

**테스트 파일**: `tests/integration/app/error.test.tsx`

**테스트 케이스**:
1. **기본 렌더링**: 에러 페이지가 렌더링됨
2. **에러 메시지 표시**: 전달된 에러 메시지가 표시됨
3. **다시 시도 버튼**: 버튼이 존재함
4. **reset 함수 호출**: 버튼 클릭 시 reset 함수 호출됨
5. **console.error 호출**: useEffect에서 에러 로깅됨

**예상 코드**:
```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ErrorPage from "./error";

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

	it("다시 시도 버튼이 존재한다", () => {
		render(<ErrorPage error={mockError} reset={mockReset} />);
		const button = screen.getByRole("button", { name: "다시 시도" });
		expect(button).toBeInTheDocument();
	});

	it("버튼 클릭 시 reset 함수가 호출된다", async () => {
		const user = userEvent.setup();
		render(<ErrorPage error={mockError} reset={mockReset} />);

		const button = screen.getByRole("button", { name: "다시 시도" });
		await user.click(button);

		expect(mockReset).toHaveBeenCalledTimes(1);
	});

	it("console.error가 호출된다", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		render(<ErrorPage error={mockError} reset={mockReset} />);

		expect(consoleSpy).toHaveBeenCalledWith(mockError);
		consoleSpy.mockRestore();
	});
});
```

**Mock 데이터**:
```typescript
const mockError = new Error("테스트 에러 메시지");
const mockReset = vi.fn();
```

---

### TC-INT-004: 로딩 페이지 렌더링
**상태**: 🆕 신규 (v1.0)
**우선순위**: 중간

**요구사항**:
- 로딩 페이지가 정상적으로 렌더링되어야 한다
- 스피너 애니메이션이 표시되어야 한다
- 중앙 정렬되어야 한다

**테스트 파일**: `tests/integration/app/loading.test.tsx`

**테스트 케이스**:
1. **기본 렌더링**: 로딩 페이지가 렌더링됨
2. **스피너 존재**: 스피너 요소가 존재함
3. **애니메이션 클래스**: animate-spin 클래스가 적용됨
4. **중앙 정렬**: flex와 justify-center 클래스가 적용됨

**예상 코드**:
```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Loading from "./loading";

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
```

**Mock 데이터**: 없음

---

### TC-CFG-001: Biome 설정 유효성
**상태**: 🆕 신규 (v1.0)
**우선순위**: 높음

**요구사항**:
- biome.json 파일이 존재해야 한다
- 올바른 JSON 형식이어야 한다
- linter와 formatter가 활성화되어 있어야 한다
- 필수 규칙들이 설정되어 있어야 한다

**테스트 파일**: `tests/config/biome.test.ts`

**테스트 케이스**:
1. **파일 존재**: biome.json 파일이 존재함
2. **JSON 유효성**: 올바른 JSON 형식
3. **Linter 활성화**: linter.enabled가 true
4. **Formatter 활성화**: formatter.enabled가 true
5. **필수 규칙**: noExplicitAny, noUnusedVariables 등이 error로 설정됨
6. **포맷 설정**: semicolons, quoteStyle 등이 설정됨

**예상 코드**:
```typescript
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Biome 설정", () => {
	const biomePath = path.resolve(process.cwd(), "biome.json");
	const biomeConfig = JSON.parse(fs.readFileSync(biomePath, "utf-8"));

	it("biome.json 파일이 존재한다", () => {
		expect(fs.existsSync(biomePath)).toBe(true);
	});

	it("linter가 활성화되어 있다", () => {
		expect(biomeConfig.linter.enabled).toBe(true);
	});

	it("formatter가 활성화되어 있다", () => {
		expect(biomeConfig.formatter.enabled).toBe(true);
	});

	it("noExplicitAny 규칙이 error로 설정되어 있다", () => {
		expect(biomeConfig.linter.rules.suspicious.noExplicitAny).toBe("error");
	});

	it("noUnusedVariables 규칙이 error로 설정되어 있다", () => {
		expect(biomeConfig.linter.rules.correctness.noUnusedVariables).toBe("error");
	});

	it("세미콜론 설정이 올바르다", () => {
		expect(biomeConfig.javascript.formatter.semicolons).toBe("always");
	});

	it("따옴표 설정이 올바르다", () => {
		expect(biomeConfig.javascript.formatter.quoteStyle).toBe("double");
	});

	it("들여쓰기 설정이 올바르다", () => {
		expect(biomeConfig.formatter.indentStyle).toBe("tab");
	});
});
```

**Mock 데이터**: 없음 (설정 파일 읽기)

---

### TC-CFG-002: TypeScript 컴파일 통과
**상태**: 🆕 신규 (v1.0)
**우선순위**: 높음

**요구사항**:
- TypeScript 컴파일이 에러 없이 통과해야 한다
- tsconfig.json이 올바르게 설정되어 있어야 한다
- strict 모드가 활성화되어 있어야 한다
- path alias가 설정되어 있어야 한다

**테스트 파일**: `tests/config/typescript.test.ts`

**테스트 케이스**:
1. **파일 존재**: tsconfig.json 파일이 존재함
2. **strict 모드**: strict가 true로 설정됨
3. **path alias**: @/* 경로가 ./src/*로 매핑됨
4. **JSX 설정**: jsx가 "preserve"로 설정됨
5. **module 설정**: module이 "esnext"로 설정됨

**예상 코드**:
```typescript
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("TypeScript 설정", () => {
	const tsconfigPath = path.resolve(process.cwd(), "tsconfig.json");
	const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));

	it("tsconfig.json 파일이 존재한다", () => {
		expect(fs.existsSync(tsconfigPath)).toBe(true);
	});

	it("strict 모드가 활성화되어 있다", () => {
		expect(tsconfig.compilerOptions.strict).toBe(true);
	});

	it("path alias가 올바르게 설정되어 있다", () => {
		expect(tsconfig.compilerOptions.paths["@/*"]).toEqual(["./src/*"]);
	});

	it("JSX가 올바르게 설정되어 있다", () => {
		expect(tsconfig.compilerOptions.jsx).toBe("preserve");
	});

	it("module이 올바르게 설정되어 있다", () => {
		expect(tsconfig.compilerOptions.module).toBe("esnext");
	});

	it("esModuleInterop이 활성화되어 있다", () => {
		expect(tsconfig.compilerOptions.esModuleInterop).toBe(true);
	});
});
```

**Mock 데이터**: 없음

---

### TC-CFG-003: Tailwind CSS 설정
**상태**: 🆕 신규 (v1.0)
**우선순위**: 중간

**요구사항**:
- tailwind.config.ts 파일이 존재해야 한다
- content 경로가 올바르게 설정되어 있어야 한다
- FSD 폴더 구조가 content에 포함되어 있어야 한다

**테스트 파일**: `tests/config/tailwind.test.ts`

**테스트 케이스**:
1. **파일 존재**: tailwind.config.ts 파일이 존재함
2. **content 경로**: src/app, src/widgets, src/features 등이 포함됨
3. **theme 확장**: colors에 background와 foreground가 정의됨

**예상 코드**:
```typescript
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Tailwind CSS 설정", () => {
	const tailwindPath = path.resolve(process.cwd(), "tailwind.config.ts");

	it("tailwind.config.ts 파일이 존재한다", () => {
		expect(fs.existsSync(tailwindPath)).toBe(true);
	});

	it("설정 파일에 필수 경로가 포함되어 있다", () => {
		const content = fs.readFileSync(tailwindPath, "utf-8");
		expect(content).toContain("./src/app/**/*.{js,ts,jsx,tsx,mdx}");
		expect(content).toContain("./src/widgets/**/*.{js,ts,jsx,tsx,mdx}");
		expect(content).toContain("./src/features/**/*.{js,ts,jsx,tsx,mdx}");
		expect(content).toContain("./src/entities/**/*.{js,ts,jsx,tsx,mdx}");
		expect(content).toContain("./src/shared/**/*.{js,ts,jsx,tsx,mdx}");
	});

	it("theme 확장이 설정되어 있다", () => {
		const content = fs.readFileSync(tailwindPath, "utf-8");
		expect(content).toContain("background");
		expect(content).toContain("foreground");
	});
});
```

**Mock 데이터**: 없음

---

## Gemini 작업 가이드

### 📋 작업 순서

1. **테스트 환경 설정**
   ```bash
   # 테스트 패키지 설치
   pnpm add -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom @testing-library/user-event
   ```

2. **Vitest 설정 파일 생성** (`vitest.config.ts`)
   ```typescript
   import react from "@vitejs/plugin-react";
   import path from "node:path";
   import { defineConfig } from "vitest/config";

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: "jsdom",
       globals: true,
       setupFiles: ["./tests/setup.ts"],
     },
     resolve: {
       alias: {
         "@": path.resolve(__dirname, "./src"),
       },
     },
   });
   ```

3. **테스트 설정 파일 생성** (`tests/setup.ts`)
   ```typescript
   import "@testing-library/jest-dom/vitest";
   ```

4. **테스트 작성 순서**
   - ✅ TC-UNIT-001: cn() 함수 테스트 (가장 간단)
   - ✅ TC-UNIT-002: 타입 정의 테스트
   - ✅ TC-INT-001: 루트 레이아웃 테스트
   - ✅ TC-INT-002: 홈 페이지 테스트
   - ✅ TC-INT-003: 에러 페이지 테스트
   - ✅ TC-INT-004: 로딩 페이지 테스트
   - ✅ TC-CFG-001: Biome 설정 테스트
   - ✅ TC-CFG-002: TypeScript 설정 테스트
   - ✅ TC-CFG-003: Tailwind 설정 테스트

5. **package.json 스크립트 추가**
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:ui": "vitest --ui",
       "test:coverage": "vitest --coverage"
     }
   }
   ```

### ✅ 완료 기준

- [x] 모든 테스트 파일 작성 완료 (9개)
- [x] `pnpm test` 실행 시 모든 테스트 통과
- [x] 테스트 커버리지 80% 이상
- [x] test-spec.md의 모든 체크박스 `[x]`로 변경
- [x] 테스트 실행 결과 스크린샷 또는 로그 기록

### 🔍 주의사항

1. **Client Component 테스트**: error.tsx는 'use client'이므로 React Testing Library 사용
2. **비동기 처리**: userEvent는 async/await 사용 필요
3. **Mock 함수**: vi.fn()으로 mock 함수 생성
4. **파일 시스템**: Node.js fs 모듈로 설정 파일 읽기
5. **경로 설정**: @/* alias가 vitest.config.ts에 설정되어야 함

### 📊 테스트 실행 명령어

```bash
# 전체 테스트 실행
pnpm test

# 특정 파일만 테스트
pnpm test src/shared/lib/utils.test.ts

# watch 모드
pnpm test --watch

# 커버리지 확인
pnpm test:coverage
```

### 📝 완료 후 작업

1. 모든 체크박스를 `[x]`로 변경
2. `document/index.md`에서 "프로젝트 초기 설정" 상태를 ✅ 완료로 유지
3. 테스트 실행 결과를 이 파일에 추가 (선택사항)

---

## 테스트 실행 결과

### 실행 일시
- 날짜: 2026-03-25
- 담당: Gemini

### 결과 요약
```
 RUN  v4.1.1 F:/work/sanghanga

 Test Files  9 passed (9)
      Tests  35 passed (35)
   Start at  11:53:23
   Duration  1.78s (transform 290ms, setup 866ms, import 811ms, tests 351ms, environment 10.16s)
```

### 커버리지
```
--------------|---------|----------|---------|---------|-------------------
File          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------|---------|----------|---------|---------|-------------------
All files     |     100 |      100 |     100 |     100 |                  
 app          |     100 |      100 |     100 |     100 |                  
  error.tsx   |     100 |      100 |     100 |     100 |                  
  layout.tsx  |     100 |      100 |     100 |     100 |                  
  loading.tsx |     100 |      100 |     100 |     100 |                  
  page.tsx    |     100 |      100 |     100 |     100 |                  
 shared/lib   |     100 |      100 |     100 |     100 |                  
  utils.ts    |     100 |      100 |     100 |     100 |                  
--------------|---------|----------|---------|---------|-------------------
```
