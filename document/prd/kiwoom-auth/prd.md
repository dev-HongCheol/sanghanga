# 키움 API 인증 및 토큰 관리 PRD

## 개요

키움증권 REST API를 사용하기 위한 OAuth 2.0 인증 시스템 구축 및 Access Token 관리 기능 구현

> **📋 API 명세 참조**: 구현 시 [`document/api/OAuth 인증/`](../../api/README.md) 디렉토리의 상세 명세를 확인하세요.
> - 접근토큰발급 (`au10001`)
> - 접근토큰폐기 (`au10002`)

## 목표

- 키움증권 OAuth 2.0 Client Credentials 인증 구현
- Access Token 발급 및 자동 갱신
- 토큰 캐싱 및 재사용 (24시간 유효)
- Next.js Route Handler를 통한 BE API 구축
- 에러 핸들링 및 로깅

## 요구사항

### 기능 요구사항

1. **OAuth 2.0 인증**
   - App Key/Secret으로 Access Token 발급
   - 키움 API: `POST https://api.kiwoom.com/oauth2/token`
   - 토큰 유효기간: 24시간

2. **토큰 관리**
   - 메모리 캐싱 (첫 단계, 추후 Redis 전환 가능)
   - 토큰 만료 시 자동 재발급
   - 401 에러 시 토큰 갱신 후 재시도

3. **API 클라이언트**
   - 키움 API 호출 공통 클라이언트 구현
   - Authorization Header 자동 주입
   - 에러 핸들링 (400, 401, 403, 500)

4. **환경 변수 관리**
   - `KIWOOM_APP_KEY`: 키움 App Key
   - `KIWOOM_APP_SECRET`: 키움 App Secret
   - `KIWOOM_API_BASE_URL`: 키움 API Base URL (기본값: `https://api.kiwoom.com`)
   - Zod 스키마로 환경변수 검증

### 비기능 요구사항

1. **보안**
   - 환경변수로 민감 정보 관리 (.env)
   - App Key/Secret을 클라이언트에 노출 금지
   - 서버 IP를 키움 포털에 화이트리스트 등록

2. **성능**
   - 토큰 캐싱으로 불필요한 API 호출 최소화

3. **안정성**
   - 토큰 만료 시 자동 재발급
   - API 에러 시 적절한 에러 메시지 반환
   - 재시도 로직 (401 에러 시 1회 재시도)

## 구현 체크리스트

> **중요**: 각 항목을 완료할 때마다 실시간으로 체크 표시 (`- [x]`)를 업데이트하세요.

### 환경 설정
- [x] .env.example 업데이트 (키움 API 환경변수 추가)
- [ ] .env.local 생성 (실제 키움 App Key/Secret 설정)
- [ ] 키움 포털에서 App Key/Secret 발급
- [ ] 키움 포털에 서버 IP 화이트리스트 등록

### 공통 타입 및 스키마
- [x] 키움 API 타입 정의 (`shared/lib/kiwoom/types.ts`)
  - [x] **KiwoomBaseResponse 인터페이스** (공통 응답 구조)
    - [x] return_code: number
    - [x] return_msg: string
  - [x] TokenRequest 인터페이스
  - [x] TokenResponse 인터페이스 (KiwoomBaseResponse 확장)
  - [x] KiwoomError 인터페이스
- [x] 환경변수 Zod 스키마 (`shared/lib/kiwoom/env.schema.ts`)
  - [x] KIWOOM_APP_KEY 검증
  - [x] KIWOOM_APP_SECRET 검증
  - [x] KIWOOM_API_BASE_URL 검증 (선택적)

### 인증 로직
- [x] 토큰 관리 모듈 (`shared/lib/kiwoom/auth.ts`)
  - [x] getAccessToken 함수 (토큰 발급 및 캐싱)
  - [x] refreshToken 함수 (토큰 갱신)
  - [x] 메모리 캐싱 로직 (만료 시간 체크)
  - [x] JSDoc 주석 추가

### API 클라이언트
- [x] 키움 API 클라이언트 (`shared/lib/kiwoom/client.ts`)
  - [x] KiwoomClient 클래스 구현
  - [x] request 메서드 (공통 API 호출)
  - [x] Authorization Header 자동 주입
  - [x] **return_code 체크 로직** (0이 아니면 에러 throw)
  - [x] 에러 핸들링 (401 시 토큰 재발급 후 재시도)
  - [x] JSDoc 주석 추가

### Route Handler
- [x] 토큰 상태 확인 API (`app/api/kiwoom/auth/status/route.ts`)
  - [x] GET 메서드 구현
  - [x] 현재 토큰 유효성 확인
  - [x] 응답: `{ isValid: boolean, expiresAt?: string }`
  - [x] 에러 핸들링
