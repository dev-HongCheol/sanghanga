# 전역 레이아웃 및 사이드바 단위 테스트 명세

## 테스트 대상
- `src/widgets/layout/ui/AppSidebar.tsx`
- `src/shared/config/routes.ts`

## 테스트 범위 및 케이스

### 1. AppSidebar 컴포넌트
- [ ] **렌더링**
  - 사이드바가 정상 렌더링됨
  - "sanghanga" 로고가 표시됨
  - 로고가 메인 페이지(`/`) 링크를 가짐
- [ ] **메뉴 구조**
  - ROUTES 배열의 모든 메뉴가 렌더링됨
  - 1depth 메뉴 아이템이 표시됨
  - 2depth 메뉴가 있는 경우 Collapsible로 렌더링됨
  - 아이콘이 있는 경우 아이콘이 표시됨
- [ ] **현재 경로 하이라이트**
  - pathname이 메뉴 href와 일치하면 `isActive=true`
  - pathname이 메뉴 href로 시작하면 부모 메뉴 활성화
  - 2depth 메뉴 클릭 시 해당 메뉴만 활성화
- [ ] **Collapsible 동작**
  - 현재 활성 메뉴는 기본으로 펼쳐짐 (`defaultOpen`)
  - ChevronDown 아이콘이 펼침/접기 상태에 따라 회전

### 2. 라우트 설정
- [ ] **ROUTES 객체**
  - ROUTES 배열이 정의됨
  - 각 Route는 label, href 필수 속성을 가짐
  - children이 있는 경우 Route[] 타입
- [ ] **MAIN_ROUTE 객체**
  - label이 "Sanghanga"
  - href가 "/"

## 핵심 패턴
- `next/navigation`의 `usePathname`을 Mock하여 현재 경로 시뮬레이션
- `lucide-react` 아이콘을 Mock 컴포넌트로 대체

## 교육용 주석
- 각 테스트에 상세한 설명 주석 작성
- Mocking의 목적과 Vitest API 활용법 설명
