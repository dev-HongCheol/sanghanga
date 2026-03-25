# 코딩 규칙

## 필수 준수 사항

### ✅ 문서화

1. **함수 JSDoc**: 모든 함수에 목적, `@param`, `@returns` 필수
   ```typescript
   /**
    * 주문을 전송합니다
    * @param order - 주문 정보
    * @returns 주문 결과
    */
   export const placeOrder = async (order: PlaceOrderRequest): Promise<OrderResponse> => {
   	// ...
   };
   ```

2. **인터페이스 프로퍼티**: 각 프로퍼티에 설명 주석 필수
   ```typescript
   interface OrderRequest {
   	/** 종목 코드 (예: '005930') */
   	symbol: string;
   	/** 주문 수량 */
   	quantity: number;
   	/** 주문 가격 */
   	price: number;
   }
   ```

3. **5줄 이상 분기문**: 복잡한 로직에 설명 주석 필수
   ```typescript
   // 체결 상태에 따른 처리
   // - pending: 대기 중 (아무 작업 안 함)
   // - filled: 체결 완료 (알림 전송)
   // - cancelled: 취소됨 (주문 목록에서 제거)
   if (status === "pending") {
   	// ...
   } else if (status === "filled") {
   	// ...
   } else if (status === "cancelled") {
   	// ...
   }
   ```

### ✅ 도구 & 라이브러리

1. **pnpm 단독**: `npm`, `yarn` 사용 금지
   ```bash
   # ✅ OK
   pnpm install
   pnpm add react-query

   # ❌ NO
   npm install
   yarn add react-query
   ```

2. **Shadcn UI**: `@/shared/ui`로 import
   ```typescript
   // ✅ OK
   import { Button } from "@/shared/ui/Button";

   // ❌ NO
   import { Button } from "@/components/ui/button";
   ```

3. **API 파일 네이밍**:
   - `xxx.api.ts`: API 함수
   - `xxx.queries.ts`: TanStack Query hooks
   ```
   features/placeOrder/api/
   ├── placeOrder.api.ts      # API 함수
   └── placeOrder.queries.ts  # usePlaceOrder hook
   ```

4. **Server Actions 파일 네이밍**:
   - `xxx.action.ts`: Server Actions
   ```
   features/placeOrder/actions/
   └── placeOrder.action.ts   # placeOrderAction
   ```

## 파일 네이밍

| 종류                | 규칙                   | 예시                        |
| :------------------ | :--------------------- | :-------------------------- |
| **컴포넌트**        | `PascalCase.tsx`       | `OrderWidget.tsx`           |
| **페이지**          | `page.tsx`             | `app/trade/page.tsx`        |
| **레이아웃**        | `layout.tsx`           | `app/layout.tsx`            |
| **Route Handler**   | `route.ts`             | `app/api/order/route.ts`    |
| **Server Action**   | `camelCase.action.ts`  | `placeOrder.action.ts`      |
| **API**             | `camelCase.api.ts`     | `placeOrder.api.ts`         |
| **쿼리**            | `camelCase.queries.ts` | `placeOrder.queries.ts`     |
| **스키마**          | `camelCase.schema.ts`  | `placeOrder.schema.ts`      |
| **타입**            | `camelCase.types.ts`   | `order.types.ts`            |
| **스토어**          | `camelCase.store.ts`   | `account.store.ts`          |
| **훅**              | `useCamelCase.ts`      | `useKiwoomWebSocket.ts`     |
| **유틸**            | `camelCase.ts`         | `formatPrice.ts`            |

## TypeScript 규칙

### 타입 정의

```typescript
// ✅ OK: interface 사용 (확장 가능)
interface User {
	id: string;
	name: string;
}

interface Admin extends User {
	role: string;
}

// ⚠️ 유니온/인터섹션에만 type 사용
type OrderType = "buy" | "sell";
type UserWithRole = User & { role: string };
```

### 타입 import/export

```typescript
// ✅ OK: 명시적 type import
import type { User } from "./user.types";
import { fetchUser } from "./user.api";

// ❌ NO: 혼합 import
import { User, fetchUser } from "./user";
```

### any 금지

```typescript
// ❌ NO
const data: any = fetchData();

// ✅ OK
interface ResponseData {
	/** 사용자 ID */
	id: string;
	/** 사용자 이름 */
	name: string;
}
const data: ResponseData = fetchData();

// ✅ OK: 불가피한 경우 unknown 사용
const data: unknown = fetchData();
if (isResponseData(data)) {
	// type guard로 타입 좁히기
}
```

## React & Next.js 규칙

### Server Component vs Client Component

**기본은 Server Component**:

