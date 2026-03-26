# 📈 Stock Trading Platform

키움증권 REST API를 활용한 고성능 실시간 웹 트레이딩 플랫폼입니다. FSD(Feature-Sliced Design) 아키텍처와 AI 기반 개발 프로세스를 준수합니다.

## 🎯 핵심 아키텍처 및 철학

- **FSD (Feature-Sliced Design)**: 레이어 간 결합도를 낮추고 유지보수성을 확보한 설계 규칙을 준수합니다.
- **Server-First Strategy**: Next.js App Router의 서버 컴포넌트를 우선 활용하여 클라이언트 상태를 최소화합니다.
- **Type-Safe Foundation**: Zod와 TypeScript를 결합하여 런타임과 컴파일 타임의 타입 안전성을 확보합니다.
- **AI-Driven Quality**: 설계, 구현, 테스트 과정을 Claude(구현)와 Gemini(테스트)로 분리하여 품질을 관리합니다.

## 🛠 기술 스택 요약

상세 의존성은 `package.json`을 참조하십시오.

- **Framework**: Next.js (App Router)
- **State**: Zustand (Client), TanStack Query (Server)
- **Validation**: Zod, React Hook Form
- **Styling**: Tailwind CSS, Shadcn UI
- **Quality**: Vitest (Testing), Biome (Lint/Format)

## 🚀 AI 기반 개발 및 검증 프로세스

본 프로젝트는 설계부터 검증까지 체계적인 AI 협업 사이클을 통해 진행됩니다.

### 1. 설계 및 명세 (Claude)
- `document/prd/` 하위에 요구사항 정의(`prd.md`) 및 테스트 명세(`test-spec.md`)를 작성합니다.
- 기술적 타당성 검토와 인터페이스 및 데이터 모델을 설계합니다.

### 2. 코드 구현 (Claude)
- 설계 명세를 바탕으로 `src/` 하위 FSD 레이어별 코드를 구현합니다.
- JSDoc 문서화와 코딩 표준을 준수합니다.

### 3. 테스트 및 품질 검증 (Gemini)
- **테스트 구현**: 구현된 코드를 바탕으로 `tests/` 하위 단위/통합 테스트를 작성합니다.
- **실시간 추적**: 작업 중 `test-spec.md` 체크리스트를 실시간 업데이트하여 진행 상황을 공유합니다.
- **최종 검증**: Biome 정적 분석, 타입 체크, 전체 테스트 통과 여부를 확인하고 결과를 기록합니다.

### 4. 완료 및 문서화
- `document/index.md`에서 기능 상태를 업데이트하고 최종 리포트를 작성합니다.

## 📚 주요 문서 맵

- [**개발 가이드 (Development)**](./document/development.md): 프로젝트 설정 및 실행, FSD 구조 상세 설명
- [**테스트 표준 (Testing)**](./document/testing-standards.md): Gemini의 테스트 작성 규칙 및 결과 기록 양식
- [**코딩 표준 (Coding Standards)**](./document/coding-standards.md): 네이밍 규칙 및 레이어별 코드 작성 가이드
- [**프로젝트 지시서 (GEMINI.md)**](./GEMINI.md): Gemini 전용 핵심 수칙 및 AI 협업 원칙
- [**키움 API 가이드 (API Guide)**](./document/api-guide.md): 외부 API 연동 및 Rate Limiting 전략

## 📝 라이선스 및 참고

- **License**: MIT License
- **Reference**: [Next.js Docs](https://nextjs.org/docs), [FSD Official](https://feature-sliced.design/)
