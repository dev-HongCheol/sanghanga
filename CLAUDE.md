# Claude Code 프로젝트 지침서

> 이 문서는 Claude Code가 이 프로젝트에서 작업할 때 따라야 할 **핵심 원칙과 규칙**을 정의합니다.
> 상세한 예제와 가이드는 각 전문 문서를 참조하세요.

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
- `document/api-guide.md` - 키움 API 호출 규칙
- `document/api/` - **키움 API 상세 명세** (Request/Response 스키마, 예제)
- 해당 기능의 PRD (`document/prd/{기능명}/prd.md`)

### 2. PRD 기반 개발

**모든 기능은 PRD 작성부터 시작**:
1. PRD 작성 (`document/prd/{기능명}/prd.md`)
2. `document/index.md`에 등록 (상태: 📝 작성중)
3. 구현하면서 **PRD 체크리스트 실시간 업데이트** (`- [ ]` → `- [x]`)
4. **구현 완료 후 반드시 테스트 명세 작성** (`test-spec-unit.md`, `test-spec-integration.md`)
5. 사용자가 Gemini에게 테스트 명세 전달
6. 테스트 완료 시 `document/index.md` 상태 변경 (📝 → 🚧 → ✅)

**필수 규칙**:
- PRD 없는 구현 금지
- **테스트 명세 없는 완료 금지**
- **테스트 명세는 간결하게**: 요구사항 + 테스트 케이스 목록 + 핵심 패턴만
- **기존 코드 변경 시**: 영향받는 기존 테스트 명세에 deprecated 표시

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

1. **PRD 작성** → `document/prd/{기능명}/prd.md`
2. **문서 참조** → architecture.md, coding-standards.md, development.md
3. **FSD 레이어 판단** → widgets/features/entities
4. **구현** → Server Component 우선, JSDoc 필수, PRD 체크리스트 실시간 업데이트
5. **테스트 명세 작성** → test-spec-unit.md, test-spec-integration.md
6. **문서 업데이트** → PRD 체크 완료, `document/index.md` 상태 변경
7. **품질 검사** → lint, test, build

### 버그 수정

1. 원인 분석 → 코드 읽기, 로그 확인
2. 최소한의 변경으로 수정
3. 버그 재현 테스트 작성

### 리팩토링

1. 기존 기능 완전 파악
2. 규칙 준수하며 리팩토링
3. 회귀 테스트

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
- [ ] **PRD 체크리스트 실시간 업데이트**

### 작업 후
- [ ] `pnpm lint` 통과
- [ ] `pnpm test` 통과
- [ ] `pnpm build` 성공
- [ ] 테스트 명세 작성 (test-spec-unit.md, test-spec-integration.md)
- [ ] PRD 체크리스트 모두 완료
- [ ] `document/index.md` 상태 업데이트 (✅ 완료)

## 참조 문서

| 문서            | 경로                           | 내용 |
| :-------------- | :----------------------------- | :--- |
| **아키텍처**    | `document/architecture.md`     | FSD 아키텍처 상세 |
| **코딩 규칙**   | `document/coding-standards.md` | JSDoc, TypeScript, 네이밍, 예제 |
| **개발 가이드** | `document/development.md`      | Next.js 패턴, Form, Server Actions |
| **API 가이드**  | `document/api-guide.md`        | 키움 API 호출 규칙, 패턴 |
| **API 명세**    | `document/api/README.md`       | 키움 API 상세 명세 |
| **문서 목록**   | `document/index.md`            | 전체 문서 인덱스 |

## 외부 자료

- [Next.js](https://nextjs.org/docs) - App Router
- [FSD](https://feature-sliced.design/) - 아키텍처
- [Shadcn UI](https://ui.shadcn.com/) - UI 컴포넌트
- [React Hook Form](https://react-hook-form.com/) - 폼 관리
- [Zod](https://zod.dev/) - 스키마 검증
- [키움 API](https://apiportal.kiwoom.com/)
