import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type PaymentOrderRow = {
    id: string;
    user_id: string;
    order_code: string;
    amount: number;
    status: 'pending' | 'paid' | 'expired' | 'manual_review' | 'cancelled';
    created_at: string;
    expires_at: string;
};

type SePayTransaction = {
    id?: number | string;
    gateway?: string;
    transactionDate?: string;
    transaction_date?: string;
    accountNumber?: string;
    account_number?: string;
    amountIn?: number | string;
    amount_in?: number | string;
    amountOut?: number | string;
    amount_out?: number | string;
    transactionContent?: string;
    transaction_content?: string;
    content?: string;
    description?: string;
    referenceNumber?: string;
    reference_number?: string;
    referenceCode?: string;
    reference_code?: string;
};

type SePayTransactionsResponse = {
    status?: number;
    error?: boolean;
    messages?: {
        success?: boolean;
        message?: string;
    };
    transactions?: SePayTransaction[];
};

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SEPAY_API_KEY = Deno.env.get("SEPAY_API_KEY");
const SEPAY_ACCOUNT = Deno.env.get("SEPAY_ACCOUNT") || "0363565884";
const SEPAY_USERAPI_BASE_URL = Deno.env.get("SEPAY_USERAPI_BASE_URL") || "https://my.sepay.vn/userapi";

function jsonResponse(payload: unknown, status = 200): Response {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

function toFiniteNumber(value: unknown): number | null {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function getTransactionAmountIn(transaction: SePayTransaction): number | null {
    return toFiniteNumber(transaction.amountIn ?? transaction.amount_in);
}

function getTransactionContent(transaction: SePayTransaction): string {
    return (
        transaction.transactionContent ??
        transaction.transaction_content ??
        transaction.content ??
        transaction.description ??
        ""
    );
}

function getTransactionReference(transaction: SePayTransaction): string {
    return String(
        transaction.referenceNumber ??
        transaction.reference_number ??
        transaction.referenceCode ??
        transaction.reference_code ??
        transaction.id ??
        "unknown"
    );
}

function formatDateOnly(dateIso: string): string {
    return new Date(dateIso).toISOString().slice(0, 10);
}

function findMatchingTransaction(
    transactions: SePayTransaction[],
    orderCode: string,
    amount: number,
): SePayTransaction | null {
    const normalizedOrderCode = orderCode.toLowerCase();

    return (
        transactions.find((transaction) => {
            const transactionAmount = getTransactionAmountIn(transaction);
            if (transactionAmount !== amount) {
                return false;
            }

            const content = getTransactionContent(transaction).toLowerCase();
            return content.includes(normalizedOrderCode);
        }) ?? null
    );
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return jsonResponse({ error: "Thiếu thông tin xác thực." }, 401);
        }

        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user }, error: authError } = await userClient.auth.getUser();
        if (authError || !user) {
            return jsonResponse({ error: "Token đăng nhập không hợp lệ." }, 401);
        }

        const { orderCode } = await req.json() as { orderCode?: string };
        if (!orderCode || typeof orderCode !== "string") {
            return jsonResponse({ error: "orderCode là bắt buộc." }, 400);
        }

        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: order, error: orderError } = await adminClient
            .from("payment_orders")
            .select("id, user_id, order_code, amount, status, created_at, expires_at")
            .eq("order_code", orderCode)
            .eq("user_id", user.id)
            .maybeSingle<PaymentOrderRow>();

        if (orderError) {
            throw orderError;
        }

        if (!order) {
            return jsonResponse({
                success: false,
                status: "pending",
                message: "Không tìm thấy order.",
            }, 404);
        }

        if (order.status !== "pending") {
            return jsonResponse({
                success: order.status === "paid",
                status: order.status,
                source: "db",
            });
        }

        if (!SEPAY_API_KEY) {
            return jsonResponse({
                success: false,
                status: "pending",
                source: "sepay_api",
                message: "SEPAY_API_KEY chưa được cấu hình ở server.",
            });
        }

        const params = new URLSearchParams({
            limit: "50",
            account_number: SEPAY_ACCOUNT,
            amount_in: String(order.amount),
            transaction_date_min: formatDateOnly(order.created_at),
        });

        const response = await fetch(`${SEPAY_USERAPI_BASE_URL}/transactions/list?${params.toString()}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${SEPAY_API_KEY}`,
                Accept: "application/json",
            },
        });

        const responseText = await response.text();
        let payload: SePayTransactionsResponse | null = null;

        try {
            payload = JSON.parse(responseText) as SePayTransactionsResponse;
        } catch {
            payload = null;
        }

        if (!response.ok) {
            return jsonResponse({
                success: false,
                status: "pending",
                source: "sepay_api",
                message: payload?.messages?.message || `SePay verify failed with HTTP ${response.status}.`,
            });
        }

        const transactions = Array.isArray(payload?.transactions) ? payload.transactions : [];
        const matchedTransaction = findMatchingTransaction(transactions, order.order_code, order.amount);

        if (!matchedTransaction) {
            return jsonResponse({
                success: false,
                status: "pending",
                source: "sepay_api",
                message: "Chưa thấy giao dịch khớp trên SePay.",
            });
        }

        const transactionId = getTransactionReference(matchedTransaction);
        const { data: processResult, error: processError } = await adminClient.rpc("process_payment_order", {
            p_order_code: order.order_code,
            p_amount: order.amount,
            p_transaction_id: transactionId,
            p_payload: {
                source: "sepay_verify_payment",
                transaction: matchedTransaction,
            },
        });

        if (processError) {
            throw processError;
        }

        const result = processResult as {
            success?: boolean;
            error?: string;
            expected_amount?: number;
            received_amount?: number;
        } | null;

        if (!result?.success) {
            const status =
                result?.error?.includes("Amount mismatch")
                    ? "manual_review"
                    : result?.error?.includes("expired")
                        ? "expired"
                        : "pending";

            return jsonResponse({
                success: false,
                status,
                source: "sepay_api",
                transactionId,
                message: result?.error || "Không thể xử lý payment order.",
            });
        }

        return jsonResponse({
            success: true,
            status: "paid",
            source: "sepay_api",
            transactionId,
        });
    } catch (error) {
        console.error("[SePay Verify] Error:", error);
        return jsonResponse({ error: "Internal server error" }, 500);
    }
});
