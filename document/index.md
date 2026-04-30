# 문서 목록

## 📚 주요 문서

| 문서              | 설명                                       |링크                                         |
| ----------------- | ------------------------------------------ | -------------------------------------------- |
| **아키텍처 설계** | 시스템 구조, FSD, Docker 배포              | [architecture.md](./architecture.md)         |
| **설치 및 설정**  | 환경 설정, Docker 설정, 키움 API 설정      | [setup.md](./setup.md)                       |
| **개발 가이드**   | FSD 구조, Next.js 개발, API 패턴           | [development.md](./development.md)           |
| **코딩 규칙**     | 필수 준수 사항, 파일 네이밍, PRD 작성 규칙 | [coding-standards.md](./coding-standards.md) |
| **테스트 표준**   | 테스트 프레임워크, 교육용 주석 규칙        | [testing-standards.md](./testing-standards.md) |
| **API 사용법**    | 키움 REST API, OAuth 2.0, WebSocket        | [api-guide.md](./api-guide.md)               |
| **API 상세 명세** | 키움 API 상세 스키마 및 예제 (자동 생성)   | [api/](./api/README.md)                      |

## 📋 PRD 목록

> PRD(Product Requirements Document) 작성 시 이 목록에 추가하세요.

| 기능명                       | 상태    | 작성일     | 담당자 | 링크                                  |
| ---------------------------- | ------- | ---------- | ------ | ------------------------------------- |
| 프로젝트 초기 설정           | ✅ 완료 | 2026-03-25 | -      | [prd](./prd/project-setup/prd.md)     |
| 키움 API 인증 및 토큰 관리   | ✅ 완료 | 2026-03-25 | -      | [prd](./prd/kiwoom-auth/prd.md)       |
| 실시간 종목조회순위 조회     | 🚧 진행중 | 2026-03-26 | -      | [prd](./prd/stock-ranking/prd.md)     |
| 전역 레이아웃 및 사이드바    | 🚧 진행중 | 2026-03-27 | -      | [prd](./prd/layout-sidebar/prd.md)    |
| 거래대금 기반 종목 검색      | 📝 작성중 | 2026-03-27 | -      | [prd](./prd/trading-volume-screener/prd.md) |
| 박스권 자동 매매 시스템      | 📝 작성중 | 2026-04-30 | -      | [prd](./prd/grid-trader/prd.md) |
| _예시: 주문 위젯_            | _✅ 완료_ | _2024-01-15_ | _-_    | _[prd](./prd/order-widget/prd.md)_    |

### 상태 표시

- 📝 **작성중**: PRD 작성 중
- 🚧 **진행중**: 구현 중
- ✅ **완료**: 구현 완료
- ⏸️ **보류**: 일시 중단
- ❌ **취소**: 기능 취소

## 📁 문서 폴더 구조

```
document/
├── index.md                    # 이 파일
├── architecture.md             # 아키텍처
├── setup.md                    # 설치 및 설정
├── development.md              # 개발 가이드
├── coding-standards.md         # 코딩 규칙
├── api-guide.md                # 키움 API
└── prd/                        # PRD 폴더
    └── {기능명}/
        ├── prd.md              # PRD 본문
        ├── ui-capture.png      # UI 캡처
        └── api-spec.md         # API 명세 (선택)
```

## 🔄 문서 업데이트 프로세스

1. **새 기능 개발 시**:
   - `document/prd/{기능명}/` 폴더 생성
   - `prd.md` 작성
   - 이 파일(`index.md`)의 PRD 목록에 추가

2. **기능 구현 중**:
   - PRD 상태를 🚧 진행중으로 업데이트

3. **기능 완료 시**:
   - PRD 상태를 ✅ 완료로 업데이트
   - 관련 문서 업데이트

## 📖 외부 참고 자료

### Next.js & React

- [Next.js 공식 문서](https://nextjs.org/docs) - App Router, Server Components
- [React 공식 문서](https://react.dev/) - React 18+ 기능

### 아키텍처 & 디자인 패턴

- [Feature-Sliced Design](https://feature-sliced.design/) - FSD 아키텍처 공식 문서
- [Bulletproof React](https://github.com/alan2207/bulletproof-react) - React 프로젝트 구조 참고

### UI & 스타일링

- [Shadcn UI](https://ui.shadcn.com/) - UI 컴포넌트 라이브러리
- [Tailwind CSS](https://tailwindcss.com/) - 유틸리티 CSS 프레임워크
- [Lucide Icons](https://lucide.dev/) - 아이콘

### 상태 관리 & 데이터 페칭

- [TanStack Query](https://tanstack.com/query/latest) - 서버 상태 관리
- [Zustand](https://zustand-demo.pmnd.rs/) - 클라이언트 전역 상태 관리

### 타입스크립트 & 검증

- [TypeScript 공식 문서](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/) - 스키마 검증

### 배포 & DevOps

- [Docker 공식 문서](https://docs.docker.com/)
- [PM2 문서](https://pm2.keymetrics.io/) - 프로세스 관리
- [Nginx 문서](https://nginx.org/en/docs/) - 리버스 프록시

### 키움증권 API

- [키움 Open API Portal](https://apiportal.kiwoom.com/) - 앱 등록 및 IP 관리
- [키움 API 개발 가이드](https://apiportal.kiwoom.com/docs) - API 명세서

## ⚠️ 주의사항

1. **PRD 없는 구현 금지**: 반드시 PRD 작성 후 구현
2. **index.md 업데이트**: PRD 추가/수정 시 반드시 업데이트
3. **문서 동기화**: 코드 변경 시 관련 문서도 함께 업데이트
