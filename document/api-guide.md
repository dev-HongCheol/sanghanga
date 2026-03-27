# 키움증권 REST API 사용법

> **📋 상세 API 명세서**: 모든 키움 API의 상세 사양은 [`document/api/`](./api/README.md) 디렉토리를 참조하세요.
> 각 API별 Request/Response 스키마, 예제 코드가 포함되어 있습니다.

## API 개요

| 구분          | 프로토콜   | 용도                     |
| :------------ | :--------- | :----------------------- |
| **REST API**  | HTTP/HTTPS | 계좌 조회, 주문, TR 요청 |
| **WebSocket** | ws/wss     | 실시간 시세, 체결 알림   |

## ⚠️ 키움 API 호출 규칙 (필수)

### 1. 서버 측 호출 원칙

**키움 API는 반드시 서버에서만 호출해야 합니다.**

**이유**:
- **보안**: API Key/Secret 노출 방지
- **성능**: 다중 API 호출 시 서버에서 병렬 처리
- **제어**: Rate Limiting, 에러 핸들링 중앙 관리

### 2. 구현 패턴

#### ✅ 올바른 패턴

**Pattern 1: Server Action (권장)**
```typescript
// features/{feature}/api/{action}.action.ts (FSD 표준)
"use server";

import { kiwoomClient } from "@/shared/lib/kiwoom/client";

export async function searchStocksAction(params: SearchParams) {
  // 서버에서 kiwoomClient 직접 호출
  const response = await kiwoomClient.request("/api/dostk/rkinfo", {
    method: "POST",
    headers: { "api-id": "ka10031" },
    body: JSON.stringify(params),
  });

  return { success: true, data: response };
}
```

**주의**: Server Actions는 `api/` 세그먼트에 배치 (FSD 공식 표준)

**Pattern 2: Route Handler (API Proxy)**
```typescript
// app/api/kiwoom/dostk/rkinfo/route.ts
import { kiwoomClient } from "@/shared/lib/kiwoom/client";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const apiId = request.headers.get("api-id");

  const response = await kiwoomClient.request("/api/dostk/rkinfo", {
    method: "POST",
    headers: { "api-id": apiId },
    body: JSON.stringify(body),
  });

  return NextResponse.json(response);
}
```

#### ❌ 잘못된 패턴

**클라이언트에서 직접 호출 (절대 금지)**
```typescript
// ❌ 브라우저에서 키움 API 직접 호출
const response = await fetch("/api/kiwoom/dostk/rkinfo", {
  method: "POST",
  headers: { "api-id": "ka10031" },
  body: JSON.stringify(params),
});

// 여러 API를 클라이언트에서 순차/병렬 호출 (비효율)
const [res1, res2, res3] = await Promise.all([
  fetch("/api/kiwoom/dostk/rkinfo", ...),
  fetch("/api/kiwoom/dostk/stkinfo", ...),
  fetch("/api/kiwoom/dostk/chart", ...),
]);
```

### 3. 패턴 선택 가이드

| 상황 | 권장 패턴 | 이유 |
|:-----|:----------|:-----|
| **다중 API 호출 + 비즈니스 로직** | Server Action | 서버에서 병렬 처리, 코드 간결 |
| **단순 API 프록시** | Route Handler | 재사용 가능한 엔드포인트 |
| **실시간 데이터** | WebSocket (서버) | 지연 최소화 |

### 4. 체크리스트

구현 전 다음을 확인하세요:

- [ ] 키움 API를 클라이언트에서 직접 호출하지 않았는가?
- [ ] 다중 API 호출이 필요하면 Server Action으로 병렬 처리했는가?
- [ ] API Key/Secret이 클라이언트 코드에 노출되지 않았는가?
- [ ] 에러 핸들링이 서버 측에서 처리되는가?

## 인증 (OAuth 2.0)

### 1. App Key 발급

