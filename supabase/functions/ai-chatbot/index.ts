/**
 * AI Chatbot Edge Function
 * Powered by Gemini 2.0 Flash with function calling
 * 
 * POST /functions/v1/ai-chatbot
 * Body: { message: string, sessionId?: string }
 * Response: { message: string, sessionId: string, metadata?: object }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Bạn là trợ lý AI của RommZ - nền tảng tìm phòng trọ dành cho sinh viên Việt Nam.

Về RommZ:
- Nền tảng kết nối sinh viên tìm phòng trọ đã xác thực
- Tất cả tin đăng đều được xác thực bằng giấy tờ và ảnh 360°
- Có tính năng phù hợp bạn cùng phòng (roommate matching)
- RommZ+ là gói premium (200.000đ/tháng) với ưu tiên hiển thị, phù hợp nâng cao, không phí đặt phòng
- SwapRoom cho phép hoán đổi/cho thuê lại phòng ngắn hạn
- Dịch vụ đối tác: chuyển nhà, dọn dẹp, thiết lập (giảm 15% cho sinh viên)
- Thẻ Ưu đãi: deal độc quyền tại quán cà phê, phòng gym, giặt là (giảm đến 30%)

Quy tắc:
1. Trả lời bằng Tiếng Việt (trừ khi user dùng English)
2. Ngắn gọn, thân thiện, có emoji phù hợp
3. Khi user hỏi tìm phòng → dùng tool search_rooms
4. Khi user hỏi chi tiết phòng → dùng tool get_room_details
5. Khi user hỏi về tính năng app → dùng tool get_app_info
6. Không bịa thông tin - nếu không biết, nói rõ
7. Không thực hiện action thay user (đặt phòng, thanh toán) - chỉ hướng dẫn`;

const TOOLS = [
    {
        name: 'search_rooms',
        description: 'Tìm phòng trọ theo tiêu chí (khu vực, giá, loại phòng). Dùng khi user muốn tìm phòng.',
        parameters: {
            type: 'OBJECT' as const,
            properties: {
                city: { type: 'STRING' as const, description: 'Thành phố (e.g., "TP.HCM", "Hà Nội")' },
                district: { type: 'STRING' as const, description: 'Quận/Huyện (e.g., "Quận 7", "Bình Thạnh")' },
                max_price: { type: 'NUMBER' as const, description: 'Giá tối đa (VND/tháng)' },
                min_price: { type: 'NUMBER' as const, description: 'Giá tối thiểu (VND/tháng)' },
                room_type: { type: 'STRING' as const, description: 'Loại phòng: private, shared, studio, entire' },
            },
        },
    },
    {
        name: 'get_room_details',
        description: 'Lấy thông tin chi tiết của một phòng cụ thể theo ID.',
        parameters: {
            type: 'OBJECT' as const,
            properties: {
                room_id: { type: 'STRING' as const, description: 'UUID của phòng' },
            },
            required: ['room_id'],
        },
    },
    {
        name: 'get_app_info',
        description: 'Lấy thông tin về tính năng của RommZ app.',
        parameters: {
            type: 'OBJECT' as const,
            properties: {
                topic: {
                    type: 'STRING' as const,
                    description: 'Chủ đề: verification, rommz_plus, swap_room, services, perks, roommate_matching, general',
                },
            },
            required: ['topic'],
        },
    },
];

const APP_INFO: Record<string, string> = {
    verification: 'Xác thực tài khoản RommZ gồm 3 bước:\n1. Xác thực email (tự động khi đăng ký)\n2. Xác thực CCCD/CMND (chụp mặt trước + mặt sau)\n3. Xác thực thẻ sinh viên (tùy chọn)\n\nTài khoản đã xác thực được ưu tiên hiển thị và tăng trust score.',
    rommz_plus: 'RommZ+ là gói premium:\n💎 Giá: 200.000đ/tháng\n✅ Ưu tiên hiển thị trong kết quả tìm kiếm\n✅ Phù hợp bạn cùng phòng nâng cao\n✅ Không phí đặt phòng\n✅ Ưu đãi và giảm giá độc quyền\n✅ Hỗ trợ ưu tiên',
    swap_room: 'SwapRoom - Tính năng cho thuê linh hoạt:\n🔄 Đăng phòng cho thuê ngắn hạn (sublet)\n🔄 Hoán đổi phòng với sinh viên khác (swap)\n\nPhù hợp cho: thực tập hè, du học ngắn hạn, chuyển chỗ tạm thời.',
    services: 'Dịch vụ đối tác RommZ:\n📦 Hỗ trợ chuyển nhà\n🧹 Dọn phòng và vệ sinh\n🛋️ Thiết lập và trang trí phòng\n\nTất cả đối tác đã xác thực, giảm giá 15% cho sinh viên!',
    perks: 'Thẻ Ưu đãi RommZ:\n🎁 Deal độc quyền dành cho sinh viên\n☕ Quán cà phê - giảm đến 20%\n💪 Phòng gym - giảm đến 30%\n👕 Giặt là - giảm đến 15%\n🍜 Nhà hàng - giảm đến 25%\n\nQuét mã QR tại cửa hàng đối tác để nhận ưu đãi.',
    roommate_matching: 'Phù hợp bạn cùng phòng:\n🤝 Trả lời bộ câu hỏi tương thích\n📊 Điểm phù hợp từ lifestyle, thói quen, sở thích\n💬 Gửi yêu cầu kết bạn cùng phòng\n\nĐiểm càng cao = càng phù hợp sống chung!',
    general: 'RommZ - Nền tảng tìm phòng trọ an toàn cho sinh viên:\n🏠 Phòng đã xác thực 100%\n📸 Ảnh 360° thực tế\n🤝 Phù hợp bạn cùng phòng\n💎 RommZ+ premium\n🔄 SwapRoom cho thuê linh hoạt\n📦 Dịch vụ chuyển nhà\n🎁 Ưu đãi sinh viên',
};

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

// Retry helper for Gemini 429
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 2
): Promise<Response> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const response = await fetch(url, options);
        if (response.status === 429 && attempt < maxRetries) {
            const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s
            console.log(`Gemini 429, retrying in ${delay}ms (attempt ${attempt + 1})`);
            await new Promise(r => setTimeout(r, delay));
            continue;
        }
        return response;
    }
    return fetch(url, options); // final attempt
}

async function handleFunctionCall(
    functionName: string,
    args: Record<string, unknown>,
    adminClient: ReturnType<typeof createClient>
): Promise<string> {
    switch (functionName) {
        case 'search_rooms': {
            let query = adminClient
                .from('rooms')
                .select('id, title, price_per_month, city, district, room_type, area_sqm, address, is_verified, furnished')
                .eq('status', 'active')
                .eq('is_available', true);

            if (args.city) query = query.ilike('city', `%${args.city}%`);
            if (args.district) query = query.ilike('district', `%${args.district}%`);
            if (args.max_price) query = query.lte('price_per_month', args.max_price);
            if (args.min_price) query = query.gte('price_per_month', args.min_price);
            if (args.room_type) query = query.eq('room_type', args.room_type);

            const { data, error } = await query.limit(5).order('created_at', { ascending: false });

            if (error) return JSON.stringify({ error: 'Lỗi tìm kiếm phòng' });
            if (!data || data.length === 0) return JSON.stringify({ rooms: [], message: 'Không tìm thấy phòng phù hợp' });

            return JSON.stringify({
                rooms: data.map(r => ({
                    id: r.id,
                    title: r.title,
                    price: `${Number(r.price_per_month).toLocaleString('vi-VN')}đ/tháng`,
                    location: `${r.district || ''}, ${r.city || ''}`.replace(/^, |, $/g, ''),
                    type: r.room_type,
                    area: r.area_sqm ? `${r.area_sqm}m²` : null,
                    verified: r.is_verified,
                    furnished: r.furnished,
                })),
                total: data.length,
            });
        }

        case 'get_room_details': {
            const { data, error } = await adminClient
                .from('rooms')
                .select(`
                    id, title, description, price_per_month, deposit_amount,
                    city, district, address, room_type, area_sqm,
                    bedroom_count, bathroom_count, max_occupants,
                    furnished, pet_allowed, smoking_allowed,
                    utilities_included, electricity_cost, water_cost,
                    is_verified, is_available, status,
                    landlord:users!landlord_id(full_name, avatar_url)
                `)
                .eq('id', args.room_id as string)
                .single();

            if (error || !data) return JSON.stringify({ error: 'Không tìm thấy phòng' });
            return JSON.stringify(data);
        }

        case 'get_app_info': {
            const topic = (args.topic as string) || 'general';
            return JSON.stringify({ info: APP_INFO[topic] || APP_INFO.general });
        }

        default:
            return JSON.stringify({ error: 'Unknown function' });
    }
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: CORS_HEADERS });
    }

    try {
        if (!GEMINI_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'Server configuration error: Missing Gemini API key', code: 'GEMINI_ERROR' }),
                { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
            );
        }

        // Verify JWT
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing authorization', code: 'AUTH_ERROR' }),
                { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
            );
        }

        const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
            global: { headers: { Authorization: authHeader } },
        });
        const { data: { user }, error: authError } = await userClient.auth.getUser();
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid token', code: 'AUTH_ERROR' }),
                { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
            );
        }

        // Rate limit
        if (!checkRateLimit(user.id)) {
            return new Response(
                JSON.stringify({ error: 'Bạn đang gửi quá nhiều tin nhắn. Vui lòng đợi 1 phút.', code: 'RATE_LIMITED' }),
                { status: 429, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
            );
        }

        // Parse request
        const { message, sessionId } = await req.json();
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: 'Message is required', code: 'INVALID_INPUT' }),
                { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
            );
        }

        if (message.length > 2000) {
            return new Response(
                JSON.stringify({ error: 'Message too long (max 2000 characters)', code: 'INVALID_INPUT' }),
                { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
            );
        }

        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Get or create session
        let currentSessionId = sessionId;
        if (!currentSessionId) {
            const { data: newSession, error: sessionError } = await adminClient
                .from('ai_chat_sessions')
                .insert({ user_id: user.id, title: message.substring(0, 100) })
                .select('id')
                .single();

            if (sessionError) throw sessionError;
            currentSessionId = newSession.id;
        }

        // Save user message
        await adminClient.from('ai_chat_messages').insert({
            session_id: currentSessionId,
            role: 'user',
            content: message.trim(),
        });

        // Get history for context
        const { data: history } = await adminClient
            .from('ai_chat_messages')
            .select('role, content')
            .eq('session_id', currentSessionId)
            .order('created_at', { ascending: true })
            .limit(20);

        // Build Gemini request
        const contents = (history || []).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

        const geminiBody = {
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            tools: [{ function_declarations: TOOLS }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
                topP: 0.95,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ],
        };

        let geminiResponse = await fetchWithRetry(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiBody),
        });

        if (!geminiResponse.ok) {
            const errBody = await geminiResponse.text();
            console.error('Gemini API error:', geminiResponse.status, errBody);
            throw new Error(`Gemini API returned ${geminiResponse.status}`);
        }

        let geminiData = await geminiResponse.json();
        let responseText = '';
        const functionCallResults: Array<{ name: string; result: unknown }> = [];

        // Handle function calling loop
        let candidate = geminiData.candidates?.[0];
        let maxIterations = 3;

        while (candidate && maxIterations > 0) {
            const parts = candidate.content?.parts || [];
            const functionCall = parts.find((p: { functionCall?: unknown }) => p.functionCall);

            if (functionCall?.functionCall) {
                const { name, args } = functionCall.functionCall;
                const result = await handleFunctionCall(name, args || {}, adminClient);
                functionCallResults.push({ name, result: JSON.parse(result) });

                contents.push({ role: 'model', parts });
                contents.push({
                    role: 'user',
                    parts: [{ functionResponse: { name, response: { content: result } } }],
                } as any);

                geminiResponse = await fetchWithRetry(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                        contents,
                        tools: [{ function_declarations: TOOLS }],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
                    }),
                });

                if (!geminiResponse.ok) {
                    console.error('Gemini function-call follow-up error:', geminiResponse.status);
                    break;
                }

                geminiData = await geminiResponse.json();
                candidate = geminiData.candidates?.[0];
                maxIterations--;
            } else {
                responseText = parts.find((p: { text?: string }) => p.text)?.text || '';
                break;
            }
        }

        if (!responseText) {
            responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
                'Xin lỗi, mình không thể xử lý yêu cầu này lúc này. Bạn có thể thử lại không? 🙏';
        }

        // Save assistant response
        await adminClient.from('ai_chat_messages').insert({
            session_id: currentSessionId,
            role: 'assistant',
            content: responseText,
            metadata: functionCallResults.length > 0 ? { functionCalls: functionCallResults } : {},
        });

        // Update session timestamp
        await adminClient
            .from('ai_chat_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', currentSessionId);

        return new Response(
            JSON.stringify({
                message: responseText,
                sessionId: currentSessionId,
                metadata: functionCallResults.length > 0 ? { functionCalls: functionCallResults } : undefined,
            }),
            { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('AI Chatbot error:', error);
        return new Response(
            JSON.stringify({
                error: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
                code: 'GEMINI_ERROR',
            }),
            { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    }
});
