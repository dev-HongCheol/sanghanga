# 전역 레이아웃 및 사이드바 네비게이션 PRD

## 개요

Shadcn UI Sidebar를 활용한 전역 레이아웃 구조 구축 및 라우팅 시스템 구현
- Supabase OAuth2 인증 기반 보호된 라우트 구조
- 2depth 계층형 네비게이션 메뉴
- 라우트 정보 전역 객체 관리

## 목표

- Shadcn UI Sidebar 컴포넌트 기반 레이아웃 구현
- Supabase OAuth2 인증 연동 (셀프호스팅)
- 라우트 정보를 전역 상수로 중앙 관리 (한글명/라벨, href)
- 2depth 계층형 메뉴 구조 지원
- 인증이 필요한 Route Group 구조 구축

## 요구사항

### 기능 요구사항

1. **레이아웃 구조**
   - Shadcn UI Sidebar 컴포넌트 설치 및 적용
   - 왼쪽 사이드바 + 메인 콘텐츠 영역
   - 반응형 레이아웃 (모바일 토글 메뉴)

2. **사이드바 헤더**
   - 최상단에 "sanghanga" 텍스트 로고
   - 메인 페이지(`/`) 링크 연결
   - 로고 스타일링 (폰트, 크기, 색상)

3. **네비게이션 메뉴**
   - 2depth 계층 구조 지원
   - 초기 메뉴 구성:
     ```
     실시간 주도주
     ├─ 거래대금 상위 기업 (/stock-ranking/trading-value)
     └─ 테마 대장주 (/stock-ranking/theme-leader)
     ```
   - 현재 활성 메뉴 하이라이트
   - 1depth 메뉴 펼침/접기 (Collapsible)

4. **라우트 관리**
   - 라우트 정보 전역 객체 (`src/shared/config/routes.ts`)
   - 타입 안정성 보장 (TypeScript)
   - 구조:
     ```typescript
     {
       label: string;      // 한글 메뉴명
       href: string;       // 실제 경로
       icon?: React.ComponentType;  // 아이콘 (선택)
       children?: Route[]; // 2depth 메뉴
     }
     ```

5. **인증 Route Group**
   - `app/(auth)/` 그룹: 인증이 필요한 페이지
   - `app/(public)/` 그룹: 공개 페이지 (로그인, 회원가입)
   - Middleware를 통한 인증 검사
   - 미인증 시 로그인 페이지로 리다이렉트

6. **Supabase OAuth2 연동**
   - 셀프호스팅 Supabase 인스턴스 사용
   - 로그인/로그아웃 기능
   - 세션 관리 (쿠키 기반)
   - 사이드바에 사용자 정보 표시 (선택사항)

### 비기능 요구사항

1. **UX**
   - 부드러운 메뉴 애니메이션
   - 모바일 환경에서 햄버거 메뉴
   - 현재 페이지 시각적 피드백

2. **성능**
   - 레이아웃은 Server Component로 구현
   - 인터랙티브 요소만 Client Component

3. **유지보수성**
   - 라우트 추가/수정이 용이한 구조
   - 메뉴 구조 변경 시 한 곳만 수정

4. **접근성**
   - 키보드 네비게이션 지원
   - ARIA 속성 적용

## 구현 체크리스트

> **중요**: 각 항목을 완료할 때마다 실시간으로 체크 표시 (`- [x]`)를 업데이트하세요.

### 환경 설정
- [ ] Supabase 프로젝트 생성 (셀프호스팅) - **향후 구현**
- [ ] 환경변수 설정 - **향후 구현**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (서버 전용)
- [ ] .env.example 업데이트 - **향후 구현**

### Supabase 클라이언트 설정 (향후 별도 PRD로 분리)
- [ ] `@supabase/ssr` 패키지 설치
- [ ] Server Component용 클라이언트 (`shared/lib/supabase/server.ts`)
- [ ] Client Component용 클라이언트 (`shared/lib/supabase/client.ts`)
- [ ] Middleware용 클라이언트 (`shared/lib/supabase/middleware.ts`)
- [ ] Public API (`shared/lib/supabase/index.ts`)

