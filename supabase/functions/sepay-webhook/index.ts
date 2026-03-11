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

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Verify webhook signature - CRITICAL SECURITY CHECK
        const signature = req.headers.get("X-SePay-Signature");
        const webhookSecret = Deno.env.get("SEPAY_WEBHOOK_SECRET");

        if (!signature || !webhookSecret) {
            console.error("[SePay] Missing signature or secret - REJECTING request");
            return new Response(
                JSON.stringify({ error: "Unauthorized - missing signature" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Verify HMAC signature
        const rawBody = await req.text();
        const expectedSignature = await generateHMAC(rawBody, webhookSecret);

        if (signature !== expectedSignature) {
            console.error("[SePay] Invalid signature - POSSIBLE ATTACK");
            return new Response(
                JSON.stringify({ error: "Unauthorized - invalid signature" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Parse payload after verification
        const payload: SePayWebhookPayload = JSON.parse(rawBody);
        console.log("[SePay] Received webhook:", {
            id: payload.id,
            referenceCode: payload.referenceCode,
            amount: payload.transferAmount,
            content: payload.content?.substring(0, 50),
        });

        // Extract order code from content
        // Format: ROMMZ1234567890
        const orderCodeMatch = payload.content?.match(/ROMMZ\d+/i);
        if (!orderCodeMatch) {
            console.warn("[SePay] No valid order code found in content:", payload.content);
            return new Response(
                JSON.stringify({ error: "No valid order code" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const orderCode = orderCodeMatch[0];
        const transferAmount = payload.transferAmount;

        console.log("[SePay] Processing order:", orderCode, "Amount:", transferAmount);

        // Create Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // ============================================
        // AUDIT LOGGING: Record webhook receipt
        // ============================================
        const idempotencyKey = payload.id
            ? `sepay:${payload.id}`
            : `sepay:${payload.referenceCode}:${payload.transactionDate}`;

        const auditLogEntry = {
            provider: 'sepay',
            webhook_id: payload.id != null ? String(payload.id) : null,
            event_type: 'payment_received',
            order_code: orderCode,
            transaction_id: payload.referenceCode,
            amount: transferAmount,
            request_method: req.method,
            request_headers: {
                'content-type': req.headers.get('content-type'),
                'user-agent': req.headers.get('user-agent'),
                'x-sepay-signature': req.headers.get('x-sepay-signature'),
            },
            request_body: payload,
            signature_valid: true,
            signature_provided: true,
            status: 'processing',
            idempotency_key: idempotencyKey,
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
                    p_transaction_id: payload.referenceCode,
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
