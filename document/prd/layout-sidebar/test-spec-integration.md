# 전역 레이아웃 및 사이드바 - 통합 테스트 명세

## 영향받는 기존 테스트

⚠️ **이 PRD는 다음 기존 테스트를 대체합니다**:
- [`document/prd/project-setup/test-spec.md`](../project-setup/test-spec.md) > TC-INT-002 (홈 페이지)
  - **변경 내용**: `app/page.tsx` → `app/(auth)/page.tsx` (이동 + 내용 변경)
  - **조치**: 아래 "메인 페이지 렌더링" 테스트 케이스로 대체됨

## 테스트 대상

- `app/(auth)/layout.tsx`
- `app/(auth)/page.tsx` (기존 `app/page.tsx`에서 이동)
- `src/widgets/layout/ui/AppSidebar.tsx`
- 실제 페이지 네비게이션

## 테스트 시나리오

### 1. 레이아웃 렌더링

- [ ] (auth) 레이아웃이 사이드바를 포함하여 렌더링됨
- [ ] SidebarProvider로 감싸져 있음
- [ ] 헤더에 SidebarTrigger가 표시됨
- [ ] 메인 콘텐츠 영역에 children이 렌더링됨

### 2. 로고 네비게이션

- [ ] "sanghanga" 로고 클릭 시 메인 페이지(/)로 이동
- [ ] URL이 `/`로 변경됨
- [ ] 메인 페이지 콘텐츠가 표시됨

### 3. 메뉴 네비게이션

- [ ] "실시간 주도주" 메뉴 클릭 시 펼쳐짐
- [ ] "거래대금 상위 기업" 클릭 시 `/stock-ranking/trading-value`로 이동
- [ ] 페이지 이동 후 해당 메뉴가 하이라이트됨
- [ ] "테마 대장주" 클릭 시 `/stock-ranking/theme-leader`로 이동
- [ ] 페이지 이동 후 해당 메뉴가 하이라이트됨

### 4. Collapsible 상호작용

- [ ] 1depth 메뉴 클릭 시 2depth 메뉴 펼침/접기 토글
- [ ] 현재 활성화된 메뉴의 부모는 자동으로 펼쳐짐
- [ ] ChevronDown 아이콘 애니메이션 동작

### 5. 사이드바 토글

**중요**: SidebarTrigger는 Shadcn UI 내부 컴포넌트로, `aria-label`이나 텍스트 없이 버튼만 렌더링될 수 있습니다.

- [ ] SidebarTrigger 버튼이 헤더에 렌더링됨
- [ ] 버튼 클릭 시 사이드바 열림/닫힘 상태 토글
- [ ] 모바일 화면에서 사이드바가 오버레이로 표시됨

**테스트 방법**:
```typescript
// "Toggle Sidebar" 텍스트 대신 버튼 역할로 찾기
const trigger = screen.getByRole('button', {
  name: /toggle/i  // 또는 data-testid 사용
});
```

또는 SidebarTrigger에 명시적 aria-label 추가:
```tsx
<SidebarTrigger aria-label="사이드바 토글" className="-ml-1" />
```

### 6. 다크모드 테마

- [ ] html에 `className="dark"` 적용됨
- [ ] 사이드바가 다크 테마 색상으로 렌더링됨
- [ ] 메인 콘텐츠가 다크 배경으로 표시됨

### 7. 메인 페이지 렌더링 (기존 TC-INT-002 대체)

⚠️ **대체**: [`project-setup/test-spec.md`](../project-setup/test-spec.md) > TC-INT-002

- [ ] `app/(auth)/page.tsx`가 에러 없이 렌더링됨
- [ ] "대시보드" h1 제목이 표시됨
- [ ] 설명 텍스트 "키움증권 REST API를 활용한 실시간 웹 트레이딩 플랫폼"이 표시됨
- [ ] 페이지가 사이드바 레이아웃 안에서 렌더링됨

## 회귀 테스트

⚠️ **다른 기능 구현 시 이 테스트 재실행 필수**:
- 사이드바 상태를 사용하는 모든 컴포넌트 추가 시
- 라우트 추가/수정 시
- 레이아웃 변경 시

## 핵심 패턴

- **실제 Next.js Navigation**: `useRouter`, `usePathname` 등 실제 동작 테스트
- **DOM 쿼리**: `screen.getByRole`, `screen.getByText`로 실제 렌더링 확인
- **사용자 시뮬레이션**: `fireEvent.click`, `userEvent.click`으로 상호작용 테스트
- **Shadcn UI 주의사항**: 일부 컴포넌트는 내부 구현에 따라 접근성 라벨이 없을 수 있으므로, 필요시 `aria-label` 추가 또는 `data-testid` 사용