```typescript
// ✅ Server Component (기본)
// - 'use client' 없음
// - async 가능
// - 서버에서만 실행
async function AccountPage() {
	const account = await fetchAccount(); // 직접 데이터 페칭
	return <div>{account.balance}</div>;
}
```

**Client Component 사용 조건**:

```typescript
// ✅ Client Component ('use client' 필요)
// - 인터랙션 (onClick, onChange)
// - 상태 관리 (useState, useReducer)
// - Effect (useEffect)
// - 브라우저 API (window, localStorage)
"use client";

import { useState } from "react";

function OrderForm() {
	const [quantity, setQuantity] = useState(0);
	return <input onChange={(e) => setQuantity(Number(e.target.value))} />;
}
```

**원칙**:
- **Server Component를 최대한 사용** (성능, SEO)
- **필요한 부분만 Client Component로** (최소 단위)

### 컴포넌트 구조

```typescript
// ✅ OK: 명확한 구조
interface OrderWidgetProps {
	/** 계좌 번호 */
	accountNo: string;
	/** 초기 종목 코드 */
	initialSymbol?: string;
}

/**
 * 주문 위젯
 */
export const OrderWidget = ({ accountNo, initialSymbol }: OrderWidgetProps) => {
	const [symbol, setSymbol] = useState(initialSymbol ?? "");
	const { mutate } = usePlaceOrder();

	const handleSubmit = () => {
		// ...
	};

	return <div>{/* ... */}</div>;
};
```

### 훅 규칙

1. **커스텀 훅은 `use` 접두사**
   ```typescript
   // ✅ OK
   export const useKiwoomWebSocket = () => {
   	// ...
   };

   // ❌ NO
   export const kiwoomWebSocket = () => {
   	// ...
   };
   ```

2. **훅은 최상위에서만 호출**
   ```typescript
   // ❌ NO
   if (condition) {
   	const data = useQuery(/*...*/);
   }

   // ✅ OK
   const { data, isEnabled } = useQuery({
   	enabled: condition,
   	// ...
   });
   ```

3. **훅은 Client Component에서만 사용**
   ```typescript
   // ❌ NO: Server Component에서 훅 사용 불가
   async function Page() {
   	const [state, setState] = useState(0); // Error!
   	return <div />;
   }

   // ✅ OK: Client Component에서 훅 사용
   "use client";
   function Page() {
   	const [state, setState] = useState(0);
   	return <div />;
   }
   ```

### Props 전달

```typescript
// ✅ OK: 구조 분해
<OrderForm symbol="005930" quantity={10} />

// ❌ NO: 스프레드 남용
<OrderForm {...props} />  // props가 뭔지 알 수 없음
```

## Next.js App Router 규칙

### Route Handler

```typescript
// app/api/order/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * 주문 전송 API
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// 비즈니스 로직
		const result = await placeOrderToKiwoom(body);

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
```

### Server Actions

```typescript
// features/placeOrder/actions/placeOrder.action.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
	symbol: z.string(),
	quantity: z.number().positive(),
});

/**
 * 주문 전송 Server Action
 */
export async function placeOrderAction(formData: FormData) {
	// 1. 검증
	const parsed = schema.parse({
		symbol: formData.get("symbol"),
		quantity: Number(formData.get("quantity")),
	});

	// 2. 비즈니스 로직
	const result = await placeOrderToKiwoom(parsed);

	// 3. 캐시 무효화
	revalidatePath("/portfolio");

	return result;
}
```

### 페이지/레이아웃

```typescript
// app/(trading)/trade/page.tsx

// Metadata (SEO)
export const metadata = {
	title: "주문하기",
	description: "주식 주문 페이지",
};

// Route Segment Config
export const dynamic = "force-dynamic"; // 항상 동적 렌더링
export const revalidate = 60; // 60초마다 재검증

/**
 * 주문 페이지
 */
export default async function TradePage() {
	// 서버에서 직접 데이터 페칭
	const account = await fetchAccount();

	return (
		<div>
			<h1>주문하기</h1>
			<OrderWidget accountNo={account.accountNo} />
		</div>
	);
}
```

## ESLint & Prettier 설정

### .eslintrc.json

```json
{
	"extends": ["next/core-web-vitals", "next/typescript"],
	"rules": {
		"@typescript-eslint/no-unused-vars": "error",
		"@typescript-eslint/no-explicit-any": "error",
		"@typescript-eslint/explicit-function-return-type": "off",
		"react-hooks/rules-of-hooks": "error",
		"react-hooks/exhaustive-deps": "warn"
	}
}
```

### .prettierrc

```json
{
	"semi": true,
	"singleQuote": false,
	"tabWidth": 2,
	"useTabs": true,
	"trailingComma": "es5",
	"printWidth": 100,
	"arrowParens": "always"
}
```

### 사용

