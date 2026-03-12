/**
 * AI Chatbot Edge Function
 * Powered by Gemini 2.5 Flash Lite via Vercel AI SDK
 * 
 * POST /functions/v1/ai-chatbot
 * Body: { message: string, sessionId?: string }
 * Response: { message: string, sessionId: string, metadata?: object }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateText, jsonSchema, stepCountIs, tool } from 'https://esm.sh/ai@5.0.56?target=deno';
import { createGoogleGenerativeAI } from 'https://esm.sh/@ai-sdk/google@2.0.40?target=deno';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPOSE_INTERNAL_ERRORS = Deno.env.get('EXPOSE_INTERNAL_ERRORS') === 'true';
const google = createGoogleGenerativeAI({
    apiKey: GEMINI_API_KEY || '',
});

const CORS_BASE_HEADERS = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const DEFAULT_ALLOWED_ORIGINS = [
    'https://rommz.vn',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
];
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

function getCorsHeaders(req: Request) {
    const origin = req.headers.get('origin');
    const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_ORIGINS[0];

    return {
        ...CORS_BASE_HEADERS,
        'Access-Control-Allow-Origin': allowOrigin,
        Vary: 'Origin',
    };
}

const SYSTEM_PROMPT = `Báº¡n lÃ  trá»£ lÃ½ AI cá»§a RommZ - ná»n táº£ng tÃ¬m phÃ²ng trá» dÃ nh cho sinh viÃªn Viá»‡t Nam.

Vá» RommZ:
- Ná»n táº£ng káº¿t ná»‘i sinh viÃªn tÃ¬m phÃ²ng trá» Ä‘Ã£ xÃ¡c thá»±c
- Táº¥t cáº£ tin Ä‘Äƒng Ä‘á»u Ä‘Æ°á»£c xÃ¡c thá»±c báº±ng giáº¥y tá» vÃ  áº£nh 360Â°
- CÃ³ tÃ­nh nÄƒng phÃ¹ há»£p báº¡n cÃ¹ng phÃ²ng (roommate matching)
- RommZ+ là gói premium 49.000đ/tháng với roommate không giới hạn, favorites không giới hạn, xem SĐT tới 100 lượt/ngày và deal Premium của Local Passport
- SwapRoom cho phÃ©p hoÃ¡n Ä‘á»•i/cho thuÃª láº¡i phÃ²ng ngáº¯n háº¡n
- Dá»‹ch vá»¥ Ä‘á»‘i tÃ¡c: chuyá»ƒn nhÃ , dá»n dáº¹p, thiáº¿t láº­p (giáº£m 15% cho sinh viÃªn)
- Tháº» Æ¯u Ä‘Ã£i: deal Ä‘á»™c quyá»n táº¡i quÃ¡n cÃ  phÃª, phÃ²ng gym, giáº·t lÃ  (giáº£m Ä‘áº¿n 30%)

Quy táº¯c:
1. Tráº£ lá»i báº±ng Tiáº¿ng Viá»‡t (trá»« khi user dÃ¹ng English)
2. Ngáº¯n gá»n, thÃ¢n thiá»‡n, cÃ³ emoji phÃ¹ há»£p
3. Khi user há»i tÃ¬m phÃ²ng â†’ dÃ¹ng tool search_rooms
4. Khi user há»i chi tiáº¿t phÃ²ng â†’ dÃ¹ng tool get_room_details
5. Khi user há»i vá» tÃ­nh nÄƒng app â†’ dÃ¹ng tool get_app_info
6. KhÃ´ng bá»‹a thÃ´ng tin - náº¿u khÃ´ng biáº¿t, nÃ³i rÃµ
7. KhÃ´ng thá»±c hiá»‡n action thay user (Ä‘áº·t phÃ²ng, thanh toÃ¡n) - chá»‰ hÆ°á»›ng dáº«n`;

const TOOLS = [
    {
        name: 'search_rooms',
        description: 'TÃ¬m phÃ²ng trá» theo tiÃªu chÃ­ (khu vá»±c, giÃ¡, loáº¡i phÃ²ng). DÃ¹ng khi user muá»‘n tÃ¬m phÃ²ng.',
        parameters: {
            type: 'OBJECT' as const,
            properties: {
                city: { type: 'STRING' as const, description: 'ThÃ nh phá»‘ (e.g., "TP.HCM", "HÃ  Ná»™i")' },
                district: { type: 'STRING' as const, description: 'Quáº­n/Huyá»‡n (e.g., "Quáº­n 7", "BÃ¬nh Tháº¡nh")' },
                max_price: { type: 'NUMBER' as const, description: 'GiÃ¡ tá»‘i Ä‘a (VND/thÃ¡ng)' },
                min_price: { type: 'NUMBER' as const, description: 'GiÃ¡ tá»‘i thiá»ƒu (VND/thÃ¡ng)' },
                room_type: { type: 'STRING' as const, description: 'Loáº¡i phÃ²ng: private, shared, studio, entire' },
            },
        },
    },
    {
        name: 'get_room_details',
        description: 'Láº¥y thÃ´ng tin chi tiáº¿t cá»§a má»™t phÃ²ng cá»¥ thá»ƒ theo ID.',
        parameters: {
            type: 'OBJECT' as const,
            properties: {
                room_id: { type: 'STRING' as const, description: 'UUID cá»§a phÃ²ng' },
            },
            required: ['room_id'],
        },
    },
    {
        name: 'get_app_info',
        description: 'Láº¥y thÃ´ng tin vá» tÃ­nh nÄƒng cá»§a RommZ app.',
        parameters: {
            type: 'OBJECT' as const,
            properties: {
                topic: {
                    type: 'STRING' as const,
                    description: 'Chá»§ Ä‘á»: verification, rommz_plus, swap_room, services, perks, roommate_matching, general',
                },
            },
            required: ['topic'],
        },
    },
];

const APP_INFO: Record<string, string> = {
    verification: 'XÃ¡c thá»±c tÃ i khoáº£n RommZ gá»“m 3 bÆ°á»›c:\n1. XÃ¡c thá»±c email (tá»± Ä‘á»™ng khi Ä‘Äƒng kÃ½)\n2. XÃ¡c thá»±c CCCD/CMND (chá»¥p máº·t trÆ°á»›c + máº·t sau)\n3. XÃ¡c thá»±c tháº» sinh viÃªn (tÃ¹y chá»n)\n\nTÃ i khoáº£n Ä‘Ã£ xÃ¡c thá»±c Ä‘Æ°á»£c Æ°u tiÃªn hiá»ƒn thá»‹ vÃ  tÄƒng trust score.',
    rommz_plus: 'RommZ+ là gói premium:\nGiá: 49.000đ/tháng\n- Xem SĐT chủ nhà tới 100 lượt/ngày\n- Lưu phòng yêu thích không giới hạn\n- Xem hồ sơ và gửi lời chào roommate không giới hạn\n- Mở khóa deal Premium của Local Passport\n- Hiển thị badge RommZ+ trên hồ sơ',
    swap_room: 'SwapRoom - TÃ­nh nÄƒng cho thuÃª linh hoáº¡t:\nðŸ”„ ÄÄƒng phÃ²ng cho thuÃª ngáº¯n háº¡n (sublet)\nðŸ”„ HoÃ¡n Ä‘á»•i phÃ²ng vá»›i sinh viÃªn khÃ¡c (swap)\n\nPhÃ¹ há»£p cho: thá»±c táº­p hÃ¨, du há»c ngáº¯n háº¡n, chuyá»ƒn chá»— táº¡m thá»i.',
    services: 'Dá»‹ch vá»¥ Ä‘á»‘i tÃ¡c RommZ:\nðŸ“¦ Há»— trá»£ chuyá»ƒn nhÃ \nðŸ§¹ Dá»n phÃ²ng vÃ  vá»‡ sinh\nðŸ›‹ï¸ Thiáº¿t láº­p vÃ  trang trÃ­ phÃ²ng\n\nTáº¥t cáº£ Ä‘á»‘i tÃ¡c Ä‘Ã£ xÃ¡c thá»±c, giáº£m giÃ¡ 15% cho sinh viÃªn!',
    perks: 'Tháº» Æ¯u Ä‘Ã£i RommZ:\nðŸŽ Deal Ä‘á»™c quyá»n dÃ nh cho sinh viÃªn\nâ˜• QuÃ¡n cÃ  phÃª - giáº£m Ä‘áº¿n 20%\nðŸ’ª PhÃ²ng gym - giáº£m Ä‘áº¿n 30%\nðŸ‘• Giáº·t lÃ  - giáº£m Ä‘áº¿n 15%\nðŸœ NhÃ  hÃ ng - giáº£m Ä‘áº¿n 25%\n\nQuÃ©t mÃ£ QR táº¡i cá»­a hÃ ng Ä‘á»‘i tÃ¡c Ä‘á»ƒ nháº­n Æ°u Ä‘Ã£i.',
    roommate_matching: 'PhÃ¹ há»£p báº¡n cÃ¹ng phÃ²ng:\nðŸ¤ Tráº£ lá»i bá»™ cÃ¢u há»i tÆ°Æ¡ng thÃ­ch\nðŸ“Š Äiá»ƒm phÃ¹ há»£p tá»« lifestyle, thÃ³i quen, sá»Ÿ thÃ­ch\nðŸ’¬ Gá»­i yÃªu cáº§u káº¿t báº¡n cÃ¹ng phÃ²ng\n\nÄiá»ƒm cÃ ng cao = cÃ ng phÃ¹ há»£p sá»‘ng chung!',
    general: 'RommZ - Ná»n táº£ng tÃ¬m phÃ²ng trá» an toÃ n cho sinh viÃªn:\nðŸ  PhÃ²ng Ä‘Ã£ xÃ¡c thá»±c 100%\nðŸ“¸ áº¢nh 360Â° thá»±c táº¿\nðŸ¤ PhÃ¹ há»£p báº¡n cÃ¹ng phÃ²ng\nðŸ’Ž RommZ+ premium\nðŸ”„ SwapRoom cho thuÃª linh hoáº¡t\nðŸ“¦ Dá»‹ch vá»¥ chuyá»ƒn nhÃ \nðŸŽ Æ¯u Ä‘Ã£i sinh viÃªn',
};

// Rate limiting
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RoomSearchRow = {
    id: string;
    title: string;
    price_per_month: number;
    city: string | null;
    district: string | null;
    room_type: string | null;
    area_sqm: number | null;
    address: string | null;
    is_verified: boolean | null;
    furnished: boolean | null;
};

function normalizeText(input: string): string {
    return input
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/Ä‘/g, 'd');
}

function normalizedIncludes(value: unknown, query: unknown): boolean {
    const left = normalizeText(String(value ?? '').trim());
    const right = normalizeText(String(query ?? '').trim());
    if (!right) return false;
    return left.includes(right);
}

function matchesLocation(room: RoomSearchRow, cityFilter: string, districtFilter: string): boolean {
    const cityMatch = cityFilter
        ? (normalizedIncludes(room.city, cityFilter) || normalizedIncludes(room.district, cityFilter))
        : true;
    const districtMatch = districtFilter
        ? (normalizedIncludes(room.district, districtFilter) || normalizedIncludes(room.city, districtFilter))
        : true;
    return cityMatch && districtMatch;
}

type HistoryMessage = {
    role: string;
    content: string;
    metadata?: unknown;
};

type CrawlAction = 'run_source' | 'sync_job' | 'import_records';

function isCrawlIngestionRequestBody(value: unknown): value is { action: CrawlAction } {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const action = (value as { action?: unknown }).action;
    return action === 'run_source' || action === 'sync_job' || action === 'import_records';
}

async function proxyCrawlIngestion(req: Request, authHeader: string) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/crawl-ingestion`, {
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            'x-admin-user-auth': authHeader,
        },
        body: await req.text(),
    });

    return new Response(await response.text(), {
        status: response.status,
        headers: {
            'Content-Type': 'application/json',
            ...CORS_BASE_HEADERS,
        },
    });
}

function isRoomSearchIntentText(text: string): boolean {
    return (
        /(tim|tim kiem|goi y|de xuat|dua ra).*(phong|nha tro|room)/.test(text) ||
        /(phong|nha tro|room).*(quan|huyen|district|city|gia|budget|khu vuc|gan|tham khao|lua chon)/.test(text) ||
        /\b(studio|shared|private|entire|o ghep|roommate)\b/.test(text) ||
        /\b([2-5])\s*(phong|room)\b/.test(text)
    );
}

function isRoomSearchRefinementText(text: string): boolean {
    const hasLocationPhrase = /\b(o|tai|khu vuc)\s+[a-z0-9\s]+/.test(text);
    return (
        /\b(o ghep|o rieng|studio|shared|private|entire|roommate)\b/.test(text) ||
        /(thu duc|quan|huyen|city|district|khu vuc|gan|thanh pho|tinh|tp)\b/.test(text) ||
        /(gia|budget|duoi|tren|toi da|toi thieu|trieu)/.test(text) ||
        /(them|them phong|tham khao|goi y them)/.test(text) ||
        hasLocationPhrase
    );
}

function hasRecentSearchToolCall(history: HistoryMessage[]): boolean {
    return history.some(msg => {
        if (msg.role !== 'assistant' || !msg.metadata || typeof msg.metadata !== 'object') return false;
        const functionCalls = (msg.metadata as { functionCalls?: Array<{ name?: string }> }).functionCalls;
        return Array.isArray(functionCalls) && functionCalls.some(fc => fc?.name === 'search_rooms');
    });
}

function getToolsForMessage(message: string, history: HistoryMessage[] = []) {
    const text = normalizeText(message);
    const recentUserMessages = history
        .filter(msg => msg.role === 'user' && typeof msg.content === 'string')
        .slice(-6)
        .map(msg => normalizeText(msg.content));
    const hasRecentRoomSearchContext = recentUserMessages.some(isRoomSearchIntentText) || hasRecentSearchToolCall(history);

    const isDirectRoomSearchIntent = isRoomSearchIntentText(text);

    const isRoomSearchIntent =
        isDirectRoomSearchIntent ||
        (hasRecentRoomSearchContext && isRoomSearchRefinementText(text));

    const isRoomDetailIntent =
        /(chi tiet|thong tin).*(phong|room)/.test(text) ||
        /(room|phong).*(id|ma)/.test(text) ||
        /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i.test(message);

    const isAppInfoIntent =
        /(tinh nang|feature|rommz\+|swap ?room|roommate|xac thuc|uu dai|service|dich vu|perk)/.test(text);

    const selectedTools: Array<(typeof TOOLS)[number]> = [];

    if (isRoomSearchIntent) {
        selectedTools.push(TOOLS[0]); // search_rooms
    }
    if (isRoomDetailIntent) {
        selectedTools.push(TOOLS[1]); // get_room_details
    }
    if (isAppInfoIntent) {
        selectedTools.push(TOOLS[2]); // get_app_info
    }

    return selectedTools;
}

async function checkRateLimit(
    userId: string,
    adminClient: any
): Promise<boolean> {
    const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString();

    const { data: recentSessions, error: sessionError } = await adminClient
        .from('ai_chat_sessions')
        .select('id')
        .eq('user_id', userId)
        .gte('updated_at', windowStart);

    if (sessionError) {
        console.error('Rate limit session lookup error:', sessionError);
        return true; // fail open
    }

    const sessionIds = ((recentSessions || []) as Array<{ id: string }>).map(s => s.id);
    if (sessionIds.length === 0) return true;

    const { count, error: messageCountError } = await adminClient
        .from('ai_chat_messages')
        .select('id', { count: 'exact', head: true })
        .in('session_id', sessionIds)
        .eq('role', 'user')
        .gte('created_at', windowStart);

    if (messageCountError) {
        console.error('Rate limit message count error:', messageCountError);
        return true; // fail open
    }

    return (count || 0) < RATE_LIMIT;
}

function formatSearchRoomsReply(result: unknown): string {
    const payload = result as { rooms?: Array<Record<string, unknown>>; message?: string; error?: string };
    if (payload?.error) {
        return 'MÃ¬nh gáº·p lá»—i khi tÃ¬m phÃ²ng. Báº¡n thá»­ láº¡i sau giÃºp mÃ¬nh nhÃ©.';
    }

    const rooms = Array.isArray(payload?.rooms) ? payload.rooms : [];
    if (rooms.length === 0) {
        return payload?.message || 'Hiá»‡n chÆ°a cÃ³ phÃ²ng phÃ¹ há»£p vá»›i tiÃªu chÃ­ cá»§a báº¡n.';
    }

    const lines = rooms.map((room, idx) => {
        const title = String(room.title || 'PhÃ²ng trá»');
        const price = String(room.price || 'LiÃªn há»‡');
        const location = String(room.location || 'ChÆ°a rÃµ vá»‹ trÃ­');
        const roomId = String(room.id || '');
        return `${idx + 1}. ${title} - ${price} (${location})${roomId ? `\nID: ${roomId}` : ''}`;
    });

    return `MÃ¬nh tÃ¬m Ä‘Æ°á»£c ${rooms.length} phÃ²ng phÃ¹ há»£p:\n\n${lines.join('\n\n')}\n\nBáº¡n muá»‘n mÃ¬nh láº¥y chi tiáº¿t phÃ²ng nÃ o thÃ¬ gá»­i ID nhÃ©.`;
}

function formatRoomDetailsReply(result: unknown): string {
    const payload = result as Record<string, unknown>;
    if (payload?.error) {
        return 'MÃ¬nh chÆ°a tÃ¬m tháº¥y chi tiáº¿t phÃ²ng nÃ y. Báº¡n kiá»ƒm tra láº¡i ID giÃºp mÃ¬nh nhÃ©.';
    }

    const title = String(payload.title || 'PhÃ²ng trá»');
    const price = payload.price_per_month
        ? `${Number(payload.price_per_month).toLocaleString('vi-VN')}Ä‘/thÃ¡ng`
        : 'LiÃªn há»‡';
    const location = [payload.address, payload.district, payload.city]
        .filter(Boolean)
        .map(String)
        .join(', ');
    const furnished = payload.furnished ? 'CÃ³ ná»™i tháº¥t' : 'KhÃ´ng ná»™i tháº¥t';
    const verified = payload.is_verified ? 'ÄÃ£ xÃ¡c thá»±c' : 'ChÆ°a xÃ¡c thá»±c';

    return `${title}\nGiÃ¡: ${price}\nVá»‹ trÃ­: ${location || 'ChÆ°a rÃµ'}\nTiá»‡n Ã­ch: ${furnished} â€¢ ${verified}`;
}

function formatToolResultReply(functionName: string, result: unknown): string {
    if (functionName === 'search_rooms') return formatSearchRoomsReply(result);
    if (functionName === 'get_room_details') return formatRoomDetailsReply(result);
    if (functionName === 'get_app_info') {
        const info = (result as { info?: string })?.info;
        return info || 'MÃ¬nh chÆ°a cÃ³ thÃ´ng tin cho chá»§ Ä‘á» nÃ y.';
    }
    return 'MÃ¬nh Ä‘Ã£ xá»­ lÃ½ yÃªu cáº§u nhÆ°ng chÆ°a thá»ƒ táº¡o pháº£n há»“i phÃ¹ há»£p.';
}

type ToolName = (typeof TOOLS)[number]['name'];
type SearchRoomsToolInput = {
    city?: string;
    district?: string;
    max_price?: number | string;
    min_price?: number | string;
    room_type?: string;
};
type RoomDetailsToolInput = { room_id: string };
type AppInfoTopic =
    | 'verification'
    | 'rommz_plus'
    | 'swap_room'
    | 'services'
    | 'perks'
    | 'roommate_matching'
    | 'general';
type AppInfoToolInput = { topic?: AppInfoTopic };

async function handleFunctionCall(
    functionName: ToolName,
    args: Record<string, unknown>,
    adminClient: any
): Promise<unknown> {
    switch (functionName) {
        case 'search_rooms': {
            const cityFilter = typeof args.city === 'string' ? args.city.trim() : '';
            const districtFilter = typeof args.district === 'string' ? args.district.trim() : '';
            const roomTypeFilter = typeof args.room_type === 'string' ? args.room_type.trim() : '';
            const maxPrice = typeof args.max_price === 'number' ? args.max_price : Number(args.max_price);
            const minPrice = typeof args.min_price === 'number' ? args.min_price : Number(args.min_price);

            const hasLocationFilters = Boolean(cityFilter || districtFilter);
            const pageSize = hasLocationFilters ? 200 : 5;
            const selectedRooms: RoomSearchRow[] = [];
            let offset = 0;

            while (selectedRooms.length < 5) {
                let pageQuery = adminClient
                    .from('rooms')
                    .select('id, title, price_per_month, city, district, room_type, area_sqm, address, is_verified, furnished')
                    .eq('status', 'active')
                    .eq('is_available', true);

                if (Number.isFinite(maxPrice)) pageQuery = pageQuery.lte('price_per_month', maxPrice);
                if (Number.isFinite(minPrice)) pageQuery = pageQuery.gte('price_per_month', minPrice);
                if (roomTypeFilter) pageQuery = pageQuery.eq('room_type', roomTypeFilter);

                const { data, error } = await pageQuery
                    .order('created_at', { ascending: false })
                    .range(offset, offset + pageSize - 1);

                if (error) return { error: 'Lá»—i tÃ¬m kiáº¿m phÃ²ng' };

                const rows = (data || []) as RoomSearchRow[];
                if (rows.length === 0) break;

                if (!hasLocationFilters) {
                    selectedRooms.push(...rows.slice(0, 5));
                    break;
                }

                for (const row of rows) {
                    if (matchesLocation(row, cityFilter, districtFilter)) {
                        selectedRooms.push(row);
                        if (selectedRooms.length >= 5) break;
                    }
                }

                if (rows.length < pageSize) break;
                offset += pageSize;
            }

            if (selectedRooms.length === 0) {
                return { rooms: [], message: 'KhÃ´ng tÃ¬m tháº¥y phÃ²ng phÃ¹ há»£p' };
            }

            return {
                rooms: selectedRooms.map(r => ({
                    id: r.id,
                    title: r.title,
                    price: `${Number(r.price_per_month).toLocaleString('vi-VN')}Ä‘/thÃ¡ng`,
                    location: `${r.district || ''}, ${r.city || ''}`.replace(/^, |, $/g, ''),
                    type: r.room_type,
                    area: r.area_sqm ? `${r.area_sqm}mÂ²` : null,
                    verified: r.is_verified,
                    furnished: r.furnished,
                })),
                total: selectedRooms.length,
            };
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

            if (error || !data) return { error: 'KhÃ´ng tÃ¬m tháº¥y phÃ²ng' };
            return data;
        }

        case 'get_app_info': {
            const topic = (args.topic as string) || 'general';
            return { info: APP_INFO[topic] || APP_INFO.general };
        }

        default:
            return { error: 'Unknown function' };
    }
}

function createToolset(selectedToolNames: ToolName[], adminClient: any) {
    const includeSearchRooms = selectedToolNames.includes('search_rooms');
    const includeRoomDetails = selectedToolNames.includes('get_room_details');
    const includeAppInfo = selectedToolNames.includes('get_app_info');
    const toolset = {};

    if (includeSearchRooms) {
        const searchRoomsTool = tool({
            description: TOOLS[0].description,
            inputSchema: jsonSchema<SearchRoomsToolInput>({
                type: 'object',
                properties: {
                    city: { type: 'string' },
                    district: { type: 'string' },
                    max_price: { type: ['number', 'string'] },
                    min_price: { type: ['number', 'string'] },
                    room_type: { type: 'string' },
                },
            }),
            execute: async (input: SearchRoomsToolInput) =>
                handleFunctionCall('search_rooms', input, adminClient),
        });
        Object.assign(toolset, { search_rooms: searchRoomsTool });
    }

    if (includeRoomDetails) {
        const roomDetailsTool = tool({
            description: TOOLS[1].description,
            inputSchema: jsonSchema<RoomDetailsToolInput>({
                type: 'object',
                properties: {
                    room_id: { type: 'string' },
                },
                required: ['room_id'],
            }),
            execute: async (input: RoomDetailsToolInput) =>
                handleFunctionCall('get_room_details', input, adminClient),
        });
        Object.assign(toolset, { get_room_details: roomDetailsTool });
    }

    if (includeAppInfo) {
        const appInfoTool = tool({
            description: TOOLS[2].description,
            inputSchema: jsonSchema<AppInfoToolInput>({
                type: 'object',
                properties: {
                    topic: {
                        type: 'string',
                        enum: [
                            'verification',
                            'rommz_plus',
                            'swap_room',
                            'services',
                            'perks',
                            'roommate_matching',
                            'general',
                        ],
                    },
                },
            }),
            execute: async (input: AppInfoToolInput) =>
                handleFunctionCall('get_app_info', input, adminClient),
        });
        Object.assign(toolset, { get_app_info: appInfoTool });
    }

    return toolset;
}

function getToolChoice(forceFunctionNames: ToolName[]) {
    if (forceFunctionNames.length === 1) {
        return { type: 'tool' as const, toolName: forceFunctionNames[0] };
    }
    if (forceFunctionNames.length > 1) {
        return 'required' as const;
    }
    return 'auto' as const;
}

async function generateTextWithRetry(
    options: Parameters<typeof generateText>[0],
    maxRetries = 2
) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await generateText(options);
        } catch (error) {
            const err = error as {
                statusCode?: number;
                response?: { status?: number };
                message?: string;
            };

            const statusCode = err.statusCode ?? err.response?.status;
            const message = err.message || '';
            const isRateLimited = statusCode === 429 || /429|RESOURCE_EXHAUSTED|rate limit/i.test(message);
            const canRetry = isRateLimited && attempt < maxRetries;

            if (!canRetry) {
                throw error;
            }

            const delayMs = Math.pow(2, attempt + 1) * 1000;
            console.log(`Gemini 429, retrying in ${delayMs}ms (attempt ${attempt + 1})`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    throw new Error('generateText retry loop exhausted unexpectedly');
}

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const requestBody = await req.clone().json().catch(() => null);
        if (isCrawlIngestionRequestBody(requestBody)) {
            const authHeader = req.headers.get('Authorization');
            if (!authHeader) {
                return new Response(
                    JSON.stringify({ error: 'Missing authorization', code: 'AUTH_ERROR' }),
                    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            return proxyCrawlIngestion(req, authHeader);
        }

        if (!GEMINI_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'Server configuration error: Missing Gemini API key', code: 'GEMINI_ERROR' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Verify JWT
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing authorization', code: 'AUTH_ERROR' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
            global: { headers: { Authorization: authHeader } },
        });
        const { data: { user }, error: authError } = await userClient.auth.getUser();
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid token', code: 'AUTH_ERROR' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Rate limit
        if (!(await checkRateLimit(user.id, adminClient))) {
            return new Response(
                JSON.stringify({ error: 'Báº¡n Ä‘ang gá»­i quÃ¡ nhiá»u tin nháº¯n. Vui lÃ²ng Ä‘á»£i 1 phÃºt.', code: 'RATE_LIMITED' }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Parse request
        const { message, sessionId } = await req.json();
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: 'Message is required', code: 'INVALID_INPUT' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (message.length > 2000) {
            return new Response(
                JSON.stringify({ error: 'Message too long (max 2000 characters)', code: 'INVALID_INPUT' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (sessionId !== undefined && sessionId !== null) {
            if (typeof sessionId !== 'string' || !UUID_REGEX.test(sessionId)) {
                return new Response(
                    JSON.stringify({ error: 'Session ID khÃ´ng há»£p lá»‡.', code: 'INVALID_INPUT' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        // Get or create session, always enforce ownership when client passes sessionId
        let currentSessionId = sessionId;
        if (currentSessionId) {
            const { data: existingSession, error: existingSessionError } = await adminClient
                .from('ai_chat_sessions')
                .select('id')
                .eq('id', currentSessionId)
                .eq('user_id', user.id)
                .maybeSingle();

            if (existingSessionError) throw existingSessionError;
            if (!existingSession) {
                return new Response(
                    JSON.stringify({ error: 'PhiÃªn chat khÃ´ng há»£p lá»‡.', code: 'INVALID_SESSION' }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

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
            .select('role, content, metadata')
            .eq('session_id', currentSessionId)
            .order('created_at', { ascending: true })
            .limit(20);

        // Build model request via Vercel AI SDK
        const messages = (history || []).map(msg => ({
            role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
            content: String(msg.content || ''),
        }));

        const selectedTools = getToolsForMessage(message, (history || []) as HistoryMessage[]);
        const selectedToolNames = selectedTools.map(t => t.name) as ToolName[];
        const forceFunctionNames = selectedToolNames.filter(
            (name): name is ToolName => name === 'search_rooms' || name === 'get_room_details'
        );
        const activeToolNames = forceFunctionNames.length > 0 ? forceFunctionNames : selectedToolNames;
        const toolset = createToolset(activeToolNames, adminClient);
        const hasTools = Object.keys(toolset).length > 0;

        const aiResult = await generateTextWithRetry({
            model: google('gemini-2.5-flash-lite'),
            system: SYSTEM_PROMPT,
            messages,
            temperature: 0.7,
            maxOutputTokens: 1024,
            topP: 0.95,
            providerOptions: {
                google: {
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    ],
                },
            },
            ...(hasTools
                ? {
                    tools: toolset,
                    toolChoice: getToolChoice(forceFunctionNames),
                    stopWhen: stepCountIs(1),
                }
                : {}),
        });

        let responseText = aiResult.text?.trim() || '';
        const functionCallResults = (aiResult.toolResults || []).map(result => ({
            name: result.toolName,
            result: result.output,
        }));

        if (!responseText && functionCallResults.length > 0) {
            responseText = functionCallResults
                .map((call, index) => {
                    const formatted = formatToolResultReply(call.name, call.result);
                    if (functionCallResults.length === 1) return formatted;
                    return `Káº¿t quáº£ ${index + 1} (${call.name}):\n${formatted}`;
                })
                .join('\n\n');
        }

        if (!responseText) {
            responseText = 'Xin lá»—i, mÃ¬nh khÃ´ng thá»ƒ xá»­ lÃ½ yÃªu cáº§u nÃ y lÃºc nÃ y. Báº¡n cÃ³ thá»ƒ thá»­ láº¡i khÃ´ng? ðŸ™';
        }

        const responseMetadata: Record<string, unknown> = {
            geminiCallCount: aiResult.steps?.length || 1,
            finishReason: aiResult.finishReason,
            usage: aiResult.usage,
        };

        if (functionCallResults.length > 0) {
            responseMetadata.functionCalls = functionCallResults;
        }

        // Save assistant response
        await adminClient.from('ai_chat_messages').insert({
            session_id: currentSessionId,
            role: 'assistant',
            content: responseText,
            metadata: responseMetadata,
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
                metadata: responseMetadata,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        const err = error as {
            code?: string;
            message?: string;
            details?: string;
            hint?: string;
        };

        console.error('AI Chatbot error:', {
            code: err.code,
            message: err.message,
            details: err.details,
            hint: err.hint,
        });

        if (err.code === '42P01') {
            return new Response(
                JSON.stringify({
                    error: 'Thiáº¿u báº£ng dá»¯ liá»‡u AI Chatbot. HÃ£y cháº¡y migration má»›i nháº¥t.',
                    code: 'DB_SCHEMA_MISSING',
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (err.code === '22P02') {
            return new Response(
                JSON.stringify({
                    error: 'Session ID khÃ´ng há»£p lá»‡.',
                    code: 'INVALID_INPUT',
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const errorPayload: Record<string, unknown> = {
            error: 'ÄÃ£ xáº£y ra lá»—i. Vui lÃ²ng thá»­ láº¡i sau.',
            code: 'GEMINI_ERROR',
        };
        if (EXPOSE_INTERNAL_ERRORS) {
            errorPayload.details = err.message || null;
        }

        return new Response(
            JSON.stringify(errorPayload),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
