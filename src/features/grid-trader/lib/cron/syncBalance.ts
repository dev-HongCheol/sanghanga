/**
 * @fileoverview 잔고 동기화 로직
 * @description 계좌 잔고 조회 → 메모리 캐시 + SSE push
 */

import { broadcastBalance } from "@/shared/lib/sse/sse-manager";
import { updateBalance } from "@/shared/lib/cache/balance-cache";
import { logger } from "@/shared/lib/logger";
import { kiwoomClient } from "@/shared/lib/kiwoom/client";
import { AccountBalance } from "../../api/getAccountBalance.action";


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
 * 계좌 잔고 조회 (Server Action 없이 직접 호출)
 */
async function getAccountBalance(): Promise<AccountBalance | null> {
	try {
		const response = await kiwoomClient.request<AccountBalanceResponse>("/api/dostk/acnt", {
			method: "POST",
			headers: { "api-id": "kt00018" },
			body: JSON.stringify({
				qry_tp: "1",
				dmst_stex_tp: "KRX",
			}),
		});

		const holdings = (response.acnt_evlt_remn_indv_tot || []).map((item) => ({
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
		}));

		const balance: AccountBalance = {
			totalPurchaseAmount: Number.parseFloat(response.tot_pur_amt) || 0,
			totalEvaluationAmount: Number.parseFloat(response.tot_evlt_amt) || 0,
			totalProfitLoss: Number.parseFloat(response.tot_evlt_pl) || 0,
			totalReturnRate: Number.parseFloat(response.tot_prft_rt) || 0,
			estimatedDepositAsset: Number.parseFloat(response.prsm_dpst_aset_amt) || 0,
			holdings,
		};

		return balance;
	} catch (error) {
		logger.error("GetAccountBalance", "계좌 잔고 조회 실패", {
			error: error instanceof Error ? error.message : String(error),
		});
		return null;
	}
}

/**
 * 잔고 동기화 비즈니스 로직
 * @description Cron과 Route Handler에서 공용으로 사용
 */
export async function syncBalanceLogic() {
	try {
		// 계좌 잔고 조회
		const balance = await getAccountBalance();

		if (!balance) {
			return {
				success: false,
				error: "잔고 조회 실패",
			};
		}

		// 메모리 캐시 업데이트
		updateBalance(balance);

		// SSE 브로드캐스트
		await broadcastBalance(balance);

		logger.info(
			"CronSyncBalance",
			"잔고 동기화 완료",
			{
				totalEvaluationAmount: balance.totalEvaluationAmount,
				holdingsCount: balance.holdings.length,
			},
			true
		);

		return {
			success: true,
			balance: {
				totalEvaluationAmount: balance.totalEvaluationAmount,
				totalProfitLoss: balance.totalProfitLoss,
				totalReturnRate: balance.totalReturnRate,
				holdingsCount: balance.holdings.length,
			},
		};
	} catch (error) {
		logger.error("CronSyncBalance", "잔고 동기화 오류", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : "잔고 동기화 중 오류 발생",
		};
	}
}
