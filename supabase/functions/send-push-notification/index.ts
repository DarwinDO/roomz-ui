import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface WebhookPayload {
    type: "INSERT";
    table: string;
    record: {
        id: string;
        conversation_id: string;
        sender_id: string;
        content: string;
        created_at: string;
    };
    schema: string;
}

serve(async (req: Request) => {
    try {
        const payload: WebhookPayload = await req.json();

        // Only process INSERT on messages
        if (payload.type !== "INSERT" || payload.table !== "messages") {
            return new Response(JSON.stringify({ message: "Ignored" }), {
                status: 200,
            });
        }

        const { record } = payload;

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        // 1. Get conversation participants (excluding sender)
        const { data: participants } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", record.conversation_id)
            .neq("user_id", record.sender_id);

        if (!participants || participants.length === 0) {
            return new Response(JSON.stringify({ message: "No recipients" }), {
                status: 200,
            });
        }

        const recipientIds = participants.map((p: { user_id: string }) => p.user_id);

        // 2. Get sender name
        const { data: sender } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", record.sender_id)
            .single();

        const senderName = sender?.full_name || "Ai đó";

        // 3. Get push tokens for recipients
        const { data: tokens } = await supabase
            .from("user_push_tokens")
            .select("token")
            .in("user_id", recipientIds);

        if (!tokens || tokens.length === 0) {
            return new Response(
                JSON.stringify({ message: "No push tokens found" }),
                { status: 200 }
            );
        }

        // Truncate content for notification body
        const notificationBody =
            record.content.length > 100
                ? record.content.substring(0, 100) + "..."
                : record.content;

        // 4. Save notification to DB (using existing schema: content, link)
        const notificationInserts = recipientIds.map((userId: string) => ({
            user_id: userId,
            type: "new_message",
            title: `${senderName} đã gửi tin nhắn`,
            content: notificationBody,
            link: `/chat/${record.conversation_id}`,
            data: {
                conversation_id: record.conversation_id,
                message_id: record.id,
            },
        }));

        await supabase.from("notifications").insert(notificationInserts);

        // 5. Send push notifications via Expo
        const messages = tokens.map((t: { token: string }) => ({
            to: t.token,
            sound: "default",
            title: `${senderName}`,
            body: notificationBody,
            data: {
                conversation_id: record.conversation_id,
                message_id: record.id,
            },
        }));

        const pushResponse = await fetch(EXPO_PUSH_URL, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(messages),
        });

        const pushResult = await pushResponse.json();

        return new Response(
            JSON.stringify({
                message: `Sent ${messages.length} push notifications`,
                result: pushResult,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Push notification error:", error);
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { status: 500 }
        );
    }
});