### 라우트 설정
- [x] 라우트 타입 정의 (`shared/config/routes.types.ts`)
  - [x] Route 인터페이스
- [x] 라우트 객체 정의 (`shared/config/routes.ts`)
  - [x] 실시간 주도주 메뉴
    - [x] 거래대금 상위 기업 (`/stock-ranking/trading-value`)
    - [x] 테마 대장주 (`/stock-ranking/theme-leader`)
  - [x] 메인 페이지 (`/`)
- [x] Public API (`shared/config/index.ts`)

### Shadcn UI Sidebar
- [x] Sidebar 컴포넌트 설치 (`npx shadcn@latest add sidebar`)
- [x] Collapsible 컴포넌트 설치 (`npx shadcn@latest add collapsible`)
- [x] 관련 컴포넌트 확인 (자동 설치됨)
  - [x] SidebarProvider
  - [x] SidebarTrigger
  - [x] SidebarContent
  - [x] SidebarGroup
  - [x] SidebarMenuItem

### 레이아웃 구조
- [x] Route Group 구조 생성
  - [x] `app/(auth)/` - 인증 필요 페이지
  - [x] `app/(auth)/layout.tsx` - 사이드바 레이아웃
  - [ ] `app/(public)/` - 공개 페이지 (선택) - **향후 구현**
- [x] 전역 레이아웃 (`app/layout.tsx`)
  - [ ] Supabase Provider 추가 (필요시) - **향후 구현**
  - [x] 메타데이터 설정

### 사이드바 컴포넌트
- [x] AppSidebar 컴포넌트 (`widgets/layout/ui/AppSidebar.tsx`)
  - [x] "sanghanga" 로고 헤더
  - [x] 메인 페이지 링크
  - [x] 2depth 네비게이션 메뉴
  - [x] Collapsible 1depth 메뉴
  - [x] 현재 경로 하이라이트
  - [x] 아이콘 지원
- [x] Public API (`widgets/layout/index.ts`)

### 인증 Middleware (향후 별도 PRD로 분리)
- [ ] `middleware.ts` 생성 (프로젝트 루트)
  - [ ] Supabase 세션 체크
  - [ ] 보호된 라우트 정의
  - [ ] 미인증 시 리다이렉트
  - [ ] Public 라우트 예외 처리

### 인증 페이지 (향후 별도 PRD로 분리)
- [ ] 로그인 페이지 (`app/(public)/login/page.tsx`)
  - [ ] Supabase signInWithPassword
  - [ ] 폼 검증 (Zod + React Hook Form)
  - [ ] 에러 핸들링
- [ ] 로그아웃 액션 (`app/(auth)/actions/logout.action.ts`)
  - [ ] Supabase signOut
  - [ ] 세션 삭제
  - [ ] 로그인 페이지로 리다이렉트

### 페이지 구현
- [x] 메인 페이지 (`app/(auth)/page.tsx`)
- [x] 거래대금 상위 기업 페이지 (`app/(auth)/stock-ranking/trading-value/page.tsx`)
- [x] 테마 대장주 페이지 (`app/(auth)/stock-ranking/theme-leader/page.tsx`)

### 테스트
- [x] 빌드 테스트 (`pnpm build`)
- [ ] 라우팅 동작 확인 (수동 테스트)
- [ ] 인증 플로우 테스트 - **향후 구현**
  - [ ] 로그인 성공
  - [ ] 로그인 실패
  - [ ] 로그아웃
  - [ ] 미인증 리다이렉트
- [ ] 메뉴 네비게이션 테스트 (수동 테스트)
- [ ] 모바일 반응형 확인 (수동 테스트)
- [ ] 현재 페이지 하이라이트 확인 (수동 테스트)

### 문서 업데이트
- [x] `document/index.md`에 PRD 등록
- [ ] PRD 상태 업데이트 (📝 → 🚧 → ✅)

## 기술 스택 및 구현 상세

### 1. 파일 구조

