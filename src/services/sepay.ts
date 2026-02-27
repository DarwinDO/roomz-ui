/**
 * SePay Payment Adapter
 * VietQR-based payment integration
 */

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

// SePay config from environment variables
const getSePayConfig = (): SePayConfig => ({
    apiKey: import.meta.env.VITE_SEPAY_API_KEY || 'sandbox_key',
    merchantId: import.meta.env.VITE_SEPAY_MERCHANT_ID || 'SP-TEST-NH925239',
    baseUrl: import.meta.env.VITE_SEPAY_BASE_URL || 'https://pgapi-sandbox.sepay.vn',
});

// Bank account for VietQR (from user config)
const getBankConfig = (): { bank: string; account: string; accountName: string } => ({
    bank: import.meta.env.VITE_SEPAY_BANK || 'Vietcombank',
    account: import.meta.env.VITE_SEPAY_ACCOUNT || '9363565884',
    accountName: import.meta.env.VITE_SEPAY_ACCOUNT_NAME || 'RoomZ',
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

    // Generate VietQR URL
    const qrCodeUrl = generateQRUrl(orderCode, amount);

    console.log('[SePay] Creating order:', { orderCode, amount, qrCodeUrl });

    return {
        orderCode,
        qrCodeUrl,
    };
}

/**
 * Verify payment status (placeholder for API call)
 * In production, this would call SePay API to check transaction status
 */
export async function verifyPayment(orderCode: string): Promise<{ success: boolean; transactionId?: string }> {
    console.log('[SePay] Verifying payment:', orderCode);

    // TODO: Implement actual API call to SePay when credentials are ready
    // For now, always return false (payment verification happens via webhook)
    return { success: false };
}

/**
 * Extract order code from payment content
 */
export function extractOrderCode(content: string): string | null {
    const match = content.match(/ROOMZ\d+/i);
    return match ? match[0] : null;
}

/**
 * Create a new order code
 */
export function generateOrderCode(): string {
    return `ROOMZ${Date.now()}`;
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

// Export singleton config for use in other modules
export const sepayConfig = getSePayConfig();
