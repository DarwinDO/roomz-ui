/**
 * SePay Payment Adapter
 * VietQR-based payment integration
 */

import { supabase } from '@/lib/supabase';

export interface VerifyPaymentResult {
    success: boolean;
    status?: 'pending' | 'paid' | 'manual_review' | 'expired' | 'cancelled';
    transactionId?: string;
    message?: string;
    source?: 'db' | 'sepay_api';
}

type RuntimeEnv = { DEV?: boolean } & Record<string, string | undefined>;
type GetSessionResult = Awaited<ReturnType<typeof supabase.auth.getSession>>;
type InvokeVerifyPaymentResult = Awaited<ReturnType<typeof supabase.functions.invoke>>;

interface PublicPaymentConfig {
    bankCode: string;
    accountNumber: string;
}

interface VerifyPaymentDeps {
    getSession: () => Promise<GetSessionResult>;
    invokeVerifyPayment: (
        accessToken: string,
        orderCode: string,
    ) => Promise<InvokeVerifyPaymentResult>;
}

const env = (import.meta as ImportMeta & {
    env?: RuntimeEnv;
}).env ?? {};
const isDev = env.DEV === true;

const defaultVerifyPaymentDeps: VerifyPaymentDeps = {
    getSession: () => supabase.auth.getSession(),
    invokeVerifyPayment: (accessToken, orderCode) =>
        supabase.functions.invoke('sepay-verify-payment', {
            body: { orderCode },
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }),
};

function getPublicPaymentConfig(): PublicPaymentConfig {
    const bankCode = env.VITE_PAYMENT_BANK;
    const accountNumber = env.VITE_PAYMENT_ACCOUNT;

    if (!bankCode || !accountNumber) {
        throw new Error('Missing public payment config. Set VITE_PAYMENT_BANK and VITE_PAYMENT_ACCOUNT.');
    }

    return { bankCode, accountNumber };
}

/**
 * Generate VietQR URL for payment
 * Format: https://qr.sepay.vn/img?bank=BANK&acc=ACCOUNT&amount=AMOUNT&des=DESCRIPTION
 */
export function generateQRUrl(orderCode: string, amount: number): string {
    const paymentConfig = getPublicPaymentConfig();
    const params = new URLSearchParams({
        bank: paymentConfig.bankCode,
        acc: paymentConfig.accountNumber,
        amount: amount.toString(),
        des: orderCode,
    });

    return `https://qr.sepay.vn/img?${params.toString()}`;
}

export async function verifyPayment(
    orderCode: string,
    deps: VerifyPaymentDeps = defaultVerifyPaymentDeps,
): Promise<VerifyPaymentResult> {
    if (isDev) {
        console.log('[SePay] Verifying payment:', orderCode);
    }

    const { data: sessionData, error: sessionError } = await deps.getSession();
    if (sessionError) {
        throw sessionError;
    }

    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const { data, error } = await deps.invokeVerifyPayment(accessToken, orderCode);

    if (error) {
        const context = (error as { context?: Response }).context;
        let serverMessage: string | null = null;

        if (context) {
            const payload = await context.clone().json().catch(() => null) as
                | { error?: string; message?: string }
                | null;
            serverMessage = payload?.error || payload?.message || null;
        }

        throw new Error(serverMessage || error.message || 'Không thể xác minh thanh toán.');
    }

    return (data ?? { success: false }) as VerifyPaymentResult;
}