- [x] 토큰 재발급 API (`app/api/kiwoom/auth/refresh/route.ts`) (선택사항)
  - [x] POST 메서드 구현
  - [x] 강제 토큰 재발급
  - [x] 응답: `{ success: boolean }`

### Public API (index.ts)
- [x] `shared/lib/kiwoom/index.ts` 생성
  - [x] KiwoomClient export
  - [x] 주요 타입 export

### 테스트
- [x] 환경변수 검증 테스트
- [x] 토큰 발급 테스트 (수동 및 Mock 기반 자동 테스트)
- [x] 토큰 캐싱 동작 확인
- [x] 401 에러 시 재발급 테스트
- [x] `/api/kiwoom/auth/status` 호출 테스트

### 문서 업데이트
- [x] `document/index.md`에 PRD 등록
- [x] PRD 상태 업데이트 (📝 → 🚧 → ✅)

## 기술 스택 및 구현 상세

### 1. OAuth 2.0 인증 플로우

**API 명세 참조**: [`document/api/OAuth 인증/접근토큰발급/au10001_접근토큰_발급.md`](../../api/OAuth%20인증/접근토큰발급/au10001_접근토큰_발급.md)

**구현 시 참조할 내용**:
- Request/Response 구조는 위 API 명세 문서의 섹션 4, 5 참조
- Request/Response 예제는 위 API 명세 문서의 섹션 6, 7 참조
- 응답의 `expires_dt`는 YYYYMMDDHHmmss 형식 (초 단위가 아님)
- 모든 응답에 `return_code`, `return_msg` 포함됨

### 2. 파일 구조

```
src/
├── app/               # FSD app 레이어 (전역 설정)
│   ├── providers/
│   │   ├── index.ts
│   │   └── Providers.tsx
│   └── styles/
│       └── globals.css
│
├── shared/
│   └── lib/
│       └── kiwoom/
│           ├── index.ts               # Public API
│           ├── types.ts               # 타입 정의
│           ├── env.schema.ts          # 환경변수 스키마
│           ├── auth.ts                # 인증 로직
│           └── client.ts              # API 클라이언트
│
└── ... (entities 등)

app/                   # Next.js App Router (라우팅 전용)
└── api/
    └── kiwoom/
        └── auth/
            ├── status/
            │   └── route.ts       # GET: 토큰 상태 확인
            └── refresh/
                └── route.ts       # POST: 토큰 재발급 (선택)
```

### 3. 환경변수 예시

```bash
# .env.example
KIWOOM_APP_KEY=your_app_key_here
KIWOOM_APP_SECRET=your_app_secret_here
KIWOOM_API_BASE_URL=https://api.kiwoom.com
```

### 4. 공통 응답 구조

**모든 키움 API 응답에 포함되는 공통 필드**:
- `return_code` (number): 0이면 성공, 0이 아니면 실패
- `return_msg` (string): 응답 메시지

**타입 정의 위치**: `shared/lib/kiwoom/types.ts`
- `KiwoomBaseResponse` 인터페이스로 정의
- 모든 API 응답 타입은 이 인터페이스를 확장(extends)

**처리 로직 구현 위치**: `shared/lib/kiwoom/client.ts`
- API 호출 후 `return_code === 0` 체크
- `return_code !== 0`이면 `return_msg`를 에러 메시지로 throw

### 5. 에러 코드 처리

**HTTP 상태 코드**:

| 코드 | 설명 | 처리 방법 |
|:---|:---|:---|
| 200 | 성공 | return_code 체크 후 정상 응답 반환 |
| 400 | 잘못된 요청 | 요청 파라미터 검증 에러 반환 |
| 401 | 인증 실패 (토큰 만료) | 토큰 재발급 후 1회 재시도 |
| 403 | 권한 없음 (IP 미등록) | IP 화이트리스트 등록 안내 에러 |
| 500 | 서버 오류 | 키움 서버 오류 메시지 반환 |

**return_code 에러**:

API 호출이 200 OK로 성공해도 `return_code`가 0이 아니면 비즈니스 로직 에러입니다.
- 에러 메시지: `return_msg` 값을 사용
- 처리: 에러를 throw하여 상위에서 처리

## 테스트 시나리오

### 1. 환경변수 검증
- [x] KIWOOM_APP_KEY가 없으면 에러 발생
- [x] KIWOOM_APP_SECRET이 없으면 에러 발생
- [x] 환경변수가 모두 설정되면 정상 동작

