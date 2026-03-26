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

## 🚀 개발 및 협업 워크플로우

본 프로젝트는 Claude(구현/명세)와 Gemini(테스트/검증)의 전문성을 결합하여 운영됩니다.

### 1. 기본 협업 루프
- **구현 및 명세 (Claude)**:
  1. 요구사항에 따른 기능 구현 (`src/` 수정)
  2. 테스트 명세서 작성 (`test-spec-unit.md`, `test-spec-integration.md`)
  3. 기능 변경 시 기존 명세를 `Deprecated` 처리하고 현행화
- **테스트 및 검증 (Gemini)**:
  1. 명세를 기반으로 테스트 코드 작성 (`tests/` 수정)
  2. 전체 테스트 실행 및 결과 보고

### 2. 트러블슈팅 및 피드백 루프 (중요)
테스트 실패 시 Gemini는 절대 운영 코드를 직접 수정하지 않으며, 다음 프로토콜을 따릅니다.

1. **실패 원인 분석**: Gemini는 테스트 실패 시 정확한 원인을 진단하여 보고합니다.
   - **운영 코드 문제**: 로직 오류나 에지 케이스 처리 누락 시
   - **명세 문제**: 구현된 코드와 테스트 명세가 불일치하거나 명세가 구형인 경우
   - **테스트 코드 문제**: 모킹 오류나 테스트 로직 자체의 문제인 경우
2. **방향 제시**: 사용자가 판단하기 쉽도록 다음과 같은 형식으로 보고합니다.
   - **[🚨 테스트 실패 보고]** 섹션 제공
   - **원인 분석**: 코드/명세/테스트 중 범인 지목
   - **수정 가이드**: 해당 담당자(Claude 또는 Gemini)에게 전달할 구체적인 요청 사항
   - **확인 명령어**: 사용자가 직접 검증해볼 수 있는 쉘 명령어 제공

### 3. Gemini의 행동 제약
- **운영 코드 수정 금지**: 어떠한 경우에도 `src/` 하위 코드를 직접 수정하지 않습니다.
- **보고 우선**: 발견된 모든 버그나 불일치는 먼저 사용자에게 보고하고 지침을 기다립니다.

## 🧪 테스트 및 교육용 주석 규칙 (중요 업데이트)
1. **테스트 전담 및 격리**: Gemini는 Claude가 작성한 `test-spec.md`와 프로젝트의 [테스트 표준 가이드](document/testing-standards.md)에 따라 테스트 코드를 작성한다. **테스트 구현 시 오직 `tests/` 폴더 하위 파일만 수정 가능하며, 어떠한 경우에도 `src/` 하위의 운영 코드를 직접 수정해서는 안 된다.** 운영 코드에 문제가 발견되면 사용자에게 보고하고 수정을 제안한다.
2. **버전 기반 구현**: 테스트 코드 작성 전 반드시 `package.json`을 참조하여 라이브러리(Zod, Vitest 등)의 버전을 확인하고, 해당 버전에 최적화된 코드를 작성한다.
3. **교육용 주석 (Educational Commenting)**: 사용자의 학습을 위해 라이브러리 개념과 함수 역할을 상세히 주석으로 남긴다.
4. **결과 기록**: 테스트 결과를 `test-spec.md`에 수동으로 기록하고 체크박스를 업데이트한다.

## ⚠️ 주의 사항
- **Windows PowerShell**: 명령어 연결 시 `;`를 사용하고, 파일 삭제 시 `Remove-Item`을 사용한다.
- **Import 경로**: `@/` 별칭을 사용하여 레이어 간 참조를 명확히 한다.
- **Side Effects**: 복잡한 로직(5줄 이상)에는 반드시 동작 방식에 대한 설명 주석을 추가한다.
