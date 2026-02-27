/**
 * SePay Webhook Handler
 * Processes payment notifications from SePay
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
        console.log("[SePay] Received webhook:", payload);

        // Extract order code from content
        // Format: ROOMZ1234567890
        const orderCodeMatch = payload.content?.match(/ROOMZ(\d+)/i);
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

        // Find the order in database
        const orderResponse = await fetch(
            `${supabaseUrl}/rest/v1/payment_orders?order_code=eq.${orderCode}&select=*`,
            {
                headers: {
                    "apikey": supabaseKey,
                    "Authorization": `Bearer ${supabaseKey}`,
                },
            }
        );

        const orders = await orderResponse.json();
        if (!orders || orders.length === 0) {
            console.error("[SePay] Order not found:", orderCode);
            return new Response(
                JSON.stringify({ error: "Order not found" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const order = orders[0];

        // Check if already paid
        if (order.status === "paid") {
            console.log("[SePay] Order already paid:", orderCode);
            return new Response(
                JSON.stringify({ message: "Order already processed" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Verify amount matches (allow small variance for currency conversion)
        const expectedAmount = order.amount;
        if (transferAmount < expectedAmount) {
            console.warn("[SePay] Amount mismatch:", { expected: expectedAmount, received: transferAmount });

            // Update order to manual_review
            await fetch(
                `${supabaseUrl}/rest/v1/payment_orders?id=eq.${order.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "apikey": supabaseKey,
                        "Authorization": `Bearer ${supabaseKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status: "manual_review",
                        provider_transaction_id: payload.referenceCode,
                    }),
                }
            );

            // Create manual review record
            await fetch(
                `${supabaseUrl}/rest/v1/manual_reviews`,
                {
                    method: "POST",
                    headers: {
                        "apikey": supabaseKey,
                        "Authorization": `Bearer ${supabaseKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        user_id: order.user_id,
                        order_code: orderCode,
                        transaction_id: payload.referenceCode,
                        amount: transferAmount,
                        reason: "Amount mismatch",
                        raw_payload: payload,
                        status: "pending",
                    }),
                }
            );

            return new Response(
                JSON.stringify({ message: "Amount mismatch - manual review" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Calculate subscription period
        const now = new Date();
        let periodEnd: Date;

        if (order.billing_cycle === "quarterly") {
            periodEnd = new Date(now);
            periodEnd.setMonth(periodEnd.getMonth() + 3);
        } else {
            periodEnd = new Date(now);
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Update order to paid
        await fetch(
            `${supabaseUrl}/rest/v1/payment_orders?id=eq.${order.id}`,
            {
                method: "PATCH",
                headers: {
                    "apikey": supabaseKey,
                    "Authorization": `Bearer ${supabaseKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: "paid",
                    paid_at: now.toISOString(),
                    provider_transaction_id: payload.referenceCode,
                }),
            }
        );

        console.log("[SePay] Order paid:", orderCode);

        // Check if user already has active subscription
        const subscriptionResponse = await fetch(
            `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${order.user_id}&status=eq.active&select=*`,
            {
                headers: {
                    "apikey": supabaseKey,
                    "Authorization": `Bearer ${supabaseKey}`,
                },
            }
        );

        const subscriptions = await subscriptionResponse.json();

        if (subscriptions && subscriptions.length > 0) {
            // Extend existing subscription
            const existingSub = subscriptions[0];
            const existingEnd = new Date(existingSub.current_period_end);

            // If current period hasn't ended, extend from end; otherwise from now
            const newPeriodStart = existingEnd > now ? existingEnd : now;
            const newPeriodEnd = new Date(newPeriodStart);
            newPeriodEnd.setMonth(newPeriodEnd.getMonth() + (order.billing_cycle === "quarterly" ? 3 : 1));

            await fetch(
                `${supabaseUrl}/rest/v1/subscriptions?id=eq.${existingSub.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "apikey": supabaseKey,
                        "Authorization": `Bearer ${supabaseKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        current_period_start: newPeriodStart.toISOString(),
                        current_period_end: newPeriodEnd.toISOString(),
                        payment_provider: "sepay",
                        payment_provider_transaction_id: payload.referenceCode,
                        amount_paid: transferAmount,
                        updated_at: now.toISOString(),
                    }),
                }
            );

            console.log("[SePay] Extended subscription for user:", order.user_id);
        } else {
            // Create new subscription
            await fetch(
                `${supabaseUrl}/rest/v1/subscriptions`,
                {
                    method: "POST",
                    headers: {
                        "apikey": supabaseKey,
                        "Authorization": `Bearer ${supabaseKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        user_id: order.user_id,
                        plan: order.plan,
                        status: "active",
                        promo_applied: order.amount < (order.billing_cycle === "quarterly" ? 119000 : 49000),
                        current_period_start: now.toISOString(),
                        current_period_end: periodEnd.toISOString(),
                        cancel_at_period_end: false,
                        payment_provider: "sepay",
                        payment_provider_transaction_id: payload.referenceCode,
                        amount_paid: transferAmount,
                    }),
                }
            );

            console.log("[SePay] Created subscription for user:", order.user_id);
        }

        // Update user's premium status
        await fetch(
            `${supabaseUrl}/rest/v1/users?id=eq.${order.user_id}`,
            {
                method: "PATCH",
                headers: {
                    "apikey": supabaseKey,
                    "Authorization": `Bearer ${supabaseKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    is_premium: true,
                    premium_until: periodEnd.toISOString(),
                    updated_at: now.toISOString(),
                }),
            }
        );

        console.log("[SePay] Updated user premium status:", order.user_id);

        // If promo was applied, increment promo claim count
        if (order.amount < (order.billing_cycle === "quarterly" ? 119000 : 49000)) {
            // This would require a function to increment the counter
            // For now, just log it
            console.log("[SePay] Promo applied for order:", orderCode);
        }

        return new Response(
            JSON.stringify({
                success: true,
                orderCode,
                amount: transferAmount,
                subscriptionEnds: periodEnd.toISOString()
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
