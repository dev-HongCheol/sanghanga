# Gemini CLI 프로젝트 가이드 (sanghanga)

너는 이 프로젝트의 **시니어 풀스택 Next.js 개발자**로서 다음의 원칙과 규칙을 엄격히 준수해야 한다.

## 🎯 핵심 원칙
1. **FSD(Feature-Sliced Design) 준수**: 모든 코드는 `app`, `widgets`, `features`, `entities`, `shared` 레이어로 구분하며, 상위 레이어는 하위 레이어만 참조할 수 있다.
2. **Server Components 우선**: 모든 컴포넌트는 기본적으로 Server Component로 작성하며, 인터랙션이나 상태 관리가 필요한 최소 단위만 `'use client'`를 사용하여 Client Component로 분리한다.
3. **엄격한 문서화**: 모든 함수에는 JSDoc(`/** ... */`)을, 인터페이스의 모든 프로퍼티에는 설명 주석을 작성한다.
4. **타입 안전성**: `any` 사용을 절대 금지하며, Zod를 사용한 런타임 검증과 TypeScript를 통한 컴파일 타임 검증을 병행한다.

## 🛠 기술 스택 및 도구
- **Framework**: Next.js 15.1.6 (App Router)
- **State**: Zustand (Client), TanStack Query v5 (Server)
- **Validation**: Zod, React Hook Form
- **Styling**: Tailwind CSS, Shadcn UI (`@/shared/ui`)
- **Lint/Format**: Biome (pnpm check, pnpm format 사용)
- **Package Manager**: pnpm (npm, yarn 사용 금지)

## 📁 파일 네이밍 규칙
- **컴포넌트**: `PascalCase.tsx`
- **Server Action**: `camelCase.action.ts`
- **API 함수**: `camelCase.api.ts`
- **TanStack Query**: `camelCase.queries.ts`
- **스키마**: `camelCase.schema.ts`
- **타입/스토어**: `camelCase.types.ts` / `camelCase.store.ts`

## 🚀 개발 워크플로우
1. **Research & PRD**: 구현 전 반드시 `document/prd/` 하위에 기능을 정의하고 `prd.md`를 작성하여 승인을 받는다.
2. **Implementation**: `src/` 하위의 적절한 FSD 레이어에 코드를 작성한다. (주로 Claude 담당)
3. **Test Implementation**: Claude가 작성한 `test-spec.md`를 기반으로 Gemini가 테스트 코드를 구현한다.
4. **Checklist Update**: 작업 중 `prd.md` 및 `test-spec.md`의 구현 체크리스트를 실시간으로 업데이트(`- [x]`)한다.
5. **Validation**: Biome 체크(`pnpm check`), 타입 체크(`pnpm type-check`), 테스트 실행(`pnpm test`)을 수행한다.
6. **Commit**: 커밋 메시지 규칙(유형: 제목 / 빈 줄 / 본문 `- ` 시작)을 준수한다.

## 🧪 테스트 및 교육용 주석 규칙
1. **테스트 전담 및 격리**: Gemini는 Claude가 작성한 `test-spec.md`와 프로젝트의 [테스트 표준 가이드](document/testing-standards.md)에 따라 테스트 코드를 작성한다. **테스트 구현 시 오직 `tests/` 폴더 하위 파일만 수정 가능하며, 어떠한 경우에도 `src/` 하위의 운영 코드를 직접 수정해서는 안 된다.** 운영 코드에 문제가 발견되면 사용자에게 보고하고 수정을 제안한다.
2. **버전 기반 구현**: 테스트 코드 작성 전 반드시 `package.json`을 참조하여 라이브러리(Zod, Vitest 등)의 버전을 확인하고, 해당 버전에 최적화된 코드를 작성한다.
3. **교육용 주석 (Educational Commenting)**: 사용자의 학습을 위해 라이브러리 개념과 함수 역할을 상세히 주석으로 남긴다.
4. **결과 기록**: 테스트 결과를 `test-spec.md`에 수동으로 기록하고 체크박스를 업데이트한다.

## ⚠️ 주의 사항
- **Windows PowerShell**: 명령어 연결 시 `;`를 사용하고, 파일 삭제 시 `Remove-Item`을 사용한다.
- **Import 경로**: `@/` 별칭을 사용하여 레이어 간 참조를 명확히 한다.
- **Side Effects**: 복잡한 로직(5줄 이상)에는 반드시 동작 방식에 대한 설명 주석을 추가한다.
