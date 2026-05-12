# 개발 가이드

## 개발 서버 실행

### 개발 모드

```bash
# Next.js 개발 서버
pnpm dev

# http://localhost:3000
```

**특징**:
- ✅ Fast Refresh (코드 변경 시 자동 새로고침)
- ✅ 상세한 에러 메시지
- ✅ Hot Module Replacement (HMR)

### Turbopack 사용 (더 빠른 HMR)

```bash
# Turbopack 활성화 (Next.js 14+)
pnpm dev:turbo

# 또는
pnpm dev --turbo
```

### 프로덕션 모드 (로컬 테스트)

```bash
# 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# http://localhost:3000
```

## 협업 워크플로우 (Claude & Gemini)

본 프로젝트는 두 AI 모델의 전문성을 결합하여 개발 효율성을 극대화합니다.

### 전체 프로세스

1. **설계 및 기능 정의 (Claude)**: `document/prd/` 하위에 요구사항(`prd.md`)과 체크리스트(`checklist.md`)를 작성합니다.
2. **코드 구현 (Claude)**: FSD 아키텍처에 따라 `src/` 하위에 비즈니스 로직과 UI를 구현합니다.
3. **테스트 명세 작성 (Claude)**: 구현 완료 후 테스트 명세(`test-spec-unit.md`, `test-spec-integration.md`)를 작성합니다.
4. **테스트 구현 및 검증 (Gemini)**:
   - Claude의 테스트 명세를 기반으로 `tests/` 폴더에 테스트 코드를 작성합니다.
   - 작업 진행 중 테스트 명세의 체크리스트를 **실시간으로 업데이트**합니다.
   - 테스트 결과와 커버리지를 문서에 기록하여 최종 검증을 완료합니다.
5. **품질 확인**: Biome 체크, 타입 체크 및 전체 테스트 통과 여부를 확인합니다.

### 문서 작성 원칙

#### PRD (prd.md)

**역할**: 지속적인 요구사항 정의 (Source of Truth)

**포함할 내용**:
- 개요/목적
- **지속적인 기능 요구사항**: 비즈니스 룰, 제약 조건, 계산 공식 등
- 기술 스택 결정 이유
- UI 와이어프레임
- 변경 이력 테이블 (버전별 하이레벨 요약만, 1줄)

**제외할 내용**:
- API 상세 명세 → `document/api/` 참조
- Zod 스키마 코드 → 실제 구현 파일
- DB 스키마 SQL → `database/schemas/` 참조
- 구현 파일 목록 → `checklist.md`
- 상세 변경 이력 → Git commit

#### 체크리스트 (checklist.md)

**역할**: 구현 파일 목록 + 핵심 역할 (Claude가 빠르게 참조)

**작성 원칙**:

```markdown
### Server Actions
- [x] `toggleStrategy.action.ts` — 전략 활성화/비활성화 토글
- [x] `getAccountBalance.action.ts` — 계좌 잔고 조회 (kt00018)
```

- ✅ 파일의 **핵심 책임** (거의 변하지 않음)
- ✅ API ID 번호 (키움 API인 경우)
- ❌ 버그 수정 내역 (Git commit 참조)
- ❌ 개선 사항 (Git commit 참조)

#### 범용 인프라 변경

`shared/` 레벨 변경 (logger, auth 등)은:
- ✅ **해당 파일의 JSDoc에 상세 기록**
- ❌ 각 기능 PRD 체크리스트에 기록하지 않음

**예시**: Logger에 폴링 로그 제어 기능 추가
```typescript
/**
 * @fileoverview 서버 사이드 로깅 래퍼
 * @description
 * **폴링 로그 제어 시스템**:
 * - `logger.info(context, message, meta, true)` 형태로 폴링 로그 플래그 전달
 * - 런타임에서 `logger.setShowPollingLogs(true/false)`로 가시성 토글 가능
 * - API 엔드포인트: `GET /api/debug/polling-logs?show=true|false`
 */
```

#### 테스트 명세 (test-spec-*.md)

**역할**: 지속적인 요구사항 → 테스트 케이스 매핑

**작성 시점**: 구현 완료 후 (코드와 동기화된 상태)

**내용**:
- 요구사항별 테스트 케이스 목록
- 핵심 테스트 패턴 (간결하게)
- deprecated 표시 (기존 코드 변경 시)

## 교육 중심 개발 (Educational Development)

사용자가 코드를 통해 기술 스택을 학습할 수 있도록 다음 원칙을 준수합니다.

- **상세한 JSDoc**: 모든 함수와 인터페이스에 역할과 파라미터 설명을 작성합니다.
- **테스트 코드 주석**: 생소한 테스트 API나 복잡한 모킹 로직에 교육용 주석을 추가합니다.
- **단계별 가이드**: `test-spec.md`에 Gemini의 작업 순서와 주의사항을 상세히 기술합니다.

