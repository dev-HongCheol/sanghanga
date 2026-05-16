# Grid Trader 향후 개선사항

> PRD: [prd.md](./prd.md) | 체크리스트: [checklist.md](./checklist.md)

이 문서는 Grid Trader의 향후 개선 및 확장 계획을 정리합니다.

---

## 🔄 Phase 1.7: 실시간 갱신 완성

### 주문/체결 실시간 갱신 (SSE 확장)

**우선순위**: 높음
**현황**: `broadcastOrders`, `broadcastFillEvent` 선언만 있고 연결 안 됨
**문제**: `router.refresh()` 의존 → 깜빡임, 자동 갱신 안 됨

#### 구현 방법

1. Zustand Store 생성
   - [ ] `shared/stores/order-store.ts` - 주문 목록 전역 상태

2. SSE 연결
   - [ ] `checkFills.ts` - 체결 감지 후 `broadcastOrders()` 호출
   - [ ] `SSEProvider.tsx` - `orders` 이벤트 리스너 추가

3. 컴포넌트 전환
   - [ ] `RealtimeActiveOrdersTable.tsx` - Zustand store 구독
   - [ ] `page.tsx` - SSR props를 store 초기값으로 활용

4. 정리
   - [ ] `router.refresh()` 제거

**기대 효과**: 깜빡임 없는 부드러운 테이블 갱신, 체결 즉시 자동 반영

---

## 📊 Phase 2: UI 개선 및 모니터링

### 1. 실시간 잔고 패널 개선

**우선순위**: 중간 (손익 계산 정확도 개선 완료 후)

**현재**: 예수금, 보유 수량, 평균단가, 평가손익
**개선**: 예수금 → 오늘의 손익 또는 전체 기간 손익

#### 구현 방법

1. DB 쿼리 함수 추가
   ```typescript
   // 오늘의 손익
   SELECT SUM(profit_loss) FROM sh_fill_events
   WHERE strategy_id = ? AND DATE(fill_time) = CURRENT_DATE

   // 전체 기간 손익
   SELECT SUM(profit_loss) FROM sh_fill_events
   WHERE strategy_id = ?
   ```

2. `AccountBalancePanel` 수정
   - 예수금 → 손익(수익률) 표시

3. 수익률 계산
   - `(손익 / 투자금) × 100`
   - 투자금 ≈ `평균단가 × 보유수량 + 예수금`

#### 체크리스트

- [ ] `getFillEventsByStrategy` 확장 - 오늘/전체 손익 집계 함수
- [ ] `AccountBalancePanel` 수정 - 손익(수익률) 표시

### 2. 체결 히스토리 페이지네이션

**우선순위**: 중간
**현재**: 최근 10개 고정, 페이지네이션 없음

#### 개선 방법

**간단한 방법**: "더 보기" 버튼
**완전한 방법**: Shadcn Pagination

```typescript
// Server Component
const page = searchParams.page ? parseInt(searchParams.page) : 1;
const limit = 20;
const fillEvents = await getFillEventsByStrategy(strategyId, limit, (page - 1) * limit);
const totalCount = await getFillEventsCount(strategyId);
```

#### 체크리스트

- [ ] `getFillEventsCount` 함수 추가
- [ ] `getFillEventsByStrategy` 확장 - offset/limit 파라미터
- [ ] Shadcn Pagination 컴포넌트 추가
- [ ] URL 쿼리 파라미터 처리 (`?page=1&limit=20`)
- [ ] (Optional) 날짜 필터 (오늘, 이번 주, 이번 달, 전체)
- [ ] (Optional) CSV 다운로드

### 3. 알림 및 모니터링

- [ ] 텔레그램 Bot 연동 (체결/에러/일일 리포트)
- [ ] P&L 차트 (일별/주별)
- [ ] 체결 통계 (승률, 평균 수익률)

---

## 🌐 Phase 3: 다중 종목 지원

- [ ] 다중 전략 동시 실행
- [ ] 전략 복사 / 템플릿
- [ ] 동적 그리드 간격 조정
- [ ] 백테스팅 시뮬레이터

---

## 🔮 Optional 개선

### 공휴일 포함 장시간 체크

**현황**: `isMarketOpen()`은 요일만 체크, 공휴일 미지원

**권장 방법**: 공공데이터포털 한국천문연구원 특일 정보 API

| 항목 | 내용 |
|:-----|:-----|
| URL | `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo` |
| 인증 | 공공데이터포털 API 키 (무료) |
| 호출 | 서버 기동 시 또는 연초 1회 → 메모리/DB 캐싱 |
| 반환 | 설날, 추석, 광복절 등 법정공휴일 목록 |

#### 구현

```typescript
const HOLIDAYS = new Set<string>(); // "20250101", "20250128"

function isWithinMarketHours(date: Date): boolean {
  const ymd = formatYYYYMMDD(date);
  if (HOLIDAYS.has(ymd)) return false; // 공휴일 제외
  // 기존 요일 + 시간 체크 ...
}
```

#### 체크리스트

- [ ] 공공데이터포털 API 키 발급 (`DATA_GO_KR_API_KEY`)
- [ ] 공휴일 데이터 조회 및 캐싱 로직
- [ ] `market-hours.ts` - `isWithinMarketHours()` 공휴일 체크 추가
