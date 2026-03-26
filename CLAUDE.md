# Claude Code 프로젝트 지침서

> 이 문서는 Claude Code가 이 프로젝트에서 작업할 때 따라야 할 원칙과 규칙을 정의합니다.

## 프로젝트 개요

**키움증권 REST API를 활용한 실시간 웹 트레이딩 플랫폼**

- **프레임워크**: Next.js 16 (App Router) + TypeScript 5.x
- **아키텍처**: Feature-Sliced Design (FSD)
- **UI 라이브러리**: Shadcn UI (필수) - `src/shared/ui` 경로
- **스타일링**: Tailwind CSS (다크 테마 기본)
- **폼 검증**: Zod + React Hook Form
- **상태 관리**: Zustand (클라이언트) + TanStack Query (서버 상태)
- **패키지 매니저**: pnpm (필수)

## 핵심 원칙

### 1. 문서 우선

작업 시작 전 **반드시 관련 문서 먼저 읽기**:
- `document/architecture.md` - FSD 아키텍처
- `document/coding-standards.md` - 코딩 규칙
- `document/development.md` - 개발 패턴
- `document/api/` - **키움 API 상세 명세** (Request/Response 스키마, 예제)
- 해당 기능의 PRD (`document/prd/{기능명}/prd.md`)

### 2. PRD 기반 개발

**모든 기능은 PRD 작성부터 시작**:
1. PRD 작성 (`document/prd/{기능명}/prd.md`)
2. `document/index.md`에 등록 (상태: 📝 작성중)
3. 구현하면서 **PRD 체크리스트 실시간 업데이트** (`- [ ]` → `- [x]`)
4. **구현 완료 후 반드시 테스트 명세 작성** (`test-spec-unit.md`, `test-spec-integration.md`)
   - 새 테스트 명세 작성
   - **기존 코드 변경 시**: 영향받는 기존 테스트 명세에 deprecated 표시
5. 사용자가 Gemini에게 테스트 명세 전달
6. Gemini가 테스트 코드 작성 및 실행
7. 테스트 실패 시:
   - Gemini → 사용자: 문제 보고 (운영 코드 버그 / 명세 오류 / 테스트 코드 버그)
   - 사용자 → Claude: 운영 코드 또는 명세 수정 요청 (필요시)
   - 사용자 → Gemini: 재실행 또는 재작성 요청
8. 테스트 완료 시 `document/index.md` 상태 변경 (📝 → 🚧 → ✅)

**필수 규칙**:
- PRD 없는 구현 금지
- **테스트 명세 없는 완료 금지** (test-spec-unit.md, test-spec-integration.md 필수)
- **테스트 명세는 간결하게**: 요구사항 + 테스트 케이스 목록 + 핵심 패턴 1-2줄만
  - ❌ 전체 코드 작성 금지 (토큰 낭비)
  - ✅ "무엇을" 테스트할지만 명시, "어떻게"는 Gemini가 판단
- **기존 코드 변경 시 테스트 명세 관리 책임**:
  - 영향받는 기존 테스트 명세 찾기
  - deprecated 표시 및 대체 테스트 명시
  - 새 테스트 명세에 영향도 기록

### 3. FSD 아키텍처

```
app → pages → widgets → features → entities → shared
```

**핵심 규칙**:
- **의존성 방향**: 상위 → 하위 레이어만 import (역방향 금지)
- **슬라이스 격리**: 같은 레이어 내 슬라이스 간 import 금지
- **Public API**: 모든 슬라이스는 `index.ts`를 통해 export

**레이어 역할**:
| 레이어 | 역할 | 주의사항 |
|:-------|:-----|:---------|
| `entities` | **비즈니스 도메인** (stock, account) | 도메인 API, 타입, 스키마 |
| `shared` | **공통 인프라** (API 클라이언트, UI) | ⚠️ 도메인 로직 금지 |

**❌ 안티패턴**:
- `shared`에 도메인 로직 배치 (예: `shared/lib/kiwoom/api/stockRanking.api.ts`)
- entities 대신 shared 사용

**✅ 올바른 패턴**:
- 도메인 로직 → `entities/stock/api/stockRanking.api.ts`
- 공통 인프라 → `shared/lib/kiwoom/client.ts`

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

### UI 컴포넌트 (필수)

**Shadcn UI를 기본으로 사용**:
- 모든 UI 컴포넌트는 Shadcn UI 기반으로 구현
- 컴포넌트 위치: `src/shared/ui/*.tsx`
- 다크 테마 기본 적용 (별도 `dark:` 클래스 불필요)

```typescript
// ✅ 올바른 예시 - Shadcn UI 사용
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Select, SelectTrigger, SelectValue } from "@/shared/ui/select";

// ❌ 잘못된 예시 - 직접 HTML + Tailwind
<div className="border rounded-lg p-4">
  <button className="px-4 py-2 bg-blue-500">버튼</button>
</div>
```

**신규 컴포넌트 설치**:
```bash
npx shadcn@latest add [component-name]
# 예: npx shadcn@latest add dialog table form
```

### 파일 네이밍

| 종류          | 규칙                   | 예시                          |
| :------------ | :--------------------- | :---------------------------- |
| 컴포넌트      | `PascalCase.tsx`       | `OrderWidget.tsx`             |
| 폼 컴포넌트   | `PascalCaseForm.tsx`   | `OrderForm.tsx`               |
| UI 컴포넌트   | `kebab-case.tsx`       | `src/shared/ui/button.tsx`    |
| Route Handler | `route.ts`             | `app/api/order/route.ts`      |
| Server Action | `camelCase.action.ts`  | `placeOrder.action.ts`        |
| API           | `camelCase.api.ts`     | `placeOrder.api.ts`           |
| Query         | `camelCase.queries.ts` | `placeOrder.queries.ts`       |
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