## FSD 아키텍처

### 디렉토리 구조

```
app/                        # Next.js App Router (Routing Only)
├── (auth)/                # 인증 그룹
├── (trading)/             # 트레이딩 그룹
├── api/                   # Route Handlers
│   ├── auth/
│   │   └── route.ts       # POST /api/auth
│   └── realtime/
│       └── route.ts       # GET /api/realtime (SSE)
├── layout.tsx             # 루트 레이아웃
├── page.tsx               # 홈 페이지 (/)
└── error.tsx              # 에러 페이지

src/                        # FSD 아키텍처 (Business Logic)
├── app/                    # FSD app 레이어 (Global Config)
│   ├── providers/         # 전역 Providers (Query, Theme 등)
│   └── styles/            # 전역 스타일 (globals.css)
│
├── widgets/               # 위젯 계층
│   ├── ChartWidget/
│   └── index.ts
│
├── features/              # 기능 계층
│   ├── placeOrder/        # 예시: 주문하기 기능
│   │   ├── ui/            # UI 컴포넌트
│   │   ├── model/         # 스키마, 타입, 상태
│   │   ├── api/           # Server Actions, API 클라이언트
│   │   ├── lib/           # 유틸리티
│   │   └── index.ts       # Public API
│   └── index.ts
│
├── entities/              # 엔티티 계층
│   ├── stock/
│   └── index.ts
│
└── shared/                # 공통 계층
    ├── ui/                # UI 컴포넌트 (Shadcn UI)
    ├── lib/               # 유틸리티 (kiwoom client 등)
    └── types/
```

### 레이어 규칙

1. **import 방향**: 상위 → 하위만 가능
   ```typescript
   // ✅ OK
   import { StockCard } from "@/entities/stock";
   import { Button } from "@/shared/ui";

   // ❌ NO
   import { HomePage } from "@/pages/HomePage"; // entities에서 pages import 불가
   ```
   *참고: 루트 `app/` 폴더는 모든 FSD 레이어를 참조할 수 있는 최상위 계층입니다.*

2. **Public API**: 각 슬라이스는 `index.ts`로 export
   ```typescript
   // features/placeOrder/index.ts
   export { PlaceOrderForm } from "./ui/PlaceOrderForm";
   export { usePlaceOrder } from "./api/placeOrder.queries";
   export { placeOrderAction } from "./api/placeOrder.action"; // Server Action
   ```

3. **슬라이스 내부 구조** (FSD 표준 세그먼트):
   - `ui/`: React 컴포넌트
   - `model/`: 상태, 스키마, 타입
   - `api/`: 백엔드 통신 (Server Actions, API 클라이언트)
   - `lib/`: 내부 유틸리티, 헬퍼 함수
   - `config/`: 설정, 플래그

## Next.js 개발

### Server Components vs Client Components

**기본은 Server Component**를 사용하고, 인터랙션이 필요한 경우에만 Client Component를 사용합니다.

