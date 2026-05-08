/**
 * 주가 색상 스킴 전역 상태 관리
 *
 * 한국/미국 시장별 주가 색상 표시 방식을 설정합니다.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 색상 스킴 타입
 */
export type PriceColorScheme = "korea" | "us";

/**
 * 주가 색상 스킴 스토어 인터페이스
 */
interface PriceColorSchemeStore {
	/** 현재 색상 스킴 (기본값: "korea") */
	scheme: PriceColorScheme;

	/**
	 * 색상 스킴 변경
	 *
	 * @param scheme - 새로운 색상 스킴
	 */
	setScheme: (scheme: PriceColorScheme) => void;
}

/**
 * 주가 색상 스킴 Zustand 스토어
 *
 * localStorage에 자동으로 저장되어 설정이 유지됩니다.
 */
export const usePriceColorScheme = create<PriceColorSchemeStore>()(
	persist(
		(set) => ({
			scheme: "korea",
			setScheme: (scheme) => set({ scheme }),
		}),
		{
			name: "price-color-scheme", // localStorage 키
		}
	)
);
