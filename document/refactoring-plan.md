# FSD 리팩토링 계획

## 개요

현재 프로젝트 구조를 FSD 공식 문서 기준에 맞게 리팩토링합니다.

## 문제점 요약

1. **shared 레이어에 도메인 로직 혼재**: `shared/lib/kiwoom`에 stock 도메인 API가 포함됨
2. **entities 레이어 부재**: 비즈니스 도메인 개념이 분리되지 않음
3. **widgets 구조 불완전**: 슬라이스 구조(폴더 + Public API) 미적용

## 리팩토링 단계

### Phase 1: entities 레이어 생성 (필수)

#### 1.1. 폴더 구조 생성

```bash
mkdir -p src/entities/stock/api
mkdir -p src/entities/stock/model
```

#### 1.2. 파일 이동

| 현재 위치 | 이동 후 위치 | 비고 |
|----------|-------------|------|
| `shared/lib/kiwoom/api/stockRanking.api.ts` | `entities/stock/api/stockRanking.api.ts` | 도메인 API |
| `shared/lib/kiwoom/queries/stockRanking.queries.ts` | `entities/stock/api/stockRanking.queries.ts` | 도메인 쿼리 |
| `shared/lib/kiwoom/types.ts` (일부) | `entities/stock/model/stock.types.ts` | 도메인 타입만 분리 |

#### 1.3. Public API 생성

**src/entities/stock/index.ts**:
```typescript
// API
export { fetchStockRanking } from './api/stockRanking.api';
export { useStockRanking } from './api/stockRanking.queries';

// 타입
export type {
  StockRankingRequest,
  StockRankingResponse,
} from './model/stock.types';
```

#### 1.4. Import 경로 수정

**변경 대상 파일**:
- `src/widgets/StockRankingWidget.tsx`
- `src/app/api/kiwoom/stock-ranking/route.ts`

```typescript
// ❌ 변경 전
import { useStockRanking } from "@/shared/lib/kiwoom/queries/stockRanking.queries";
import type { StockRankingRequest } from "@/shared/lib/kiwoom/types";

// ✅ 변경 후
import { useStockRanking } from "@/entities/stock";
import type { StockRankingRequest } from "@/entities/stock";
```

### Phase 2: widgets 구조화 (권장)

#### 2.1. 폴더 구조 생성

```bash
mkdir -p src/widgets/stock-ranking/ui
```

#### 2.2. 파일 이동 및 생성

| 현재 | 변경 후 |
|------|---------|
| `src/widgets/StockRankingWidget.tsx` | `src/widgets/stock-ranking/ui/StockRankingWidget.tsx` |
| - | `src/widgets/stock-ranking/index.ts` (신규) |

#### 2.3. Public API 생성

**src/widgets/stock-ranking/index.ts**:
```typescript
export { StockRankingWidget } from './ui/StockRankingWidget';
```

#### 2.4. Import 경로 수정

**src/app/stock-ranking/page.tsx**:
```typescript
// ❌ 변경 전
import { StockRankingWidget } from "@/widgets/StockRankingWidget";

// ✅ 변경 후
import { StockRankingWidget } from "@/widgets/stock-ranking";
```

### Phase 3: pages 레이어 생성 (선택)

> **참고**: Next.js App Router는 app 폴더가 라우팅 역할을 하므로, pages 레이어는 **선택 사항**입니다.
> 단순 페이지는 app에 직접 구현해도 FSD 위반이 아닙니다.

#### 3.1. 폴더 구조 (선택 시)

```bash
mkdir -p src/pages/stock-ranking/ui
```

#### 3.2. 파일 생성

**src/pages/stock-ranking/ui/StockRankingPage.tsx**:
```typescript
import { StockRankingWidget } from "@/widgets/stock-ranking";

export function StockRankingPage() {
  return <StockRankingWidget />;
}
```

**src/pages/stock-ranking/index.ts**:
```typescript
export { StockRankingPage } from './ui/StockRankingPage';
export { metadata } from './metadata';
```

**src/pages/stock-ranking/metadata.ts**:
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '실시간 종목조회순위',
  description: '키움증권 API를 통한 실시간 종목 조회 순위',
};
```

#### 3.3. Next.js 페이지 수정

**app/stock-ranking/page.tsx**:
```typescript
// FSD pages 레이어 재내보내기
export { StockRankingPage as default, metadata } from '@/pages/stock-ranking';
```

### Phase 4: shared 정리 (필수)

#### 4.1. shared/lib/kiwoom/index.ts 수정

**변경 전**:
```typescript
// API
export { fetchStockRanking } from "./api/stockRanking.api";  // ❌ 제거

// Queries
export { useStockRanking } from "./queries/stockRanking.queries";  // ❌ 제거

// 타입
export type {
  StockRankingRequest,  // ❌ 제거
  StockRankingResponse,  // ❌ 제거
  // ...
} from "./types";
```

**변경 후**:
```typescript
// 클라이언트
export { KiwoomClient, kiwoomClient } from "./client";

// 인증
export {
  clearTokenCache,
  getAccessToken,
  getTokenStatus,
  refreshToken,
} from "./auth";

// 타입 (공통 인프라만)
export type {
  CachedToken,
  KiwoomError,
  KiwoomRequestOptions,
  TokenRequest,
  TokenResponse,
} from "./types";

// 환경변수 검증
export type { KiwoomEnv } from "./env.schema";
export { kiwoomEnvSchema, validateKiwoomEnv } from "./env.schema";
```

#### 4.2. 폴더 정리

**삭제할 폴더**:
- `src/shared/lib/kiwoom/api/` (entities/stock으로 이동 완료)
- `src/shared/lib/kiwoom/queries/` (entities/stock으로 이동 완료)

#### 4.3. shared/lib/kiwoom/types.ts 정리

도메인 타입(`StockRankingRequest`, `StockRankingResponse`)을 제거하고, **공통 인프라 타입만 유지**.

## 리팩토링 우선순위

### 🔴 필수 (Phase 1, 4)
- **entities/stock 레이어 생성** (FSD 핵심 원칙)
- **shared 정리** (도메인 로직 제거)

### 🟡 권장 (Phase 2)
- **widgets 구조화** (Public API 패턴 적용)

### ⚪ 선택 (Phase 3)
- **pages 레이어 생성** (복잡한 페이지 로직이 생기면 고려)

## FSD 준수 체크리스트

리팩토링 후 다음을 확인:

- [ ] `shared`에 도메인 로직이 없는가?
- [ ] `entities/stock`에 주식 관련 모든 로직이 있는가?
- [ ] 모든 슬라이스에 `index.ts` Public API가 있는가?
- [ ] import는 Public API를 통하는가?
- [ ] 의존성 방향이 올바른가? (상위 → 하위만)

## 참고 문서

- `document/fsd-official.md` - FSD 공식 문서 완전 분석
- `document/architecture.md` - 프로젝트 아키텍처
- `document/coding-standards.md` - 코딩 규칙