**상세 규칙**: [coding-standards.md - Server Component vs Client Component](./coding-standards.md#server-component-vs-client-component)

### Route Handlers & Server Actions

- **Route Handlers**: `app/api/*/route.ts`에서 REST API 구현
- **Server Actions**: `'use server'`로 서버 함수 정의, Form 처리
  - **위치**: `features/{feature}/api/*.action.ts` (FSD 표준)
  - **특징**: 타입 안전, 서버 측 실행, 클라이언트에서 함수처럼 호출

**상세 규칙**:
- [coding-standards.md - Route Handler](./coding-standards.md#route-handler)
- [coding-standards.md - Server Actions](./coding-standards.md#server-actions)
- [api-guide.md - 키움 API 호출 규칙](./api-guide.md#%EF%B8%8F-키움-api-호출-규칙-필수)

## API 개발

> **📋 API 구현 시 필수 참조**: [`document/api/`](./api/README.md) 디렉토리의 상세 명세를 확인하세요.
> 각 API별 정확한 Request/Response 스키마와 실제 예제가 포함되어 있습니다.

### TanStack Query

- `xxx.api.ts`: API 함수
- `xxx.queries.ts`: useQuery/useMutation 훅
- queryKey로 캐싱 관리
- invalidateQueries로 재조회

## Form 검증 (Zod & React Hook Form)

### 기본 패턴

**라이브러리**: Zod + React Hook Form

**파일 구조**:
- `model/*.schema.ts`: Zod 스키마 정의
- `ui/*Form.tsx`: 폼 컴포넌트 (useForm + zodResolver)

### ⚠️ 중요: `.default()` 사용 금지

**문제**:
```typescript
// ❌ 잘못된 예시
const schema = z.object({
  market: z.string().default('ALL'),  // undefined 타입이 포함됨
  minVolume: z.number().default(0)
});

type FormData = z.infer<typeof schema>;
// market: string | undefined  ← react-hook-form resolver 에러 발생
```

**이유**:
- Zod의 `.default()`는 값이 없어도 허용하기 때문에 타입에 `undefined`가 포함됨
- react-hook-form은 이 타입을 그대로 사용해서 필드가 `undefined`일 수 있다고 판단
- resolver에서 타입 불일치 에러 발생

**해결**:
```typescript
// ✅ 올바른 예시
const schema = z.object({
  market: z.string(),           // .default() 제거
  minVolume: z.number()
});

type FormData = z.infer<typeof schema>;
// market: string  ← 타입이 명확함

const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {              // 기본값은 여기서만 설정
    market: 'ALL',
    minVolume: 0
  }
});
```

**규칙**:
1. **Zod 스키마**: `.default()` 사용 금지, 타입 정의만
2. **useForm**: `defaultValues`에서 모든 기본값 설정

### 사용 예시

**스키마 정의** (`model/searchStock.schema.ts`):
```typescript
import { z } from "zod";

/**
 * 종목 검색 폼 스키마
 */
export const searchStockSchema = z.object({
  /** 검색어 */
  keyword: z.string().min(1, "검색어를 입력하세요"),
  /** 시장 구분 */
  market: z.enum(["ALL", "KOSPI", "KOSDAQ"]),
  /** 최소 거래량 */
  minVolume: z.number().min(0)
});

export type SearchStockFormData = z.infer<typeof searchStockSchema>;
```

**폼 컴포넌트** (`ui/SearchStockForm.tsx`):
```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { searchStockSchema, type SearchStockFormData } from "../model/searchStock.schema";
import { Button } from "@/shared/ui/button";

export function SearchStockForm() {
  const form = useForm<SearchStockFormData>({
    resolver: zodResolver(searchStockSchema),
    defaultValues: {
      keyword: "",
      market: "ALL",
      minVolume: 0
    }
  });

  const onSubmit = (data: SearchStockFormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("keyword")} />
      {form.formState.errors.keyword && (
        <p>{form.formState.errors.keyword.message}</p>
      )}
      <Button type="submit">검색</Button>
    </form>
  );
}
```

## 상태 관리

### Zustand

**위치**: `src/shared/stores/*.store.ts` 또는 `src/features/{기능}/stores/*.store.ts`

**기본 패턴**:
```typescript
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface MyStore {
  data: string | null;
  isLoading: boolean;
  setData: (data: string) => void;
  reset: () => void;
}

export const useMyStore = create<MyStore>()(
  devtools(
    (set) => ({
      data: null,
      isLoading: false,
      setData: (data) => set({ data, isLoading: false }),
      reset: () => set({ data: null, isLoading: false }),
    }),
    { name: "MyStore" }
  )
);
```

**사용 예시**:
```typescript
// 전체 구독
const data = useMyStore((state) => state.data);

// 선택적 구독 (성능 최적화)
const isLoading = useMyStore((state) => state.isLoading);

// 액션 호출
useMyStore.getState().setData("new value");
```

**⚠️ 주의**: Client Component에서만 사용 가능

## 실시간 데이터 (Server-Sent Events)

### 서버 측: SSE Route Handler

**위치**: `app/api/sse/*/route.ts`

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      // 클라이언트 등록
      const clientId = crypto.randomUUID();
      registerClient(clientId, controller);

      // Heartbeat (30초마다)
      const heartbeat = setInterval(() => {
        const encoder = new TextEncoder();
        const message = `event: heartbeat\ndata: {"timestamp": ${Date.now()}}\n\n`;
        controller.enqueue(encoder.encode(message));
      }, 30000);

      // Cleanup
      return () => {
        clearInterval(heartbeat);
        unregisterClient(clientId);
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

### 클라이언트 측: SSE Provider + Zustand

**1단계: SSE Provider 생성** (`features/{기능}/providers/SSEProvider.tsx`)

```typescript
"use client";

import { useEffect, useRef } from "react";
import { useMyStore } from "@/shared/stores/my-store";

export function SSEProvider({ children }) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/sse/realtime");
    eventSourceRef.current = eventSource;

    // 연결 성공
    eventSource.onopen = () => {
      console.log("[SSE] 연결 성공");
      useMyStore.getState().setConnected(true);
    };

    // 데이터 수신
    eventSource.addEventListener("data", (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      useMyStore.getState().setData(data);
    });

    // 연결 오류
    eventSource.onerror = () => {
      console.error("[SSE] 연결 오류");
      useMyStore.getState().setConnected(false);
    };

    // Cleanup
    return () => {
      eventSource.close();
    };
  }, []);

  return <>{children}</>;
}
```

**2단계: Layout/Page에서 감싸기**

```typescript
import { SSEProvider } from "@/features/my-feature/providers/SSEProvider";

export default function Layout({ children }) {
  return (
    <SSEProvider>
      {children}
    </SSEProvider>
  );
}
```

**3단계: 컴포넌트에서 Store 구독**

```typescript
"use client";

import { useMyStore } from "@/shared/stores/my-store";

export function RealtimeDisplay() {
  const data = useMyStore((state) => state.data);
  const isConnected = useMyStore((state) => state.isConnected);

  return (
    <div>
      <div>연결 상태: {isConnected ? "✅" : "❌"}</div>
      <div>데이터: {data}</div>
    </div>
  );
}
```

### Cron 스케줄러

**위치**: `instrumentation.ts` (프로젝트 루트)

**1단계: instrumentation.ts 생성**

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCronScheduler } = await import("./src/shared/lib/cron/scheduler");
    startCronScheduler();
  }
}
```

**2단계: Cron 스케줄러 구현** (`src/shared/lib/cron/scheduler.ts`)

```typescript
import cron from "node-cron";
import { logger } from "@/shared/lib/logger";

const IS_ENABLED = process.env.ENABLE_CRON === "true";

export function startCronScheduler() {
  if (!IS_ENABLED) {
    logger.warn("CronScheduler", "Cron이 비활성화되어 있습니다");
    return;
  }

  // 1초마다 실행
  cron.schedule("* * * * * *", async () => {
    await syncPricesLogic();
  });

  // 3초마다 실행
  cron.schedule("*/3 * * * * *", async () => {
    await syncBalanceLogic();
  });

  logger.info("CronScheduler", "모든 Cron Jobs 시작 완료");
}
```

**3단계: .env 설정**

```bash
ENABLE_CRON=true  # 장중에만 활성화
```

**⚠️ 주의사항**:
- Cron에서 DB 접근 시 반드시 `createAdminClient()` 사용 (cookies 불필요)
- Rate Limiting 고려 필수
- 에러 핸들링 및 로깅 필수

**예시**: Grid Trader의 가격/잔고 동기화 (PRD 참조)

## 스타일링

### Tailwind CSS

- 유틸리티 클래스 사용
- `className="flex items-center gap-4"`
- 다크 모드 대응: `dark:bg-gray-900`

### Shadcn UI 사용 가이드

**컴포넌트 위치**: `src/shared/ui/*.tsx` (FSD 아키텍처 준수)

#### 컴포넌트 추가

```bash
# 개별 컴포넌트 추가
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add select

# 여러 컴포넌트 한 번에 추가
npx shadcn@latest add card select alert button
```

**주의**: 컴포넌트는 자동으로 `src/shared/ui`에 생성됩니다 (`components.json` 설정)

#### 사용 예시

**Card 컴포넌트**:
```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export function MyWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>제목</CardTitle>
        <CardDescription>설명</CardDescription>
      </CardHeader>
      <CardContent>
        <p>내용</p>
      </CardContent>
    </Card>
  );
}
```

**Select 컴포넌트**:
```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export function MySelect() {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="선택하세요" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">옵션 1</SelectItem>
        <SelectItem value="option2">옵션 2</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

**Alert 컴포넌트**:
```typescript
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { AlertCircle } from "lucide-react";

export function ErrorAlert() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>에러</AlertTitle>
      <AlertDescription>에러 메시지</AlertDescription>
    </Alert>
  );
}
```

#### 아이콘 사용

Shadcn UI는 `lucide-react` 아이콘을 사용합니다:

```typescript
import { Loader2, AlertCircle, Check } from "lucide-react";

// 로딩 스피너
<Loader2 className="h-4 w-4 animate-spin" />

// 에러 아이콘
<AlertCircle className="h-4 w-4 text-destructive" />
```

#### 테마 커스터마이징

`src/app/globals.css`에서 CSS 변수로 테마 색상 변경:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

## 명령어

```bash
# 개발
pnpm dev              # 개발 서버
pnpm build            # 빌드
pnpm lint             # ESLint
pnpm type-check       # TypeScript

# 의존성
pnpm add [package]    # 추가
pnpm remove [package] # 제거
```

## 관련 문서

- [architecture.md](./architecture.md) - 전체 아키텍처 개요
- [coding-standards.md](./coding-standards.md) - 코딩 규칙 및 상세 예시
- [api-guide.md](./api-guide.md) - 키움 REST API 사용법
- **[api/](./api/README.md)** - 키움 API 상세 명세 (Request/Response 스키마, 예제)
- [index.md](./index.md) - 외부 참고 자료 링크
