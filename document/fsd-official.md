# Feature-Sliced Design (FSD) 완전 분석 문서

## 목차
1. [FSD란 무엇인가?](#1-fsd란-무엇인가)
2. [핵심 개념과 원칙](#2-핵심-개념과-원칙)
3. [Layers (계층)](#3-layers-계층)
4. [Slices (슬라이스)](#4-slices-슬라이스)
5. [Segments (세그먼트)](#5-segments-세그먼트)
6. [Public API](#6-public-api)
7. [의존성 규칙](#7-의존성-규칙)
8. [Next.js와 함께 사용하기](#8-nextjs와-함께-사용하기)
9. [실제 예제](#9-실제-예제)
10. [베스트 프랙티스와 안티패턴](#10-베스트-프랙티스와-안티패턴)

---

## 1. FSD란 무엇인가?

### 정의
**Feature-Sliced Design (FSD)**는 프론트엔드 애플리케이션의 코드를 체계적으로 조직하기 위한 **아키텍처 방법론**입니다. 기술 중심의 전통적인 계층화 방식이 아닌, **비즈니스 기능(Features) 중심**으로 코드를 구조화합니다.

### 핵심 목적
- **변화하는 비즈니스 요구사항에 안정적으로 대응**
- **프로젝트를 이해하기 쉽게 만들기**
- **확장 가능하고 유지보수하기 쉬운 구조 제공**

### 적용 대상
- 프론트엔드 개발 프로젝트 (React, Vue, Angular, Svelte 등)
- 애플리케이션 구축 (라이브러리는 제외)
- 모든 프로그래밍 언어, UI 프레임워크, 상태 관리 도구와 호환

### FSD가 해결하는 문제

#### 1. 버스 팩터 & 온보딩 문제
- **문제**: 제한된 인원만 프로젝트 아키텍처를 이해
- **해결**: 표준화된 구조로 새로운 팀원 온보딩 용이

#### 2. 암묵적 부작용
- **문제**: "모든 것이 모든 것에 의존"하는 복잡한 관계
- **해결**: 명확한 의존성 규칙으로 격리된 수정 가능

#### 3. 통제 불능의 로직 재사용
- **문제**: 중복 구현 또는 무분별한 공유 폴더 확산
- **해결**: 계층별 재사용 수준 조절

---

## 2. 핵심 개념과 원칙

### FSD의 세 가지 기본 원칙

#### 1. Public API
모든 모듈은 최상위 레벨에서 공개 API를 선언해야 합니다.

```typescript
// ✅ 올바른 사용 - Public API를 통한 import
import { ProductCard } from '@/entities/product';

// ❌ 잘못된 사용 - 내부 구조에 직접 접근
import { ProductCard } from '@/entities/product/ui/ProductCard';
```

#### 2. Isolation (격리)
모듈은 동일 계층이나 상위 계층의 다른 모듈에 직접 의존하지 않습니다.

```typescript
// ✅ 올바른 의존성 - 하위 레이어 import
// features/product-form → entities/product
import { createProduct } from '@/entities/product';

// ❌ 잘못된 의존성 - 상위 레이어 import
// entities/product → features/product-form (불가능)
```

#### 3. Needs Driven (비즈니스 중심)
아키텍처는 비즈니스와 사용자 요구에 지향해야 합니다.

### 설계 철학

#### 명시성 (Explicitness)
- 팀이 쉽게 이해하고 설명할 수 있는 구조
- 비즈니스 가치를 반영하는 명확한 아키텍처
- 중복 로직을 쉽게 감지하되 고유 구현은 방해하지 않음

#### 통제 (Control)
- 개발 속도 향상과 기능 도입 용이성
- 코드 확장, 수정, 삭제의 단순화
- 각 컴포넌트가 쉽게 교체 가능하고 제거 가능

#### 적응성 (Adaptability)
- 대부분의 프로젝트에 적용 가능
- 프레임워크/플랫폼 독립성
- 팀 규모 확장과 개발 병렬화 지원

### FSD의 구조적 요소

FSD는 **Layer(계층)**, **Slice(슬라이스)**, **Segment(세그먼트)** 3단계로 코드를 조직합니다.

```
📂 src/
  📂 app/                    # Layer 1
  📂 pages/                  # Layer 2
  📂 widgets/                # Layer 3
  📂 features/               # Layer 4
    📂 product-form/         # Slice (비즈니스 도메인)
      📂 ui/                 # Segment (기술적 목적)
      📂 api/                # Segment
      📂 model/              # Segment
      📄 index.ts            # Public API
  📂 entities/               # Layer 5
  📂 shared/                 # Layer 6
```

---

## 3. Layers (계층)

### 레이어 구조 (7단계)

FSD는 책임도와 의존성에 따라 **7개 레이어**를 정의합니다:

```
app       ← 최상위 (앱 전역 설정)
  ↓
processes ← deprecated
  ↓
pages     ← 화면/페이지
  ↓
widgets   ← 자체완결 UI 블록
  ↓
features  ← 사용자 기능
  ↓
entities  ← 비즈니스 개념
  ↓
shared    ← 최하위 (공통 인프라)
```

### 의존성 규칙

> **핵심 원칙**: "상위 레이어는 하위 레이어로만 의존할 수 있다"

```typescript
// ✅ 올바른 의존성
features/product-form → entities/product
features/product-form → shared/ui

// ❌ 잘못된 의존성
entities/product → features/product-form  // 하위가 상위를 참조 (불가능)
features/auth → features/product          // 같은 레이어 간 참조 (불가능)
```

### 각 레이어의 역할

#### 1. Shared (기초층)
**역할**: 외부 세계(백엔드, 라이브러리)와의 연결을 담당하는 기반

**포함 내용**:
- API 클라이언트 설정
- UI 키트 (Shadcn 등)
- 유틸리티 함수
- 라우팅 상수
- 환경 변수

**구조**:
```typescript
📂 shared/
  📂 ui/               # UI 컴포넌트 (shadcn 포함)
    📄 button.tsx      # shadcn 컴포넌트 (배럴 파일 없음)
    📄 input.tsx
    📂 Logo/           # 커스텀 컴포넌트 (폴더 단위)
      📄 Logo.tsx
      📄 index.ts      # 배럴 파일
  📂 api/              # 공통 API 설정
    📄 client.ts       # axios, fetch wrapper
  📂 lib/              # 공통 유틸리티
    📄 format.ts
  📂 config/           # 설정
    📄 routes.ts       # PAGES 상수
    📄 env.ts
```

**예제**:
```typescript
// shared/api/client.ts
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

// shared/config/routes.ts
export const PAGES = {
  HOME: { path: '/', metadata: { title: '홈' } },
  PRODUCT: {
    LIST: { path: '/products', metadata: { title: '상품 목록' } },
    DETAIL: {
      path: (id: string) => `/products/${id}`,
      metadata: (name: string) => ({ title: `${name} - 상품 상세` }),
    },
  },
};
```

#### 2. Entities (비즈니스 개념)
**역할**: 비즈니스에서 사용하는 실제 개념 (도메인 객체)

**포함 내용**:
- 도메인 타입 및 인터페이스
- 기본 CRUD API 함수
- 데이터 검증 스키마 (Zod)
- UI 표현 컴포넌트

**구조**:
```typescript
📂 entities/
  📂 product/
    📂 api/
      📄 product.api.ts       # API 함수
      📄 product.queries.ts   # React Query hooks
    📂 model/
      📄 product.types.ts     # orval 자동 생성 타입
      📄 product.schema.ts    # Zod 스키마 (요청용만)
    📂 ui/
      📄 ProductCard.tsx      # UI 컴포넌트
    📄 index.ts               # Public API
```

**예제**:
```typescript
// entities/product/model/product.schema.ts
import { z } from 'zod';

// orval 타입 기반 요청 스키마만 생성 (응답 스키마 X)
export const createProductSchema = z.object({
  name: z.string().min(1, "상품명을 입력해주세요"),
  price: z.number().positive("가격은 0보다 커야 합니다"),
  categoryId: z.number().positive(),
  description: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductForm = z.infer<typeof createProductSchema>;
export type UpdateProductForm = z.infer<typeof updateProductSchema>;

// entities/product/api/product.api.ts
import { apiClient } from '@/shared/api';
import type { Product } from './product.types'; // orval 생성

export async function fetchProducts() {
  const { data } = await apiClient.get<Product[]>('/products');
  return data;
}

export async function fetchProduct(id: string) {
  const { data } = await apiClient.get<Product>(`/products/${id}`);
  return data;
}
```

#### 3. Features (주요 상호작용)
**역할**: 사용자가 수행하는 주요 기능 (재사용 가능한 기능만)

**포함 내용**:
- 폼 및 검증 로직
- API 호출 및 상태 관리
- 사용자 인터랙션 처리

**구조**:
```typescript
📂 features/
  📂 product-form/
    📂 ui/
      📄 ProductForm.tsx
      📄 ProductFormField.tsx  # 내부 컴포넌트 (export 안 함)
    📂 api/
      📄 product.api.ts
      📄 product.queries.ts
    📂 model/
      📄 product-form.schema.ts  # entities 스키마 상속 + 폼 특화
    📄 index.ts                  # 메인 컴포넌트, API만 export
```

**예제**:
```typescript
// features/product-form/model/product-form.schema.ts
import { createProductSchema } from '@/entities/product';

// entities 상속 + 폼 특화: 문자열→숫자 변환, 추가 검증
export const createProductFormSchema = createProductSchema.extend({
  price: z.string().transform(val => parseFloat(val)),
  categoryId: z.string().transform(val => parseInt(val, 10)),
}).refine(
  (data) => data.price > 0,
  { message: "가격은 0보다 커야 합니다", path: ["price"] }
);

// 타입 분리: input(폼) vs output(서버)
export type CreateProductFormInput = z.input<typeof createProductFormSchema>;
export type CreateProductFormData = z.output<typeof createProductFormSchema>;

// features/product-form/ui/ProductForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductFormSchema } from '../model/product-form.schema';
import { Button } from '@/shared/ui/button';

export function ProductForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createProductFormSchema),
  });

  const onSubmit = async (data) => {
    // API 호출
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <input type="number" {...register('price')} />
      {errors.price && <span>{errors.price.message}</span>}

      <Button type="submit">등록</Button>
    </form>
  );
}
```

#### 4. Widgets (자체완결 UI 블록)
**역할**: 여러 페이지에서 재사용되는 큰 UI 컴포넌트

**포함 내용**:
- 헤더, 푸터, 사이드바
- 복잡한 UI 블록 (여러 feature 조합)

**중요**: 단일 페이지에서만 사용되면 해당 페이지 내에 배치

**구조**:
```typescript
📂 widgets/
  📂 header/
    📂 ui/
      📄 Header.tsx
    📄 index.ts
  📂 product-filter/
    📂 ui/
      📄 ProductFilter.tsx
    📂 model/
      📄 filter.store.ts  # 상태 관리
    📄 index.ts
```

**예제**:
```typescript
// widgets/header/ui/Header.tsx
import { Logo } from '@/shared/ui/Logo';
import { LoginButton } from '@/features/auth';

export function Header() {
  return (
    <header>
      <Logo />
      <nav>
        <a href="/products">상품</a>
        <a href="/about">소개</a>
      </nav>
      <LoginButton />
    </header>
  );
}
```

#### 5. Pages (화면/페이지)
**역할**: 웹사이트의 개별 페이지 또는 스크린

**포함 내용**:
- UI 렌더링
- 데이터 페칭 (Server Component)
- 로딩 상태 및 에러 바운더리
- 페이지 전용 로직

**구조**:
```typescript
📂 pages/
  📂 product-list/
    📂 ui/
      📄 ProductListPage.tsx
    📂 api/
      📄 product-list.queries.ts
    📄 index.ts
  📂 product-detail/
    📂 ui/
      📄 ProductDetailPage.tsx
    📄 index.ts
```

**예제 (Next.js App Router)**:
```typescript
// pages/product-detail/ui/ProductDetailPage.tsx
import { ProductCard } from '@/entities/product';
import { ProductForm } from '@/features/product-form';

interface Props {
  product: Product;
}

export function ProductDetailPage({ product }: Props) {
  return (
    <div>
      <ProductCard product={product} />
      <ProductForm initialData={product} />
    </div>
  );
}

// pages/product-detail/index.ts
export { ProductDetailPage } from './ui/ProductDetailPage';
export { metadata } from './metadata';
```

#### 6. Processes (deprecated)
다중 페이지 상호작용용으로 설계되었으나 **현재는 권장되지 않음**

#### 7. App (앱 전역 관리)
**역할**: 애플리케이션 전체에 걸친 설정 및 초기화

**포함 내용**:
- 라우터 설정
- 전역 상태 Provider
- 글로벌 스타일
- 애플리케이션 진입점

**구조**:
```typescript
📂 app/
  📂 providers/
    📄 QueryProvider.tsx
    📄 ThemeProvider.tsx
  📂 styles/
    📄 globals.css
  📄 layout.tsx
```

**예제**:
```typescript
// app/providers/QueryProvider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// app/layout.tsx
import { QueryProvider } from './providers/QueryProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

### 레이어 사용 지침

#### 필수 레이어
- **Shared**: 공통 인프라 (필수)
- **Pages**: 화면 구성 (필수)
- **App**: 전역 설정 (필수)

#### 선택 레이어
- **Entities**: 도메인 객체가 있을 때
- **Features**: 재사용 가능한 기능이 있을 때
- **Widgets**: 복잡한 재사용 UI 블록이 있을 때

#### 주의사항
- 모든 레이어를 사용할 필요는 없음
- 폴더는 소문자로 명명
- 새 레이어 추가는 권장되지 않음

---

## 4. Slices (슬라이스)

### 슬라이스란?

슬라이스는 FSD의 조직 계층 구조에서 **두 번째 수준**으로, **제품, 비즈니스 또는 애플리케이션의 의미에 따라 코드를 그룹화**합니다.

```
📂 src/
  📂 features/          ← Layer
    📂 product-form/    ← Slice (비즈니스 도메인)
    📂 user-auth/       ← Slice
    📂 comment-list/    ← Slice
```

### 슬라이스의 핵심 원칙

#### 1. 낮은 결합도와 높은 응집도
슬라이스는 **독립적이고 응집도 높은 코드 파일 그룹**입니다.

```typescript
// ✅ 올바른 슬라이스 - 응집도 높음
📂 features/
  📂 product-form/
    📂 ui/
    📂 api/
    📂 model/
    📄 index.ts

// ❌ 잘못된 슬라이스 - 낮은 응집도
📂 features/
  📂 product/           # 너무 광범위
    📄 form.tsx
    📄 list.tsx
    📄 detail.tsx
```

#### 2. 같은 레이어 간 독립성
**같은 레이어의 다른 슬라이스들과 독립적**이어야 합니다.

```typescript
// ❌ 잘못된 의존성 - 같은 레이어 간 참조
// features/product-form → features/user-auth (불가능)
import { useAuth } from '@/features/user-auth';

// ✅ 올바른 의존성 - 하위 레이어 참조
// features/product-form → entities/user
import { useCurrentUser } from '@/entities/user';
```

#### 3. 공개 API 규칙
모든 슬라이스는 **공개 API 정의(index.ts)를 포함**해야 하며, 외부 모듈은 내부 파일 구조가 아닌 공개 API만 참조 가능합니다.

### 슬라이스 네이밍

슬라이스 이름은 **비즈니스 도메인과 목적**을 명확하게 반영해야 합니다.

```typescript
// ✅ 좋은 슬라이스 이름
📂 entities/
  📂 product/          # 명확한 도메인
  📂 user/
  📂 order/

📂 features/
  📂 product-form/     # 목적이 명확
  📂 order-checkout/
  📂 user-auth/

// ❌ 나쁜 슬라이스 이름
📂 entities/
  📂 data/             # 너무 일반적
  📂 models/

📂 features/
  📂 forms/            # 기술 중심
  📂 utils/
```

### 슬라이스 그룹화

관련된 슬라이스들을 **폴더로 구조적으로 그룹화**할 수 있지만, 다른 슬라이스와 동일한 격리 규칙을 따라야 합니다.

```typescript
📂 entities/
  📂 product/
    📂 physical/       # 그룹
      📂 book/
      📂 electronics/
    📂 digital/        # 그룹
      📂 ebook/
      📂 software/
```

**주의**: 폴더 내 코드 공유는 금지됩니다.

```typescript
// ❌ 잘못된 그룹화 - 공유 코드
📂 entities/
  📂 product/
    📄 shared-utils.ts  # 그룹 내 공유 (불가능)
    📂 book/
    📂 electronics/

// ✅ 올바른 방법 - 공유 코드는 상위 슬라이스나 shared로
📂 entities/
  📂 product/           # 공통 로직 위치
    📂 model/
      📄 utils.ts
    📂 book/
    📂 electronics/
```

### 슬라이스 예제

#### 포토갤러리 앱
```typescript
📂 src/
  📂 features/
    📂 photo/
    📂 effects/
    📂 gallery-page/
```

#### 소셜 네트워크
```typescript
📂 src/
  📂 entities/
    📂 post/
    📂 user/
    📂 comment/
  📂 features/
    📂 post-create/
    📂 comment-list/
    📂 news-feed/
```

---

## 5. Segments (세그먼트)

### 세그먼트란?

세그먼트는 조직 계층의 **세 번째 수준**으로, **코드를 기술적 특성에 따라 그룹화**합니다.

```
📂 src/
  📂 features/              ← Layer
    📂 product-form/        ← Slice
      📂 ui/                ← Segment (기술적 목적)
      📂 api/               ← Segment
      📂 model/             ← Segment
      📄 index.ts
```

### 표준 세그먼트

| 세그먼트 | 역할 | 포함 내용 |
|---------|------|----------|
| `ui` | UI 표시 | 컴포넌트, 날짜 포매터, 스타일 |
| `api` | 백엔드 상호작용 | 요청 함수, 데이터 타입, 매퍼 |
| `model` | 데이터 모델 | 스키마, 인터페이스, 저장소, 비즈니스 로직 |
| `lib` | 라이브러리 코드 | 슬라이스 내 다른 모듈에서 필요한 유틸리티 |
| `config` | 설정 | 설정 파일 및 기능 플래그 |

### 세그먼트 네이밍 규칙

세그먼트 이름은 **내용의 본질이 아닌 목적을 설명**해야 합니다.

```typescript
// ❌ 피해야 할 이름 (기술적 분류)
📂 features/product-form/
  📂 components/    # 컴포넌트가 들어있다는 것만 알 수 있음
  📂 hooks/         # 훅이 들어있다는 것만 알 수 있음
  📂 types/         # 타입이 들어있다는 것만 알 수 있음
  📂 utils/         # 유틸리티가 들어있다는 것만 알 수 있음

// ✅ 권장하는 이름 (목적 중심)
📂 features/product-form/
  📂 ui/            # UI 표시 목적
  📂 api/           # API 통신 목적
  📂 model/         # 비즈니스 로직 및 데이터 모델
  📂 lib/           # 슬라이스 전용 유틸리티
  📂 config/        # 설정
```

### 각 세그먼트의 상세 역할

#### 1. UI Segment
**역할**: 사용자 인터페이스 렌더링

**포함 내용**:
- React/Vue 컴포넌트
- 스타일 파일
- UI 관련 유틸리티 (포매터 등)

**예제**:
```typescript
📂 features/product-form/
  📂 ui/
    📄 ProductForm.tsx           # 메인 컴포넌트
    📄 ProductFormField.tsx      # 내부 컴포넌트
    📄 ProductFormActions.tsx
    📄 ProductForm.module.css    # 스타일
```

```typescript
// features/product-form/ui/ProductForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { ProductFormField } from './ProductFormField';
import { ProductFormActions } from './ProductFormActions';

export function ProductForm() {
  const { register, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ProductFormField register={register} />
      <ProductFormActions />
    </form>
  );
}
```

#### 2. API Segment
**역할**: 백엔드와의 통신

**포함 내용**:
- API 요청 함수
- React Query/SWR hooks
- 데이터 타입 (orval 자동 생성)
- 데이터 매퍼/변환 함수

**파일 네이밍**:
- `xxx.api.ts` - API 함수 (fetch, axios 등)
- `xxx.queries.ts` - React Query hooks (useQuery, useMutation)

**예제**:
```typescript
📂 entities/product/
  📂 api/
    📄 product.api.ts
    📄 product.queries.ts
    📄 product.types.ts  # orval 자동 생성 (선택)
```

```typescript
// entities/product/api/product.api.ts
import { apiClient } from '@/shared/api';
import type { Product, CreateProductRequest } from './product.types';

/**
 * 상품 목록을 조회합니다
 * @param page - 페이지 번호
 * @param limit - 페이지당 항목 수
 * @returns 상품 목록
 */
export async function fetchProducts(page: number, limit: number) {
  const { data } = await apiClient.get<Product[]>('/products', {
    params: { page, limit },
  });
  return data;
}

/**
 * 상품을 생성합니다
 * @param request - 상품 생성 요청 데이터
 * @returns 생성된 상품
 */
export async function createProduct(request: CreateProductRequest) {
  const { data } = await apiClient.post<Product>('/products', request);
  return data;
}

// entities/product/api/product.queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, createProduct } from './product.api';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (page: number, limit: number) => [...productKeys.lists(), { page, limit }] as const,
};

/**
 * 상품 목록 조회 Query Hook
 */
export function useProductsQuery(page: number, limit: number) {
  return useQuery({
    queryKey: productKeys.list(page, limit),
    queryFn: () => fetchProducts(page, limit),
  });
}

/**
 * 상품 생성 Mutation Hook
 */
export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
```

#### 3. Model Segment
**역할**: 비즈니스 로직 및 데이터 모델

**포함 내용**:
- 타입 및 인터페이스
- Zod 스키마 (요청 검증용)
- 상태 관리 (Zustand, Jotai 등)
- 비즈니스 로직 함수

**파일 네이밍**:
- `xxx.types.ts` - 타입 정의
- `xxx.schema.ts` - Zod 스키마
- `xxx.store.ts` - 상태 관리

**예제**:
```typescript
📂 entities/product/
  📂 model/
    📄 product.types.ts    # orval 자동 생성
    📄 product.schema.ts   # Zod 스키마 (요청용만)
```

```typescript
// entities/product/model/product.schema.ts
import { z } from 'zod';

/**
 * 상품 생성 스키마
 * orval 타입 기반 요청 스키마만 생성 (응답 스키마 X)
 */
export const createProductSchema = z.object({
  /** 상품명 */
  name: z.string().min(1, "상품명을 입력해주세요").max(255),
  /** 가격 (원) */
  price: z.number().positive("가격은 0보다 커야 합니다"),
  /** 카테고리 ID */
  categoryId: z.number().positive(),
  /** 상품 설명 */
  description: z.string().optional(),
  /** 노출 여부 */
  visible: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductForm = z.infer<typeof createProductSchema>;
export type UpdateProductForm = z.infer<typeof updateProductSchema>;

// features/product-form/model/product-form.schema.ts
import { createProductSchema } from '@/entities/product';

/**
 * 상품 폼 스키마
 * entities 상속 + 폼 특화: 문자열→숫자 변환, 추가 검증
 */
export const createProductFormSchema = createProductSchema.extend({
  // 폼에서는 문자열로 받아서 숫자로 변환
  price: z.string().transform(val => parseFloat(val)),
  categoryId: z.string().transform(val => parseInt(val, 10)),
}).refine(
  (data) => data.price > 0,
  { message: "가격은 0보다 커야 합니다", path: ["price"] }
);

// 타입 분리: input(폼) vs output(서버)
export type CreateProductFormInput = z.input<typeof createProductFormSchema>;
export type CreateProductFormData = z.output<typeof createProductFormSchema>;
```

#### 4. Lib Segment
**역할**: 슬라이스 전용 유틸리티 함수

**포함 내용**:
- 해당 슬라이스에서만 사용하는 유틸리티
- 헬퍼 함수
- 계산 로직

**예제**:
```typescript
📂 features/product-form/
  📂 lib/
    📄 formatPrice.ts
    📄 validateStock.ts

// features/product-form/lib/formatPrice.ts
/**
 * 가격을 원화 형식으로 포맷팅합니다
 * @param price - 가격
 * @returns 포맷팅된 가격 문자열
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(price);
}
```

#### 5. Config Segment
**역할**: 설정 및 상수

**포함 내용**:
- 설정 값
- 상수
- 기능 플래그

**예제**:
```typescript
📂 features/product-form/
  📂 config/
    📄 constants.ts

// features/product-form/config/constants.ts
export const PRODUCT_FORM_CONFIG = {
  MAX_NAME_LENGTH: 255,
  MIN_PRICE: 0,
  MAX_PRICE: 10000000,
  DEFAULT_VISIBLE: true,
};
```

### Shared 레이어 특수 케이스

Shared 레이어는 슬라이스 대신 **목적별 폴더**나 **세그먼트**로 구성됩니다.

```typescript
📂 shared/
  📂 ui/               # UI 컴포넌트 (shadcn 포함)
    📄 button.tsx      # shadcn 컴포넌트 (배럴 파일 없음)
    📄 input.tsx
    📂 Logo/           # 커스텀 컴포넌트 (폴더 단위)
      📄 Logo.tsx
      📄 index.ts      # 배럴 파일
  📂 api/              # 공통 API 설정
  📂 lib/              # 공통 유틸리티
  📂 config/           # 설정 및 상수
  📂 device-detection/ # 특정 목적의 기능
    📂 ui/
    📂 lib/
    📄 index.ts
```

---

## 6. Public API

### Public API란?

Public API는 **슬라이스와 같은 모듈 그룹 간의 계약**으로, **index.ts를 통한 재내보내기**로 구현됩니다. 이는 **접근 제어의 게이트** 역할을 합니다.

```typescript
// features/product-form/index.ts
export { ProductForm } from './ui/ProductForm';
export { useCreateProductMutation } from './api/product.queries';
export type { CreateProductFormInput, CreateProductFormData } from './model/product-form.schema';
export { createProductFormSchema } from './model/product-form.schema';
```

### 좋은 Public API의 3가지 목표

#### 1. 구조적 변화 차단
슬라이스 리팩토링이 외부 코드에 영향을 주지 않아야 합니다.

```typescript
// ✅ Public API를 통한 import - 내부 구조 변경에 영향 없음
import { ProductForm } from '@/features/product-form';

// ❌ 내부 구조 직접 접근 - 내부 구조 변경 시 모든 import 수정 필요
import { ProductForm } from '@/features/product-form/ui/ProductForm';
```

#### 2. 행동 변화 추적
동작 변화가 API 변경으로 반영되어야 합니다.

```typescript
// 변경 전
export { createProduct } from './api/product.api';

// 변경 후 - API 시그니처 변경이 명확하게 드러남
export { createProductV2 as createProduct } from './api/product.api';
```

#### 3. 필요한 것만 노출
슬라이스의 필수 부분만 외부에 공개합니다.

### Public API Export 전략

#### Export 원칙
> **핵심**: 외부에서 필요한 것만 노출 (타입, API, 메인 컴포넌트)

```typescript
// src/features/product-form/index.ts

// ✅ 메인 컴포넌트만 export (내부 하위 컴포넌트는 노출 X)
export { ProductForm } from './ui/ProductForm';

// ✅ API 및 쿼리 hooks
export { createProduct, updateProduct } from './api/product.api';
export { useCreateProductMutation } from './api/product.queries';

// ✅ 타입 및 스키마 (외부에서 사용할 것만)
export type { ProductFormInput, ProductFormData } from './model/product-form.schema';
export { productFormSchema } from './model/product-form.schema';

// ❌ 내부 구현 세부사항은 노출하지 않음
// - 하위 UI 컴포넌트 (ProductFormField, ProductFormActions 등)
// - lib 유틸리티 함수
// - 내부에서만 사용하는 타입
```

#### 좋은 예시
```typescript
// entities/product/index.ts
// 타입
export type { Product, CreateProductRequest } from './model/product.types';
export type { CreateProductForm } from './model/product.schema';
export { createProductSchema } from './model/product.schema';

// API
export { fetchProducts, fetchProduct, createProduct } from './api/product.api';
export { useProductsQuery, useProductQuery } from './api/product.queries';

// UI
export { ProductCard } from './ui/ProductCard';
```

### 피해야 할 패턴

#### 1. 와일드카드 재내보내기

```typescript
// ❌ 안 좋은 예시 - 와일드카드 재내보내기
export * from './ui/Comment';
export * from './model/comments';
```

**문제점**:
- 슬라이스 인터페이스 파악이 어려움
- 의도하지 않은 내부 구현 노출
- 리팩토링 어려움

```typescript
// ✅ 좋은 예시 - 명시적 export
export { Comment } from './ui/Comment';
export type { CommentData } from './model/comments';
export { useCommentsQuery } from './api/comments.queries';
```

#### 2. 모든 것을 export

```typescript
// ❌ 안 좋은 예시 - 모든 내부 컴포넌트 노출
export { ProductForm } from './ui/ProductForm';
export { ProductFormField } from './ui/ProductFormField';  // 내부 컴포넌트
export { ProductFormActions } from './ui/ProductFormActions';  // 내부 컴포넌트
export { formatPrice } from './lib/formatPrice';  // 내부 유틸리티
```

```typescript
// ✅ 좋은 예시 - 메인 컴포넌트만 노출
export { ProductForm } from './ui/ProductForm';
// ProductFormField, ProductFormActions는 ProductForm 내부에서만 사용
```

### Cross-imports를 위한 특수 API

엔티티 간 참조가 필요할 때 `@x` 표기법을 사용합니다.

```typescript
📂 entities/A/
  📂 @x/
    📄 B.ts  # B에만 공개되는 API
  📄 index.ts
```

**사용 방식**:
```typescript
// entities/B에서만 사용 가능
import type { EntityA } from '@/entities/A/@x/B';
```

> **주의**: 엔티티 레이어에서만 이 표기법을 사용할 것을 권장합니다.

### Public API의 주요 문제점과 해결책

#### 1. 순환 참조
**문제**: 같은 슬라이스 내에서 index.ts를 참조하면 순환 참조 발생

```typescript
// ❌ 순환 참조 발생
// features/product-form/ui/ProductForm.tsx
import { createProductFormSchema } from '../';  // index.js 참조
```

**해결**:
```typescript
// ✅ 상대 경로로 직접 참조
// features/product-form/ui/ProductForm.tsx
import { createProductFormSchema } from '../model/product-form.schema';
```

#### 2. 공유 레이어의 번들 크기 증가
**문제**: shared/ui의 모든 컴포넌트를 하나의 index.ts에서 export하면 번들 크기 증가

```typescript
// ❌ 번들 크기 증가
// shared/ui/index.ts
export { Button } from './button';
export { Input } from './input';
export { Card } from './card';
// ... 100개 컴포넌트

// 사용 시 모든 컴포넌트가 번들에 포함
import { Button } from '@/shared/ui';
```

**해결**: 컴포넌트별 별도 index.ts

```typescript
// ✅ 번들 크기 최적화
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
```

#### 3. API 우회 방지 불가
**문제**: 자동 import가 Public API 규칙을 우회할 수 있음

**해결**: **Steiger**(아키텍처 린터) 사용 권장

```bash
pnpm add -D @feature-sliced/steiger
npx steiger src
```

#### 4. 대규모 프로젝트의 성능 저하
**해결 전략**:
- `shared/ui`, `shared/lib`에 세분화된 index.ts 사용
- 슬라이스 수준 index.ts만 유지 (세그먼트 index.ts 제거)
- 모노레포 구조로 FSD 루트 분산

---

## 7. 의존성 규칙

### Import 규칙

#### 레이어 간 의존성
> **핵심 원칙**: "한 모듈은 자신보다 아래 계층의 코드만 import 가능"

```typescript
app       ← 모든 하위 레이어 import 가능
  ↓
pages     ← widgets, features, entities, shared import 가능
  ↓
widgets   ← features, entities, shared import 가능
  ↓
features  ← entities, shared import 가능
  ↓
entities  ← shared import 가능
  ↓
shared    ← 외부 라이브러리만 import 가능
```

**예제**:
```typescript
// ✅ 올바른 의존성
// features/product-form → entities/product
import { createProduct } from '@/entities/product';

// features/product-form → shared/ui
import { Button } from '@/shared/ui/button';

// ❌ 잘못된 의존성
// entities/product → features/product-form (하위가 상위를 참조)
import { ProductForm } from '@/features/product-form';

// features/auth → features/product (같은 레이어 간 참조)
import { useProducts } from '@/features/product';
```

#### 슬라이스 간 의존성
**같은 레이어의 슬라이스 간에는 직접 의존 불가**

```typescript
// ❌ 잘못된 의존성 - 같은 레이어 간 참조
// features/product-form → features/user-auth
import { useAuth } from '@/features/user-auth';

// ✅ 올바른 방법 1: 하위 레이어(entities)로 이동
// features/product-form → entities/user
import { useCurrentUser } from '@/entities/user';

// ✅ 올바른 방법 2: 상위 레이어(pages)에서 조합
// pages/product-create/ui/ProductCreatePage.tsx
import { ProductForm } from '@/features/product-form';
import { useAuth } from '@/features/user-auth';

export function ProductCreatePage() {
  const auth = useAuth();

  if (!auth.isLoggedIn) {
    return <LoginPrompt />;
  }

  return <ProductForm />;
}
```

### Import 방식

#### Public API를 통한 Import (권장)
```typescript
// ✅ Public API 사용
import { ProductCard, useProductsQuery } from '@/entities/product';
import { ProductForm } from '@/features/product-form';
```

#### 내부 구조 직접 접근 (금지)
```typescript
// ❌ 내부 구조 직접 접근
import { ProductCard } from '@/entities/product/ui/ProductCard';
import { useProductsQuery } from '@/entities/product/api/product.queries';
```

### Shared/UI 특수 규칙

#### Shadcn 컴포넌트
배럴 파일 없이 직접 import

```typescript
// ✅ Shadcn 컴포넌트
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardHeader, CardContent } from '@/shared/ui/card';
```

#### 커스텀 컴포넌트
폴더 단위로 배럴 파일 사용

```typescript
// ✅ 커스텀 컴포넌트
import { Logo } from '@/shared/ui/Logo';
import { BackButton } from '@/shared/ui/BackButton';
```

### 서버/클라이언트 컴포넌트 분리

> **문제**: index.ts에서 서버/클라이언트 컴포넌트를 혼용하면 하이드레이션 에러 발생

```typescript
// ❌ 문제가 되는 구조
// src/shared/ui/index.ts
export { ServerComponent } from './ServerComponent';  // 서버 컴포넌트
export { ClientComponent } from './ClientComponent';  // 'use client'
```

**해결 방법 1**: Shadcn처럼 각 컴포넌트별 개별 import
```typescript
import { ServerComponent } from '@/shared/ui/ServerComponent';
import { ClientComponent } from '@/shared/ui/ClientComponent';
```

**해결 방법 2**: 폴더로 분리하여 각각 배럴 파일 생성
```typescript
// src/shared/ui/ServerComponent/index.ts
export { ServerComponent } from './ServerComponent';

// src/shared/ui/ClientComponent/index.ts
export { ClientComponent } from './ClientComponent';

// 사용
import { ServerComponent } from '@/shared/ui/ServerComponent';
import { ClientComponent } from '@/shared/ui/ClientComponent';
```

---

## 8. Next.js와 함께 사용하기

### 폴더 충돌 해결

FSD의 `app`, `pages` 레이어와 Next.js의 `app`, `pages` 폴더가 충돌합니다.

#### App Router 사용 시

**프로젝트 구조**:
```
project-root/
├── app/                 # Next.js 라우팅
│   ├── api/
│   ├── products/
│   │   └── page.tsx
│   └── layout.tsx
├── pages/               # 빈 폴더 (Next.js 요구사항)
│   └── README.md
└── src/                 # FSD 레이어
    ├── app/
    ├── pages/
    ├── widgets/
    ├── features/
    ├── entities/
    └── shared/
```

**페이지 재내보내기**:
```typescript
// app/products/page.tsx (Next.js 라우팅)
export { ProductListPage as default, metadata } from '@/pages/product-list';

// src/pages/product-list/index.ts (FSD)
export { ProductListPage } from './ui/ProductListPage';
export { metadata } from './metadata';

// src/pages/product-list/ui/ProductListPage.tsx
export function ProductListPage() {
  return <div>상품 목록</div>;
}

// src/pages/product-list/metadata.ts
export const metadata = {
  title: '상품 목록',
  description: '모든 상품을 확인하세요',
};
```

**동적 라우트**:
```typescript
// app/products/[id]/page.tsx
export { ProductDetailPage as default } from '@/pages/product-detail';
export { generateMetadata } from '@/pages/product-detail';

// src/pages/product-detail/index.ts
export { ProductDetailPage } from './ui/ProductDetailPage';
export { generateMetadata } from './metadata';

// src/pages/product-detail/ui/ProductDetailPage.tsx
import { ProductCard } from '@/entities/product';

interface Props {
  params: Promise<{ id: string }>;
}

export async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await fetchProduct(id);

  return <ProductCard product={product} />;
}

// src/pages/product-detail/metadata.ts
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await fetchProduct(id);

  return {
    title: `${product.name} - 상품 상세`,
    description: product.description,
  };
}
```

**특수 파일 위치**:
- **미들웨어**: 프로젝트 루트 `middleware.ts`
- **계측 파일**: 프로젝트 루트 `instrumentation.js`

#### Pages Router 사용 시

**프로젝트 구조**:
```
project-root/
├── pages/               # Next.js 라우팅
│   ├── _app.tsx
│   ├── api/
│   ├── products/
│   │   └── index.tsx
│   └── products/
│       └── [id].tsx
└── src/                 # FSD 레이어
    ├── app/
    ├── pages/
    ├── widgets/
    ├── features/
    ├── entities/
    └── shared/
```

**커스텀 App 컴포넌트**:
```typescript
// src/app/custom-app/custom-app.tsx
import type { AppProps } from 'next/app';
import { QueryProvider } from '../providers/QueryProvider';

export function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <QueryProvider>
      <Component {...pageProps} />
    </QueryProvider>
  );
}

// src/app/custom-app/index.ts
export { CustomApp } from './custom-app';

// pages/_app.tsx
export { CustomApp as default } from '@/app/custom-app';
```

### API 라우팅

두 라우터 모두에서 `src/app/api-routes` 세그먼트를 사용하여 API 엔드포인트를 관리합니다.

```typescript
// src/app/api-routes/products/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const products = await fetchProducts();
  return NextResponse.json(products);
}

// app/api/products/route.ts (App Router)
export { GET } from '@/app/api-routes/products/route';

// pages/api/products.ts (Pages Router)
export { handler as default } from '@/app/api-routes/products/handler';
```

### 권장사항

- **데이터베이스 쿼리**: `shared/db`에 구성
- **캐싱 및 재검증**: 쿼리와 동일 위치에서 관리

```typescript
// shared/db/product.ts
import { db } from './client';

export async function getProducts() {
  'use cache';
  return db.product.findMany();
}
```

---

## 9. 실제 예제

### 인증(Authentication) 구현

#### 1. 로그인 페이지

```typescript
📂 pages/
  📂 login/
    📂 ui/
      📄 LoginPage.tsx
      📄 RegisterPage.tsx
    📂 model/
      📄 registration-schema.ts
    📄 index.ts
```

**스키마 정의**:
```typescript
// pages/login/model/registration-schema.ts
import { z } from 'zod';

/**
 * 회원가입 데이터 검증 스키마
 */
export const registrationData = z.object({
  /** 이메일 주소 */
  email: z.string().email("올바른 이메일을 입력해주세요"),
  /** 비밀번호 (최소 6자) */
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
  /** 비밀번호 확인 */
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

export type RegistrationData = z.infer<typeof registrationData>;
```

**UI 컴포넌트**:
```typescript
// pages/login/ui/RegisterPage.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registrationData } from '../model/registration-schema';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

export function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registrationData),
  });

  const onSubmit = async (data) => {
    // API 호출
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">이메일</label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <label htmlFor="password">비밀번호 (최소 6자)</label>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      <div>
        <label htmlFor="confirmPassword">비밀번호 확인</label>
        <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
        {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}
      </div>

      <Button type="submit">회원가입</Button>
    </form>
  );
}
```

#### 2. 토큰 저장 (Entities)

```typescript
📂 entities/
  📂 user/
    📂 model/
      📄 user.store.ts
      📄 user.types.ts
    📂 api/
      📄 auth.api.ts
    📄 index.ts
```

**상태 관리**:
```typescript
// entities/user/model/user.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  /** 현재 사용자 */
  user: User | null;
  /** 액세스 토큰 */
  token: string | null;
  /** 로그인 */
  setUser: (user: User, token: string) => void;
  /** 로그아웃 */
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'user-storage',
    }
  )
);
```

**API 함수**:
```typescript
// entities/user/api/auth.api.ts
import { apiClient } from '@/shared/api';

/**
 * 로그인 API
 * @param email - 이메일
 * @param password - 비밀번호
 * @returns 사용자 정보 및 토큰
 */
export async function login(email: string, password: string) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
}

/**
 * 로그아웃 API
 */
export async function logout() {
  await apiClient.post('/auth/logout');
}
```

#### 3. API 클라이언트에 토큰 주입

```typescript
// shared/api/client.ts
import axios from 'axios';
import { useUserStore } from '@/entities/user';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// 요청 인터셉터: 토큰 자동 추가
apiClient.interceptors.request.use((config) => {
  const token = useUserStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401 에러 시 로그아웃
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useUserStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
```

### CRUD 구현 예제

#### 1. 상품 목록 페이지

```typescript
📂 pages/
  📂 product-list/
    📂 ui/
      📄 ProductListPage.tsx
    📄 index.ts
    📄 metadata.ts
```

```typescript
// pages/product-list/ui/ProductListPage.tsx
import { ProductCard } from '@/entities/product';
import { useProductsQuery } from '@/entities/product';

export function ProductListPage() {
  const { data: products, isLoading } = useProductsQuery(1, 20);

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <div>
      <h1>상품 목록</h1>
      <div className="grid grid-cols-3 gap-4">
        {products?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

// app/products/page.tsx (Next.js)
export { ProductListPage as default, metadata } from '@/pages/product-list';
```

#### 2. 상품 생성 페이지

```typescript
📂 pages/
  📂 product-create/
    📂 ui/
      📄 ProductCreatePage.tsx
    📄 index.ts
```

```typescript
// pages/product-create/ui/ProductCreatePage.tsx
import { ProductForm } from '@/features/product-form';
import { useRouter } from 'next/navigation';
import { useCreateProductMutation } from '@/entities/product';

export function ProductCreatePage() {
  const router = useRouter();
  const createMutation = useCreateProductMutation();

  const handleSubmit = async (data) => {
    await createMutation.mutateAsync(data);
    router.push('/products');
  };

  return (
    <div>
      <h1>상품 등록</h1>
      <ProductForm onSubmit={handleSubmit} />
    </div>
  );
}

// app/products/create/page.tsx (Next.js)
export { ProductCreatePage as default } from '@/pages/product-create';
```

---

## 10. 베스트 프랙티스와 안티패턴

### 베스트 프랙티스

#### 1. 공유 코드는 실제로 재사용될 때 추출
```typescript
// ❌ 조기 최적화 - 아직 재사용하지 않는데 shared로 이동
// shared/lib/formatProductPrice.ts
export function formatProductPrice(price: number) { ... }

// ✅ 재사용이 필요할 때 이동
// 처음에는 features/product-form/lib/formatPrice.ts
// 두 번째 사용처가 생기면 shared/lib/formatPrice.ts로 이동
```

#### 2. Server Component 우선, 필요 시만 'use client'
```typescript
// ✅ Server Component (기본)
// pages/product-detail/ui/ProductDetailPage.tsx
import { ProductCard } from '@/entities/product';

export async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await fetchProduct(id);  // 서버에서 직접 fetch

  return <ProductCard product={product} />;
}

// ✅ Client Component (상호작용 필요 시만)
// features/product-form/ui/ProductForm.tsx
'use client';

import { useForm } from 'react-hook-form';

export function ProductForm() {
  const { register, handleSubmit } = useForm();
  // ...
}
```

#### 3. PAGES 상수 사용
```typescript
// ✅ PAGES 상수 사용
import { PAGES } from '@/shared/config';
import Link from 'next/link';

<Link href={PAGES.PRODUCT.LIST.path}>상품 목록</Link>
<Link href={PAGES.PRODUCT.DETAIL.path(productId)}>상품 상세</Link>

// ❌ 하드코딩
<Link href="/products">상품 목록</Link>
<Link href={`/products/${productId}`}>상품 상세</Link>
```

#### 4. Zod 스키마: Entities는 기본, Features는 폼 특화
```typescript
// ✅ Entities: 기본 스키마
// entities/product/model/product.schema.ts
export const createProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

// ✅ Features: Entities 상속 + 폼 특화
// features/product-form/model/product-form.schema.ts
import { createProductSchema } from '@/entities/product';

export const createProductFormSchema = createProductSchema.extend({
  price: z.string().transform(val => parseFloat(val)),  // 문자열→숫자 변환
});
```

#### 5. API 파일 네이밍 규칙
```typescript
📂 entities/product/api/
  📄 product.api.ts       # API 함수 (fetch, axios)
  📄 product.queries.ts   # React Query hooks
  📄 product.types.ts     # orval 자동 생성 타입
```

#### 6. 함수 및 인터페이스 주석
```typescript
/**
 * 상품 목록을 조회합니다
 * @param page - 페이지 번호
 * @param limit - 페이지당 항목 수
 * @returns 상품 목록과 총 개수
 */
export async function fetchProducts(page: number, limit: number) {
  // 구현
}

/**
 * 상품 정보 인터페이스
 */
interface Product {
  /** 상품 고유 ID */
  id: string;
  /** 상품명 */
  name: string;
  /** 가격 (원) */
  price: number;
}
```

### 안티패턴

#### 1. 같은 레이어 간 의존
```typescript
// ❌ 안티패턴 - 같은 레이어 간 의존
// features/product-form → features/user-auth
import { useAuth } from '@/features/user-auth';

// ✅ 해결 1: 하위 레이어로 이동
// features/product-form → entities/user
import { useCurrentUser } from '@/entities/user';

// ✅ 해결 2: 상위 레이어에서 조합
// pages/product-create에서 두 feature 조합
```

#### 2. 내부 구조 직접 접근
```typescript
// ❌ 안티패턴 - 내부 구조 직접 접근
import { ProductCard } from '@/entities/product/ui/ProductCard';

// ✅ Public API 사용
import { ProductCard } from '@/entities/product';
```

#### 3. 와일드카드 export
```typescript
// ❌ 안티패턴 - 와일드카드 export
// entities/product/index.ts
export * from './ui/ProductCard';
export * from './model/product.types';

// ✅ 명시적 export
export { ProductCard } from './ui/ProductCard';
export type { Product } from './model/product.types';
```

#### 4. 기술 중심 네이밍
```typescript
// ❌ 안티패턴 - 기술 중심 네이밍
📂 features/
  📂 forms/
    📂 components/
    📂 hooks/
    📂 utils/

// ✅ 비즈니스 중심 네이밍
📂 features/
  📂 product-form/
    📂 ui/
    📂 api/
    📂 model/
```

#### 5. 조기 최적화 (premature abstraction)
```typescript
// ❌ 안티패턴 - 한 번만 사용하는데 shared로 이동
// shared/lib/formatProductTitle.ts
export function formatProductTitle(title: string) { ... }

// ✅ 필요할 때까지 기다리기
// 처음에는 features/product-form/lib/formatTitle.ts
// 두 번째 사용처가 생기면 shared로 이동
```

#### 6. 모든 것을 export
```typescript
// ❌ 안티패턴 - 모든 내부 컴포넌트 노출
// features/product-form/index.ts
export { ProductForm } from './ui/ProductForm';
export { ProductFormField } from './ui/ProductFormField';  // 내부 컴포넌트
export { formatPrice } from './lib/formatPrice';  // 내부 유틸리티

// ✅ 필요한 것만 노출
export { ProductForm } from './ui/ProductForm';
export type { ProductFormInput } from './model/product-form.schema';
```

#### 7. 응답 스키마 생성
```typescript
// ❌ 안티패턴 - 응답 스키마 생성
export const productResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  // ...
});

// ✅ orval 자동 생성 타입 사용
import type { Product } from './product.types';  // orval 생성
```

#### 8. 순환 참조
```typescript
// ❌ 안티패턴 - 순환 참조
// features/product-form/ui/ProductForm.tsx
import { createProductFormSchema } from '../';  // index.ts 참조

// ✅ 상대 경로로 직접 참조
import { createProductFormSchema } from '../model/product-form.schema';
```

---

## 요약

### FSD 핵심 원칙
1. **Public API**: index.ts를 통한 명시적 export
2. **Isolation**: 상위 레이어는 하위 레이어로만 의존
3. **Needs Driven**: 비즈니스 중심 구조

### 레이어 구조
```
app (전역 설정) → pages (화면) → widgets (UI 블록) →
features (기능) → entities (도메인) → shared (인프라)
```

### 슬라이스와 세그먼트
- **Slices**: 비즈니스 도메인별 그룹화 (product, user, order)
- **Segments**: 기술적 목적별 그룹화 (ui, api, model, lib, config)

### 의존성 규칙
- 상위 → 하위 레이어만 import 가능
- 같은 레이어 간 직접 의존 금지
- Public API를 통한 import만 허용

### Next.js 통합
- FSD는 src/ 폴더에 구성
- Next.js 라우팅 폴더에서 FSD 페이지 재내보내기
- Server Component 우선, 필요 시만 'use client'

### 베스트 프랙티스
- 공유 코드는 실제 재사용 시 추출
- PAGES 상수 사용
- Entities는 기본 스키마, Features는 폼 특화
- 명시적 export (와일드카드 금지)
- 비즈니스 중심 네이밍

---

## 참고 자료

- [FSD 공식 문서](https://feature-sliced.design/)
- [FSD GitHub](https://github.com/feature-sliced/documentation)
- [Steiger (FSD 린터)](https://github.com/feature-sliced/steiger)