```
app/
├── (auth)/                           # 인증 필요 라우트 그룹
│   ├── layout.tsx                    # 사이드바 레이아웃
│   ├── page.tsx                      # 메인 페이지
│   ├── stock-ranking/
│   │   ├── trading-value/
│   │   │   └── page.tsx              # 거래대금 상위 기업
│   │   └── theme-leader/
│   │       └── page.tsx              # 테마 대장주
│   └── actions/
│       └── logout.action.ts          # 로그아웃 Server Action
│
├── (public)/                         # 공개 라우트 그룹
│   └── login/
│       └── page.tsx                  # 로그인 페이지
│
└── layout.tsx                        # 전역 레이아웃

src/
├── widgets/
│   └── layout/
│       ├── ui/
│       │   └── AppSidebar.tsx        # 사이드바 컴포넌트
│       └── index.ts
│
└── shared/
    ├── config/
    │   ├── routes.types.ts           # 라우트 타입
    │   ├── routes.ts                 # 라우트 객체
    │   └── index.ts
    └── lib/
        └── supabase/
            ├── server.ts             # Server Component 클라이언트
            ├── client.ts             # Client Component 클라이언트
            ├── middleware.ts         # Middleware 클라이언트
            └── index.ts

middleware.ts                         # 인증 Middleware (프로젝트 루트)
```

### 2. 라우트 타입 정의

```typescript
// src/shared/config/routes.types.ts

/**
 * 메뉴 라우트 정보
 */
export interface Route {
  /** 메뉴 한글명 (라벨) */
  label: string;
  /** 실제 경로 */
  href: string;
  /** 아이콘 컴포넌트 (선택) */
  icon?: React.ComponentType<{ className?: string }>;
  /** 하위 메뉴 (2depth) */
  children?: Route[];
}
```

### 3. 라우트 객체 예시

```typescript
// src/shared/config/routes.ts

import type { Route } from "./routes.types";
import { TrendingUp, DollarSign, Sparkles } from "lucide-react";

export const ROUTES: Route[] = [
  {
    label: "실시간 주도주",
    href: "/stock-ranking",
    icon: TrendingUp,
    children: [
      {
        label: "거래대금 상위 기업",
        href: "/stock-ranking/trading-value",
        icon: DollarSign,
      },
      {
        label: "테마 대장주",
        href: "/stock-ranking/theme-leader",
        icon: Sparkles,
      },
    ],
  },
];

export const MAIN_ROUTE = {
  label: "Sanghanga",
  href: "/",
};
```

### 4. Supabase 클라이언트 설정

**Server Component용**:
```typescript
// src/shared/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = () => {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
};
```

**Client Component용**:
```typescript
// src/shared/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
```

### 5. Middleware 구현

```typescript
// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          response.cookies.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 보호된 라우트: (auth) 그룹
  if (request.nextUrl.pathname.startsWith("/(auth)") && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 로그인한 사용자가 로그인 페이지 접근 시 메인으로 리다이렉트
  if (request.nextUrl.pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 6. 사이드바 컴포넌트 구조

```typescript
// widgets/layout/ui/AppSidebar.tsx
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/shared/ui/sidebar";
import { ROUTES, MAIN_ROUTE } from "@/shared/config/routes";
import Link from "next/link";

