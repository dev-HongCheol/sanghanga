"use server";

import { kiwoomClient } from "@/shared/lib/kiwoom/client";
import { logger } from "@/shared/lib/logger";

/**
 * 계좌 잔고 요약 정보
 */
export interface AccountBalance {
	/**
	 * 총매입금액 (원)
	 */
	totalPurchaseAmount: number;
	/**
	 * 총평가금액 (원)
	 */
	totalEvaluationAmount: number;
	/**
	 * 총평가손익금액 (원)
	 */
	totalProfitLoss: number;
	/**
	 * 총수익률 (%)
	 */
	totalReturnRate: number;
	/**
	 * 추정예탁자산 (원)
	 */
	estimatedDepositAsset: number;
	/**
	 * 보유 종목 목록
	 */
	holdings: AccountHolding[];
}

/**
 * 보유 종목 정보
 */
export interface AccountHolding {
	/**
	 * 종목코드
	 */
	stockCode: string;
	/**
	 * 종목명
	 */
	stockName: string;
	/**
	 * 보유수량
	 */
	quantity: number;
	/**
	 * 매매가능수량
	 */
	tradableQuantity: number;
	/**
	 * 매입가 (원)
	 */
	purchasePrice: number;
	/**
	 * 현재가 (원)
	 */
	currentPrice: number;
	/**
	 * 매입금액 (원)
	 */
	purchaseAmount: number;
	/**
	 * 평가금액 (원)
	 */
	evaluationAmount: number;
	/**
	 * 평가손익 (원)
	 */
	profitLoss: number;
	/**
	 * 수익률 (%)
	 */
	returnRate: number;
}

/**
 * kt00018 계좌평가잔고내역 API 응답
 */
interface AccountBalanceResponse {
	return_code: number;
	return_msg: string;
	tot_pur_amt: string;
	tot_evlt_amt: string;
	tot_evlt_pl: string;
	tot_prft_rt: string;
	prsm_dpst_aset_amt: string;
	tot_loan_amt: string;
	tot_crd_loan_amt: string;
	tot_crd_ls_amt: string;
	acnt_evlt_remn_indv_tot: Array<{
		stk_cd: string;
		stk_nm: string;
		rmnd_qty: string;
		trde_able_qty: string;
		pur_pric: string;
		cur_prc: string;
		pur_amt: string;
		evlt_amt: string;
		evltv_prft: string;
		prft_rt: string;
	}>;
}

/**
 * Server Action: 계좌평가잔고내역 조회
 *
 * API ID: kt00018 (계좌평가잔고내역요청)
 * URL: /api/dostk/acnt
 *
 * @param queryType - 조회구분 (1:합산, 2:개별, 기본값: 1)
 * @param exchange - 국내거래소구분 (기본값: KRX)
 * @returns 계좌 잔고 정보
 */
export async function getAccountBalanceAction(
	queryType: "1" | "2" = "1",
	exchange: "KRX" | "NXT" = "KRX"
): Promise<{ success: true; balance: AccountBalance } | { success: false; error: string }> {
	try {
		logger.info("GetAccountBalanceAction", "계좌 잔고 조회 시작");

		const response = await kiwoomClient.request<AccountBalanceResponse>("/api/dostk/acnt", {
			method: "POST",
			headers: { "api-id": "kt00018" },
			body: JSON.stringify({
				qry_tp: queryType,
				dmst_stex_tp: exchange,
			}),
		});

		const balance: AccountBalance = {
			totalPurchaseAmount: Number.parseFloat(response.tot_pur_amt) || 0,
			totalEvaluationAmount: Number.parseFloat(response.tot_evlt_amt) || 0,
			totalProfitLoss: Number.parseFloat(response.tot_evlt_pl) || 0,
			totalReturnRate: Number.parseFloat(response.tot_prft_rt) || 0,
			estimatedDepositAsset: Number.parseFloat(response.prsm_dpst_aset_amt) || 0,
			holdings: (response.acnt_evlt_remn_indv_tot || []).map((item) => ({
				stockCode: item.stk_cd,
				stockName: item.stk_nm,
				quantity: Number.parseFloat(item.rmnd_qty) || 0,
				tradableQuantity: Number.parseFloat(item.trde_able_qty) || 0,
				purchasePrice: Number.parseFloat(item.pur_pric) || 0,
				currentPrice: Number.parseFloat(item.cur_prc) || 0,
				purchaseAmount: Number.parseFloat(item.pur_amt) || 0,
				evaluationAmount: Number.parseFloat(item.evlt_amt) || 0,
				profitLoss: Number.parseFloat(item.evltv_prft) || 0,
				returnRate: Number.parseFloat(item.prft_rt) || 0,
			})),
		};

		logger.info("GetAccountBalanceAction", "계좌 잔고 조회 완료", {
			totalEvaluationAmount: balance.totalEvaluationAmount,
			holdingsCount: balance.holdings.length,
		});

		return { success: true, balance };
	} catch (error) {
		logger.error("GetAccountBalanceAction", "계좌 잔고 조회 실패", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "계좌 잔고 조회 중 오류가 발생했습니다.",
		};
	}
}