### 2. 토큰 발급
- [x] 최초 API 호출 시 토큰 발급 성공
- [x] 발급된 토큰이 메모리에 캐싱됨
- [x] 유효기간이 정확히 설정됨 (24시간)

### 3. 토큰 캐싱
- [x] 두 번째 API 호출 시 캐시된 토큰 재사용
- [x] `/oauth2/token` API가 중복 호출되지 않음

### 4. 토큰 만료 처리
- [x] 토큰 만료 시 자동으로 새 토큰 발급
- [x] 401 에러 발생 시 토큰 재발급 후 재시도

### 5. 공통 응답 처리
- [x] 200 OK 응답에서 `return_code` 체크
- [x] `return_code === 0`이 아니면 `return_msg`로 에러 throw
- [x] 모든 API 응답이 `KiwoomBaseResponse` 확장하도록 타입 정의

### 6. 에러 핸들링
- [x] 403 에러 시 IP 미등록 안내 메시지
- [x] 500 에러 시 적절한 에러 메시지
- [x] 네트워크 에러 시 재시도 또는 에러 반환
- [x] `return_code !== 0` 에러 처리

### 7. Route Handler 테스트
- [x] `GET /api/kiwoom/auth/status` 호출 시 토큰 상태 반환
- [x] 토큰이 유효하면 `{ isValid: true, expiresAt: "..." }`
- [x] 토큰이 없으면 `{ isValid: false }`

## 기술적 고려사항

### 1. 토큰 저장소 (현재 vs 향후)

**현재 (1단계)**: 메모리 캐싱
- 간단하고 빠름
- 서버 재시작 시 토큰 재발급 필요
- 단일 서버 환경에 적합

**향후 (2단계)**: Redis 캐싱
- 서버 재시작 시에도 토큰 유지
- 다중 서버 환경 지원
- Docker 환경에서 Redis 컨테이너 추가

### 2. 재시도 로직

**구현 위치**: `shared/lib/kiwoom/client.ts`

- **401 에러**: 1회 재시도 (토큰 재발급 후)
- **500 에러**: 재시도 안 함 (키움 서버 문제)
- **return_code !== 0**: 재시도 안 함 (비즈니스 로직 에러)
- **네트워크 에러**: 2회 재시도 (선택사항)

## 참고 문서

- **[document/api/OAuth 인증/](../../api/README.md)** - 키움 OAuth API 상세 명세 (Request/Response 스키마, 예제)
- [api-guide.md](../../api-guide.md) - 키움 REST API 사용법
- [architecture.md](../../architecture.md) - 시스템 아키텍처
- [coding-standards.md](../../coding-standards.md) - 코딩 규칙
- [development.md](../../development.md) - 개발 가이드
- [키움 Open API Portal](https://apiportal.kiwoom.com/) - App Key 발급 및 IP 등록

## 주의사항

### 1. 보안
- ⚠️ **App Key/Secret을 절대 클라이언트에 노출하지 마세요**
- ⚠️ **환경변수를 Git에 커밋하지 마세요** (.env.local은 .gitignore에 포함)
- ⚠️ **프로덕션 환경에서는 환경변수를 안전하게 관리하세요** (Docker secrets, AWS Secrets Manager 등)

### 2. IP 화이트리스트
- ⚠️ **키움 포털에서 서버 공인 IP를 반드시 등록하세요**
- 개발 환경: 로컬 개발 머신 IP 등록
- 프로덕션 환경: 배포 서버 IP 등록
- Docker 환경: 호스트 머신 IP 등록


### 3. 토큰 관리
- ⚠️ **토큰은 24시간 유효, 반드시 캐싱하여 재사용**
- 매번 토큰 발급 시 Rate Limit 낭비
- 토큰 만료 5분 전 미리 재발급 권장 (선택사항)

### 4. 에러 처리
- 403 에러 (IP 미등록): 개발자에게 명확한 안내 메시지
- 401 에러 (토큰 만료): 자동 재발급 로직 필수
- 500 에러: 키움 서버 장애 가능성, 로그 기록

### 5. FSD 아키텍처 준수
- `shared/lib/kiwoom/`에만 구현 (entities나 features 아님)
- Public API는 `index.ts`를 통해 export
- JSDoc 주석 필수

## 다음 단계 (이 PRD 이후)

1. **실시간 시세 조회** (WebSocket 또는 REST API)
   - 특정 종목의 호가 정보 조회
   - 특정 시간에 매도 호가 체크

2. **계좌 조회**
   - 계좌 목록 조회
   - 잔고 조회
   - 보유 종목 조회

3. **주문 기능**
   - 매수/매도 주문
   - 주문 취소
   - 주문 내역 조회