1. [키움 Open API Portal](https://apiportal.kiwoom.com/) 접속
2. 앱 등록 → App Key/Secret 발급
3. IP 등록 → 서버 공인 IP 추가

### 2. Access Token 발급

```bash
POST https://api.kiwoom.com/oauth2/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "appkey": "YOUR_APP_KEY",
  "secretkey": "YOUR_APP_SECRET"
}
```

**응답**:
```json
{
  "access_token": "xxx",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

**토큰 캐싱**: 토큰은 24시간 유효, 재사용 권장

## 주요 API

### 계좌 조회

```bash
GET /v1/account
Authorization: Bearer {token}

# 응답
{
  "accounts": ["1234567890", "0987654321"]
}
```

```bash
GET /v1/account/{accountNo}/balance
Authorization: Bearer {token}

# 응답
{
  "deposit": 1000000,
  "withdrawable": 500000,
  "totalAssets": 5000000
}
```

### 주문

```bash
POST /v1/order
Authorization: Bearer {token}
Content-Type: application/json

{
  "accountNo": "1234567890",
  "symbol": "005930",
  "quantity": 10,
  "price": 75000,
  "orderType": "1",  // 1: 매수, 2: 매도
  "hogaType": "00"   // 00: 지정가, 03: 시장가
}

# 응답
{
  "orderId": "20240115123456",
  "status": "pending"
}
```

### 주식 정보

```bash
GET /v1/stock/{symbol}/price
Authorization: Bearer {token}

# 응답
{
  "symbol": "005930",
  "price": 75000,
  "change": 500,
  "changeRate": 0.67,
  "volume": 1234567
}
```

## WebSocket (실시간)

### 연결

```javascript
const ws = new WebSocket("wss://api.kiwoom.com/ws", {
	headers: {
		Authorization: `Bearer ${token}`,
	},
});

// 실시간 시세 등록
ws.send(
	JSON.stringify({
		type: "subscribe",
		data: {
			symbols: ["005930", "000660"],
			fields: ["price", "volume"],
		},
	})
);
```

### 메시지 수신

```json
{
  "type": "price",
  "data": {
    "symbol": "005930",
    "price": 75000,
    "volume": 1234567
  }
}
```

## Rate Limiting

키움 REST API의 호출 제한에 대한 공식 문서가 명확하지 않습니다.
실제 구현 시 429 에러 발생 여부를 모니터링하여 적절한 제한을 설정하세요.

## 에러 코드

| 코드 | 설명                  |
| :--- | :-------------------- |
| 200  | 성공                  |
| 400  | 잘못된 요청           |
| 401  | 인증 실패 (토큰 만료) |
| 403  | 권한 없음 (IP 미등록) |
| 429  | Rate Limit 초과       |
| 500  | 서버 오류             |

## Next.js 구현 예시

### API 클라이언트

```typescript
// src/shared/lib/kiwoom/api.ts
export class KiwoomAPI {
	private async getToken() {
		// 토큰 캐싱 로직
	}

	async request(endpoint: string, options?: RequestInit) {
		const token = await this.getToken();
		const response = await fetch(`https://api.kiwoom.com${endpoint}`, {
			...options,
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		});
		return response.json();
	}
}
```

### Route Handler

```typescript
// app/api/order/route.ts
import { kiwoomClient } from "@/shared/lib/kiwoom";

export async function POST(request: Request) {
	const body = await request.json();
	const result = await kiwoomClient.request("/v1/order", {
		method: "POST",
		body: JSON.stringify(body),
	});
	return Response.json(result);
}
```

## 관련 문서

- **[document/api/](./api/README.md)** - 키움 API 상세 명세서 (Request/Response 스키마, 예제)
- [architecture.md](./architecture.md) - 전체 시스템 구조
- [setup.md](./setup.md) - 키움 API 초기 설정
- [coding-standards.md](./coding-standards.md) - Route Handler 작성 규칙
- [index.md](./index.md) - 키움 API Portal 링크