```bash
# 검사
pnpm lint

# 자동 수정
pnpm lint:fix

# 포맷팅
pnpm format
```

## Git 규칙

### 커밋 메시지

```
<type>: <subject>

<body>

<footer>
```

**타입**:
- `feat`: 새 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 리팩토링
- `test`: 테스트 추가
- `chore`: 빌드, 설정 변경

**예시**:
```
feat: 주문 위젯 추가

- 시장가/지정가 주문 지원
- 실시간 체결 알림

Closes #123
```

### 브랜치 네이밍

```
<type>/<description>

예시:
feature/order-widget
fix/login-bug
docs/update-readme
```

## PRD 작성 규칙

### 폴더 구조

```
document/prd/{기능명}/
├── prd.md              # PRD 본문
├── ui-capture.png      # UI 캡처 (있다면)
└── api-spec.md         # API 명세 (있다면)
```

### PRD 템플릿

```markdown
# {기능명} PRD

## 개요
간단한 기능 설명

## 요구사항
- [ ] 요구사항 1
- [ ] 요구사항 2

## UI/UX
(UI 캡처 이미지 첨부)

## API 명세
### POST /api/order
...

## 기술 스택
- Server Component vs Client Component
- Server Actions vs Route Handlers
- Zod + React Hook Form (폼 검증)

## 구현 체크리스트
> **중요**: 각 항목을 완료할 때마다 실시간으로 체크 표시 (`- [x]`)를 업데이트하세요.

### 스키마 및 타입
- [ ] Zod 스키마 정의 (`{기능명}.schema.ts`)
- [ ] TypeScript 타입 정의 (`{기능명}.types.ts`)

### 컴포넌트
- [ ] Server Component 구현
- [ ] Client Component 구현 (폼, 인터랙션)
- [ ] React Hook Form + Zod 연동

### API
- [ ] Route Handler 구현 (`app/api/{경로}/route.ts`)
- [ ] Server Action 구현 (선택사항)
- [ ] API 에러 핸들링

### 테스트
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] E2E 테스트 작성 (선택사항)

### 문서
- [ ] JSDoc 주석 작성
- [ ] README 업데이트 (필요시)
- [ ] `document/index.md` 상태 업데이트

## 테스트 시나리오
1. ...
2. ...
```

### 체크리스트 업데이트 규칙

**실시간 업데이트 필수**:
- 각 구현 항목을 완료할 때마다 **즉시** PRD 파일의 체크리스트를 업데이트하세요
- 완료된 항목: `- [ ]` → `- [x]`
- 모든 체크리스트가 완료(`- [x]`)되면 `document/index.md`의 상태를 ✅ 완료로 변경

**예시**:
```markdown
## 구현 체크리스트

### 스키마 및 타입
- [x] Zod 스키마 정의  ← 완료됨
- [x] TypeScript 타입 정의  ← 완료됨

### 컴포넌트
- [x] Server Component 구현  ← 완료됨
- [ ] Client Component 구현  ← 진행중
```

### document/index.md 업데이트

PRD 작성/수정 시 반드시 `document/index.md`에 등록:

```markdown
# PRD 목록

| 기능명 | 상태 | 작성일 | 링크 |
|--------|------|--------|------|
| 주문 위젯 | ✅ 완료 | 2024-01-15 | [prd](./prd/order-widget/prd.md) |
| 차트 위젯 | 🚧 진행중 | 2024-01-20 | [prd](./prd/chart-widget/prd.md) |
```

## 체크리스트

### 코드 작성 전

- [ ] PRD 작성 또는 업데이트
- [ ] 구현 체크리스트 작성
- [ ] API 명세 확인
- [ ] Server Component vs Client Component 판단

### 코드 작성 중

- [ ] 함수 JSDoc 주석
- [ ] 인터페이스 프로퍼티 주석
- [ ] 복잡한 로직 설명 주석
- [ ] FSD 아키텍처 준수
- [ ] 타입 정의 (any 금지)
- [ ] Server Component 우선 사용
- [ ] 폼 검증은 Zod + React Hook Form 사용
- [ ] **각 구현 항목 완료 시 PRD 체크리스트 실시간 업데이트**

### 코드 작성 후

- [ ] ESLint 검사 통과
- [ ] 테스트 작성
- [ ] **PRD 체크리스트 모두 완료 확인** (`- [x]`)
- [ ] `document/index.md` 상태 업데이트 (✅ 완료)
- [ ] 커밋 메시지 규칙 준수
- [ ] Next.js 빌드 성공 확인

## 관련 문서

- [architecture.md](./architecture.md) - FSD 아키텍처 개요
- [development.md](./development.md) - 상세 폴더 구조
- [api-guide.md](./api-guide.md) - 키움 REST API 연동
- [index.md](./index.md) - 외부 참고 자료 링크
