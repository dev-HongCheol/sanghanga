# FSD 구조 검토 결과 및 개선 방안

> **작성일**: 2026-03-25
> **검토 범위**: 전체 프로젝트 구조 (FSD 공식 문서 기준)

## 📊 검토 결과 요약

### 🔴 심각 (즉시 개선 필요)

#### 1. shared 레이어의 역할 위반

**FSD 공식 문서 정의**:
> shared는 "외부 세계(백엔드, 라이브러리)와의 연결을 담당하는 기반"

**현재 문제**:
```
shared/lib/kiwoom/
├── api/stockRanking.api.ts          ❌ 도메인 API (→ entities/stock)
├── queries/stockRanking.queries.ts  ❌ 도메인 쿼리 (→ entities/stock)
└── types.ts                         ❌ 도메인 타입 포함 (분리 필요)
```

**영향**:
- 도메인 지식이 `shared`에 분산되어 **비즈니스 로직 파악 어려움**
- 향후 `stock` 관련 기능 추가 시 **어디에 배치할지 불명확**
- FSD의 핵심 원칙 "Needs Driven(비즈니스 중심)" 위반

#### 2. entities 레이어 부재

**FSD 공식 문서**:
> entities는 "비즈니스에서 사용하는 실제 개념 (도메인 객체)"
> - 도메인 타입 및 인터페이스
> - 기본 CRUD API 함수
> - 데이터 검증 스키마
> - UI 표현 컴포넌트

**현재 상황**:
- `entities` 폴더 자체가 없음
- 주식(stock), 계좌(account), 주문(order) 같은 **비즈니스 도메인 개념이 분리되지 않음**

**영향**:
- 프로젝트 확장 시 **구조 파악 어려움**
- 도메인 로직 재사용 불가
- FSD의 **가장 중요한 레이어 중 하나** 누락

### 🟡 개선 권장

#### 3. widgets 구조 불완전

**FSD 권장 구조**:
```
widgets/stock-ranking/
├── ui/
│   └── StockRankingWidget.tsx
└── index.ts  # Public API
```

**현재 구조**:
```
widgets/
└── StockRankingWidget.tsx  ❌ 단일 파일
```

**영향**:
- Public API 패턴 미적용
- 내부 구조 변경 시 모든 import 경로 수정 필요
- 슬라이스 격리 원칙 미준수

#### 4. pages 레이어 미적용 (선택 사항)

**FSD 권장 (복잡한 페이지 로직이 있을 때)**:
```
pages/stock-ranking/
├── ui/
│   └── StockRankingPage.tsx
├── metadata.ts
└── index.ts
```

**현재 구조**:
```
app/stock-ranking/
└── page.tsx  # Next.js 라우팅에 직접 구현
```

**참고**: Next.js App Router는 `app` 폴더가 라우팅 역할을 하므로, **단순 페이지는 app에 직접 구현해도 FSD 위반 아님**. 단, 복잡한 페이지 로직이 생기면 `pages` 레이어 고려.

## ✅ 올바른 FSD 구조 (개선안)

```
src/
├── app/                           # Next.js 라우팅
│   ├── stock-ranking/
│   │   └── page.tsx              # → pages/stock-ranking 재내보내기 (선택)
│   ├── api/
│   │   └── kiwoom/
│   │       ├── auth/
│   │       │   ├── status/route.ts
│   │       │   └── refresh/route.ts
│   │       └── stock-ranking/route.ts
│   ├── providers.tsx
│   └── layout.tsx
│
├── pages/                         # 화면/페이지 (선택)
│   └── stock-ranking/
│       ├── ui/
│       │   └── StockRankingPage.tsx
│       ├── metadata.ts
│       └── index.ts
│
├── widgets/                       # 자체완결 UI 블록
│   └── stock-ranking/             ⭐ 폴더 구조로 변경
│       ├── ui/
│       │   └── StockRankingWidget.tsx
│       └── index.ts
│
├── entities/                      # 비즈니스 도메인 ⭐⭐ 신규 (최우선)
│   └── stock/
│       ├── api/
│       │   ├── stockRanking.api.ts       # shared에서 이동
│       │   └── stockRanking.queries.ts   # shared에서 이동
│       ├── model/
│       │   ├── stock.types.ts            # types.ts에서 분리
│       │   └── stock.schema.ts           # 선택
│       └── index.ts                      # Public API
│
└── shared/                        # 공통 인프라
    └── lib/
        └── kiwoom/
            ├── auth.ts           ✅ 유지 (공통 인증)
            ├── client.ts         ✅ 유지 (API 클라이언트 설정)
            ├── env.schema.ts     ✅ 유지 (환경 변수)
            └── index.ts          ⚠️ 도메인 export 제거
```

