/**
 * AI Chatbot Edge Function
 * Powered by Vercel AI Gateway via Vercel AI SDK
 * 
 * POST /functions/v1/ai-chatbot
 * Body: { message: string, sessionId?: string }
 * Response: { message: string, sessionId: string, metadata?: object }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { gateway, generateText, jsonSchema, stepCountIs, tool } from 'https://esm.sh/ai@5.0.56?target=deno';
import { createGoogleGenerativeAI } from 'https://esm.sh/@ai-sdk/google@2.0.40?target=deno';
import {
    ROMI_APP_INFO_TOPICS,
    getRomiAppInfo,
    type RomiAppInfoTopic,
} from '../../../packages/shared/src/constants/romi.ts';

const AI_GATEWAY_API_KEY = Deno.env.get('AI_GATEWAY_API_KEY');
const AI_GATEWAY_MODEL = Deno.env.get('AI_GATEWAY_MODEL') || 'google/gemini-2.0-flash-lite';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash-lite';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPOSE_INTERNAL_ERRORS = Deno.env.get('EXPOSE_INTERNAL_ERRORS') === 'true';
const google = GEMINI_API_KEY
    ? createGoogleGenerativeAI({
        apiKey: GEMINI_API_KEY,
    })
    : null;

const CORS_BASE_HEADERS = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const DEFAULT_ALLOWED_ORIGINS = [
    'https://rommz.vn',
    'https://rommz.site',
    'https://roomz-ui.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
];
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

function isAllowedOrigin(origin: string | null): origin is string {
    if (!origin) return false;
    if (ALLOWED_ORIGINS.includes(origin)) return true;

    try {
        const { protocol, hostname } = new URL(origin);
        if (protocol !== 'https:') return false;

        return hostname === 'roomz-ui.vercel.app'
            || hostname.startsWith('roomz-') && hostname.endsWith('.vercel.app')
            || hostname.startsWith('roomz-ui-') && hostname.endsWith('.vercel.app');
    } catch {
        return false;
    }
}

function getCorsHeaders(req: Request) {
    const origin = req.headers.get('origin');
    const allowOrigin = isAllowedOrigin(origin)
        ? origin
        : ALLOWED_ORIGINS[0];

    return {
        ...CORS_BASE_HEADERS,
        'Access-Control-Allow-Origin': allowOrigin,
        Vary: 'Origin',
    };
}

const SYSTEM_PROMPT = `Bạn là ROMI, trợ lý của RommZ - nền tảng tìm phòng trọ và sống tiện hơn dành cho sinh viên Việt Nam.

Về RommZ:
- Kết nối sinh viên với phòng trọ đã xác thực
- Hỗ trợ tìm bạn cùng phòng dựa trên độ phù hợp
- Có RommZ+ cho các quyền lợi nâng cao
- Có Local Passport với ưu đãi và deal theo khu vực
- Có dịch vụ đối tác như chuyển nhà, dọn dẹp và thiết lập phòng

Quy tắc:
1. Trả lời bằng tiếng Việt, trừ khi người dùng chủ động dùng tiếng Anh
2. Ngắn gọn, rõ ràng, thân thiện; không văn vẻ
3. Khi người dùng hỏi tìm phòng, dùng tool search_rooms
4. Khi người dùng hỏi tìm dịch vụ đối tác, dùng tool search_partners
5. Khi người dùng hỏi ưu đãi hoặc deal Local Passport, dùng tool search_deals
6. Khi người dùng hỏi trường, ga, bến xe, landmark hoặc địa điểm nổi bật, dùng tool search_locations
7. Khi người dùng hỏi chi tiết phòng cụ thể, dùng tool get_room_details
8. Khi người dùng hỏi về tính năng hoặc quyền lợi của app, dùng tool get_app_info
9. Không bịa thông tin; nếu không chắc thì nói rõ là chưa có dữ liệu
10. Không thực hiện hành động thay người dùng như đặt phòng hay thanh toán; chỉ hướng dẫn bước tiếp theo`;

const TOOLS = {
    search_rooms: {
        name: 'search_rooms',
        description: 'Tìm phòng trọ theo khu vực, giá và loại phòng. Dùng khi người dùng muốn tìm phòng.',
        parameters: {
            type: 'OBJECT' as const,
            properties: {
                city: { type: 'STRING' as const, description: 'Thành phố, ví dụ Hà Nội hoặc Thành phố Hồ Chí Minh' },
                district: { type: 'STRING' as const, description: 'Quận hoặc huyện, ví dụ Quận 7 hoặc Bình Thạnh' },
                max_price: { type: 'NUMBER' as const, description: 'Giá tối đa theo tháng, đơn vị VND' },
                min_price: { type: 'NUMBER' as const, description: 'Giá tối thiểu theo tháng, đơn vị VND' },
                room_type: { type: 'STRING' as const, description: 'Loại phòng: private, shared, studio hoặc entire' },
            },
        },
    },
    search_partners: {
        name: 'search_partners',
        description: 'Tìm dịch vụ hoặc đối tác Local Passport theo loại dịch vụ, khu vực và từ khóa.',
        parameters: {
            type: 'OBJECT' as const,
            properties: {
                query: { type: 'STRING' as const, description: 'Từ khóa như chuyển nhà, vệ sinh, nội thất, tên đối tác' },
                category: { type: 'STRING' as const, description: 'Nhóm dịch vụ hoặc loại đối tác, ví dụ moving, cleaning, coffee, gym, entertainment, furniture' },
                city: { type: 'STRING' as const, description: 'Thành phố hoặc khu vực lớn, ví dụ Hà Nội, Thành phố Hồ Chí Minh' },
                limit: { type: 'NUMBER' as const, description: 'Số kết quả tối đa, mặc định 5' },
            },
        },
    },
    search_deals: {
        name: 'search_deals',
        description: 'Tìm ưu đãi Local Passport theo từ khóa, khu vực hoặc nhóm đối tác.',
        parameters: {
            type: 'OBJECT' as const,
            properties: {
                query: { type: 'STRING' as const, description: 'Từ khóa như cafe, gym, chuyển nhà, voucher, giảm giá' },
                category: { type: 'STRING' as const, description: 'Nhóm đối tác của deal, ví dụ moving, cleaning, coffee, gym, entertainment, furniture' },
                city: { type: 'STRING' as const, description: 'Thành phố hoặc khu vực lớn, ví dụ Hà Nội, Thành phố Hồ Chí Minh' },
                premium_only: { type: 'BOOLEAN' as const, description: 'Chỉ lấy deal premium nếu người dùng hỏi riêng về deal RommZ+' },
                limit: { type: 'NUMBER' as const, description: 'Số kết quả tối đa, mặc định 5' },
            },
        },
    },
    search_locations: {
        name: 'search_locations',
        description: 'Tìm địa điểm trong location catalog như trường đại học, ga, bến xe, landmark hoặc khu vực.',
        parameters: {
            type: 'OBJECT' as const,
            properties: {
                query: { type: 'STRING' as const, description: 'Tên địa điểm hoặc từ khóa như Bách Khoa, Mỹ Đình, Quận 7' },
                city: { type: 'STRING' as const, description: 'Thành phố để thu hẹp phạm vi, ví dụ Hà Nội' },
                location_type: { type: 'STRING' as const, description: 'Loại địa điểm: university, district, neighborhood, poi, campus, station, landmark' },
                limit: { type: 'NUMBER' as const, description: 'Số kết quả tối đa, mặc định 5' },
            },
            required: ['query'],
        },
    },
    get_room_details: {
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
    get_app_info: {
        name: 'get_app_info',
        description: 'Lấy thông tin về tính năng và quyền lợi của RommZ.',
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
} as const;

// Rate limiting
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type AdminClient = ReturnType<typeof createClient>;

type SearchRoomsRpcRow = {
    id: string;
    landlord_id: string;
    title: string;
    description: string | null;
    address: string;
    price_per_month: number;
    city: string | null;
    district: string | null;
    room_type: string;
    area_sqm: number | null;
    furnished: boolean;
    is_verified: boolean;
    total_count: number;
    primary_image_url: string | null;
    distance_km: number | null;
};

type PartnerCategory = string;
type LocationCatalogType = 'university' | 'district' | 'neighborhood' | 'poi' | 'campus' | 'station' | 'landmark';

type ContactInfo = {
    email?: string | null;
    phone?: string | null;
    website?: string | null;
};

type PartnerSearchRow = {
    id: string;
    name: string;
    category: PartnerCategory;
    description: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    contact_info: ContactInfo | null;
    specialization: string | null;
    discount: string | null;
    rating: number | null;
    review_count: number | null;
    hours: string | null;
    status: string | null;
};

type DealSearchRow = {
    id: string;
    title: string;
    discount_value: string | null;
    description: string | null;
    valid_until: string | null;
    is_premium_only: boolean | null;
    is_active: boolean | null;
    partner: {
        id: string;
        name: string;
        category: PartnerCategory | null;
        address: string | null;
        status: string | null;
    } | null;
};

type LocationSearchRow = {
    id: string;
    name: string;
    location_type: LocationCatalogType;
    city: string | null;
    district: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    distance_km?: number | null;
    source_name?: string | null;
};

type RomiAction = {
    type:
        | 'open_search'
        | 'open_room'
        | 'open_local_passport'
        | 'open_payment'
        | 'open_support_services'
        | 'open_verification'
        | 'open_roommates'
        | 'open_swap';
    label: string;
    href: string;
    description?: string;
};

function normalizeText(input: string): string {
    return input
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');
}

function normalizeOptionalText(input: unknown): string {
    return typeof input === 'string' ? normalizeText(input) : '';
}

function isGreetingMessage(text: string): boolean {
    const normalized = text.trim();
    if (!normalized) return false;

    return /^(xin chao|chao|hello|hi|helo|alo|hey|yo|romi oi|romi)$/.test(normalized);
}

function buildGreetingReply(): string {
    return 'Xin chào. Tôi là ROMI, trợ lý của RommZ. Tôi có thể giúp bạn tìm phòng, tìm dịch vụ, tìm ưu đãi và chỉ sang đúng flow tiếp theo trong app.';
}

function isRateLimitError(error: unknown): boolean {
    const err = error as {
        statusCode?: number;
        response?: { status?: number };
        message?: string;
    };

    const statusCode = err.statusCode ?? err.response?.status;
    const message = err.message || '';

    return statusCode === 429 || /429|RESOURCE_EXHAUSTED|rate limit|Too Many Requests/i.test(message);
}

function isRecoverableProviderError(error: unknown): boolean {
    const err = error as {
        name?: string;
        statusCode?: number;
        response?: { status?: number };
        message?: string;
        responseBody?: string;
    };

    const statusCode = err.statusCode ?? err.response?.status;
    const message = err.message || '';
    const responseBody = err.responseBody || '';

    if (!['AI_APICallError', 'APICallError'].includes(err.name || '')) {
        return false;
    }

    if (statusCode === 429) {
        return true;
    }

    return statusCode === 400
        || statusCode === 401
        || statusCode === 403
        || /API_KEY_INVALID|API key not valid|INVALID_ARGUMENT|Bad Request/i.test(`${message} ${responseBody}`);
}

function clampLimit(input: unknown, fallback = 5, max = 8): number {
    const value =
        typeof input === 'number'
            ? input
            : Number.isFinite(Number(input))
                ? Number(input)
                : fallback;

    return Math.min(Math.max(Math.trunc(value || fallback), 1), max);
}

function getLanguageModel() {
    if (AI_GATEWAY_API_KEY) {
        return gateway(AI_GATEWAY_MODEL);
    }

    if (google) {
        return google(GEMINI_MODEL);
    }

    return null;
}

function formatPartnerCategoryLabel(category: PartnerCategory | null | undefined): string {
    switch (category) {
        case 'moving':
            return 'Chuyển nhà';
        case 'cleaning':
            return 'Dọn dẹp';
        case 'real_estate':
            return 'Bất động sản';
        case 'utilities':
            return 'Điện nước';
        case 'furniture':
            return 'Nội thất';
        case 'gym':
            return 'Phòng gym';
        case 'fitness':
            return 'Fitness';
        case 'coffee':
            return 'Cà phê';
        case 'entertainment':
            return 'Giải trí';
        case 'other':
            return 'Dịch vụ khác';
        default:
            return String(category || 'Dịch vụ')
                .replace(/[_-]+/g, ' ')
                .replace(/\b\w/g, (char) => char.toUpperCase());
    }
}

function getPartnerContactValue(contactInfo: ContactInfo | null | undefined, key: keyof ContactInfo): string | null {
    const value = contactInfo?.[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function formatLocationTypeLabel(type: LocationCatalogType | null | undefined): string {
    switch (type) {
        case 'university':
            return 'Trường đại học';
        case 'district':
            return 'Khu vực';
        case 'neighborhood':
            return 'Lân cận';
        case 'campus':
            return 'Campus';
        case 'station':
            return 'Ga / bến';
        case 'landmark':
            return 'Điểm mốc';
        case 'poi':
        default:
            return 'Địa điểm';
    }
}

function buildInternalHref(
    pathname: string,
    params: Record<string, string | number | boolean | null | undefined>
): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
            return;
        }

        searchParams.set(key, String(value));
    });

    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
}

function buildRomiActionsFromToolResult(functionName: ToolName, result: unknown): RomiAction[] {
    const payload = (typeof result === 'object' && result !== null ? result : {}) as Record<string, unknown>;

    if (functionName === 'search_rooms') {
        const rooms = Array.isArray(payload.rooms) ? payload.rooms as Array<Record<string, unknown>> : [];
        const searchContext = (payload.searchContext ?? {}) as Record<string, unknown>;
        if (rooms.length === 0) {
            return [];
        }

        const actions: RomiAction[] = [
            {
                type: 'open_search',
                label: `Mở ${rooms.length} phòng phù hợp`,
                href: buildInternalHref('/search', {
                    q: searchContext.query,
                    city: searchContext.city,
                    district: searchContext.district,
                    address: searchContext.address,
                    lat: searchContext.lat,
                    lng: searchContext.lng,
                    radius: searchContext.radiusKm,
                }),
                description: 'Xem danh sách phòng đã được ROMI lọc sẵn',
            },
        ];

        const firstRoomId = rooms[0]?.id;
        const firstRoomTitle = typeof rooms[0]?.title === 'string' ? rooms[0].title : 'phòng đầu tiên';
        if (typeof firstRoomId === 'string' && firstRoomId) {
            actions.push({
                type: 'open_room',
                label: `Xem ${firstRoomTitle}`,
                href: `/room/${firstRoomId}`,
            });
        }

        return actions;
    }

    if (functionName === 'search_partners') {
        const partners = Array.isArray(payload.partners) ? payload.partners as Array<Record<string, unknown>> : [];
        const searchContext = (payload.searchContext ?? {}) as Record<string, unknown>;
        if (partners.length === 0) {
            return [];
        }

        return [
            {
                type: 'open_local_passport',
                label: 'Xem đối tác phù hợp',
                href: buildInternalHref('/local-passport', {
                    search: searchContext.query,
                    category: searchContext.category,
                }),
                description: 'Mở Local Passport với bộ lọc dịch vụ tương ứng',
            },
            {
                type: 'open_support_services',
                label: 'Mở trang dịch vụ',
                href: '/support-services',
            },
        ];
    }

    if (functionName === 'search_deals') {
        const deals = Array.isArray(payload.deals) ? payload.deals as Array<Record<string, unknown>> : [];
        const searchContext = (payload.searchContext ?? {}) as Record<string, unknown>;
        if (deals.length === 0) {
            return [];
        }

        const actions: RomiAction[] = [
            {
                type: 'open_local_passport',
                label: 'Mở ưu đãi trong Local Passport',
                href: buildInternalHref('/local-passport', {
                    search: searchContext.query,
                    category: searchContext.category,
                }),
                description: 'Xem danh sách ưu đãi phù hợp với câu hỏi của bạn',
            },
        ];

        if (payload.hasLockedPremiumDeals) {
            actions.push({
                type: 'open_payment',
                label: 'Mở khóa deal Premium',
                href: '/payment?source=romi',
            });
        }

        return actions;
    }

    if (functionName === 'search_locations') {
        const locations = Array.isArray(payload.locations) ? payload.locations as Array<Record<string, unknown>> : [];
        if (locations.length === 0) {
            return [];
        }

        const primaryLocation = locations[0];
        return [
            {
                type: 'open_search',
                label: 'Tìm phòng quanh địa điểm này',
                href: buildInternalHref('/search', {
                    q: typeof primaryLocation.name === 'string' ? primaryLocation.name : '',
                    address: typeof primaryLocation.address === 'string' && primaryLocation.address.trim()
                        ? primaryLocation.address
                        : primaryLocation.subtitle,
                    city: primaryLocation.city,
                    district: primaryLocation.district,
                    lat: primaryLocation.latitude,
                    lng: primaryLocation.longitude,
                    radius: 5,
                }),
                description: 'Mở Search với vị trí đã được ROMI chọn sẵn',
            },
        ];
    }

    if (functionName === 'get_app_info') {
        const topic = typeof payload.topic === 'string' ? payload.topic : 'general';
        switch (topic) {
            case 'rommz_plus':
                return [{ type: 'open_payment', label: 'Xem gói RommZ+', href: '/payment?source=romi' }];
            case 'services':
                return [{ type: 'open_support_services', label: 'Mở dịch vụ', href: '/support-services' }];
            case 'perks':
                return [{ type: 'open_local_passport', label: 'Mở Local Passport', href: '/local-passport' }];
            case 'verification':
                return [{ type: 'open_verification', label: 'Mở xác thực', href: '/verification' }];
            case 'roommate_matching':
                return [{ type: 'open_roommates', label: 'Mở tìm bạn cùng phòng', href: '/roommates' }];
            case 'swap_room':
                return [{ type: 'open_swap', label: 'Mở SwapRoom', href: '/swap' }];
            default:
                return [{ type: 'open_search', label: 'Bắt đầu tìm phòng', href: '/search' }];
        }
    }

    return [];
}

function buildRomiActions(functionCalls: Array<{ name: ToolName; result: unknown }>): RomiAction[] {
    const seen = new Set<string>();
    const actions: RomiAction[] = [];

    for (const call of functionCalls) {
        for (const action of buildRomiActionsFromToolResult(call.name, call.result)) {
            const key = `${action.type}:${action.href}`;
            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            actions.push(action);

            if (actions.length >= 3) {
                return actions;
            }
        }
    }

    return actions;
}

function buildRateLimitedFallback(toolNames: ToolName[]): { message: string; actions: RomiAction[] } {
    if (toolNames.includes('search_rooms')) {
        return {
            message: 'ROMI đang quá tải ở bước phân tích câu hỏi. Bạn vẫn có thể mở thẳng trang tìm phòng để tiếp tục lọc theo khu vực và ngân sách.',
            actions: [
                {
                    type: 'open_search',
                    label: 'Mở tìm phòng',
                    href: '/search',
                    description: 'Tiếp tục tìm phòng trực tiếp trong app',
                },
            ],
        };
    }

    if (toolNames.includes('search_partners')) {
        return {
            message: 'ROMI đang quá tải ở bước xử lý yêu cầu. Bạn có thể mở thẳng trang dịch vụ để xem các đối tác phù hợp.',
            actions: [
                { type: 'open_support_services', label: 'Mở dịch vụ', href: '/support-services' },
                { type: 'open_local_passport', label: 'Mở Local Passport', href: '/local-passport' },
            ],
        };
    }

    if (toolNames.includes('search_deals')) {
        return {
            message: 'ROMI đang quá tải ở bước xử lý ưu đãi. Bạn có thể mở Local Passport để xem deal đang hoạt động.',
            actions: [
                { type: 'open_local_passport', label: 'Mở Local Passport', href: '/local-passport' },
            ],
        };
    }

    if (toolNames.includes('search_locations')) {
        return {
            message: 'ROMI đang quá tải ở bước xử lý địa điểm. Bạn có thể mở tìm phòng và nhập thẳng khu vực hoặc trường học cần tìm.',
            actions: [
                { type: 'open_search', label: 'Mở tìm phòng', href: '/search' },
            ],
        };
    }

    if (toolNames.includes('get_app_info')) {
        return {
            message: getRomiAppInfo('general'),
            actions: [
                { type: 'open_search', label: 'Bắt đầu tìm phòng', href: '/search' },
                { type: 'open_roommates', label: 'Tìm bạn cùng phòng', href: '/roommates' },
            ],
        };
    }

    return {
        message: 'ROMI đang quá tải tạm thời. Bạn thử lại sau ít phút, hoặc mở trực tiếp các flow chính của RommZ ở bên dưới.',
        actions: [
            { type: 'open_search', label: 'Tìm phòng', href: '/search' },
            { type: 'open_roommates', label: 'Tìm bạn cùng phòng', href: '/roommates' },
        ],
    };
}

async function hasActiveRommzPlus(userId: string, adminClient: AdminClient): Promise<boolean> {
    const { data, error } = await adminClient
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('plan', 'rommz_plus')
        .gt('current_period_end', new Date().toISOString())
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Premium lookup error:', error);
        return false;
    }

    return Boolean(data?.id);
}

type RomiTelemetryEventName =
    | 'romi_message_sent'
    | 'romi_response_received'
    | 'romi_tool_called'
    | 'romi_action_clicked'
    | 'romi_error';

async function trackRomiAnalyticsEvent(
    adminClient: AdminClient,
    userId: string | null,
    sessionId: string | null,
    eventName: RomiTelemetryEventName,
    properties: Record<string, unknown>
) {
    const { error } = await adminClient
        .from('analytics_events')
        .insert({
            event_name: eventName,
            user_id: userId,
            session_id: sessionId,
            properties,
            timestamp: new Date().toISOString(),
        });

    if (error) {
        console.warn('Failed to track ROMI analytics event:', eventName, error.message);
    }
}

function summarizeToolOutput(toolName: string, result: unknown) {
    const payload = typeof result === 'object' && result !== null
        ? result as Record<string, unknown>
        : {};

    const collectionKey = ['rooms', 'partners', 'deals', 'locations']
        .find((key) => Array.isArray(payload[key]));
    const resultCount = collectionKey ? (payload[collectionKey] as unknown[]).length : null;
    const status = payload.error
        ? 'error'
        : resultCount === 0
            ? 'empty'
            : 'success';

    return {
        tool_name: toolName,
        status,
        result_count: resultCount,
        has_message: typeof payload.message === 'string',
    };
}

type HistoryMessage = {
    role: string;
    content: string;
    metadata?: unknown;
};

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

    const isPartnerSearchIntent =
        /(dich vu|doi tac|chuyen nha|don dep|ve sinh|noi that|dien nuoc|sua chua|furniture|cleaning|moving)/.test(text);

    const isDealSearchIntent =
        /(uu dai|deal|voucher|giam gia|khuyen mai|local passport)/.test(text);

    const isLocationSearchIntent =
        !isRoomSearchIntent &&
        /(dia diem|truong|dai hoc|campus|ga|ben xe|landmark|diem moc)/.test(text);

    const isAppInfoIntent =
        /(tinh nang|feature|rommz\+|swap ?room|roommate|xac thuc|uu dai|service|dich vu|perk)/.test(text);

    const selectedTools: Array<(typeof TOOLS)[keyof typeof TOOLS]> = [];

    if (isRoomSearchIntent) {
        selectedTools.push(TOOLS.search_rooms);
    }
    if (isPartnerSearchIntent) {
        selectedTools.push(TOOLS.search_partners);
    }
    if (isDealSearchIntent) {
        selectedTools.push(TOOLS.search_deals);
    }
    if (isLocationSearchIntent) {
        selectedTools.push(TOOLS.search_locations);
    }
    if (isRoomDetailIntent) {
        selectedTools.push(TOOLS.get_room_details);
    }
    if (isAppInfoIntent) {
        selectedTools.push(TOOLS.get_app_info);
    }

    return selectedTools;
}

async function checkRateLimit(
    userId: string,
    adminClient: AdminClient
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
        return 'ROMI gặp lỗi khi tìm phòng. Bạn thử lại sau giúp mình nhé.';
    }

    const rooms = Array.isArray(payload?.rooms) ? payload.rooms : [];
    if (rooms.length === 0) {
        return payload?.message || 'Hiện chưa có phòng phù hợp với tiêu chí của bạn.';
    }

    const lines = rooms.map((room, idx) => {
        const title = String(room.title || 'Phòng trọ');
        const price = String(room.price || 'Liên hệ');
        const location = String(room.location || 'Chưa rõ vị trí');
        const roomId = String(room.id || '');
        return `${idx + 1}. ${title} - ${price} (${location})${roomId ? `\nID: ${roomId}` : ''}`;
    });

    return `ROMI tìm được ${rooms.length} phòng phù hợp:\n\n${lines.join('\n\n')}\n\nBạn muốn mình lấy chi tiết phòng nào thì gửi ID nhé.`;
}

function formatSearchPartnersReply(result: unknown): string {
    const payload = result as { partners?: Array<Record<string, unknown>>; message?: string; error?: string };
    if (payload?.error) {
        return 'ROMI gặp lỗi khi tìm dịch vụ. Bạn thử lại sau giúp mình nhé.';
    }

    const partners = Array.isArray(payload?.partners) ? payload.partners : [];
    if (partners.length === 0) {
        return payload?.message || 'Hiện chưa có đối tác phù hợp với yêu cầu của bạn.';
    }

    const lines = partners.map((partner, idx) => {
        const name = String(partner.name || 'Đối tác');
        const category = String(partner.categoryLabel || 'Dịch vụ');
        const address = String(partner.address || 'Chưa rõ khu vực');
        const rating = typeof partner.rating === 'number' ? ` • ${partner.rating.toFixed(1)}⭐` : '';
        return `${idx + 1}. ${name} (${category})${rating}\nKhu vực: ${address}`;
    });

    return `ROMI tìm được ${partners.length} dịch vụ/đối tác phù hợp:\n\n${lines.join('\n\n')}`;
}

function formatSearchDealsReply(result: unknown): string {
    const payload = result as {
        deals?: Array<Record<string, unknown>>;
        isPremium?: boolean;
        message?: string;
        error?: string;
    };
    if (payload?.error) {
        return 'ROMI gặp lỗi khi tìm ưu đãi. Bạn thử lại sau giúp mình nhé.';
    }

    const deals = Array.isArray(payload?.deals) ? payload.deals : [];
    if (deals.length === 0) {
        return payload?.message || 'Hiện chưa có ưu đãi phù hợp với yêu cầu của bạn.';
    }

    const lines = deals.map((deal, idx) => {
        const title = String(deal.title || 'Ưu đãi');
        const partnerName = String(deal.partnerName || 'Đối tác');
        const discount = String(deal.discountValue || 'Ưu đãi đang cập nhật');
        const city = String(deal.city || 'Chưa rõ khu vực');
        const premiumTag = deal.isLocked
            ? ' • Deal Premium, cần RommZ+ để mở khóa'
            : deal.isPremiumOnly
                ? ' • Deal Premium đã mở khóa'
                : '';

        return `${idx + 1}. ${title} - ${discount}${premiumTag}\nĐối tác: ${partnerName} • Khu vực: ${city}`;
    });

    const tail = payload.isPremium
        ? '\n\nBạn đang có RommZ+, nên có thể mở các deal Premium ngay trên Local Passport.'
        : '\n\nNếu bạn muốn mở các deal Premium, ROMI có thể chỉ đường sang trang nâng cấp RommZ+.';

    return `ROMI tìm được ${deals.length} ưu đãi phù hợp:\n\n${lines.join('\n\n')}${tail}`;
}

function formatSearchLocationsReply(result: unknown): string {
    const payload = result as { locations?: Array<Record<string, unknown>>; message?: string; error?: string };
    if (payload?.error) {
        return 'ROMI gặp lỗi khi tìm địa điểm. Bạn thử lại sau giúp mình nhé.';
    }

    const locations = Array.isArray(payload?.locations) ? payload.locations : [];
    if (locations.length === 0) {
        return payload?.message || 'Hiện chưa có địa điểm phù hợp trong catalog.';
    }

    const lines = locations.map((location, idx) => {
        const name = String(location.name || 'Địa điểm');
        const type = String(location.typeLabel || 'Địa điểm');
        const subtitle = String(location.subtitle || 'Chưa rõ khu vực');
        return `${idx + 1}. ${name} (${type})\nKhu vực: ${subtitle}`;
    });

    return `ROMI tìm được ${locations.length} địa điểm phù hợp:\n\n${lines.join('\n\n')}`;
}

function formatRoomDetailsReply(result: unknown): string {
    const payload = result as Record<string, unknown>;
    if (payload?.error) {
        return 'ROMI chưa tìm thấy chi tiết phòng này. Bạn kiểm tra lại ID giúp mình nhé.';
    }

    const title = String(payload.title || 'Phòng trọ');
    const price = payload.price_per_month
        ? `${Number(payload.price_per_month).toLocaleString('vi-VN')}đ/tháng`
        : 'Liên hệ';
    const location = [payload.address, payload.district, payload.city]
        .filter(Boolean)
        .map(String)
        .join(', ');
    const furnished = payload.furnished ? 'Có nội thất' : 'Không nội thất';
    const verified = payload.is_verified ? 'Đã xác thực' : 'Chưa xác thực';

    return `${title}\nGiá: ${price}\nVị trí: ${location || 'Chưa rõ'}\nTiện ích: ${furnished} • ${verified}`;
}

function formatToolResultReply(functionName: string, result: unknown): string {
    if (functionName === 'search_rooms') return formatSearchRoomsReply(result);
    if (functionName === 'search_partners') return formatSearchPartnersReply(result);
    if (functionName === 'search_deals') return formatSearchDealsReply(result);
    if (functionName === 'search_locations') return formatSearchLocationsReply(result);
    if (functionName === 'get_room_details') return formatRoomDetailsReply(result);
    if (functionName === 'get_app_info') {
        const info = (result as { info?: string })?.info;
        return info || 'ROMI chưa có thông tin cho chủ đề này.';
    }
    return 'ROMI đã xử lý yêu cầu nhưng chưa thể tạo phản hồi phù hợp.';
}

type ToolName = keyof typeof TOOLS;
type SearchRoomsToolInput = {
    city?: string;
    district?: string;
    max_price?: number | string;
    min_price?: number | string;
    room_type?: string;
};
type SearchPartnersToolInput = {
    query?: string;
    category?: PartnerCategory;
    city?: string;
    limit?: number | string;
};
type SearchDealsToolInput = {
    query?: string;
    category?: PartnerCategory;
    city?: string;
    premium_only?: boolean;
    limit?: number | string;
};
type SearchLocationsToolInput = {
    query: string;
    city?: string;
    location_type?: LocationCatalogType;
    limit?: number | string;
};
type RoomDetailsToolInput = { room_id: string };
type AppInfoToolInput = { topic?: RomiAppInfoTopic };

async function handleFunctionCall(
    functionName: ToolName,
    args: Record<string, unknown>,
    adminClient: AdminClient,
    userId: string
): Promise<unknown> {
    switch (functionName) {
        case 'search_rooms': {
            const cityFilter = typeof args.city === 'string' ? args.city.trim() : '';
            const districtFilter = typeof args.district === 'string' ? args.district.trim() : '';
            const roomTypeFilter = typeof args.room_type === 'string' ? args.room_type.trim() : '';
            const maxPrice =
                typeof args.max_price === 'number'
                    ? args.max_price
                    : Number.isFinite(Number(args.max_price))
                        ? Number(args.max_price)
                        : null;
            const minPrice =
                typeof args.min_price === 'number'
                    ? args.min_price
                    : Number.isFinite(Number(args.min_price))
                        ? Number(args.min_price)
                        : null;
            const searchQuery = [districtFilter, cityFilter].filter(Boolean).join(', ') || cityFilter || districtFilter || null;

            const { data, error } = await adminClient.rpc('search_rooms', {
                p_search_query: searchQuery,
                p_district: districtFilter || null,
                p_min_price: minPrice,
                p_max_price: maxPrice,
                p_room_types: roomTypeFilter ? [roomTypeFilter] : null,
                p_is_verified: null,
                p_pet_allowed: null,
                p_furnished: null,
                p_amenities: null,
                p_lat: null,
                p_lng: null,
                p_radius_km: null,
                p_sort_by: 'newest',
                p_page: 1,
                p_page_size: 5,
            });

            if (error) return { error: 'Lỗi tìm kiếm phòng' };

            const rows = (data || []) as SearchRoomsRpcRow[];
            if (rows.length === 0) {
                return {
                    rooms: [],
                    message: 'Không tìm thấy phòng phù hợp',
                    searchContext: {
                        query: searchQuery,
                        city: cityFilter || null,
                        district: districtFilter || null,
                    },
                };
            }

            return {
                rooms: rows.map((r) => ({
                    id: r.id,
                    title: r.title,
                    price: `${Number(r.price_per_month).toLocaleString('vi-VN')}đ/tháng`,
                    location: `${r.district || ''}, ${r.city || ''}`.replace(/^, |, $/g, ''),
                    type: r.room_type,
                    area: r.area_sqm ? `${r.area_sqm}m²` : null,
                    verified: r.is_verified,
                    furnished: r.furnished,
                    distanceKm: r.distance_km,
                })),
                total: rows[0]?.total_count ?? rows.length,
                searchContext: {
                    query: searchQuery,
                    city: cityFilter || null,
                    district: districtFilter || null,
                    address: searchQuery,
                    lat: null,
                    lng: null,
                    radiusKm: null,
                },
            };
        }

        case 'search_partners': {
            const query = normalizeOptionalText(args.query);
            const city = normalizeOptionalText(args.city);
            const category = typeof args.category === 'string' ? args.category as PartnerCategory : null;
            const limit = clampLimit(args.limit);

            const { data, error } = await adminClient
                .from('partners')
                .select('id, name, category, description, address, phone, email, contact_info, specialization, discount, rating, review_count, hours, status')
                .eq('status', 'active')
                .order('rating', { ascending: false, nullsFirst: false })
                .order('review_count', { ascending: false, nullsFirst: false })
                .limit(50);

            if (error) return { error: 'Lỗi tìm kiếm đối tác' };

            const partners = ((data || []) as PartnerSearchRow[])
                .filter((partner) => !category || partner.category === category)
                .filter((partner) => {
                    if (!city) return true;
                    const haystack = [
                        partner.address,
                        partner.description,
                        partner.specialization,
                        partner.discount,
                    ]
                        .filter(Boolean)
                        .map(normalizeOptionalText)
                        .join(' ');
                    return haystack.includes(city);
                })
                .filter((partner) => {
                    if (!query) return true;
                    const haystack = [
                        partner.name,
                        partner.description,
                        partner.specialization,
                        partner.discount,
                        partner.address,
                    ]
                        .filter(Boolean)
                        .map(normalizeOptionalText)
                        .join(' ');
                    return haystack.includes(query);
                })
                .slice(0, limit);

            if (partners.length === 0) {
                return {
                    partners: [],
                    message: 'Không tìm thấy dịch vụ phù hợp trong hệ đối tác hiện tại.',
                    searchContext: {
                        query: typeof args.query === 'string' ? args.query.trim() : null,
                        category,
                        city: typeof args.city === 'string' ? args.city.trim() : null,
                    },
                };
            }

            return {
                partners: partners.map((partner) => ({
                    id: partner.id,
                    name: partner.name,
                    category: partner.category,
                    categoryLabel: formatPartnerCategoryLabel(partner.category),
                    address: partner.address,
                    website: getPartnerContactValue(partner.contact_info, 'website'),
                    phone: partner.phone || getPartnerContactValue(partner.contact_info, 'phone'),
                    email: partner.email || getPartnerContactValue(partner.contact_info, 'email'),
                    specialization: partner.specialization,
                    discount: partner.discount,
                    rating: partner.rating,
                    reviewCount: partner.review_count,
                    hours: partner.hours,
                })),
                searchContext: {
                    query: typeof args.query === 'string' ? args.query.trim() : null,
                    category,
                    city: typeof args.city === 'string' ? args.city.trim() : null,
                },
            };
        }

        case 'search_deals': {
            const query = normalizeOptionalText(args.query);
            const city = normalizeOptionalText(args.city);
            const category = typeof args.category === 'string' ? args.category as PartnerCategory : null;
            const premiumOnly = args.premium_only === true;
            const limit = clampLimit(args.limit);
            const isPremium = await hasActiveRommzPlus(userId, adminClient);
            const nowIso = new Date().toISOString();

            const { data, error } = await adminClient
                .from('deals')
                .select(`
                    id,
                    title,
                    discount_value,
                    description,
                    valid_until,
                    is_premium_only,
                    is_active,
                    partner:partners(
                        id,
                        name,
                        category,
                        address,
                        status
                    )
                `)
                .eq('is_active', true)
                .limit(50);

            if (error) return { error: 'Lỗi tìm kiếm ưu đãi' };

            const deals = ((data || []) as DealSearchRow[])
                .filter((deal) => deal.partner?.status === 'active')
                .filter((deal) => !deal.valid_until || deal.valid_until >= nowIso)
                .filter((deal) => !premiumOnly || deal.is_premium_only === true)
                .filter((deal) => !category || deal.partner?.category === category)
                .filter((deal) => {
                    if (!city) return true;
                    const haystack = [
                        deal.partner?.address,
                        deal.description,
                        deal.title,
                    ]
                        .filter(Boolean)
                        .map(normalizeOptionalText)
                        .join(' ');
                    return haystack.includes(city);
                })
                .filter((deal) => {
                    if (!query) return true;
                    const haystack = [
                        deal.title,
                        deal.description,
                        deal.discount_value,
                        deal.partner?.name,
                        deal.partner?.address,
                    ]
                        .filter(Boolean)
                        .map(normalizeOptionalText)
                        .join(' ');
                    return haystack.includes(query);
                })
                .sort((a, b) => Number(a.is_premium_only) - Number(b.is_premium_only))
                .slice(0, limit);

            if (deals.length === 0) {
                return {
                    deals: [],
                    isPremium,
                    message: 'Không tìm thấy ưu đãi phù hợp trong Local Passport.',
                    hasLockedPremiumDeals: false,
                    searchContext: {
                        query: typeof args.query === 'string' ? args.query.trim() : null,
                        category,
                        city: typeof args.city === 'string' ? args.city.trim() : null,
                    },
                };
            }

            return {
                isPremium,
                hasLockedPremiumDeals: deals.some((deal) => Boolean(deal.is_premium_only) && !isPremium),
                deals: deals.map((deal) => ({
                    id: deal.id,
                    title: deal.title,
                    discountValue: deal.discount_value,
                    description: deal.description,
                    validUntil: deal.valid_until,
                    isPremiumOnly: Boolean(deal.is_premium_only),
                    isLocked: Boolean(deal.is_premium_only) && !isPremium,
                    partnerName: deal.partner?.name,
                    category: deal.partner?.category,
                    city: deal.partner?.address,
                })),
                searchContext: {
                    query: typeof args.query === 'string' ? args.query.trim() : null,
                    category,
                    city: typeof args.city === 'string' ? args.city.trim() : null,
                },
            };
        }

        case 'search_locations': {
            const query = typeof args.query === 'string' ? args.query.trim() : '';
            if (!query) {
                return { error: 'Thiếu từ khóa địa điểm' };
            }

            const limit = clampLimit(args.limit);
            const city = typeof args.city === 'string' ? args.city.trim() : null;
            const locationType = typeof args.location_type === 'string' ? args.location_type as LocationCatalogType : null;

            const { data, error } = await adminClient.rpc('search_location_catalog', {
                p_query: query,
                p_city: city,
                p_types: locationType ? [locationType] : null,
                p_limit: limit,
            });

            if (error) return { error: 'Lỗi tìm kiếm địa điểm' };

            const locations = ((data || []) as LocationSearchRow[]).slice(0, limit);

            if (locations.length === 0) {
                return { locations: [], message: 'Không tìm thấy địa điểm phù hợp trong catalog.' };
            }

            return {
                locations: locations.map((location) => ({
                    id: location.id,
                    name: location.name,
                    type: location.location_type,
                    typeLabel: formatLocationTypeLabel(location.location_type),
                    subtitle: [location.district, location.city].filter(Boolean).join(', ') || location.address || 'Chưa rõ khu vực',
                    address: location.address,
                    city: location.city,
                    district: location.district,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    distanceKm: location.distance_km,
                    sourceName: location.source_name,
                })),
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

            if (error || !data) return { error: 'Không tìm thấy phòng' };
            return data;
        }

        case 'get_app_info': {
            const topic = typeof args.topic === 'string' ? args.topic : 'general';
            return { info: getRomiAppInfo(topic), topic };
        }

        default:
            return { error: 'ROMI chưa hỗ trợ tool này.' };
    }
}

function createToolset(selectedToolNames: ToolName[], adminClient: AdminClient, userId: string) {
    const includeSearchRooms = selectedToolNames.includes('search_rooms');
    const includeSearchPartners = selectedToolNames.includes('search_partners');
    const includeSearchDeals = selectedToolNames.includes('search_deals');
    const includeSearchLocations = selectedToolNames.includes('search_locations');
    const includeRoomDetails = selectedToolNames.includes('get_room_details');
    const includeAppInfo = selectedToolNames.includes('get_app_info');
    const toolset = {};

    if (includeSearchRooms) {
        const searchRoomsTool = tool({
            description: TOOLS.search_rooms.description,
            inputSchema: jsonSchema<SearchRoomsToolInput>({
                type: 'object',
                properties: {
                    city: { type: 'string' },
                    district: { type: 'string' },
                    max_price: { type: 'number' },
                    min_price: { type: 'number' },
                    room_type: { type: 'string' },
                },
            }),
            execute: async (input: SearchRoomsToolInput) =>
                handleFunctionCall('search_rooms', input, adminClient, userId),
        });
        Object.assign(toolset, { search_rooms: searchRoomsTool });
    }

    if (includeSearchPartners) {
        const searchPartnersTool = tool({
            description: TOOLS.search_partners.description,
            inputSchema: jsonSchema<SearchPartnersToolInput>({
                type: 'object',
                properties: {
                    query: { type: 'string' },
                    category: { type: 'string' },
                    city: { type: 'string' },
                    limit: { type: 'number' },
                },
            }),
            execute: async (input: SearchPartnersToolInput) =>
                handleFunctionCall('search_partners', input, adminClient, userId),
        });
        Object.assign(toolset, { search_partners: searchPartnersTool });
    }

    if (includeSearchDeals) {
        const searchDealsTool = tool({
            description: TOOLS.search_deals.description,
            inputSchema: jsonSchema<SearchDealsToolInput>({
                type: 'object',
                properties: {
                    query: { type: 'string' },
                    category: { type: 'string' },
                    city: { type: 'string' },
                    premium_only: { type: 'boolean' },
                    limit: { type: 'number' },
                },
            }),
            execute: async (input: SearchDealsToolInput) =>
                handleFunctionCall('search_deals', input, adminClient, userId),
        });
        Object.assign(toolset, { search_deals: searchDealsTool });
    }

    if (includeSearchLocations) {
        const searchLocationsTool = tool({
            description: TOOLS.search_locations.description,
            inputSchema: jsonSchema<SearchLocationsToolInput>({
                type: 'object',
                properties: {
                    query: { type: 'string' },
                    city: { type: 'string' },
                    location_type: {
                        type: 'string',
                        enum: ['university', 'district', 'neighborhood', 'poi', 'campus', 'station', 'landmark'],
                    },
                    limit: { type: 'number' },
                },
                required: ['query'],
            }),
            execute: async (input: SearchLocationsToolInput) =>
                handleFunctionCall('search_locations', input, adminClient, userId),
        });
        Object.assign(toolset, { search_locations: searchLocationsTool });
    }

    if (includeRoomDetails) {
        const roomDetailsTool = tool({
            description: TOOLS.get_room_details.description,
            inputSchema: jsonSchema<RoomDetailsToolInput>({
                type: 'object',
                properties: {
                    room_id: { type: 'string' },
                },
                required: ['room_id'],
            }),
            execute: async (input: RoomDetailsToolInput) =>
                handleFunctionCall('get_room_details', input, adminClient, userId),
        });
        Object.assign(toolset, { get_room_details: roomDetailsTool });
    }

    if (includeAppInfo) {
        const appInfoTool = tool({
            description: TOOLS.get_app_info.description,
            inputSchema: jsonSchema<AppInfoToolInput>({
                type: 'object',
                properties: {
                    topic: {
                        type: 'string',
                        enum: [...ROMI_APP_INFO_TOPICS],
                    },
                },
            }),
            execute: async (input: AppInfoToolInput) =>
                handleFunctionCall('get_app_info', input, adminClient, userId),
        });
        Object.assign(toolset, { get_app_info: appInfoTool });
    }

    return toolset;
}

function getToolChoice(forceFunctionNames: ToolName[]) {
    if (forceFunctionNames.length > 1) {
        return 'required' as const;
    }
    if (forceFunctionNames.length === 1) {
        return 'required' as const;
    }
    return 'auto' as const;
}

async function generateTextWithRetry(
    options: Parameters<typeof generateText>[0],
    maxRetries = 1
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

            const delayMs = (attempt + 1) * 1200;
            console.log(`Gemini 429, retrying in ${delayMs}ms (attempt ${attempt + 1})`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    throw new Error('generateText retry loop exhausted unexpectedly');
}

function buildErrorDebugDetails(error: unknown) {
    const err = error as {
        name?: string;
        code?: string;
        message?: string;
        details?: string;
        hint?: string;
        statusCode?: number;
        responseBody?: unknown;
        cause?: unknown;
    };

    return {
        name: err.name || null,
        code: err.code || null,
        message: err.message || null,
        details: err.details || null,
        hint: err.hint || null,
        statusCode: err.statusCode ?? null,
        responseBody: err.responseBody ?? null,
        cause:
            typeof err.cause === 'object' && err.cause !== null
                ? JSON.parse(JSON.stringify(err.cause))
                : err.cause ?? null,
    };
}

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);
    let telemetryUserId: string | null = null;
    let telemetrySessionId: string | null = null;

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Verify JWT
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Thiếu thông tin xác thực.', code: 'AUTH_ERROR' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
            global: { headers: { Authorization: authHeader } },
        });
        const { data: { user }, error: authError } = await userClient.auth.getUser();
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Token đăng nhập không hợp lệ.', code: 'AUTH_ERROR' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }
        telemetryUserId = user.id;

        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Rate limit
        if (!(await checkRateLimit(user.id, adminClient))) {
            return new Response(
                JSON.stringify({ error: 'Bạn đang gửi quá nhiều tin nhắn. Vui lòng đợi 1 phút.', code: 'RATE_LIMITED' }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Parse request
        const { message, sessionId } = await req.json();
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: 'Tin nhắn là bắt buộc.', code: 'INVALID_INPUT' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (message.length > 2000) {
            return new Response(
                JSON.stringify({ error: 'Tin nhắn quá dài. Giới hạn là 2000 ký tự.', code: 'INVALID_INPUT' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (sessionId !== undefined && sessionId !== null) {
            if (typeof sessionId !== 'string' || !UUID_REGEX.test(sessionId)) {
                return new Response(
                    JSON.stringify({ error: 'Session ID không hợp lệ.', code: 'INVALID_INPUT' }),
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
                    JSON.stringify({ error: 'Phiên chat không hợp lệ.', code: 'INVALID_SESSION' }),
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
        telemetrySessionId = currentSessionId;

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
            (name): name is ToolName =>
                name === 'search_rooms' ||
                name === 'search_partners' ||
                name === 'search_deals' ||
                name === 'search_locations' ||
                name === 'get_room_details'
        );
        const activeToolNames = forceFunctionNames.length > 0 ? forceFunctionNames : selectedToolNames;
        const toolset = createToolset(activeToolNames, adminClient, user.id);
        const hasTools = Object.keys(toolset).length > 0;

        await trackRomiAnalyticsEvent(
            adminClient,
            user.id,
            currentSessionId,
            'romi_message_sent',
            {
                message_length: message.trim().length,
                selected_tools: selectedToolNames,
                active_tools: activeToolNames,
                is_new_session: !sessionId,
            }
        );

        let responseText = '';
        let finishReason = 'rule_based';
        let geminiCallCount = 0;
        let usage: unknown = null;
        let responseSource = 'rule_based';
        let functionCallResults: Array<{ name: string; result: unknown }> = [];
        let romiActions: RomiAction[] = [];
        const languageModel = getLanguageModel();

        if (!hasTools && isGreetingMessage(normalizeText(message))) {
            responseText = buildGreetingReply();
            romiActions = [
                { type: 'open_search', label: 'Tìm phòng', href: '/search' },
                { type: 'open_roommates', label: 'Tìm bạn cùng phòng', href: '/roommates' },
            ];
            responseSource = 'rule_based_greeting';
        } else if (!languageModel) {
            const fallback = buildRateLimitedFallback(selectedToolNames);
            responseText = fallback.message;
            romiActions = fallback.actions;
            finishReason = 'provider_not_configured';
            responseSource = 'provider_not_configured_fallback';
        } else {
            try {
                const aiResult = await generateTextWithRetry({
                    model: languageModel,
                    system: SYSTEM_PROMPT,
                    messages,
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                    topP: 0.95,
                    ...(hasTools
                        ? {
                            tools: toolset,
                            toolChoice: getToolChoice(forceFunctionNames),
                            stopWhen: stepCountIs(1),
                        }
                        : {}),
                });

                responseText = aiResult.text?.trim() || '';
                functionCallResults = (aiResult.toolResults || []).map(result => ({
                    name: result.toolName,
                    result: result.output,
                }));

                if (!responseText && functionCallResults.length > 0) {
                    responseText = functionCallResults
                        .map((call, index) => {
                            const formatted = formatToolResultReply(call.name, call.result);
                            if (functionCallResults.length === 1) return formatted;
                            return `Kết quả ${index + 1} (${call.name}):\n${formatted}`;
                        })
                        .join('\n\n');
                }

                if (!responseText) {
                    responseText = 'Xin lỗi, ROMI chưa thể xử lý yêu cầu này lúc này. Bạn thử lại giúp mình nhé.';
                }

                finishReason = String(aiResult.finishReason || 'stop');
                geminiCallCount = aiResult.steps?.length || 1;
                usage = aiResult.usage;
                responseSource = 'model';
                romiActions = buildRomiActions(
                    functionCallResults
                        .filter((call): call is { name: ToolName; result: unknown } =>
                            typeof call.name === 'string' &&
                            (call.name in TOOLS)
                        )
                );
            } catch (modelError) {
                if (!isRateLimitError(modelError) && !isRecoverableProviderError(modelError)) {
                    throw modelError;
                }
                const fallback = buildRateLimitedFallback(selectedToolNames);
                responseText = fallback.message;
                romiActions = fallback.actions;
                finishReason = isRateLimitError(modelError)
                    ? 'provider_rate_limited'
                    : 'provider_unavailable';
                responseSource = isRateLimitError(modelError)
                    ? 'provider_rate_limited_fallback'
                    : 'provider_unavailable_fallback';
            }
        }

        const responseMetadata: Record<string, unknown> = {
            source: responseSource,
            geminiCallCount,
            finishReason,
            usage,
        };

        if (functionCallResults.length > 0) {
            responseMetadata.functionCalls = functionCallResults;
        }

        if (romiActions.length > 0) {
            responseMetadata.actions = romiActions;
        }

        if (functionCallResults.length > 0) {
            await Promise.all(functionCallResults.map((call) =>
                trackRomiAnalyticsEvent(
                    adminClient,
                    user.id,
                    currentSessionId,
                    'romi_tool_called',
                    summarizeToolOutput(call.name, call.result),
                )
            ));
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

        await trackRomiAnalyticsEvent(
            adminClient,
            user.id,
            currentSessionId,
            'romi_response_received',
            {
                response_length: responseText.length,
                tool_count: functionCallResults.length,
                tool_names: functionCallResults.map((call) => call.name),
                finish_reason: finishReason,
                gemini_call_count: geminiCallCount,
                source: responseSource,
            }
        );

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

        const errorDebugDetails = buildErrorDebugDetails(error);

        console.error('ROMI error:', errorDebugDetails);

        if (telemetryUserId) {
            await trackRomiAnalyticsEvent(
                createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY),
                telemetryUserId,
                telemetrySessionId,
                'romi_error',
                EXPOSE_INTERNAL_ERRORS
                    ? errorDebugDetails
                    : {
                        code: err.code || 'UNKNOWN',
                        message: err.message || null,
                    }
            );
        }

        if (err.code === '42P01') {
            return new Response(
                JSON.stringify({
                    error: 'Thiếu bảng dữ liệu AI Chatbot. Hãy chạy migration mới nhất.',
                    code: 'DB_SCHEMA_MISSING',
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (err.code === '22P02') {
            return new Response(
                JSON.stringify({
                    error: 'Session ID không hợp lệ.',
                    code: 'INVALID_INPUT',
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const errorPayload: Record<string, unknown> = {
            error: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
            code: 'GEMINI_ERROR',
        };
        if (EXPOSE_INTERNAL_ERRORS) {
            errorPayload.details = errorDebugDetails;
        }

        return new Response(
            JSON.stringify(errorPayload),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
