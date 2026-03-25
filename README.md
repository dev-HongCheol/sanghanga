# 📈 Stock Trading Platform

키움증권 REST API를 활용한 실시간 웹 트레이딩 플랫폼

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

```bash
# .env.local 파일 생성
cp .env.example .env.local

# 필수 환경 변수 입력
KIWOOM_APP_KEY=your_app_key
KIWOOM_APP_SECRET=your_app_secret
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. 개발 서버 실행

```bash
# 개발 모드
pnpm dev

# http://localhost:3000
```

## 🎯 주요 기능

- 🔐 키움증권 REST API 연동 (OAuth 2.0)
- 📊 실시간 시세 및 차트 (WebSocket/SSE)
- 💼 계좌 조회 및 주문 관리
- 📈 포지션 추적 및 손익 분석
- 🔔 실시간 체결 알림
- 📱 반응형 웹 디자인 (모바일 지원)

## 🛠 기술 스택

| 구분          | 기술                    | 비고                              |
| :------------ | :---------------------- | :-------------------------------- |
| **Framework** | Next.js 16 (App Router) | React Server Components           |
| **언어**      | TypeScript 5.x          | 타입 안전성                       |
| **스타일링**  | Tailwind CSS            | Shadcn UI 컴포넌트                |
| **폼 검증**   | Zod, React Hook Form    | 타입 안전 폼 검증                 |
| **상태 관리** | Zustand, TanStack Query | 전역 상태, 서버 상태              |
| **실시간**    | Server-Sent Events      | 실시간 시세, 체결 알림            |
| **API**       | 키움증권 REST API       | OAuth 2.0, WebSocket              |
| **Database**  | Supabase                | PostgreSQL, Real-time (선택사항)  |
| **배포**      | Docker + Nginx          | Next.js Standalone, 개인 서버     |
| **Package**   | pnpm                    | 빠른 의존성 관리                  |

## 📁 프로젝트 구조

> **Next.js App Router + FSD 아키텍처**

```
stock-trading-platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 인증 관련 페이지
│   │   ├── (trading)/         # 트레이딩 페이지
│   │   ├── api/               # Route Handlers
│   │   │   ├── auth/          # 인증 API
│   │   │   ├── order/         # 주문 API
│   │   │   ├── account/       # 계좌 API
│   │   │   └── realtime/      # 실시간 데이터 (SSE)
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   └── page.tsx           # 홈 페이지
│   │
│   ├── widgets/               # 위젯 (차트, 주문창 등)
│   │   ├── ChartWidget/
│   │   ├── OrderWidget/
│   │   └── AccountWidget/
│   │
│   ├── features/              # 기능 (주문, 계좌조회 등)
│   │   ├── placeOrder/
│   │   ├── fetchAccount/
│   │   └── updateWatchlist/
│   │
│   ├── entities/              # 엔티티 (주식, 계좌 등)
│   │   ├── stock/
│   │   ├── account/
│   │   └── order/
│   │
│   └── shared/                # 공통 (UI, lib, types)
│       ├── ui/                # Shadcn UI 컴포넌트
│       ├── lib/               # 유틸리티
│       ├── config/            # 설정
│       └── types/             # 타입 정의
│
├── document/                  # 프로젝트 문서
├── public/                    # 정적 파일
├── .env.example               # 환경 변수 예시
├── next.config.ts             # Next.js 설정
├── tailwind.config.ts         # Tailwind 설정
└── tsconfig.json              # TypeScript 설정
```

## 📚 문서

- [아키텍처 설계](./document/architecture.md)
- [설치 및 설정](./document/setup.md)
- [개발 가이드](./document/development.md)
- [코딩 규칙](./document/coding-standards.md)
- [키움 REST API 사용법](./document/api-guide.md)
- [PRD 목록](./document/index.md)

## 🔧 개발 명령어

```bash
# 개발
pnpm dev              # 개발 서버 실행 (http://localhost:3000)
pnpm dev:turbo        # Turbopack 사용 (더 빠른 HMR)

# 빌드
pnpm build            # 프로덕션 빌드
pnpm start            # 프로덕션 서버 실행

# 코드 품질
pnpm lint             # ESLint 검사
pnpm lint:fix         # ESLint 자동 수정
pnpm format           # Prettier 포맷팅
pnpm type-check       # TypeScript 타입 검사

# 테스트
pnpm test             # Vitest 실행
pnpm test:ui          # Vitest UI
pnpm test:coverage    # 테스트 커버리지
```

## 📋 개발 프로세스

1. **PRD 작성** → `document/prd/{기능명}/prd.md`
2. **체크리스트 작성** → 구현 항목 및 테스트 항목
3. **코드 구현** → FSD 아키텍처 준수
4. **문서 업데이트** → `document/index.md` 상태 업데이트

상세 규칙은 [코딩 규칙](./document/coding-standards.md) 참조

## 🚀 배포 (Docker + Next.js Standalone)

### 개인 서버 배포

```bash
# 1. Docker 이미지 빌드
docker build -t trading-platform .

# 2. 컨테이너 실행
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name trading-platform \
  trading-platform

# 또는 Docker Compose
docker compose up -d
```

### 키움증권 IP 화이트리스트 등록

```bash
# 서버 공인 IP 확인
curl ifconfig.me

# 키움 포털에서 IP 등록
# https://apiportal.kiwoom.com/ → 마이페이지 → IP 관리
```

## 🔧 트러블슈팅

### CORS 에러

Next.js는 기본적으로 CORS를 지원합니다. Route Handler에서 응답 헤더를 설정하세요.

```typescript
// app/api/[...]/route.ts
export async function GET(request: Request) {
	return NextResponse.json(data, {
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		},
	});
}
```

### 환경 변수가 로드되지 않음

- **서버 사이드**: 일반 환경 변수 (`API_KEY`)
- **클라이언트 사이드**: `NEXT_PUBLIC_` 접두사 필요 (`NEXT_PUBLIC_API_URL`)

```bash
# .env.local
API_KEY=xxx                    # 서버 사이드만 접근 가능
NEXT_PUBLIC_API_URL=xxx        # 클라이언트도 접근 가능
```

### 실시간 데이터가 끊김

Server-Sent Events (SSE) 연결은 일정 시간 후 끊어질 수 있습니다. 자동 재연결 로직을 구현하세요.

```typescript
// src/shared/lib/sse.ts
const connectSSE = () => {
	const eventSource = new EventSource("/api/realtime");

	eventSource.onerror = () => {
		eventSource.close();
		// 3초 후 재연결
		setTimeout(connectSSE, 3000);
	};
};
```

### 키움 API 호출 제한

키움증권 REST API는 호출 횟수 제한이 있습니다:
- **1초당 최대 20회**
- **초과 시 429 에러**

Rate Limiting을 구현하세요 (p-limit, bottleneck 등 사용).

## 📝 라이선스

MIT License

## 🔗 참고 링크

- [Next.js 공식 문서](https://nextjs.org/docs)
- [키움증권 Open API Portal](https://apiportal.kiwoom.com/)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Shadcn UI](https://ui.shadcn.com/)