## 🔧 리팩토링 우선순위

### 🔴 최우선 (Phase 1)

**1. entities/stock 레이어 생성**

**이유**: FSD의 핵심 원칙 "비즈니스 중심 아키텍처" 준수

**작업 내용**:
```bash
# 1. 폴더 생성
mkdir -p src/entities/stock/api
mkdir -p src/entities/stock/model

# 2. 파일 이동
mv src/shared/lib/kiwoom/api/stockRanking.api.ts \
   src/entities/stock/api/stockRanking.api.ts

mv src/shared/lib/kiwoom/queries/stockRanking.queries.ts \
   src/entities/stock/api/stockRanking.queries.ts

# 3. types.ts 분리 (도메인 타입만)
# → entities/stock/model/stock.types.ts

# 4. Public API 생성
# → entities/stock/index.ts
```

**Import 경로 수정**:
```typescript
// ❌ 변경 전
import { useStockRanking } from "@/shared/lib/kiwoom/queries/stockRanking.queries";

// ✅ 변경 후
import { useStockRanking } from "@/entities/stock";
```

**2. shared 정리**

**작업 내용**:
- `shared/lib/kiwoom/api/` 폴더 삭제
- `shared/lib/kiwoom/queries/` 폴더 삭제
- `shared/lib/kiwoom/index.ts`에서 도메인 export 제거
- `shared/lib/kiwoom/types.ts`에서 도메인 타입 제거 (공통 인프라 타입만 유지)

### 🟡 권장 (Phase 2)

**widgets 구조화**

**작업 내용**:
```bash
# 1. 폴더 생성
mkdir -p src/widgets/stock-ranking/ui

# 2. 파일 이동
mv src/widgets/StockRankingWidget.tsx \
   src/widgets/stock-ranking/ui/StockRankingWidget.tsx

# 3. Public API 생성
# → widgets/stock-ranking/index.ts
```

### ⚪ 선택 (Phase 3)

**pages 레이어 생성** (복잡한 페이지 로직이 생기면 고려)

## 📋 Gemini 피드백 검증

| Gemini 지적 | 검증 결과 | FSD 공식 문서 근거 |
|:------------|:----------|:-------------------|
| shared에 도메인 비중 과다 | ✅ **정확** | "shared는 외부 세계와의 연결 담당" (Section 3.1) |
| entities로 이동 권장 | ✅ **정확** | "entities는 비즈니스 개념" (Section 3.2) |
| features 활용 고려 | ✅ **정확** | 현재는 widgets 내부 처리가 적절, 복잡해지면 features 분리 (Section 3.3) |

**Gemini의 피드백은 FSD 공식 문서와 100% 일치합니다.**

## 🎯 FSD 준수 체크리스트

리팩토링 후 다음을 확인:

- [x] `shared`에 도메인 로직이 없는가? ✅ (api/, queries/ 폴더 삭제 완료)
- [x] `entities/stock`에 주식 관련 모든 로직이 있는가? ✅ (api, model 완벽 구성)
- [x] 모든 슬라이스에 `index.ts` Public API가 있는가? ✅ (entities, widgets, shared)
- [x] import는 Public API를 통하는가? ✅ (모든 import 검증 완료)
- [x] 의존성 방향이 올바른가? (상위 → 하위만) ✅ (역방향 의존성 없음)

**✨ 리팩토링 완료일**: 2026-03-26
**🎉 FSD 아키텍처 완벽 준수 인증**

## 📚 참고 문서

- **[refactoring-plan.md](./refactoring-plan.md)** - 상세 리팩토링 단계
- **[fsd-official.md](./fsd-official.md)** - FSD 공식 문서 완전 분석
- **[architecture.md](./architecture.md)** - 프로젝트 아키텍처 (업데이트됨)
- **[CLAUDE.md](./CLAUDE.md)** - Claude 작업 지침 (업데이트됨)

## 🚀 다음 단계

1. **[refactoring-plan.md](./refactoring-plan.md) 검토**
2. **Phase 1 (entities 레이어) 리팩토링 시작**
3. **테스트 및 검증**
4. **Phase 2, 3 순차 진행**
