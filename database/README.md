# 데이터베이스 스키마 관리

## 개요

이 디렉토리는 Supabase PostgreSQL 데이터베이스의 스키마 파일을 관리합니다.

- **데이터베이스**: Supabase Self-Hosting
- **URL**: https://supa.devhong.cc
- **DBMS**: PostgreSQL
- **프로젝트 Prefix**: `sh_` (Sanghanga Project)

**⚠️ 중요**: Supabase 셀프 호스팅은 단일 데이터베이스에서 여러 프로젝트를 관리하므로, 네임스페이스 충돌을 방지하기 위해 **모든 테이블, 함수, 트리거, 인덱스에 `sh_` prefix를 필수로 추가**합니다.

## 디렉토리 구조

```
database/
├── schemas/                    # 기능별 스키마 파일
│   ├── grid-trader/           # Grid Trader 기능
│   │   ├── 01-schema.sql      # 전체 스키마 (새 환경용)
│   │   ├── 02-migration.sql   # 마이그레이션 (기존 프로젝트용)
│   │   └── 03-reset.sql       # 리셋 (전체 데이터 삭제)
│   └── [feature-name]/        # 다른 기능...
└── README.md                   # 이 파일
```

## 스키마 파일 구성

각 기능은 **3개의 SQL 파일**로 구성됩니다:

### 1. `01-schema.sql` - 전체 스키마

**용도**: 새로운 환경에서 처음 데이터베이스를 구축할 때 사용

**특징**:
- 테이블, 인덱스, 제약조건, 함수, 트리거 등 모든 스키마 정의
- 한글 주석 포함 (Supabase UI에서 컬럼 설명 표시용)
- 초기 데이터 (Seed) 포함 가능
- `CREATE TABLE IF NOT EXISTS` 사용

**실행 방법**:
```bash
psql -h supa.devhong.cc -U postgres -d postgres -f database/schemas/grid-trader/01-schema.sql
```

### 2. `02-migration.sql` - 마이그레이션

**용도**: 기존 운영 중인 데이터베이스에 스키마 변경사항을 적용할 때 사용

**특징**:
- 기존 데이터를 보존하면서 스키마 변경
- `ALTER TABLE`, `CREATE INDEX IF NOT EXISTS` 등 사용
- 롤백 가능한 트랜잭션 구조
- 버전 관리 (마이그레이션 이력 테이블 활용 가능)

**실행 방법**:
```bash
psql -h supa.devhong.cc -U postgres -d postgres -f database/schemas/grid-trader/02-migration.sql
```

### 3. `03-reset.sql` - 리셋

**용도**: 개발/테스트 환경에서 데이터베이스를 초기화할 때 사용

**특징**:
- 해당 기능의 모든 테이블, 인덱스, 함수 삭제
- `DROP TABLE IF EXISTS ... CASCADE` 사용
- **⚠️ 주의**: 모든 데이터가 삭제됩니다 (운영 환경에서 사용 금지)

**실행 방법**:
```bash
psql -h supa.devhong.cc -U postgres -d postgres -f database/schemas/grid-trader/03-reset.sql
```

## 스키마 작성 규칙

### 1. 프로젝트 Prefix 규칙 (필수)

**⚠️ 모든 데이터베이스 객체에 `sh_` prefix 필수**

Supabase 셀프 호스팅 환경에서 여러 프로젝트가 동일한 데이터베이스를 공유하므로, 네임스페이스 충돌을 방지하기 위해 **모든 테이블, 함수, 트리거, 인덱스, ENUM 타입 등에 `sh_` prefix를 추가**해야 합니다.

**적용 대상**:
- ✅ 테이블명: `sh_grid_strategies`
- ✅ 함수명: `sh_update_updated_at()`
- ✅ 트리거명: `sh_set_updated_at`
- ✅ ENUM 타입: `sh_order_type`, `sh_order_status`
- ✅ 인덱스명: `idx_sh_grid_orders_strategy_id`
- ❌ 컬럼명: prefix 불필요 (테이블 내에서만 유효)

### 2. 한글 주석 필수

Supabase UI에서 컬럼 정보를 확인할 수 있도록 **모든 테이블과 컬럼에 한글 주석** 추가:

```sql
-- 테이블 주석
COMMENT ON TABLE sh_grid_strategies IS '그리드 트레이딩 전략';

-- 컬럼 주석
COMMENT ON COLUMN sh_grid_strategies.id IS '전략 고유 ID';
COMMENT ON COLUMN sh_grid_strategies.stock_code IS '종목코드 (6자리)';
COMMENT ON COLUMN sh_grid_strategies.stock_name IS '종목명';
```

### 3. 네이밍 컨벤션

| 항목 | 규칙 | 예시 |
|:-----|:-----|:-----|
| 테이블명 | `sh_{name}` (snake_case, 복수형) | `sh_grid_strategies`, `sh_grid_orders` |
| 컬럼명 | `snake_case` (prefix 불필요) | `stock_code`, `grid_gap` |
| 인덱스명 | `idx_sh_{table}_{column}` | `idx_sh_grid_orders_strategy_id` |
| 제약조건명 | `sh_{table}_{column}_{type}` | `sh_grid_strategies_stock_code_check` |
| 함수명 | `sh_{name}` (snake_case) | `sh_update_updated_at` |
| 트리거명 | `sh_{name}` | `sh_set_updated_at` |
| ENUM 타입 | `sh_{name}` | `sh_order_type`, `sh_order_status` |

### 4. 필수 컬럼

모든 테이블에 다음 컬럼 포함 권장:

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### 5. 트랜잭션 및 에러 처리

마이그레이션 파일은 트랜잭션으로 감싸기:

```sql
BEGIN;

-- 스키마 변경 작업...

COMMIT;
```

## Supabase 연동

### 환경 변수 설정

`.env.local` 파일에 Supabase 연결 정보 추가:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://supa.devhong.cc
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 클라이언트 사용

```typescript
import { createClient } from '@/shared/lib/supabase/client';

const supabase = createClient();

// ⚠️ 테이블명에 sh_ prefix 필수
const { data, error } = await supabase.from('sh_grid_strategies').select('*');
```

## 스키마 업데이트 프로세스

1. **PRD 확인**: 기능 요구사항 파악
2. **스키마 설계**: ERD 작성, 테이블 구조 설계
3. **파일 작성**: 3종 SQL 파일 작성 (`01-schema.sql`, `02-migration.sql`, `03-reset.sql`)
4. **테스트**: 로컬 또는 개발 환경에서 테스트
5. **문서 업데이트**: 이 README 및 관련 PRD 업데이트
6. **마이그레이션 실행**: 운영 환경에 `02-migration.sql` 실행
7. **검증**: 데이터 무결성 및 애플리케이션 동작 확인

## 주의사항

- **운영 환경**에서는 `02-migration.sql`만 사용
- **개발 환경**에서는 `03-reset.sql` + `01-schema.sql` 조합 가능
- 마이그레이션 실행 전 **반드시 백업**
- `03-reset.sql`은 **절대 운영 환경에서 실행 금지**
- 스키마 변경 시 **3개 파일 모두 동기화** 필수

## 관련 문서

- [architecture.md](../document/architecture.md) - 시스템 아키텍처
- [development.md](../document/development.md) - 개발 가이드
- [Grid Trader PRD](../document/prd/grid-trader/prd.md) - 기능 요구사항
