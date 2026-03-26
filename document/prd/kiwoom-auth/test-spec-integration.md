# 키움 API 인증 및 토큰 관리 - 통합 테스트 명세

## 문서 정보
- **현재 버전**: v1.0
- **최종 수정일**: 2026-03-25
- **PRD 버전**: v1.0 ([prd.md](./prd.md) 참조)
- **테스트 담당**: Gemini
- **구현 담당**: Claude

## 변경 이력
| 버전 | 날짜 | 변경 내용 | 영향받는 테스트 | 담당 |
|------|------|-----------|-----------------|------|
| v1.2 | 2026-03-26 | FSD 구조 리팩토링 반영 (Route Handler 경로 수정) | TC-INT-001, 002 | Gemini |
| v1.1 | 2026-03-26 | return_code 체크 로직 추가 | - | Claude |
| v1.0 | 2026-03-25 | 초기 작성 | - | Claude |

## 개요

키움 API 인증 및 토큰 관리 기능의 **통합 테스트** 명세입니다. Route Handler (API 엔드포인트)가 라이브러리와 올바르게 연동되는지 검증합니다.

**중요**: Route Handler 함수를 직접 호출하여 테스트하며, 실제 키움 API는 호출하지 않습니다.

## 테스트 환경

- **테스트 프레임워크**: Vitest
- **Mocking**: vi.mock() - 라이브러리 모킹
- **Node 환경**: Node.js 20+

### 테스트 폴더 구조
```
tests/integration/app/api/kiwoom/auth/
├── status.test.ts
└── refresh.test.ts
```

## 테스트 범위

- [x] TC-INT-001: Route Handler - 토큰 상태 확인 (GET /api/kiwoom/auth/status)
- [x] TC-INT-002: Route Handler - 토큰 재발급 (POST /api/kiwoom/auth/refresh)

---

## 테스트 케이스 상세

### TC-INT-001: Route Handler - 토큰 상태 확인
**상태**: 🆕 신규
**우선순위**: 높음

**요구사항**:
- GET /api/kiwoom/auth/status 엔드포인트 동작 확인
- getTokenStatus() 함수와 올바르게 연동
- 에러 발생 시 500 상태 코드 반환

**테스트 케이스**:
1. 토큰 없음 → { isValid: false } 반환
2. 유효한 토큰 → { isValid: true, expiresAt: "..." } 반환
3. getTokenStatus 에러 → 500 + 에러 메시지

**Mock**:
- `@/shared/lib/kiwoom` 모듈의 `getTokenStatus` 함수

**핵심 패턴**:
```typescript
vi.mock("@/shared/lib/kiwoom", () => ({
  getTokenStatus: vi.fn()
}));
const { getTokenStatus } = await import("@/shared/lib/kiwoom");
vi.mocked(getTokenStatus).mockReturnValue({ ... });
```

---

### TC-INT-002: Route Handler - 토큰 재발급
**상태**: 🆕 신규
**우선순위**: 중간

**요구사항**:
- POST /api/kiwoom/auth/refresh 엔드포인트 동작 확인
- getAccessToken(true) 호출 확인 (forceRefresh=true)
- 에러 발생 시 500 상태 코드 반환

**테스트 케이스**:
1. 성공 → { success: true, message: "..." } 반환
2. getAccessToken(true) 호출 확인
3. 에러 발생 → { success: false, error: "..." } + 500

**Mock**:
- `@/shared/lib/kiwoom` 모듈의 `getAccessToken` 함수

**핵심 패턴**:
```typescript
vi.mocked(getAccessToken).mockResolvedValue("token");
vi.mocked(getAccessToken).mockRejectedValue(new Error("..."));
```

---

## Gemini 작업 가이드

### 📋 작업 순서

1. TC-INT-001 작성 (status.test.ts)
2. TC-INT-002 작성 (refresh.test.ts)
3. testing-standards.md 참고하여 교육용 주석 추가

### ✅ 완료 기준

- [x] 모든 통합 테스트 작성 완료 (2개)
- [x] `pnpm test integration/app/api/kiwoom` 통과
- [x] 체크박스 모두 `[x]`

### 🔍 주의사항

- **Route Handler 직접 호출**: `app/api/kiwoom/auth/...` 경로에서 GET(), POST() 함수 import (루트 `app/` 별칭 사용)
- **라이브러리 모킹**: 실제 키움 API 호출 방지
- **응답 검증**: NextResponse.status와 json() 확인

---

## 테스트 실행 결과

### 실행 정보
- **최초 작성**: 2026-03-25 - Gemini (Senior Fullstack Developer)
- **경로 수정**: 2026-03-26 - Claude (AI Assistant) - FSD 구조 리팩토링 반영
- **도구**: Vitest v4.1.1

### 최종 결과 (2026-03-26 경로 수정 후)
```
 Test Files  2 passed (2)
      Tests  5 passed (5)
   Start at  18:23:42
   Duration  1.06s (transform 44ms, setup 131ms, import 233ms, tests 16ms, environment 1.17s)
```

**수정 내역**:
- ✅ Route Handler import 경로 수정: `@/app/api/...` → `app/api/...`
  - Next.js App Router가 루트 `app/` 디렉토리로 이동 (FSD 구조 개선)
  - vitest.config.ts에 `app` alias 추가
- ✅ 모든 테스트 정상 통과 (로직 변경 없음)

### 이전 실행 결과 (2026-03-25 최초 작성)
```
 Test Files  2 passed (2)
      Tests  5 passed (5)
   Start at  14:30:02
   Duration  963ms (transform 74ms, setup 152ms, import 126ms, tests 13ms, environment 1.34s)
```

### 커버리지 리포트
*(통합 테스트는 단위 테스트와 함께 커버리지 측정 가능)*
