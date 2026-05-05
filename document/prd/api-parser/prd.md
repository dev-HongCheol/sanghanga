# PRD: 키움 REST API 문서 파서 (Excel to AI-Friendly Markdown)

이 도구는 `kiwoom-api-docs.xlsx` 파일을 분석하여, 대분류/중분류별로 구조화된 AI 친화적 마크다운 문서를 자동으로 생성하고 전체 목록(Index)을 관리합니다.

## 1. 목적
- 엑셀 시트에 파편화된 API 정보를 통합하여 일관된 마크다운 문서로 변환
- AI(Gemini/Claude)가 즉시 TypeScript 인터페이스 및 API 호출 코드를 생성할 수 있도록 최적화된 데이터 포맷 제공
- 전체 API 목록(`index.md`) 자동 생성을 통한 탐색 효율성 극대화 및 토큰 비용 절감

## 2. 데이터 구조 및 파싱 전략

### 2.0 API ID 체계 및 파싱 범위

키움 REST API의 API ID는 prefix에 따라 성격이 구분됩니다:

| Prefix | 설명 | 파싱 여부 |
| :----- | :--- | :-------- |
| `au`   | OAuth 인증 REST API | ✅ 포함 |
| `ka`   | 국내주식 조회 REST API | ✅ 포함 |
| `kt`   | 국내주식 주문/계좌 REST API | ✅ 포함 |
| 숫자/알파 (e.g. `00`, `0A`, `1h`) | **실시간시세 WebSocket API** | ❌ 제외 (별도 파서 필요) |

> **주의**: `kt` prefix를 누락하면 주문(kt10000~), 계좌(kt00001~) 관련 REST API 문서가 생성되지 않습니다.

#### 실시간시세 WebSocket API 제외 이유
- ID 패턴이 `au`/`ka`/`kt`와 달리 숫자+알파벳 혼합 (예: `00`, `04`, `0A`, `0B`, `0g`, `1h`)
- REST API가 아닌 **WebSocket 구독 기반** 프로토콜로 동작 (연결 방식, 요청/응답 구조 상이)
- 현재 파서는 REST API 전용으로 설계되어 별도 파서 구현 필요
- 제외된 실시간시세 항목 (총 19개):

| API ID | 명칭 |
| :----- | :--- |
| `00` | 주문체결 |
| `04` | 잔고 |
| `0A` | 주식기세 |
| `0B` | 주식체결 |
| `0C` | 주식우선호가 |
| `0D` | 주식호가잔량 |
| `0E` | 주식시간외호가 |
| `0F` | 주식당일거래원 |
| `0G` | ETF NAV |
| `0H` | 주식예상체결 |
| `0I` | 국제금환산가격 |
| `0J` | 업종지수 |
| `0U` | 업종등락 |
| `0g` | 주식종목정보 |
| `0m` | ELW 이론가 |
| `0s` | 장시작시간 |
| `0u` | ELW 지표 |
| `0w` | 종목프로그램매매 |
| `1h` | VI발동/해제 |

### 2.1 목차 파싱 (Sheet 0: "목차")
- **대상 컬럼**: `API ID`, `API 명`, `대분류`, `중분류`, `URL` 수집
- **역할**: 
  - 전체 API의 마스터 리스트 수집 및 메타데이터 관리
  - 파일 저장 경로 결정: `document/api/{대분류}/{중분류}/{API_ID}_{API_명}.md`
- **필터 조건**: `apiId.startsWith("au") || apiId.startsWith("ka") || apiId.startsWith("kt")`

### 2.2 상세 시트 파싱 (API ID 매칭 시트)
- **섹션별 추출 로직**:
  1. **API 정보**: 메뉴 위치, API 명, API ID 추출 (테이블 포맷)
  2. **기본 정보**: Method, 도메인, URL, Format, Content-Type 추출
  3. **개요**: API 기능 설명 텍스트 추출
  4. **Request/Response 테이블**:
     - `Element`, `한글명`, `Type`, `Required`, `Length`, `Description` 등 엑셀 헤더에 맞춘 가변 대응
  5. **Example 블록**:
     - `Request Example`, `Response Example` 내의 JSON 텍스트를 감지하여 코드 블록(```json) 처리

### 2.3 인덱스 생성 (index.md)
- 모든 API를 대분류 > 중분류 순으로 그룹화
- 각 분류별로 API ID, 명칭, 상세 문서 바로가기 링크가 포함된 테이블 자동 렌더링

## 3. 주요 기능
- [x] **Smart Sheet Selector**: 목차의 `API ID`를 포함하는 시트 이름을 패턴 매칭으로 자동 탐색
- [x] **Category Grouping**: 엑셀의 분류 체계를 폴더 구조로 물리적 반영
- [x] **Index Auto-Generation**: 개별 문서 생성 후 전체 목록을 담은 `index.md` 자동 갱신
- [x] **Data Cleaning**: 줄바꿈 정제 및 엑셀 특유의 포맷팅(빈 셀 처리 등) 자동 최적화
- [ ] **WebSocket Parser**: 실시간시세 WebSocket API(`00`~`1h` 등 숫자/알파 ID) 별도 파서 구현 (현재 미지원)

## 4. 기술 스택
- **Runtime**: Node.js (tsx)
- **Library**: `xlsx` (데이터 추출), `fs-extra` (파일 시스템 제어), `path` (경로 처리)

## 5. 구현 체크리스트
- [x] 목차 시트에서 API 리스트 및 카테고리 메타데이터 수집
- [x] API ID 기반 가변 시트 탐색 및 로딩 로직 (`au`, `ka`, `kt` prefix 지원)
- [x] 섹션 키워드 매칭 기반의 데이터 추출기 (Label-Value 및 Table 인식)
- [x] 마크다운 변환 엔진 (Gfm 테이블 및 JSON 코드 블록 렌더링)
- [x] 대분류/중분류 기준 폴더 구조 자동 생성 및 파일 저장
- [x] 분류별 테이블과 문서 링크가 포함된 `index.md` 자동 생성
- [ ] 실시간시세 WebSocket API 파서 구현 (숫자/알파 ID 체계, WebSocket 프로토콜 명세 변환)

---

## 6. 출력 마크다운 샘플 (실제 구현 결과)
```markdown
# [API_ID] - API_명

## 1. API 정보
| 항목 | 내용 |
| :--- | :--- |
| **메뉴 위치** | 대분류 > 중분류 > API명 |

## 2. 기본 정보
| 항목 | 내용 |
| :--- | :--- |
| **Method** | POST |
| **URL** | /api/url |

## 4. Request
| 구분 | Element | 한글명 | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Body | stk_cd | 종목코드 | String | Y | |

## 6. Request Example
```json
{ "stk_cd": "005930" }
```
