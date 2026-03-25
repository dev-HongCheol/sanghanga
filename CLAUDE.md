# Claude Code 프로젝트 지침서

> 이 문서는 Claude Code가 이 프로젝트에서 작업할 때 따라야 할 원칙과 규칙을 정의합니다.

## 프로젝트 개요

**키움증권 REST API를 활용한 실시간 웹 트레이딩 플랫폼**

- **프레임워크**: Next.js 16 (App Router) + TypeScript 5.x
- **아키텍처**: Feature-Sliced Design (FSD)
- **스타일링**: Tailwind CSS + Shadcn UI
- **폼 검증**: Zod + React Hook Form
- **상태 관리**: Zustand (클라이언트) + TanStack Query (서버 상태)
- **패키지 매니저**: pnpm (필수)

## 핵심 원칙

### 1. 문서 우선

작업 시작 전 **반드시 관련 문서 먼저 읽기**:
- `document/architecture.md` - FSD 아키텍처
- `document/coding-standards.md` - 코딩 규칙
- `document/development.md` - 개발 패턴
- 해당 기능의 PRD (`document/prd/{기능명}/prd.md`)

### 2. PRD 기반 개발

**모든 기능은 PRD 작성부터 시작**:
1. PRD 작성 (`document/prd/{기능명}/prd.md`)
2. `document/index.md`에 등록 (상태: 📝 작성중)
3. 구현하면서 **PRD 체크리스트 실시간 업데이트** (`- [ ]` → `- [x]`)
4. 완료 시 `document/index.md` 상태 변경 (📝 → 🚧 → ✅)

**PRD 없는 구현 금지**

### 3. FSD 아키텍처

```
app → widgets → features → entities → shared
```

**규칙**:
- 상위 레이어는 하위 레이어만 import (역방향 금지)
- 같은 레이어 내 슬라이스 간 import 금지
- Public API만 export (`index.ts`)

### 4. Server Component 우선

**기본은 Server Component** (async 가능, 데이터 페칭, SEO 최적화)

**Client Component는 최소한으로**:
- 인터랙션 (onClick, onChange)
- 상태 관리 (useState, useReducer)
- 브라우저 API (window, localStorage)

## 필수 규칙

### JSDoc 주석 (필수)

**모든 함수**:
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

**모든 인터페이스 프로퍼티**:
```typescript
interface OrderRequest {
  /** 종목 코드 (예: '005930') */
  symbol: string;
  /** 주문 수량 */
  quantity: number;
}
```

### 파일 네이밍

| 종류          | 규칙                   | 예시                     |
| :------------ | :--------------------- | :----------------------- |
| 컴포넌트      | `PascalCase.tsx`       | `OrderWidget.tsx`        |
| 폼 컴포넌트   | `PascalCaseForm.tsx`   | `OrderForm.tsx`          |
| Route Handler | `route.ts`             | `app/api/order/route.ts` |
| Server Action | `camelCase.action.ts`  | `placeOrder.action.ts`   |
| API           | `camelCase.api.ts`     | `placeOrder.api.ts`      |
| Query         | `camelCase.queries.ts` | `placeOrder.queries.ts`  |
| Schema        | `camelCase.schema.ts`  | `placeOrder.schema.ts`   |
| Store         | `camelCase.store.ts`   | `account.store.ts`       |
| Hook          | `useCamelCase.ts`      | `useKiwoomWebSocket.ts`  |

### TypeScript

- **interface 우선** (type은 유니온/인터섹션에만)
- **any 금지** (불가피한 경우 unknown)
- **명시적 type import**: `import type { User } from "./user.types";`

### 패키지 매니저

**pnpm만 사용** (npm, yarn 금지)

## Next.js 패턴

### Form 검증 (Zod + React Hook Form)