## 테스트 명세 관리

### 신규 기능 구현 시

1. **구현 완료 후 테스트 명세 작성**
   - `test-spec-unit.md`: 단위 테스트 명세
   - `test-spec-integration.md`: 통합 테스트 명세
   - 테스트 대상, 케이스, 핵심 패턴만 간결하게

2. **사용자가 Gemini에게 전달**
   - Gemini는 명세를 보고 테스트 코드 작성 (`tests/` 폴더)

### 기존 코드 변경 시 (중요!)

**시나리오**: layout-sidebar 구현 중 `app/page.tsx`를 `app/(auth)/page.tsx`로 변경

1. **영향도 파악**
   - 변경된 파일: `app/page.tsx` → `app/(auth)/page.tsx`
   - 영향받는 기존 테스트: `project-setup/test-spec.md` > TC-INT-002

2. **새 테스트 명세에 영향도 명시** (`layout-sidebar/test-spec-integration.md`)
   ```markdown
   ## 영향받는 기존 테스트

   ⚠️ 이 PRD는 다음 기존 테스트를 대체합니다:
   - `document/prd/project-setup/test-spec.md` > TC-INT-002 (홈 페이지)
     - 변경 내용: `app/page.tsx` → `app/(auth)/page.tsx` (이동 + 내용 변경)
     - 조치: 아래 테스트 케이스로 대체됨

   ### 7. 메인 페이지 렌더링 (기존 TC-INT-002 대체)
   - [ ] app/(auth)/page.tsx가 에러 없이 렌더링됨
   - [ ] "대시보드" h1 제목이 표시됨
   ```

3. **기존 테스트 명세에 deprecated 표시** (`project-setup/test-spec.md`)
   ```markdown
   ## 변경 이력
   | 버전 | 날짜 | 변경 내용 | 영향받는 테스트 | 담당 |
   |------|------|-----------|-----------------|------|
   | v1.0 | 2026-03-25 | 초기 작성 | - | Claude |
   | v2.0 | 2026-03-27 | TC-INT-002 deprecated | TC-INT-002 | Claude |

   ### TC-INT-002: 홈 페이지 (DEPRECATED)

   ⚠️ **상태**: 🗑️ Deprecated (v2.0, 2026-03-27)
   ⚠️ **이유**: layout-sidebar PRD에서 페이지 구조 변경
   ⚠️ **대체 테스트**: `document/prd/layout-sidebar/test-spec-integration.md` > "메인 페이지 렌더링"
   ⚠️ **파일 변경**: `app/page.tsx` → `app/(auth)/page.tsx`
   ```

4. **Gemini가 테스트 코드 처리**
   - 새 테스트 작성: `tests/integration/layout/main-page.test.tsx`
   - 기존 테스트 스킵: `tests/integration/app/page.test.tsx`에 `describe.skip` 추가

### Gemini와의 협업 프로세스

**역할 분담**:
- **Claude**: 운영 코드 (`src/`), 테스트 명세 (`test-spec-*.md`), 문서
- **Gemini**: 테스트 코드 (`tests/`), 테스트 코드 버그 수정
- **사용자**: 판단 및 중재

**테스트 실패 시 플로우**:
```
Gemini: 테스트 실행 → ❌ 실패
         ↓
Gemini → 사용자: 문제 보고
         - 운영 코드 버그: "AppSidebar.tsx:45에서 로고 링크가 잘못됨"
         - 명세 오류: "test-spec에 '로고는 /로 이동'인데 실제는 /dashboard"
         - 테스트 코드 버그: "내 selector가 잘못됨" (직접 수정)
         ↓
사용자: 판단
         ↓
사용자 → Claude: 운영 코드 또는 명세 수정 요청 (필요 시)
         ↓
Claude: 수정 완료
         ↓
사용자 → Gemini: "코드 수정했어, 재실행해"
         ↓
Gemini: 재실행 → ✅ 통과
```

**중요**: Gemini는 절대로 `src/` 폴더를 수정할 수 없습니다 (GEMINI.md 규칙).

## 작업 프로세스

### 새 기능 추가

1. **PRD 작성** → `document/prd/{기능명}/prd.md`
2. **문서 참조** → architecture.md, coding-standards.md
3. **FSD 레이어 판단** → widgets/features/entities
4. **구현** → Server Component 우선, JSDoc 필수, **PRD 체크리스트 실시간 업데이트**
5. **영향도 확인** → 기존 파일 변경 시 영향받는 테스트 명세 파악
6. **테스트 명세 작성** → 새 명세 + 기존 명세 deprecated (필요 시)
7. **사용자가 Gemini에게 전달** → 테스트 코드 작성
8. **문서 업데이트** → PRD 모두 체크 완료, `document/index.md` 상태 변경
9. **품질 검사** → lint, test, build

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
- **키움 API 에러 핸들링** - return_code 체크, 401 재시도
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
| **API 상세 명세** | `document/api/README.md`     |
| **문서 목록**   | `document/index.md`            |

## 외부 자료

- [Next.js](https://nextjs.org/docs) - App Router
- [FSD](https://feature-sliced.design/) - 아키텍처
- [Shadcn UI](https://ui.shadcn.com/) - UI 컴포넌트
- [React Hook Form](https://react-hook-form.com/) - 폼 관리
- [Zod](https://zod.dev/) - 스키마 검증
- [TanStack Query](https://tanstack.com/query/latest) - 서버 상태
- [키움 API](https://apiportal.kiwoom.com/)
