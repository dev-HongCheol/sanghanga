import type { ReactNode } from "react";
import { Separator } from "./separator";

interface PageHeaderProps {
	/** 페이지 제목 */
	title: string;
	/** 페이지 설명 */
	description?: string;
	/** 우측 액션 버튼 영역 (선택) */
	actions?: ReactNode;
}

/**
 * 페이지 상단 헤더 컴포넌트
 *
 * 페이지 타이틀과 설명을 일관된 스타일로 표시합니다.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="거래대금 기반"
 *   description="거래대금, 시가총액, 상승 패턴 조건을 조합하여 종목을 검색합니다."
 * />
 * ```
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
	return (
		<div className="space-y-4">
			<div className="flex items-start justify-between">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold tracking-tight">{title}</h1>
					{description && <p className="text-muted-foreground">{description}</p>}
				</div>
				{actions && <div className="flex items-center gap-2">{actions}</div>}
			</div>
			<Separator />
		</div>
	);
}