```typescript
// features/placeOrder/model/order.schema.ts
export const orderSchema = z.object({
  symbol: z.string().min(1, "종목 코드를 입력하세요"),
  quantity: z.number().positive("수량은 양수여야 합니다"),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

// features/placeOrder/ui/OrderForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderSchema, type OrderFormValues } from "../model/order.schema";

export const OrderForm = () => {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { symbol: "", quantity: 0 },
  });

  const onSubmit = async (data: OrderFormValues) => {
    await placeOrderAction(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField control={form.control} name="symbol" ... />
        <Button type="submit">주문하기</Button>
      </form>
    </Form>
  );
};
```

### Server Actions

```typescript
// features/placeOrder/actions/placeOrder.action.ts
"use server";

import { revalidatePath } from "next/cache";
import { orderSchema } from "../model/order.schema";

export async function placeOrderAction(data: unknown) {
  // 1. 검증
  const parsed = orderSchema.parse(data);

  // 2. 비즈니스 로직
  const result = await placeOrderToKiwoom(parsed);

  // 3. 캐시 무효화
  revalidatePath("/portfolio");

  return result;
}
```

### Route Handler

```typescript
// app/api/order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { orderSchema } from "@/features/placeOrder/model/order.schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = orderSchema.parse(body);
    const result = await placeOrderToKiwoom(parsed);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## 작업 프로세스

### 새 기능 추가

1. **PRD 작성** → `document/prd/{기능명}/prd.md`
2. **문서 참조** → architecture.md, coding-standards.md
3. **FSD 레이어 판단** → widgets/features/entities
4. **구현** → Server Component 우선, JSDoc 필수, **PRD 체크리스트 실시간 업데이트**
5. **테스트** → PRD 시나리오 기반
6. **문서 업데이트** → PRD 모두 체크 완료, `document/index.md` 상태 변경
7. **품질 검사** → lint, test, build

### 버그 수정

1. 원인 분석 → 코드 읽기, 로그 확인
2. 최소한의 변경으로 수정
3. 버그 재현 테스트 작성

### 리팩토링

1. 기존 기능 완전 파악
2. 규칙 준수하며 리팩토링
3. 회귀 테스트

## 주의사항

- **과도한 추상화 방지** - YAGNI 원칙
- **문서 동기화** - 코드 변경 시 PRD, index.md 업데이트
- **키움 API Rate Limiting** - 1초당 최대 20회 (p-limit 사용)
- **SSE 재연결** - 자동 재연결 로직 필수
- **IP 화이트리스트** - 키움 포털에 서버 IP 등록

## 체크리스트

### 작업 전
- [ ] PRD 읽음/작성
- [ ] 문서 참조 (architecture.md, coding-standards.md)
- [ ] FSD 레이어 판단
- [ ] Server Component vs Client Component 판단

### 작업 중
- [ ] JSDoc 주석 (함수, 인터페이스)
- [ ] FSD import 규칙 준수
- [ ] any 타입 금지
- [ ] Server Component 우선
- [ ] 폼 검증은 Zod + React Hook Form
- [ ] **PRD 체크리스트 실시간 업데이트** (`- [ ]` → `- [x]`)

### 작업 후
- [ ] `pnpm lint` 통과
- [ ] `pnpm test` 통과
- [ ] `pnpm build` 성공
- [ ] PRD 체크리스트 모두 완료 (`- [x]`)
- [ ] `document/index.md` 상태 업데이트 (✅ 완료)

## 참조 문서

| 문서            | 경로                           |
| :-------------- | :----------------------------- |
| **아키텍처**    | `document/architecture.md`     |
| **코딩 규칙**   | `document/coding-standards.md` |
| **개발 가이드** | `document/development.md`      |
| **API 가이드**  | `document/api-guide.md`        |
| **문서 목록**   | `document/index.md`            |

## 외부 자료

- [Next.js](https://nextjs.org/docs) - App Router
- [FSD](https://feature-sliced.design/) - 아키텍처
- [Shadcn UI](https://ui.shadcn.com/) - UI 컴포넌트
- [React Hook Form](https://react-hook-form.com/) - 폼 관리
- [Zod](https://zod.dev/) - 스키마 검증
- [TanStack Query](https://tanstack.com/query/latest) - 서버 상태
- [키움 API](https://apiportal.kiwoom.com/)
