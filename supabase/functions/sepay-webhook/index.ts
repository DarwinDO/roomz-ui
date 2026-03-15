/**
 * SePay Webhook Handler
 * Processes payment notifications from SePay
 * 
 * IMPROVEMENTS:
 * - Uses atomic RPC (process_payment_order) to prevent race conditions
 * - Row-level locking with SELECT FOR UPDATE
 * - Idempotent processing (safe to retry)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface SePayWebhookPayload {
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

interface SePayGatewayOrderPayload {
    notification_type?: string;
    id?: string | number;
    order?: {
        id?: string | number;
        order_invoice_number?: string;
        order_code?: string;
        code?: string;
        amount?: number | string;
    };
    transaction?: {
        id?: string | number;
        transaction_id?: string;
        reference_code?: string;
        amount?: number | string;
        transaction_amount?: number | string;
        content?: string;
        bank_transaction_content?: string;
    };
}

interface NormalizedWebhookPayload {
    orderCode: string | null;
    amount: number | null;
    transactionId: string | null;
    webhookId: string | null;
    eventType: string;
    idempotencyKey: string;
    contentPreview: string | null;
}

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Generate HMAC-SHA256 signature
 */
async function generateHMAC(body: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

function parseAuthorizationValue(header: string | null): string | null {
    if (!header) return null;
    const trimmed = header.trim();
    const match = trimmed.match(/^(?:Apikey|ApiKey|Bearer|Token)\s+(.+)$/i);
    return match ? match[1].trim() : trimmed;
}

async function verifyRequestAuth(req: Request, rawBody: string, secret: string): Promise<{
    ok: boolean;
    scheme: 'api_key' | 'secret_key' | 'hmac' | 'missing';
}> {
    const apiKey = parseAuthorizationValue(req.headers.get("authorization"));
    if (apiKey && apiKey === secret) {
        return { ok: true, scheme: 'api_key' };
    }

    const directApiKey = req.headers.get("apikey");
    if (directApiKey && directApiKey === secret) {
        return { ok: true, scheme: 'api_key' };
    }

    const xApiKey = req.headers.get("x-api-key");
    if (xApiKey && xApiKey === secret) {
        return { ok: true, scheme: 'api_key' };
    }

    const xSecretKey = req.headers.get("x-secret-key");
    if (xSecretKey && xSecretKey === secret) {
        return { ok: true, scheme: 'secret_key' };
    }

    const signature = req.headers.get("x-sepay-signature");
    if (signature) {
        const expectedSignature = await generateHMAC(rawBody, secret);
        if (signature === expectedSignature) {
            return { ok: true, scheme: 'hmac' };
        }
    }

    return { ok: false, scheme: 'missing' };
}

function toFiniteNumber(value: unknown): number | null {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeWebhookPayload(payload: SePayWebhookPayload | SePayGatewayOrderPayload): NormalizedWebhookPayload {
    if ('transferAmount' in payload) {
        const orderCodeMatch = payload.content?.match(/ROMMZ\d+/i);
        const orderCode = orderCodeMatch ? orderCodeMatch[0] : null;
        const webhookId = payload.id != null ? String(payload.id) : null;
        const transactionId = payload.referenceCode ?? null;
        const eventType = 'payment_received';
        const idempotencyKey = webhookId
            ? `sepay:${webhookId}`
            : `sepay:${transactionId ?? 'unknown'}:${payload.transactionDate ?? 'unknown'}`;

        return {
            orderCode,
            amount: toFiniteNumber(payload.transferAmount),
            transactionId,
            webhookId,
            eventType,
            idempotencyKey,
            contentPreview: payload.content ?? null,
        };
    }

    const orderCode =
        payload.order?.order_invoice_number ??
        payload.order?.order_code ??
        payload.order?.code ??
        null;

    const amount =
        toFiniteNumber(payload.transaction?.transaction_amount) ??
        toFiniteNumber(payload.transaction?.amount) ??
        toFiniteNumber(payload.order?.amount);

    const transactionId =
        payload.transaction?.transaction_id ??
        (payload.transaction?.id != null ? String(payload.transaction.id) : null) ??
        payload.transaction?.reference_code ??
        (payload.id != null ? String(payload.id) : null);

    const webhookId =
        payload.id != null
            ? String(payload.id)
            : payload.transaction?.id != null
                ? String(payload.transaction.id)
                : payload.order?.id != null
                    ? String(payload.order.id)
                    : null;

    const eventType = payload.notification_type ?? 'payment_received';
    const idempotencyKey = webhookId
        ? `sepay:${eventType}:${webhookId}`
        : `sepay:${eventType}:${transactionId ?? 'unknown'}:${orderCode ?? 'unknown'}`;

    return {
        orderCode,
        amount,
        transactionId,
        webhookId,
        eventType,
        idempotencyKey,
        contentPreview: payload.transaction?.bank_transaction_content ?? payload.transaction?.content ?? orderCode,
    };
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const webhookSecret = Deno.env.get("SEPAY_WEBHOOK_SECRET");
        if (!webhookSecret) {
            console.error("[SePay] Missing webhook secret in environment");
            return new Response(
                JSON.stringify({ error: "Server misconfiguration" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const rawBody = await req.text();
        const authResult = await verifyRequestAuth(req, rawBody, webhookSecret);

        if (!authResult.ok) {
            console.error("[SePay] Unauthorized webhook request", {
                hasAuthorization: Boolean(req.headers.get("authorization")),
                hasApiKey: Boolean(req.headers.get("apikey")),
                hasXApiKey: Boolean(req.headers.get("x-api-key")),
                hasXSecretKey: Boolean(req.headers.get("x-secret-key")),
                hasSignature: Boolean(req.headers.get("x-sepay-signature")),
            });
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const payload = JSON.parse(rawBody) as SePayWebhookPayload | SePayGatewayOrderPayload;
        const normalized = normalizeWebhookPayload(payload);
        console.log("[SePay] Received webhook:", {
            auth: authResult.scheme,
            eventType: normalized.eventType,
            orderCode: normalized.orderCode,
            transactionId: normalized.transactionId,
            amount: normalized.amount,
            content: normalized.contentPreview?.substring(0, 80),
        });

        if (!normalized.orderCode) {
            console.warn("[SePay] No valid order code found in payload");
            return new Response(
                JSON.stringify({ error: "No valid order code" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (normalized.amount == null) {
            console.warn("[SePay] No valid amount found in payload");
            return new Response(
                JSON.stringify({ error: "No valid transfer amount" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const orderCode = normalized.orderCode;
        const transferAmount = normalized.amount;

        // Create Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // ============================================
        // AUDIT LOGGING: Record webhook receipt
        // ============================================
        const auditLogEntry = {
            provider: 'sepay',
            webhook_id: normalized.webhookId,
            event_type: normalized.eventType,
            order_code: orderCode,
            transaction_id: normalized.transactionId,
            amount: transferAmount,
            request_method: req.method,
            request_headers: {
                'content-type': req.headers.get('content-type'),
                'user-agent': req.headers.get('user-agent'),
                'has-authorization': Boolean(req.headers.get('authorization')),
                'has-x-secret-key': Boolean(req.headers.get('x-secret-key')),
                'has-x-sepay-signature': Boolean(req.headers.get('x-sepay-signature')),
                'auth-scheme': authResult.scheme,
            },
            request_body: payload,
            signature_valid: true,
            signature_provided: true,
            status: 'processing',
            idempotency_key: normalized.idempotencyKey,
        };

        // Insert audit log asynchronously (don't block processing)
        const auditLogPromise = fetch(
            `${supabaseUrl}/rest/v1/webhook_audit_logs`,
            {
                method: "POST",
                headers: {
                    "apikey": supabaseKey,
                    "Authorization": `Bearer ${supabaseKey}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=representation",
                },
                body: JSON.stringify(auditLogEntry),
            }
        );

        // ============================================
        // ATOMIC PAYMENT PROCESSING (Race Condition Fix)
        // Uses RPC with SELECT FOR UPDATE for locking
        // ============================================
        const rpcResponse = await fetch(
            `${supabaseUrl}/rest/v1/rpc/process_payment_order`,
            {
                method: "POST",
                headers: {
                    "apikey": supabaseKey,
                    "Authorization": `Bearer ${supabaseKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    p_order_code: orderCode,
                    p_amount: transferAmount,
                    p_transaction_id: normalized.transactionId,
                    p_payload: payload,
                }),
            }
        );

        // Wait for audit log to complete (but don't fail if it errors)
        const auditLogResult = await auditLogPromise.catch(err => {
            console.error("[SePay] Audit log failed (non-critical):", err);
            return null;
        });

        if (auditLogResult && !auditLogResult.ok) {
            const auditError = await auditLogResult.text();
            console.error("[SePay] Audit log insert returned non-OK status:", auditError);
        }

        if (!rpcResponse.ok) {
            const errorText = await rpcResponse.text();
            console.error("[SePay] RPC error:", errorText);
            return new Response(
                JSON.stringify({ error: "Payment processing failed", details: errorText }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const result = await rpcResponse.json();
        console.log("[SePay] Processing result:", result);

        // Handle different response scenarios
        if (!result.success) {
            // Check if it's a retryable error (lock conflict)
            if (result.error?.includes("being processed")) {
                console.warn("[SePay] Order locked by another process, suggesting retry:", orderCode);
                return new Response(
                    JSON.stringify({
                        error: "Order is being processed",
                        retry_after: result.retry_after || 2,
                    }),
                    {
                        status: 409,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                            "Retry-After": String(result.retry_after || 2),
                        },
                    }
                );
            }

            // Amount mismatch or other non-retryable errors
            if (result.error?.includes("Amount mismatch")) {
                console.warn("[SePay] Amount mismatch, sent to manual review:", orderCode);
                return new Response(
                    JSON.stringify({
                        message: "Amount mismatch - manual review required",
                        order_code: orderCode,
                        expected: result.expected_amount,
                        received: result.received_amount,
                    }),
                    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Order not found or expired
            console.error("[SePay] Processing failed:", result.error);
            return new Response(
                JSON.stringify({ error: result.error, order_code: orderCode }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Success response
        const successMessage = result.already_paid
            ? "Order already processed"
            : `Payment processed successfully. Subscription ends: ${result.subscription_end}`;

        console.log("[SePay] Success:", successMessage, "Order:", orderCode);

        return new Response(
            JSON.stringify({
                success: true,
                message: successMessage,
                order_code: orderCode,
                amount: transferAmount,
                subscription_end: result.subscription_end,
                is_promo: result.is_promo,
                extended: result.extended,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("[SePay] Webhook error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
