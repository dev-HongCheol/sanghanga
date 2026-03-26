# 설치 및 설정 가이드

## 환경 요구사항

- **Node.js**: 20.x 이상
- **pnpm**: 9.x 이상
- **Docker**: 24.x 이상 (배포 시)
- **키움증권 계좌**: 모의투자 또는 실계좌

## 로컬 개발 환경 설정

### 1. 프로젝트 생성

```bash
# Next.js 프로젝트 생성
pnpm create next-app@latest trading-platform

# 옵션 선택
✔ Would you like to use TypeScript? Yes
✔ Would you like to use ESLint? Yes
✔ Would you like to use Tailwind CSS? Yes
✔ Would you like to use `src/` directory? Yes
✔ Would you like to use App Router? Yes
✔ Would you like to customize the default import alias? Yes (@/*)

cd trading-platform
```

### 2. 의존성 설치

```bash
# 필수 라이브러리
pnpm add zustand @tanstack/react-query zod

# Shadcn UI 필수 패키지
pnpm add class-variance-authority clsx tailwind-merge lucide-react

# Supabase (선택)
pnpm add @supabase/supabase-js
```

### 3. Shadcn UI 설정

**Shadcn UI는 `src/shared/ui` 경로에 설치됩니다** (FSD 아키텍처 준수)

#### 3.1. components.json 생성

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/shared/ui",
    "utils": "@/shared/lib/utils",
    "ui": "@/shared/ui",
    "lib": "@/shared/lib",
    "hooks": "@/shared/hooks"
  },
  "iconLibrary": "lucide"
}
```

#### 3.2. 컴포넌트 설치

```bash
# 필요한 컴포넌트 설치 (src/shared/ui에 자동 생성)
npx shadcn@latest add card select alert button

# 추가 컴포넌트 설치 예시
npx shadcn@latest add dialog table form
```

**설치된 컴포넌트 위치**: `src/shared/ui/*.tsx`

#### 3.3. 사용 예시

```typescript
// widgets/MyWidget.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

export function MyWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>제목</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>버튼</Button>
      </CardContent>
    </Card>
  );
}
```

### 4. 환경 변수 설정

```bash
# .env.local 파일 생성
cp .env.example .env.local
```

**.env.local**:
```bash
# 키움증권 API
KIWOOM_APP_KEY=your_app_key
KIWOOM_APP_SECRET=your_app_secret

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000

# Supabase (선택)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 5. Next.js 설정

**next.config.ts**:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone", // Docker 배포용
	reactStrictMode: true,
};

export default nextConfig;
```

### 6. 개발 서버 실행

```bash
pnpm dev
# http://localhost:3000
```

## Docker 환경 설정

### 1. Dockerfile 생성

```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

### 2. .dockerignore

```
node_modules
.next
.git
.env.local
```

### 3. Docker Compose

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: trading-platform
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - KIWOOM_APP_KEY=${KIWOOM_APP_KEY}
      - KIWOOM_APP_SECRET=${KIWOOM_APP_SECRET}
    restart: unless-stopped
    networks:
      - trading-network

networks:
  trading-network:
    driver: bridge
```

### 4. 빌드 및 실행

```bash
# 이미지 빌드
docker build -t trading-platform .

# 컨테이너 실행
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name trading-platform \
  trading-platform

# 또는 Docker Compose
docker compose up -d
```

## 키움증권 API 설정

### 1. App Key 발급

1. [키움 Open API Portal](https://apiportal.kiwoom.com/) 접속
2. 회원가입 및 로그인
3. 마이페이지 → 앱 등록
4. App Key/Secret 복사 → `.env.local`에 추가

### 2. IP 화이트리스트 등록

```bash
# 서버 공인 IP 확인
curl ifconfig.me
```

키움 포털 → 마이페이지 → IP 관리 → IP 추가

### 3. 모의투자 vs 실서버

| 구분        | 모의투자                     | 실서버                  |
| :---------- | :--------------------------- | :---------------------- |
| **URL**     | openapi-sandbox.kiwoom.com   | openapi.kiwoom.com      |
| **App Key** | 모의투자 전용                | 실서버 전용             |
| **주문**    | 가상 주문                    | 실제 주문               |
| **IP 등록** | 불필요                       | 필수                    |

## 배포 (개인 서버)

### 1. 서버 준비

```bash
# Docker 설치
curl -fsSL https://get.docker.com | sh

# Docker Compose 설치
sudo apt install docker-compose-plugin
```

### 2. 프로젝트 배포

```bash
# 프로젝트 클론
git clone https://github.com/your-repo/trading-platform.git
cd trading-platform

# 환경 변수 설정
nano .env

# Docker Compose 실행
docker compose up -d

# 로그 확인
docker compose logs -f
```

### 3. Nginx 리버스 프록시 (선택)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. SSL 인증서 (선택)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 트러블슈팅

### Docker 빌드 실패

```bash
# 캐시 없이 빌드
docker build --no-cache -t trading-platform .

# 빌드 로그 확인
docker build -t trading-platform . --progress=plain
```

### 환경 변수 로드 안 됨

- 서버 사이드: 일반 환경 변수
- 클라이언트 사이드: `NEXT_PUBLIC_` 접두사 필요

### CORS 에러

Next.js API Routes는 기본적으로 CORS 허용.
필요시 Route Handler에서 헤더 추가:

```typescript
export async function GET() {
	return Response.json(data, {
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
	});
}
```

## 관련 문서

- [architecture.md](./architecture.md) - 시스템 아키텍처 개요
- [api-guide.md](./api-guide.md) - 키움 REST API 인증 및 사용법
- [index.md](./index.md) - 외부 참고 자료 링크