export function AppSidebar() {
  return (
    <Sidebar>
      {/* 로고 헤더 */}
      <SidebarGroup>
        <Link href={MAIN_ROUTE.href}>
          <h1 className="text-2xl font-bold p-4">sanghanga</h1>
        </Link>
      </SidebarGroup>

      {/* 메뉴 */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {ROUTES.map((route) => (
                <SidebarMenuItem key={route.href}>
                  {/* 1depth 메뉴 구현 */}
                  {/* 2depth가 있으면 Collapsible 사용 */}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
```

### 7. 레이아웃 적용

```typescript
// app/(auth)/layout.tsx
import { AppSidebar } from "@/widgets/layout";
import { SidebarProvider } from "@/shared/ui/sidebar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
```

## 환경 변수

```bash
# .env.example

# Supabase (셀프호스팅)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 테스트 시나리오

### 1. 라우팅
- [ ] 메인 페이지 접근 (`/`)
- [ ] 사이드바 메뉴 클릭 시 페이지 이동
- [ ] URL 직접 입력 시 정상 동작
- [ ] 존재하지 않는 경로 404 처리

### 2. 인증 플로우
- [ ] 미인증 상태에서 보호된 페이지 접근 → 로그인 페이지로 리다이렉트
- [ ] 로그인 성공 → 메인 페이지로 이동
- [ ] 로그인 실패 → 에러 메시지 표시
- [ ] 로그아웃 → 로그인 페이지로 이동
- [ ] 세션 만료 시 자동 로그아웃

### 3. 사이드바
- [ ] 로고 클릭 시 메인 페이지 이동
- [ ] 1depth 메뉴 펼침/접기 동작
- [ ] 2depth 메뉴 클릭 시 페이지 이동
- [ ] 현재 페이지 하이라이트 표시
- [ ] 모바일 환경에서 햄버거 메뉴 동작

### 4. 반응형
- [ ] 데스크톱: 고정 사이드바
- [ ] 태블릿: 접을 수 있는 사이드바
- [ ] 모바일: 오버레이 사이드바

## 기술적 고려사항

### 1. Route Group vs Pages
- **(auth)** 그룹: 괄호는 URL에 포함되지 않음 (예: `/page`가 실제 경로)
- 그룹별로 다른 레이아웃 적용 가능
- Middleware에서 그룹 경로 체크 시 주의

### 2. Supabase 셀프호스팅
- Docker Compose로 로컬 환경 구축
- JWT Secret 설정 필요
- 데이터베이스 마이그레이션 관리

### 3. 라우트 관리 패턴
- **장점**: 중앙 집중식 관리, 타입 안정성, IDE 자동완성
- **단점**: 파일 위치와 라우트 객체 동기화 필요
- 대안: 파일 시스템 기반 자동 생성 (추후 고려)

### 4. 현재 경로 감지
- Client Component에서 `usePathname()` 훅 사용
- 하이라이트 조건: `pathname === route.href` 또는 `pathname.startsWith(route.href)`

### 5. 아이콘 라이브러리
- **lucide-react** 사용 (Shadcn UI 기본)
- Tree-shaking 지원으로 번들 크기 최적화

## 주의사항

### 1. 보안
- ⚠️ **Supabase Service Role Key는 서버 전용** (클라이언트 노출 금지)
- ⚠️ **환경변수를 Git에 커밋하지 마세요** (.env.local은 .gitignore)
- ⚠️ **Row Level Security (RLS) 설정** (Supabase 데이터베이스)

### 2. FSD 아키텍처
- ✅ **라우트 설정은 shared/config** (전역 설정)
- ✅ **사이드바 컴포넌트는 widgets/layout** (조합된 UI)
- ✅ **Supabase 클라이언트는 shared/lib** (공통 인프라)

### 3. 성능
- Server Component 우선 (레이아웃, 페이지)
- Client Component는 최소화 (사이드바 메뉴 상호작용)
- 동적 import로 초기 번들 크기 최적화 (필요시)

### 4. 접근성
- 키보드 네비게이션 지원 (Tab, Enter)
- ARIA 속성 (Shadcn UI가 기본 제공)
- 색상 대비 (WCAG AA 기준)

## 다음 단계 (이 PRD 이후)

1. **사용자 프로필**
   - 사이드바 하단에 사용자 정보 표시
   - 프로필 드롭다운 (설정, 로그아웃)

2. **알림 시스템**
   - 헤더에 알림 아이콘
   - 실시간 알림 (WebSocket)

3. **검색 기능**
   - 사이드바 상단에 검색 바
   - 종목 검색, 메뉴 검색

4. **다크 모드 토글**
   - 사이드바 또는 헤더에 토글 버튼
   - 사용자 설정 저장 (Supabase)

5. **메뉴 즐겨찾기**
   - 자주 사용하는 메뉴 상단 고정
   - 드래그 앤 드롭 순서 변경

## 참고 문서

- [Shadcn UI Sidebar](https://ui.shadcn.com/docs/components/sidebar) - 공식 문서
- [Supabase Auth (SSR)](https://supabase.com/docs/guides/auth/server-side/nextjs) - Next.js 인증
- [Next.js Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups) - 라우트 그룹
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) - 미들웨어
- [architecture.md](../../architecture.md) - FSD 아키텍처
- [coding-standards.md](../../coding-standards.md) - 코딩 규칙
