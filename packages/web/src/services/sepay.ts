/**
 * SePay Payment Adapter
 * VietQR-based payment integration
 */

import { supabase } from '@/lib/supabase';

export interface SePayConfig {
    apiKey: string;
    merchantId: string;
    baseUrl: string;
}

export interface CreateOrderParams {
    orderCode: string;
    amount: number;
    description: string;
}

export interface SePayOrder {
    orderCode: string;
    qrCodeUrl: string;
}

export interface SePayWebhookPayload {
    id: number;
    gateway: string;
    transactionDate: string;
    accountNumber: string;
    code: string | null;
    content: string;
    transferType: string;
    transferAmount: number;
    accumulated: number;
    subAccount: string | null;
    referenceCode: string;
    description: string;
}

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

// SePay config from environment variables
const getSePayConfig = (): SePayConfig => ({
    apiKey: env.VITE_SEPAY_API_KEY || 'sandbox_key',
    merchantId: env.VITE_SEPAY_MERCHANT_ID || 'SP-TEST-NH925239',
    baseUrl: env.VITE_SEPAY_BASE_URL || 'https://pgapi-sandbox.sepay.vn',
});

// Bank account for VietQR (from user config)
const getBankConfig = (): { bank: string; account: string; accountName: string } => ({
    bank: env.VITE_SEPAY_BANK || 'MB',
    account: env.VITE_SEPAY_ACCOUNT || '0363565884',
    accountName: env.VITE_SEPAY_ACCOUNT_NAME || 'NGUYEN HOANG VIET DO',
});

/**
 * Generate VietQR URL for payment
 * Format: https://qr.sepay.vn/img?bank=BANK&acc=ACCOUNT&amount=AMOUNT&des=DESCRIPTION
 */
export function generateQRUrl(orderCode: string, amount: number): string {
    const bankConfig = getBankConfig();
    const params = new URLSearchParams({
        bank: bankConfig.bank,
        acc: bankConfig.account,
        amount: amount.toString(),
        des: orderCode,
    });
    return `https://qr.sepay.vn/img?${params.toString()}`;
}

/**
 * Create a new payment order
 */
export function createPaymentOrder(params: CreateOrderParams): SePayOrder {
    const { orderCode, amount } = params;

    const qrCodeUrl = generateQRUrl(orderCode, amount);

    if (isDev) {
        console.log('[SePay] Creating order:', { orderCode, amount, qrCodeUrl });
    }

    return {
        orderCode,
        qrCodeUrl,
    };
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

/**
 * Extract order code from payment content
 */
export function extractOrderCode(content: string): string | null {
    const match = content.match(/ROMMZ\d+/i);
    return match ? match[0] : null;
}

/**
 * Create a new order code
 */
export function generateOrderCode(): string {
    return `ROMMZ${Date.now()}`;
}

/**
 * Calculate order expiration time
 * Default: 20 minutes (15 display + 5 grace)
 */
export function getOrderExpiration(minutes: number = 20): Date {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
    return expiresAt;
}

export const sepayConfig = getSePayConfig();
