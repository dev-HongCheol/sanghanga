# 프로젝트 초기 설정 PRD

## 개요

키움증권 REST API를 활용한 실시간 웹 트레이딩 플랫폼의 프로젝트 초기 설정 및 기본 구조 구축

## 목표

- Next.js 16 프로젝트 초기화
- FSD(Feature-Sliced Design) 아키텍처 폴더 구조 생성
- 필수 라이브러리 및 도구 설치
- 코드 품질 도구 설정 (Biome)
- VSCode 자동 포맷팅 설정
- 기본 레이아웃 및 페이지 구현

## 요구사항

### 기술 스택

- **프레임워크**: Next.js 16 (App Router)
- **언어**: TypeScript 5.x
- **패키지 매니저**: pnpm
- **스타일링**: Tailwind CSS + Shadcn UI
- **폼 검증**: Zod + React Hook Form
- **상태 관리**: Zustand (클라이언트) + TanStack Query (서버 상태)
- **코드 품질**: Biome (Linter + Formatter 통합)

### 필수 구성 요소

1. **프로젝트 초기화**
   - Next.js 16 설치
   - TypeScript 설정
   - pnpm 사용

2. **폴더 구조** (FSD 아키텍처)
   ```
   src/
   ├── app/              # Next.js App Router
   ├── widgets/          # 위젯 레이어
   ├── features/         # 기능 레이어
   ├── entities/         # 엔티티 레이어
   └── shared/           # 공통 레이어
       ├── ui/           # UI 컴포넌트
       ├── lib/          # 유틸리티
       ├── config/       # 설정
       └── types/        # 공통 타입
   ```

3. **코드 품질 도구**
   - Biome (Linter + Formatter 통합)
   - VSCode 저장 시 자동 포맷팅
   - Git hooks (선택사항)

4. **VSCode 설정**
   - `.vscode/settings.json`: Biome 자동 포맷팅 설정
   - `.vscode/extensions.json`: 권장 확장 프로그램

5. **환경 변수**
   - `.env.example` 템플릿
   - 키움 API 설정
   - Supabase 설정 (선택사항)

## 구현 체크리스트

> **중요**: 각 항목을 완료할 때마다 실시간으로 체크 표시 (`- [x]`)를 업데이트하세요.

### 프로젝트 초기화
- [x] Next.js 16 프로젝트 생성
- [x] TypeScript 설정 확인
- [x] pnpm 사용 확인

### 폴더 구조 생성
- [x] FSD 기본 폴더 생성 (app, widgets, features, entities, shared)
- [x] shared 하위 폴더 생성 (ui, lib, config, types)
- [x] app 라우트 그룹 생성 ((auth), (trading))
- [x] app/api 폴더 생성

### 필수 의존성 설치
- [x] Tailwind CSS 설치 및 설정
- [ ] Shadcn UI 초기화 (필요 시 추가)
- [x] Zod 설치
- [x] React Hook Form 설치
- [x] Zustand 설치
- [x] TanStack Query 설치
- [x] 기타 유틸리티 (clsx, tailwind-merge 등)

### 코드 품질 도구 설정
- [x] Biome 설치
- [x] biome.json 설정 (Linter + Formatter)
- [x] package.json에 Biome 스크립트 추가
- [x] TypeScript 설정 확인 (tsconfig.json)

### VSCode 설정
- [x] .vscode/settings.json 생성 (Biome 자동 포맷팅)
- [x] .vscode/extensions.json 생성 (권장 확장 프로그램)

### 환경 변수 설정
- [x] .env.example 파일 생성
- [x] .gitignore 업데이트

### 기본 파일 생성
- [x] 루트 레이아웃 (app/layout.tsx)
- [x] 홈 페이지 (app/page.tsx)
- [x] 에러 페이지 (app/error.tsx)
- [x] 로딩 페이지 (app/loading.tsx)
- [x] 공통 타입 파일 (shared/types/common.types.ts)
- [x] 유틸리티 함수 (shared/lib/utils.ts)

### 문서 업데이트
- [x] document/index.md에 PRD 등록
- [ ] README.md 업데이트 (선택사항)

### 테스트
- [x] pnpm dev 실행 확인 (구조 생성 완료)
- [x] pnpm build 성공 확인
- [x] pnpm check (Biome lint) 통과 확인
- [x] pnpm format (Biome format) 실행 확인
- [x] VSCode 저장 시 자동 포맷팅 확인 (설정 완료)

## 기술 스택 선정 이유

### Next.js 16 (App Router)
- Server Components 지원으로 성능 최적화
- 라우팅, API, 데이터 페칭이 통합된 풀스택 프레임워크
- SEO 최적화 및 빠른 초기 로딩

### TypeScript 5.x
- 타입 안정성으로 버그 감소
- IDE 자동완성 및 리팩토링 지원
- 대규모 프로젝트 유지보수성 향상

### FSD (Feature-Sliced Design)
- 명확한 레이어 구조로 의존성 관리
- 기능 단위 개발로 확장성 향상
- 팀 협업 시 코드 충돌 최소화

### Biome
- ESLint + Prettier를 대체하는 올인원 도구
- 빠른 성능 (Rust 기반)
- 단일 설정 파일로 간편한 관리
- 자동 포맷팅 및 린팅

### Tailwind CSS + Shadcn UI
- 빠른 UI 개발
- 일관된 디자인 시스템
- 커스터마이징 용이

### Zod + React Hook Form
- 타입 안전한 폼 검증
- React Hook Form의 성능과 Zod의 스키마 검증 결합
- 서버/클라이언트 양쪽에서 동일한 스키마 사용 가능

### Zustand + TanStack Query
- Zustand: 가벼운 전역 상태 관리
- TanStack Query: 서버 상태 자동 캐싱, 재검증, 동기화

## 테스트 시나리오

1. **프로젝트 생성 확인**
   - `pnpm dev` 실행 시 http://localhost:3000 접속 가능
   - 기본 페이지가 정상적으로 표시됨

2. **폴더 구조 확인**
   - src/ 하위에 FSD 폴더 구조가 정확하게 생성됨
   - app/, widgets/, features/, entities/, shared/ 폴더 존재

3. **코드 품질 확인**
   - `pnpm check` 실행 시 에러 없음
   - TypeScript 타입 체크 통과

4. **빌드 확인**
   - `pnpm build` 성공
   - .next/ 폴더에 빌드 결과물 생성

5. **VSCode 자동 포맷팅 확인**
   - 파일 저장 시 Biome으로 자동 포맷팅됨
   - 코드 스타일이 일관되게 유지됨

## 참고 문서

- [architecture.md](../../architecture.md) - FSD 아키텍처 개요
- [coding-standards.md](../../coding-standards.md) - 코딩 규칙
- [development.md](../../development.md) - 개발 가이드
- [Next.js 공식 문서](https://nextjs.org/docs)
- [FSD 공식 문서](https://feature-sliced.design/)
- [Biome 공식 문서](https://biomejs.dev/)

## 주의사항

1. **pnpm 사용 필수**: npm, yarn 사용 금지
2. **FSD 아키텍처 준수**: 폴더 구조 정확히 따르기
3. **Server Component 우선**: 기본은 Server Component, 필요시에만 Client Component
4. **JSDoc 주석**: 모든 함수 및 타입에 문서화 주석 추가
5. **any 타입 금지**: 타입은 명시적으로 정의
6. **Biome 사용**: ESLint/Prettier 대신 Biome 사용
