# Claude Code 프로젝트 지침서

> 이 문서는 Claude Code가 이 프로젝트에서 작업할 때 따라야 할 **핵심 원칙과 규칙**을 정의합니다.
> 상세한 예제와 가이드는 각 전문 문서를 참조하세요.

## 프로젝트 개요

**키움증권 REST API를 활용한 실시간 웹 트레이딩 플랫폼**

- **프레임워크**: Next.js 16 (App Router) + TypeScript 5.x
- **아키텍처**: Feature-Sliced Design (FSD)
- **데이터베이스**: Supabase Self-Hosting (PostgreSQL) - https://supa.devhong.cc
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
- `document/api-guide.md` - 키움 API 호출 규칙
- `document/api/` - **키움 API 상세 명세** (Request/Response 스키마, 예제)
- 해당 기능의 PRD (`document/prd/{기능명}/prd.md`)

### 2. PRD 기반 개발

**모든 기능은 PRD 작성부터 시작**:
1. PRD 작성 (`document/prd/{기능명}/prd.md` + `checklist.md`)
2. `document/index.md`에 등록 (상태: 📝 작성중)
3. 구현하면서 **체크리스트 실시간 업데이트** (`checklist.md`의 `- [ ]` → `- [x]`)
4. **구현 완료 후 반드시 테스트 명세 작성** (`test-spec-unit.md`, `test-spec-integration.md`)
5. 사용자가 Gemini에게 테스트 명세 전달
6. 테스트 완료 시 `document/index.md` 상태 변경 (📝 → 🚧 → ✅)

**필수 규칙**:
- PRD 없는 구현 금지
- **테스트 명세 없는 완료 금지**
- **테스트 명세는 간결하게**: 요구사항 + 테스트 케이스 목록 + 핵심 패턴만
- **기존 코드 변경 시**: 영향받는 기존 테스트 명세에 deprecated 표시

#### PRD 파일 구조 규칙

PRD는 **여러 파일로 분리**하여 작성 (토큰 효율 + 변경 빈도 분리):

```
document/prd/{기능명}/
├── prd.md                       # 지속적인 요구사항 (Source of Truth)
├── checklist.md                 # 구현 파일 목록 + 핵심 역할
├── implementation-patterns.md   # 구현 패턴 상세 (선택, 코드 포함 가능)
└── future-improvements.md       # 향후 개선 계획 (선택)
```

##### prd.md 작성 원칙

**포함할 내용**:
- 개요/목적, **지속적인 기능 요구사항**(비즈니스 룰, 제약 조건, 계산 공식 등)
- 기술 스택 결정 이유, UI 와이어프레임, 주의사항
- 변경 이력 테이블 (버전별 하이레벨 요약만, 1줄)

**제외할 내용** (이미 다른 곳에 있음):
- API Request/Response 상세 → `document/api/` 참조
- Zod 스키마 코드 → 실제 구현 파일에 있어야 함
- DB 스키마 SQL → `database/schemas/` 참조
- 구현 체크리스트 → `checklist.md`로 분리
- 상세 변경 이력 → Git commit 참조

##### checklist.md 작성 원칙

**체크리스트는 파일의 핵심 역할만 기록** (변경 이력/버그 수정 내역 제외):

```markdown
### Server Actions
- [x] `toggleStrategy.action.ts` — 전략 활성화/비활성화 토글
- [x] `updateStrategy.action.ts` — 전략 수정
- [x] `getAccountBalance.action.ts` — 계좌 잔고 조회 (kt00018)
```

**기록 원칙**:
- ✅ 파일의 **핵심 책임** (거의 변하지 않음)
- ✅ API ID 번호 (키움 API인 경우)
- ❌ 버그 수정 내역 (예: "sellable qty 계산 수정")
- ❌ 개선 사항 (예: "폴링 로그 플래그 적용")
- ❌ 구현 상세 (Git commit + PRD 변경 이력 참조)

**이유**:
- Claude가 요구사항 → 체크리스트 보고 어떤 파일 읽을지 빠르게 판단
- 체크리스트가 계속 깔끔하게 유지됨
- 상세 변경은 Git commit + PRD 변경 이력 참조

##### 범용 인프라 변경 처리

`shared/` 레벨 변경 (logger, auth 등)은:
- ✅ **해당 파일의 JSDoc에 상세 기록** (`@fileoverview`, `@description`, `@example`)
- ✅ 필요하면 `document/infrastructure-changelog.md` 생성
- ❌ 각 기능 PRD 체크리스트에 기록하지 않음 (범용 인프라이므로)

