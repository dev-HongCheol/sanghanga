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

## FSD 아키텍처

### 디렉토리 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 그룹
│   │   ├── login/
│   │   │   └── page.tsx   # /login
│   │   └── layout.tsx
│   ├── (trading)/         # 트레이딩 그룹
│   │   ├── trade/
│   │   │   └── page.tsx   # /trade
│   │   ├── portfolio/
│   │   │   └── page.tsx   # /portfolio
│   │   └── layout.tsx
│   ├── api/               # Route Handlers
│   │   ├── auth/
│   │   │   └── route.ts   # POST /api/auth
│   │   ├── order/
│   │   │   └── route.ts   # POST /api/order
│   │   └── realtime/
│   │       └── route.ts   # GET /api/realtime (SSE)
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 홈 페이지 (/)
│   └── error.tsx          # 에러 페이지
│
├── widgets/               # 위젯 계층
│   ├── ChartWidget/       # 차트 위젯
│   │   ├── ui/
│   │   │   └── ChartWidget.tsx
│   │   ├── model/         # 상태, 로직
│   │   └── index.ts
│   ├── OrderWidget/       # 주문 위젯
│   └── AccountWidget/     # 계좌 위젯
│
├── features/              # 기능 계층
│   ├── placeOrder/        # 주문하기
│   │   ├── ui/
│   │   │   └── PlaceOrderForm.tsx
│   │   ├── api/
│   │   │   ├── placeOrder.api.ts
│   │   │   └── placeOrder.queries.ts
│   │   ├── actions/
│   │   │   └── placeOrder.action.ts
│   │   ├── model/
│   │   │   └── placeOrder.schema.ts
│   │   └── index.ts
│   ├── fetchAccount/      # 계좌 조회
│   └── updateWatchlist/   # 관심종목 업데이트
│
├── entities/              # 엔티티 계층
│   ├── stock/
│   │   ├── ui/
│   │   │   └── StockCard.tsx
│   │   ├── model/
│   │   │   ├── stock.types.ts
│   │   │   └── stock.store.ts
│   │   └── index.ts
│   ├── account/
│   └── order/
│
└── shared/                # 공통 계층
    ├── ui/                # UI 컴포넌트 (Shadcn UI)
    │   ├── Button.tsx
    │   ├── Input.tsx
    │   └── Card.tsx
    ├── lib/               # 유틸리티
    │   ├── api.ts         # API 클라이언트
    │   ├── utils.ts
    │   └── kiwoom/        # 키움 API
    │       ├── auth.ts
    │       ├── api.ts
    │       └── types.ts
    ├── config/
    │   └── constants.ts
    └── types/
        └── common.types.ts
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

2. **Public API**: 각 슬라이스는 `index.ts`로 export
   ```typescript
   // features/placeOrder/index.ts
   export { PlaceOrderForm } from "./ui/PlaceOrderForm";
   export { usePlaceOrder } from "./api/placeOrder.queries";
   export { placeOrderAction } from "./actions/placeOrder.action";
   ```

3. **슬라이스 내부 구조**:
   - `ui/`: React 컴포넌트
   - `model/`: 상태, 스키마, 타입
   - `api/`: API 호출 함수 (Client-side)
   - `actions/`: Server Actions (Server-side)
   - `lib/`: 내부 유틸

## Next.js 개발

### Server Components vs Client Components

**기본은 Server Component**를 사용하고, 인터랙션이 필요한 경우에만 Client Component를 사용합니다.

**상세 규칙**: [coding-standards.md - Server Component vs Client Component](./coding-standards.md#server-component-vs-client-component)

### Route Handlers & Server Actions

- **Route Handlers**: `app/api/*/route.ts`에서 REST API 구현
- **Server Actions**: `'use server'`로 서버 함수 정의, Form 처리

**상세 규칙**:
- [coding-standards.md - Route Handler](./coding-standards.md#route-handler)
- [coding-standards.md - Server Actions](./coding-standards.md#server-actions)

## API 개발

### TanStack Query

- `xxx.api.ts`: API 함수
- `xxx.queries.ts`: useQuery/useMutation 훅
- queryKey로 캐싱 관리
- invalidateQueries로 재조회

## 상태 관리

### Zustand

- `xxx.store.ts`: 스토어 정의
- persist 미들웨어로 localStorage 저장
- Client Component에서만 사용

## 실시간 데이터 (Server-Sent Events)

- Route Handler에서 ReadableStream 생성
- 키움 WebSocket을 SSE로 변환
- 클라이언트에서 EventSource로 수신
- 자동 재연결 로직 구현

## 스타일링

### Tailwind CSS

- 유틸리티 클래스 사용
- `className="flex items-center gap-4"`

### Shadcn UI

```bash
pnpx shadcn@latest add button input card
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
- [index.md](./index.md) - 외부 참고 자료 링크