**예시**: Logger에 폴링 로그 제어 기능 추가
- ✅ `shared/lib/logger.ts`의 JSDoc에 상세 사용법 기록
- ❌ Grid Trader 체크리스트에 "Logger 개선" 항목 추가하지 않음

**상세 가이드**: [`document/development.md - 협업 워크플로우`](./document/development.md#협업-워크플로우-claude--gemini)

##### 아키텍처 패턴 및 버그 수정 원칙

**📋 핵심 원칙: "문서는 Source of Truth, 이력은 Git에"**

#### 1. 아키텍처 패턴 문서화

**버그를 통해 발견한 아키텍처 규칙은 문서에 기록** (향후 동일 실수 방지):

**공통 패턴** → `document/development.md` 또는 `document/coding-standards.md`
- Cron Admin 클라이언트 필수 사용
- DB 기반 Mutex (분산 환경 동시성 제어)
- 방어적 프로그래밍 (빈 배열 체크 등)
- 외부 API 데이터 정규화

**기능별 패턴** → `document/prd/{기능명}/prd.md` (기술 스택 섹션 아래)
- Grid Trader: 그리드 이탈 판정, 보유 수량 체크 일관성 등
- 각 기능에 특화된 핵심 로직 패턴

#### 2. 버그 수정 기록 규칙

**Git commit 메시지에 상세 기록** (코드와 함께 버전 관리):

```bash
fix: 무한 리밸런싱 버그 수정

- 원인: 매도 주문 없을 때 Math.max(...[]) → -Infinity 반환
- 해결: 이론적 최대값 계산 로직 추가 (최고 매수가 + gap * (upper_grid_count + 1))
- 영향 파일: features/grid-trader/lib/cron/checkRebalance.ts:56-84
- 패턴: 배열 연산 전 빈 배열 체크 필수 (development.md 참조)
```

**PRD 변경 이력에는 하이레벨 요약만** (1줄):

```markdown
| v1.5.8 | 2026-05-13 | 무한 리밸런싱 버그 수정 (매도 주문 부재 시 이론적 최대값 계산) |
```

#### 3. 작업 프로세스

**버그 수정 시**:
1. ✅ 버그 원인 분석 → 아키텍처 패턴 도출
2. ✅ 패턴을 문서에 추가 (공통이면 development.md, 기능별이면 prd.md)
3. ✅ 코드 수정 + Git commit에 상세 기록
4. ✅ PRD 변경 이력에 1줄 요약 추가
5. ❌ bug-fixes.md 같은 별도 버그 이력 문서 생성하지 않음

**이유**:
- **문서 = 현재 요구사항 + 아키텍처 패턴** (미래에도 유효)
- **Git = 변경 이력** (과거 기록, 필요 시 검색)
- **중복 방지**: 버그 상세를 문서와 Git 양쪽에 기록하면 동기화 문제 발생

##### future-improvements.md 작성 원칙 (선택)

**미완성 기능 및 향후 개선 계획**을 별도 문서로 분리하여 PRD 길이 제한.

**작성 시기**:
- PRD가 너무 길어질 때 (400줄 이상)
- 향후 개선 항목이 많을 때 (5개 이상)

**작성 형식**:
- 우선순위별 섹션 (긴급, 높음, 중간, 낮음)
- 각 항목마다 구현 체크리스트 포함
- PRD에서는 간단한 요약 + 링크만 제공

**상세 가이드**: [`document/development.md - 협업 워크플로우`](./document/development.md#협업-워크플로우-claude--gemini)

### 3. FSD 아키텍처

```
app → pages → widgets → features → entities → shared
```

**핵심 규칙**:
- **의존성 방향**: 상위 → 하위 레이어만 import (역방향 금지)
- **슬라이스 격리**: 같은 레이어 내 슬라이스 간 import 금지
- **Public API**: 모든 슬라이스는 `index.ts`를 통해 export

**표준 세그먼트** (FSD 공식):
| 세그먼트 | 용도 | 예시 |
|:---------|:-----|:-----|
| `ui` | UI 컴포넌트, 스타일 | `Button.tsx`, `Form.tsx` |
| `api` | 백엔드 통신 (Server Actions, API 클라이언트) | `searchStocks.action.ts` |
| `model` | 데이터 모델, 스키마, 비즈니스 로직 | `user.schema.ts`, `user.types.ts` |
| `lib` | 유틸리티, 헬퍼 함수 | `formatDate.ts`, `validators.ts` |
| `config` | 설정, 플래그 | `constants.ts` |

**⚠️ 중요**: Server Actions는 반드시 `api/` 세그먼트에 배치 (FSD 표준)

**레이어 역할**:
| 레이어 | 역할 | 주의사항 |
|:-------|:-----|:---------|
| `entities` | 비즈니스 도메인 (stock, account) | 도메인 API, 타입, 스키마 |
| `shared` | 공통 인프라 (API 클라이언트, UI) | ⚠️ 도메인 로직 금지 |

**상세 가이드**: [`document/architecture.md`](./document/architecture.md)

### 4. Server Component 우선

**기본은 Server Component** (async 가능, 데이터 페칭, SEO 최적화)

**Client Component는 최소한으로**:
- 인터랙션 (onClick, onChange)
- 상태 관리 (useState, useReducer)
- 브라우저 API (window, localStorage)

**상세 가이드**: [`document/coding-standards.md - Server Component`](./document/coding-standards.md#server-component-vs-client-component)

## 필수 규칙

### 키움 API 호출 (필수)

**키움 API는 반드시 서버에서만 호출**:
- ✅ Server Action (`"use server"`) - 다중 API 호출 + 비즈니스 로직
- ✅ Route Handler - 단순 API 프록시
- ❌ 클라이언트에서 fetch로 직접 호출 금지

**이유**: API Key/Secret 보안, 서버 병렬 처리, Rate Limiting 중앙 관리

**상세 가이드**: [`document/api-guide.md - 키움 API 호출 규칙`](./document/api-guide.md#️-키움-api-호출-규칙-필수)

### JSDoc 주석 (필수)

- 모든 함수에 JSDoc 주석 필수
- 모든 인터페이스 프로퍼티에 설명 필수

**상세 가이드**: [`document/coding-standards.md - JSDoc`](./document/coding-standards.md#jsdoc)

### UI 컴포넌트 (필수)

**Shadcn UI를 기본으로 사용**:
- 모든 UI 컴포넌트는 Shadcn UI 기반으로 구현
- 컴포넌트 위치: `src/shared/ui/*.tsx`
- 다크 테마 기본 적용

**설치**:
```bash
npx shadcn@latest add [component-name]
```

**상세 가이드**: [`document/development.md - Shadcn UI`](./document/development.md#shadcn-ui-사용-가이드)

### 파일 네이밍

| 종류          | 규칙                   | 위치 (FSD 세그먼트) | 예시                          |
| :------------ | :--------------------- | :------------------ | :---------------------------- |
| 컴포넌트      | `PascalCase.tsx`       | `ui/`               | `ui/OrderWidget.tsx`          |
| Server Action | `camelCase.action.ts`  | `api/` ⚠️           | `api/placeOrder.action.ts`    |
| API Client    | `camelCase.api.ts`     | `api/`              | `api/fetchUser.api.ts`        |
| Schema        | `camelCase.schema.ts`  | `model/`            | `model/order.schema.ts`       |
| Types         | `camelCase.types.ts`   | `model/`            | `model/order.types.ts`        |
| Utility       | `camelCase.ts`         | `lib/`              | `lib/formatDate.ts`           |

**⚠️ 중요**: Server Actions는 반드시 `api/` 세그먼트에 배치

**전체 네이밍 규칙**: [`document/coding-standards.md - 파일 네이밍`](./document/coding-standards.md#파일-네이밍)

### TypeScript

- **interface 우선** (type은 유니온/인터섹션에만)
- **any 금지** (불가피한 경우 unknown)
- **명시적 type import**: `import type { User } from "./user.types";`

**상세 가이드**: [`document/coding-standards.md - TypeScript`](./document/coding-standards.md#typescript)

### 패키지 매니저

**pnpm만 사용** (npm, yarn 금지)

### 데이터베이스 (필수)

**Supabase 셀프 호스팅 환경 규칙**:

#### 1. Prefix 규칙 (필수)

**⚠️ 모든 DB 객체에 `sh_` prefix 필수** (Sanghanga Project):
- ✅ 테이블명: `sh_grid_strategies`, `sh_grid_orders`
- ✅ 함수명: `sh_update_updated_at()`
- ✅ 트리거명: `sh_set_updated_at`
- ✅ ENUM 타입: `sh_order_type`, `sh_order_status`
- ✅ 인덱스명: `idx_sh_grid_orders_strategy_id`
- ❌ 컬럼명: prefix 불필요

**이유**: Supabase 셀프 호스팅은 단일 DB에서 여러 프로젝트 공유

#### 2. 스키마 파일 구성 (3종 세트)

모든 기능의 DB 스키마는 **3개 파일로 구성**:

| 파일 | 용도 | 실행 환경 |
|:-----|:-----|:----------|
| `01-schema.sql` | 전체 스키마 (새 환경용) | 신규 환경 |
| `02-migration.sql` | 마이그레이션 (기존 프로젝트용) | 운영 환경 |
| `03-reset.sql` | 리셋 (전체 삭제) | 개발/테스트만 |

**위치**: `database/schemas/{기능명}/`

**⚠️ 중요**: 스키마 변경 시 **3개 파일 모두 동기화 필수**

#### 3. 한글 주석 필수

Supabase UI에서 컬럼 정보 표시용:

```sql
COMMENT ON TABLE sh_grid_strategies IS '그리드 트레이딩 전략';
COMMENT ON COLUMN sh_grid_strategies.stock_code IS '종목코드 (6자리)';
```

#### 4. 타입 접근 규칙 (필수)

`database.types.ts`는 자동 생성 파일입니다. **직접 import 금지**, 반드시 entities 레이어를 통해서만 사용:

```
shared/lib/supabase/database.types.ts   ← 자동 생성 (직접 import 금지)
         ↓ entities에서만 참조
entities/{도메인}/model/*.types.ts       ← Tables<>, Enums<>로 도메인 타입 정의
         ↓
features / widgets / pages
```

```typescript
// ✅ 올바른 사용
import type { GridStrategy } from "@/entities/grid-trader";

// ❌ 금지 — database.types.ts 직접 import
import type { Database } from "@/shared/lib/supabase/database.types";
import type { Tables } from "@/shared/lib/supabase/database.types";
```

entity 타입 파일 작성 방법:
```typescript
// entities/{도메인}/model/{도메인}.types.ts
import type { Tables, Enums } from "@/shared/lib/supabase/database.types";

export type GridStrategy = Tables<"sh_grid_strategies">;
export type OrderType = Enums<"sh_order_type">;
```

#### 5. 클라이언트 사용

```typescript
import { createServerClient } from '@/shared/lib/supabase/server';

const supabase = await createServerClient();
// ⚠️ 테이블명에 sh_ prefix 필수
const { data } = await supabase.from('sh_grid_strategies').select('*');
```

#### 6. 타입 재생성

스키마 변경 시:
```bash
pnpm db:types   # SaaS Supabase에서 타입 재생성 → database.types.ts 덮어쓰기
```

**상세 가이드**: [`database/README.md`](./database/README.md)

## Next.js 패턴

### Form 검증

- **라이브러리**: Zod + React Hook Form
- **위치**: `model/*.schema.ts` (스키마), `ui/*Form.tsx` (폼 컴포넌트)
- **검증**: zodResolver 사용
- **⚠️ 중요**: Zod 스키마에서 `.default()` 사용 금지 (타입에 undefined 포함되어 resolver 에러 발생)
  - 기본값은 `useForm`의 `defaultValues`에서만 설정

**상세 가이드**: [`document/development.md - Form 검증`](./document/development.md#form-검증-zod--react-hook-form)

### Server Actions

- **위치**: `api/*.action.ts` (FSD 표준)
- **지시어**: `"use server"`
- **용도**: Form 처리, 다중 API 호출, 비즈니스 로직

**상세 가이드**:
- [`document/api-guide.md - Server Action 패턴`](./document/api-guide.md#️-키움-api-호출-규칙-필수)
- [`document/coding-standards.md - Server Actions`](./document/coding-standards.md#server-actions)

### Route Handler

- **위치**: `app/api/*/route.ts`
- **용도**: RESTful API, Webhook, 단순 프록시

**상세 가이드**: [`document/coding-standards.md - Route Handler`](./document/coding-standards.md#route-handler)

## 작업 프로세스

### 새 기능 추가

1. **PRD 작성** → `document/prd/{기능명}/prd.md` + `checklist.md`
   - prd.md: 지속적인 요구사항 (비즈니스 룰, 제약 조건, 계산 공식 등)
   - checklist.md: 파일명 + 핵심 역할 (버그 수정/개선 이력 제외)
2. **문서 참조** → architecture.md, coding-standards.md, development.md
3. **FSD 레이어 판단** → widgets/features/entities
4. **구현** → Server Component 우선, JSDoc 필수
   - 파일 생성 시 체크리스트에 추가 (핵심 역할만)
   - 새로운 요구사항 발견 시 PRD에 즉시 추가
5. **테스트 명세 작성** → test-spec-unit.md, test-spec-integration.md
6. **문서 업데이트**
   - PRD 변경 이력 추가 (버전별 하이레벨 요약 1줄)
   - 범용 인프라 변경 시 해당 파일 JSDoc에 상세 기록
   - `document/index.md` 상태 변경
7. **품질 검사** → lint, test, build

### 버그 수정

1. **원인 분석** → 코드 읽기, 로그 확인, 근본 원인 파악
2. **아키텍처 패턴 도출** → 버그 원인이 공통 패턴이면 문서에 기록
   - 공통 패턴 → `development.md` 또는 `coding-standards.md`
   - 기능별 패턴 → `prd.md` (구현 패턴 섹션)
3. **코드 수정** → 최소한의 변경으로 수정
4. **테스트 작성** → 버그 재현 테스트
5. **문서 업데이트**:
   - **Git commit 메시지에 상세 기록** (원인, 해결, 영향 파일, 참조 패턴)
   - PRD 변경 이력에 하이레벨 요약 추가 (1줄)
   - 체크리스트는 수정하지 않음 (핵심 역할은 변하지 않음)

### 리팩토링

1. 기존 기능 완전 파악
2. 규칙 준수하며 리팩토링
3. 회귀 테스트
4. **문서 업데이트**:
   - 파일명 변경 시 체크리스트 업데이트
   - 요구사항 변경 없으면 PRD 수정 불필요
   - Git commit에 리팩토링 이유/내용 기록

## 체크리스트

### 작업 전
- [ ] PRD 읽음/작성
- [ ] 문서 참조 (architecture.md, coding-standards.md, development.md)
- [ ] FSD 레이어 판단
- [ ] Server Component vs Client Component 판단

### 작업 중
- [ ] JSDoc 주석 (함수, 인터페이스)
- [ ] FSD import 규칙 준수 (상위 → 하위만)
- [ ] any 타입 금지
- [ ] Server Component 우선
- [ ] Shadcn UI 사용
- [ ] 키움 API는 서버에서만 호출
- [ ] **DB 객체에 sh_ prefix 필수** (테이블, 함수, 트리거, ENUM, 인덱스)
- [ ] **DB 스키마 변경 시 3종 파일 모두 업데이트** (schema, migration, reset)
- [ ] **체크리스트 업데이트** (파일명 + 핵심 역할만, 버그 수정/개선 이력 제외)
- [ ] **새로운 요구사항 발견 시 PRD에 즉시 추가**
- [ ] **범용 인프라 변경 시 해당 파일 JSDoc에 상세 기록** (shared/ 레벨)

### 작업 후
- [ ] `pnpm lint` 통과
- [ ] `pnpm test` 통과
- [ ] `pnpm build` 성공
- [ ] 테스트 명세 작성 (test-spec-unit.md, test-spec-integration.md)
- [ ] **버그 수정 시 아키텍처 패턴 문서화** (공통 패턴 → development.md, 기능별 → prd.md)
- [ ] **Git commit 메시지에 상세 기록** (원인, 해결, 영향 파일, 참조 패턴)
- [ ] PRD 변경 이력 업데이트 (버전별 하이레벨 요약 1줄)
- [ ] `document/index.md` 상태 업데이트 (✅ 완료)

## 참조 문서

| 문서            | 경로                           | 내용 |
| :-------------- | :----------------------------- | :--- |
| **아키텍처**    | `document/architecture.md`     | FSD 아키텍처 상세 |
| **코딩 규칙**   | `document/coding-standards.md` | JSDoc, TypeScript, 네이밍, 예제 |
| **개발 가이드** | `document/development.md`      | Next.js 패턴, Form, Server Actions |
| **API 가이드**  | `document/api-guide.md`        | 키움 API 호출 규칙, 패턴 |
| **API 명세**    | `document/api/README.md`       | 키움 API 상세 명세 |
| **DB 가이드**   | `database/README.md`           | **DB 스키마 규칙 (sh_ prefix, 3종 파일)** |
| **문서 목록**   | `document/index.md`            | 전체 문서 인덱스 |

## 외부 자료

- [Next.js](https://nextjs.org/docs) - App Router
- [FSD](https://feature-sliced.design/) - 아키텍처
- [Supabase](https://supabase.com/docs) - 데이터베이스
- [Shadcn UI](https://ui.shadcn.com/) - UI 컴포넌트
- [React Hook Form](https://react-hook-form.com/) - 폼 관리
- [Zod](https://zod.dev/) - 스키마 검증
- [키움 API](https://apiportal.kiwoom.com/)
