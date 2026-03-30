/**
 * AI Chatbot Edge Function
 * Powered by Vercel AI Gateway via Vercel AI SDK
 * 
 * POST /functions/v1/ai-chatbot
 * Body: { message: string, sessionId?: string }
 * Response: { message: string, sessionId: string, metadata?: object }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { gateway, generateText, jsonSchema, stepCountIs, streamText, tool } from 'https://esm.sh/ai@5.0.56?target=deno';
import { createGoogleGenerativeAI } from 'https://esm.sh/@ai-sdk/google@2.0.40?target=deno';
import {
    ROMI_EXPERIENCE_VERSION,
    ROMI_APP_INFO_TOPICS,
    getRomiAppInfo,
    type RomiAppInfoTopic,
} from '../../../packages/shared/src/constants/romi.ts';
import { analyzeRomiIntake } from '../../../packages/shared/src/services/ai-chatbot/intake.ts';
import { finalizeJourneyState, mergeJourneyState } from '../../../packages/shared/src/services/ai-chatbot/journey.ts';
import type {
    AIChatHistoryEntry,
    AIChatMessageMetadata,
    RomiBudgetConstraintType,
    RomiClarificationRequest,
    RomiHandoff,
    RomiIntent,
    RomiJourneyState,
    RomiKnowledgeSource,
    RomiNormalizationConfidence,
    RomiResolutionOutcome,
    RomiViewerMode,
} from '../../../packages/shared/src/services/ai-chatbot/types.ts';
import { buildClarificationReply, buildGuestHandoff } from './fallback-policy.ts';
import {
    buildKnowledgeContext,
    ensureKnowledgeCorpus,
    inferKnowledgeSection,
    retrieveKnowledgeSources,
} from './knowledge.ts';
import { buildKnowledgeOnlyReply, buildRomiSystemPrompt } from './response-composer.ts';

const AI_GATEWAY_API_KEY = Deno.env.get('AI_GATEWAY_API_KEY');
const AI_GATEWAY_MODEL = Deno.env.get('AI_GATEWAY_MODEL') || 'google/gemini-2.0-flash-lite';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash-lite';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPOSE_INTERNAL_ERRORS = Deno.env.get('EXPOSE_INTERNAL_ERRORS') === 'true';
const FEATURE_FLAG_CACHE_TTL_MS = 10_000;
const DEFAULT_ROMI_FLAGS = {
    romi_normalization_v2: Deno.env.get('ROMI_NORMALIZATION_V2') !== 'false',
    romi_knowledge_gating_v1: Deno.env.get('ROMI_KNOWLEDGE_GATING_V1') !== 'false',
    romi_auto_broaden_v1: Deno.env.get('ROMI_AUTO_BROADEN_V1') !== 'false',
} as const;
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
type AdminClient = any;
const guestRateLimitWindow = new Map<string, number[]>();
let romiFeatureFlagCache: { expiresAt: number; flags: RomiFeatureFlags } | null = null;

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
        | 'open_swap'
        | 'open_login';
    label: string;
    href: string;
    description?: string;
};

type SessionRow = {
    id: string;
    user_id: string;
    title: string | null;
    created_at: string;
    updated_at: string;
    experience_version: string;
    journey_state: RomiJourneyState | null;
};

type ToolCallSummary = {
    name: string;
    status: 'planned' | 'running' | 'completed' | 'failed';
    input?: unknown;
    result?: unknown;
};

type StreamEmitter = (event: Record<string, unknown>) => void;
type RomiFeatureFlagKey = keyof typeof DEFAULT_ROMI_FLAGS;
type RomiFeatureFlags = Record<RomiFeatureFlagKey, boolean>;
type RoomSearchAttemptMode = 'exact' | 'broaden_location' | 'broaden_budget';
type RoomSearchAttemptSummary = NonNullable<AIChatMessageMetadata['searchAttempts']>[number];
type FeatureFlagRow = {
    key: string;
    enabled: boolean;
};
type ResolvedLocation = {
    name: string;
    city: string | null;
    district: string | null;
    latitude: number | null;
    longitude: number | null;
};
type RoomSearchExecution = {
    functionCallResults: Array<{ name: ToolName; result: unknown }>;
    journeyState: RomiJourneyState;
    clarification: RomiClarificationRequest | null;
    responseText: string;
    responseSource: string;
    romiActions: RomiAction[];
    sources: string[];
    searchAttempts: RoomSearchAttemptSummary[];
    searchNormalizationWarnings: string[];
    normalizationConfidence: RomiNormalizationConfidence | null;
    autoBroadenApplied: boolean;
    resolutionOutcome: RomiResolutionOutcome;
    knowledgeAppended: boolean;
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

function canonicalizeCityLabel(city: string | null | undefined) {
    const normalized = normalizeOptionalText(city);
    if (!normalized) return typeof city === 'string' ? city : null;

    if (normalized === 'tp.hcm' || normalized === 'tphcm' || normalized === 'thanh pho ho chi minh' || normalized === 'ho chi minh' || normalized === 'sai gon') {
        return 'Thành phố Hồ Chí Minh';
    }

    if (normalized === 'ha noi') return 'Hà Nội';
    if (normalized === 'da nang') return 'Đà Nẵng';
    if (normalized === 'can tho') return 'Cần Thơ';

    return typeof city === 'string' ? city : null;
}

async function getRomiFeatureFlags(adminClient: AdminClient): Promise<RomiFeatureFlags> {
    const now = Date.now();
    if (romiFeatureFlagCache && romiFeatureFlagCache.expiresAt > now) {
        return romiFeatureFlagCache.flags;
    }

    const defaults: RomiFeatureFlags = { ...DEFAULT_ROMI_FLAGS };
    try {
        const { data, error } = await adminClient
            .from('romi_feature_flags')
            .select('key, enabled');

        if (error) {
            throw error;
        }

        const rows: FeatureFlagRow[] = Array.isArray(data) ? data as FeatureFlagRow[] : [];
        const flags: RomiFeatureFlags = { ...defaults };

        for (const featureRow of rows) {
            if (featureRow.key in flags) {
                flags[featureRow.key as RomiFeatureFlagKey] = Boolean(featureRow.enabled);
            }
        }

        romiFeatureFlagCache = {
            expiresAt: now + FEATURE_FLAG_CACHE_TTL_MS,
            flags,
        };
        return flags;
    } catch (error) {
        console.warn('ROMI feature flag lookup failed, falling back to env defaults:', error);
        romiFeatureFlagCache = {
            expiresAt: now + FEATURE_FLAG_CACHE_TTL_MS,
            flags: defaults,
        };
        return defaults;
    }
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

    if (['AI_LoadAPIKeyError', 'LoadAPIKeyError', 'AI_NoSuchModelError', 'NoSuchModelError'].includes(err.name || '')) {
        return true;
    }

    if (!['AI_APICallError', 'APICallError'].includes(err.name || '')) {
        return /missing api key|api key is missing|api key not valid|no such model|model not found|provider_not_configured/i.test(
            `${message} ${responseBody}`,
        );
    }

    if (statusCode === 429) {
        return true;
    }

    return statusCode === 400
        || statusCode === 401
        || statusCode === 403
        || /API_KEY_INVALID|API key not valid|INVALID_ARGUMENT|Bad Request|missing api key|no such model|model not found/i.test(`${message} ${responseBody}`);
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
                    q: typeof searchContext.query === 'string' ? searchContext.query : null,
                    city: typeof searchContext.city === 'string' ? searchContext.city : null,
                    district: typeof searchContext.district === 'string' ? searchContext.district : null,
                    address: typeof searchContext.address === 'string' ? searchContext.address : null,
                    lat: typeof searchContext.lat === 'number' ? searchContext.lat : null,
                    lng: typeof searchContext.lng === 'number' ? searchContext.lng : null,
                    radius: typeof searchContext.radiusKm === 'number' ? searchContext.radiusKm : null,
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
                    search: typeof searchContext.query === 'string' ? searchContext.query : null,
                    category: typeof searchContext.category === 'string' ? searchContext.category : null,
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
                    search: typeof searchContext.query === 'string' ? searchContext.query : null,
                    category: typeof searchContext.category === 'string' ? searchContext.category : null,
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
                        : typeof primaryLocation.subtitle === 'string'
                            ? primaryLocation.subtitle
                            : null,
                    city: typeof primaryLocation.city === 'string' ? primaryLocation.city : null,
                    district: typeof primaryLocation.district === 'string' ? primaryLocation.district : null,
                    lat: typeof primaryLocation.latitude === 'number' ? primaryLocation.latitude : null,
                    lng: typeof primaryLocation.longitude === 'number' ? primaryLocation.longitude : null,
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
    | 'romi_error'
    | 'romi_clarification_loop'
    | 'romi_budget_terse_fill'
    | 'romi_zero_result_exact'
    | 'romi_broaden_success'
    | 'romi_broaden_fail'
    | 'romi_unresolved_poi'
    | 'romi_mixed_intent_append'
    | 'romi_repair_after_failed_extraction';

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

async function trackRomiHardeningEvents(
    adminClient: AdminClient,
    userId: string | null,
    sessionId: string | null,
    options: {
        clarification: RomiClarificationRequest | null;
        clarificationLoopCount: number;
        searchAttempts: RoomSearchAttemptSummary[];
        searchNormalizationWarnings: string[];
        autoBroadenApplied: boolean;
        resolutionOutcome: RomiResolutionOutcome | null;
        knowledgeAppended: boolean;
        budgetTerseReplyFilled: boolean;
    },
) {
    const followUpEvents: Array<Promise<void>> = [];

    if (options.clarification?.mode === 'repair_after_failed_extraction') {
        followUpEvents.push(
            trackRomiAnalyticsEvent(adminClient, userId, sessionId, 'romi_repair_after_failed_extraction', {
                missing_fields: options.clarification.missingFields,
            }),
        );
    }

    if (options.clarificationLoopCount > 1) {
        followUpEvents.push(
            trackRomiAnalyticsEvent(adminClient, userId, sessionId, 'romi_clarification_loop', {
                clarification_loop_count: options.clarificationLoopCount,
                field: options.clarification?.missingFields?.[0] || null,
            }),
        );
    }

    const exactAttempt = options.searchAttempts.find((attempt) => attempt.mode === 'exact');
    if (exactAttempt && exactAttempt.resultCount === 0) {
        followUpEvents.push(
            trackRomiAnalyticsEvent(adminClient, userId, sessionId, 'romi_zero_result_exact', {
                applied_filters: exactAttempt.appliedFilters,
            }),
        );
    }

    if (options.autoBroadenApplied && options.resolutionOutcome === 'broadened_results') {
        followUpEvents.push(
            trackRomiAnalyticsEvent(adminClient, userId, sessionId, 'romi_broaden_success', {
                search_attempts: options.searchAttempts,
            }),
        );
    }

    if (options.searchAttempts.length > 1 && options.resolutionOutcome === 'no_match') {
        followUpEvents.push(
            trackRomiAnalyticsEvent(adminClient, userId, sessionId, 'romi_broaden_fail', {
                search_attempts: options.searchAttempts,
            }),
        );
    }

    if (options.searchNormalizationWarnings.includes('poi_unresolved')) {
        followUpEvents.push(
            trackRomiAnalyticsEvent(adminClient, userId, sessionId, 'romi_unresolved_poi', {
                warnings: options.searchNormalizationWarnings,
            }),
        );
    }

    if (options.knowledgeAppended && options.searchAttempts.length > 0) {
        followUpEvents.push(
            trackRomiAnalyticsEvent(adminClient, userId, sessionId, 'romi_mixed_intent_append', {
                search_attempts: options.searchAttempts.length,
            }),
        );
    }

    if (options.budgetTerseReplyFilled) {
        followUpEvents.push(
            trackRomiAnalyticsEvent(adminClient, userId, sessionId, 'romi_budget_terse_fill', {
                search_attempts: options.searchAttempts.length,
            }),
        );
    }

    if (followUpEvents.length > 0) {
        await Promise.all(followUpEvents);
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

function shouldRetrieveKnowledgeForTurn(
    intent: RomiIntent,
    requestedTopics: string[],
    selectedToolNames: ToolName[],
    flags: RomiFeatureFlags,
) {
    if (!flags.romi_knowledge_gating_v1) {
        return requestedTopics.length > 0 || selectedToolNames.includes('get_app_info');
    }

    const roomSearchPrimary = intent === 'room_search'
        || selectedToolNames.includes('search_rooms')
        || selectedToolNames.includes('search_locations');

    if (roomSearchPrimary) {
        return requestedTopics.length > 0;
    }

    return requestedTopics.length > 0 || selectedToolNames.includes('get_app_info');
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

function getGuestRateKey(req: Request) {
    const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const userAgent = req.headers.get('user-agent') || 'unknown';
    return `${forwardedFor || 'guest'}:${userAgent.slice(0, 48)}`;
}

function checkGuestRateLimit(key: string) {
    const now = Date.now();
    const windowStart = now - RATE_WINDOW_MS;
    const recentHits = (guestRateLimitWindow.get(key) || []).filter((timestamp) => timestamp >= windowStart);

    if (recentHits.length >= RATE_LIMIT) {
        guestRateLimitWindow.set(key, recentHits);
        return false;
    }

    recentHits.push(now);
    guestRateLimitWindow.set(key, recentHits);
    return true;
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
    search_query?: string;
    max_price?: number | string;
    min_price?: number | string;
    room_type?: string;
    lat?: number | string;
    lng?: number | string;
    radius_km?: number | string;
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
            const explicitSearchQuery = typeof args.search_query === 'string' ? args.search_query.trim() : '';
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
            const latitude =
                typeof args.lat === 'number'
                    ? args.lat
                    : Number.isFinite(Number(args.lat))
                        ? Number(args.lat)
                        : null;
            const longitude =
                typeof args.lng === 'number'
                    ? args.lng
                    : Number.isFinite(Number(args.lng))
                        ? Number(args.lng)
                        : null;
            const radiusKm =
                typeof args.radius_km === 'number'
                    ? args.radius_km
                    : Number.isFinite(Number(args.radius_km))
                        ? Number(args.radius_km)
                        : null;
            const searchQuery = explicitSearchQuery || [districtFilter, cityFilter].filter(Boolean).join(', ') || cityFilter || districtFilter || null;

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
                p_lat: latitude,
                p_lng: longitude,
                p_radius_km: radiusKm,
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
                        address: searchQuery,
                        lat: latitude,
                        lng: longitude,
                        radiusKm,
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
                    lat: latitude,
                    lng: longitude,
                    radiusKm,
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

function isRoomCollectionResult(result: unknown) {
    return Array.isArray((result as { rooms?: unknown[] })?.rooms);
}

function getRoomResultCount(result: unknown) {
    return isRoomCollectionResult(result) ? (((result as { rooms?: unknown[] }).rooms) || []).length : 0;
}

function getSearchContext(result: unknown) {
    return ((result as { searchContext?: Record<string, unknown> })?.searchContext || {}) as Record<string, unknown>;
}

function getBroadeningIncrement(maxPrice: number) {
    return Math.min(500_000, Math.max(300_000, Math.round(maxPrice * 0.15)));
}

function canBroadenBudget(
    budgetConstraintType: RomiBudgetConstraintType | null | undefined,
    budgetMax: number | null | undefined,
    flags: RomiFeatureFlags,
) {
    return flags.romi_auto_broaden_v1
        && budgetConstraintType === 'soft_cap'
        && typeof budgetMax === 'number'
        && Number.isFinite(budgetMax);
}

function buildSearchAttemptSummary(mode: RoomSearchAttemptMode, result: unknown): RoomSearchAttemptSummary {
    return {
        mode,
        resultCount: getRoomResultCount(result),
        appliedFilters: getSearchContext(result),
    };
}

function buildFieldClarificationState(
    currentJourneyState: RomiJourneyState,
    field: string,
    prompt: string,
    mode: NonNullable<RomiClarificationRequest['mode']>,
) {
    const nextLoopCounts = {
        ...(currentJourneyState.clarificationLoopCounts || {}),
        [field]: ((currentJourneyState.clarificationLoopCounts || {})[field] || 0) + 1,
    };
    const clarification: RomiClarificationRequest = {
        prompt,
        missingFields: [field],
        mode,
    };

    const nextJourneyState = mergeJourneyState(currentJourneyState, {
        stage: 'clarify',
        missingFields: [field],
        lastAskedField: field,
        lastAskedTurnIndex: (currentJourneyState.lastAskedTurnIndex || 0) + 1,
        clarificationLoopCounts: nextLoopCounts,
        resolutionOutcome: mode,
    });

    return { clarification, nextJourneyState };
}

function buildRoomSearchFiltersLabel(journeyState: RomiJourneyState) {
    const segments: string[] = [];

    if (journeyState.poiHint) {
        segments.push(`gần ${journeyState.poiHint}`);
    } else if (journeyState.areaHint) {
        segments.push(`gần ${journeyState.areaHint}`);
    }

    const location = [journeyState.district, journeyState.city].filter(Boolean).join(', ');
    if (location) {
        segments.push(location);
    }

    if (typeof journeyState.budgetMax === 'number') {
        segments.push(`tối đa ${journeyState.budgetMax.toLocaleString('vi-VN')}đ`);
    } else if (typeof journeyState.budgetMin === 'number') {
        segments.push(`từ ${journeyState.budgetMin.toLocaleString('vi-VN')}đ`);
    }

    if (journeyState.roomType) {
        segments.push(`loại ${journeyState.roomType}`);
    }

    return segments.join(' • ');
}

function buildKnowledgeAppendix(knowledgeSources: RomiKnowledgeSource[]) {
    if (!knowledgeSources.length) return '';

    const bulletLines = knowledgeSources
        .slice(0, 2)
        .map((source) => `- ${source.snippet || source.summary || source.label}`)
        .join('\n');

    return `\n\nNgoài phần tìm phòng, câu hỏi sản phẩm bạn vừa nhắc thêm có ý chính như sau:\n${bulletLines}`;
}

function buildRoomSearchResponseText(
    journeyState: RomiJourneyState,
    finalResult: unknown,
    attemptMode: RoomSearchAttemptMode,
    knowledgeSources: RomiKnowledgeSource[],
    searchWarnings: string[],
): string {
    const understanding = journeyState.summary?.trim()
        ? `Mình đang hiểu nhu cầu của bạn là ${journeyState.summary}.`
        : 'Mình đã gom lại nhu cầu tìm phòng của bạn để search sát hơn.';
    const searched = buildRoomSearchFiltersLabel(journeyState);
    const searchLine = searched
        ? `Mình đã tìm theo bộ lọc: ${searched}.`
        : 'Mình đã tìm theo các dữ liệu bạn vừa cho.';

    let broadenLine = '';
    if (attemptMode === 'broaden_location') {
        broadenLine = 'Vì chưa có kết quả khớp ngay theo điểm gần chính xác, mình đã nới phạm vi lân cận nhưng vẫn giữ nguyên quận/thành phố.';
    } else if (attemptMode === 'broaden_budget' && typeof journeyState.budgetMax === 'number') {
        broadenLine = 'Vì chưa có kết quả khớp ngay, mình đã nới nhẹ trần ngân sách theo mức mềm để tránh bỏ sót lựa chọn sát nhất.';
    } else if (searchWarnings.includes('poi_unresolved_admin_only')) {
        broadenLine = 'Lưu ý là mình chưa áp được khoảng cách đến địa điểm cụ thể, nên hiện đang lọc theo khu hành chính đã có.';
    }

    const roomCount = getRoomResultCount(finalResult);
    if (roomCount === 0) {
        const steps = attemptMode === 'exact'
            ? 'Hiện chưa có phòng khớp hoàn toàn ở lần tìm chính xác đầu tiên.'
            : 'Hiện cả sau khi đã nới an toàn thì vẫn chưa có phòng khớp hoàn toàn.';
        return [understanding, searchLine, broadenLine, steps, 'Nếu muốn, bạn nói lại khu vực gần nhất hoặc nới ngân sách mềm thêm một chút để mình lọc lại.']
            .filter(Boolean)
            .join('\n\n')
            + buildKnowledgeAppendix(knowledgeSources);
    }

    return [understanding, searchLine, broadenLine, formatSearchRoomsReply(finalResult)]
        .filter(Boolean)
        .join('\n\n')
        + buildKnowledgeAppendix(knowledgeSources);
}

async function executeRoomSearchFlow(
    adminClient: AdminClient,
    userId: string,
    journeyState: RomiJourneyState,
    flags: RomiFeatureFlags,
    viewerMode: RomiViewerMode,
    knowledgeSources: RomiKnowledgeSource[],
): Promise<RoomSearchExecution> {
    let nextJourneyState = mergeJourneyState(journeyState, {
        resolutionOutcome: null,
        lastAskedField: null,
        missingFields: [],
    });
    const canonicalCity = canonicalizeCityLabel(nextJourneyState.city);
    if (canonicalCity && canonicalCity !== nextJourneyState.city) {
        nextJourneyState = mergeJourneyState(nextJourneyState, {
            city: canonicalCity,
        });
    }
    const functionCallResults: Array<{ name: ToolName; result: unknown }> = [];
    const searchAttempts: RoomSearchAttemptSummary[] = [];
    const searchNormalizationWarnings: string[] = [];
    let normalizationConfidence: RomiNormalizationConfidence | null =
        nextJourneyState.district || nextJourneyState.city ? 'high' : null;
    let autoBroadenApplied = false;
    let knowledgeAppended = false;
    let clarification: RomiClarificationRequest | null = null;

    let resolvedLocation: ResolvedLocation | null = null;
    if (flags.romi_normalization_v2 && nextJourneyState.poiHint) {
        const locationResult = await handleFunctionCall(
            'search_locations',
            {
                query: nextJourneyState.poiHint,
                city: nextJourneyState.city || undefined,
                location_type: 'university',
                limit: 5,
            },
            adminClient,
            userId,
        );
        functionCallResults.push({ name: 'search_locations', result: locationResult });
        const locations = Array.isArray((locationResult as { locations?: unknown[] })?.locations)
            ? (locationResult as { locations: Array<Record<string, unknown>> }).locations
            : [];
        const firstLocation = locations[0];

        if (firstLocation) {
            resolvedLocation = {
                name: String(firstLocation.name || nextJourneyState.poiHint),
                city: typeof firstLocation.city === 'string' ? firstLocation.city : null,
                district: typeof firstLocation.district === 'string' ? firstLocation.district : null,
                latitude: typeof firstLocation.latitude === 'number' ? firstLocation.latitude : null,
                longitude: typeof firstLocation.longitude === 'number' ? firstLocation.longitude : null,
            };
            nextJourneyState = mergeJourneyState(nextJourneyState, {
                city: resolvedLocation.city ?? nextJourneyState.city,
                district: resolvedLocation.district ?? nextJourneyState.district,
            });
            normalizationConfidence = 'high';
        } else {
            normalizationConfidence = nextJourneyState.city || nextJourneyState.district ? 'medium' : 'low';
            if (nextJourneyState.city || nextJourneyState.district) {
                searchNormalizationWarnings.push('poi_unresolved_admin_only');
            } else {
                searchNormalizationWarnings.push('poi_unresolved');
                const repair = buildFieldClarificationState(
                    nextJourneyState,
                    'khu_vuc',
                    'Mình chưa khóa được địa điểm này trong catalog. Bạn cho mình quận, thành phố hoặc landmark gần đó nhé.',
                    'repair_after_failed_extraction',
                );
                clarification = repair.clarification;
                nextJourneyState = repair.nextJourneyState;
                return {
                    functionCallResults,
                    journeyState: finalizeJourneyState(nextJourneyState, viewerMode),
                    clarification,
                    responseText: buildClarificationReply(clarification),
                    responseSource: 'clarification',
                    romiActions: [],
                    sources: buildSources(functionCallResults),
                    searchAttempts,
                    searchNormalizationWarnings,
                    normalizationConfidence,
                    autoBroadenApplied,
                    resolutionOutcome: 'repair_after_failed_extraction',
                    knowledgeAppended: false,
                };
            }
        }
    }

    const exactSearchQuery = nextJourneyState.poiHint
        ? [nextJourneyState.poiHint, nextJourneyState.district, nextJourneyState.city].filter(Boolean).join(', ')
        : [nextJourneyState.areaHint, nextJourneyState.district, nextJourneyState.city].filter(Boolean).join(', ');
    const exactResult = await handleFunctionCall(
        'search_rooms',
        {
            city: nextJourneyState.city || undefined,
            district: nextJourneyState.district || undefined,
            search_query: exactSearchQuery || undefined,
            max_price: nextJourneyState.budgetMax ?? undefined,
            min_price: nextJourneyState.budgetMin ?? undefined,
            room_type: nextJourneyState.roomType ?? undefined,
            lat: resolvedLocation?.latitude ?? undefined,
            lng: resolvedLocation?.longitude ?? undefined,
            radius_km: resolvedLocation?.latitude != null && resolvedLocation?.longitude != null ? 3 : undefined,
        },
        adminClient,
        userId,
    );
    functionCallResults.push({ name: 'search_rooms', result: exactResult });
    searchAttempts.push(buildSearchAttemptSummary('exact', exactResult));

    let finalResult = exactResult;
    let finalMode: RoomSearchAttemptMode = 'exact';

    if (getRoomResultCount(finalResult) === 0 && nextJourneyState.district && resolvedLocation) {
        const broadenLocationResult = await handleFunctionCall(
            'search_rooms',
            {
                city: nextJourneyState.city || undefined,
                district: nextJourneyState.district || undefined,
                search_query: [nextJourneyState.district, nextJourneyState.city].filter(Boolean).join(', ') || undefined,
                max_price: nextJourneyState.budgetMax ?? undefined,
                min_price: nextJourneyState.budgetMin ?? undefined,
                room_type: nextJourneyState.roomType ?? undefined,
            },
            adminClient,
            userId,
        );
        functionCallResults.push({ name: 'search_rooms', result: broadenLocationResult });
        searchAttempts.push(buildSearchAttemptSummary('broaden_location', broadenLocationResult));
        if (getRoomResultCount(broadenLocationResult) > 0) {
            finalResult = broadenLocationResult;
            finalMode = 'broaden_location';
            autoBroadenApplied = true;
        }
    }

    if (getRoomResultCount(finalResult) === 0 && canBroadenBudget(nextJourneyState.budgetConstraintType, nextJourneyState.budgetMax, flags)) {
        const broadenedMaxPrice = Number(nextJourneyState.budgetMax) + getBroadeningIncrement(Number(nextJourneyState.budgetMax));
        const broadenBudgetResult = await handleFunctionCall(
            'search_rooms',
            {
                city: nextJourneyState.city || undefined,
                district: nextJourneyState.district || undefined,
                search_query: [nextJourneyState.district, nextJourneyState.city].filter(Boolean).join(', ') || undefined,
                max_price: broadenedMaxPrice,
                min_price: nextJourneyState.budgetMin ?? undefined,
                room_type: nextJourneyState.roomType ?? undefined,
            },
            adminClient,
            userId,
        );
        functionCallResults.push({ name: 'search_rooms', result: broadenBudgetResult });
        searchAttempts.push(buildSearchAttemptSummary('broaden_budget', broadenBudgetResult));
        if (getRoomResultCount(broadenBudgetResult) > 0) {
            finalResult = broadenBudgetResult;
            finalMode = 'broaden_budget';
            autoBroadenApplied = true;
            nextJourneyState = mergeJourneyState(nextJourneyState, {
                budgetMax: broadenedMaxPrice,
            });
        }
    }

    if (knowledgeSources.length > 0) {
        knowledgeAppended = true;
    }

    const resolutionOutcome: RomiResolutionOutcome = getRoomResultCount(finalResult) > 0
        ? (finalMode === 'exact' ? 'results' : 'broadened_results')
        : 'no_match';
    nextJourneyState = mergeJourneyState(nextJourneyState, {
        stage: getRoomResultCount(finalResult) > 0 ? 'recommend' : 'clarify',
        resolutionOutcome,
    });
    const responseText = buildRoomSearchResponseText(nextJourneyState, finalResult, finalMode, knowledgeSources, searchNormalizationWarnings);
    const romiActions = buildRomiActions(functionCallResults);
    if (romiActions.length === 0) {
        romiActions.push({
            type: 'open_search',
            label: 'Mở tìm phòng',
            href: '/search',
            description: 'Tiếp tục lọc trực tiếp trong app nếu bạn muốn chủ động hơn.',
        });
    }

    return {
        functionCallResults,
        journeyState: finalizeJourneyState(nextJourneyState, viewerMode),
        clarification,
        responseText,
        responseSource: finalMode === 'exact' ? 'deterministic_room_search' : 'deterministic_room_search_broadened',
        romiActions,
        sources: buildSources(functionCallResults),
        searchAttempts,
        searchNormalizationWarnings,
        normalizationConfidence,
        autoBroadenApplied,
        resolutionOutcome,
        knowledgeAppended,
    };
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

function getSessionPreview(content: string | null | undefined) {
    if (!content) return null;
    const normalized = content.replace(/\s+/g, ' ').trim();
    if (!normalized) return null;
    return normalized.length > 110 ? `${normalized.slice(0, 107)}...` : normalized;
}

function buildSessionPreviewFromJourney(
    content: string | null | undefined,
    journeyState: RomiJourneyState | null | undefined,
    handoff: RomiHandoff | null | undefined,
) {
    const summary = journeyState?.summary?.trim();
    const resolutionOutcome = journeyState?.resolutionOutcome;

    if (summary && resolutionOutcome && resolutionOutcome !== 'needs_clarification') {
        return summary;
    }

    if (handoff?.reason?.trim()) {
        return handoff.reason.trim();
    }

    return getSessionPreview(content);
}

function inferIntent(
    message: string,
    selectedToolNames: ToolName[],
    functionCallResults: Array<{ name: ToolName; result: unknown }> = []
) {
    const normalized = normalizeText(message);
    const executedToolNames = functionCallResults.map(call => call.name);
    const appInfoTopic = functionCallResults.find(call => call.name === 'get_app_info')?.result as
        | { topic?: string }
        | undefined;

    if (selectedToolNames.includes('get_room_details') || executedToolNames.includes('get_room_details')) return 'room_detail';
    if (selectedToolNames.includes('search_rooms') || executedToolNames.includes('search_rooms')) return 'room_search';
    if (selectedToolNames.includes('search_deals') || executedToolNames.includes('search_deals')) return 'deals';
    if (selectedToolNames.includes('search_partners') || executedToolNames.includes('search_partners')) return 'services';
    if (selectedToolNames.includes('search_locations') || executedToolNames.includes('search_locations')) return 'room_search';

    if (appInfoTopic?.topic === 'rommz_plus') return 'premium';
    if (appInfoTopic?.topic === 'services' || appInfoTopic?.topic === 'perks') return 'services';
    if (appInfoTopic?.topic === 'roommate_matching') return 'roommates';
    if (appInfoTopic?.topic === 'swap_room') return 'swap';

    if (/(roommate|ban cung phong|o ghep)/.test(normalized)) return 'roommates';
    if (/(swap|ngan han|doi phong|nhuong phong)/.test(normalized)) return 'swap';
    if (/(premium|rommz\+)/.test(normalized)) return 'premium';
    if (/(service|dich vu|doi tac|uu dai|deal)/.test(normalized)) return 'services';

    return 'general';
}

function inferContext(functionCallResults: Array<{ name: ToolName; result: unknown }>) {
    for (const call of functionCallResults) {
        const payload = (typeof call.result === 'object' && call.result !== null ? call.result : {}) as Record<string, unknown>;

        if (call.name === 'get_room_details' && typeof payload.id === 'string') {
            return { contextType: 'room', contextId: payload.id };
        }

        if (call.name === 'search_rooms') {
            const firstRoom = Array.isArray(payload.rooms) ? payload.rooms[0] as Record<string, unknown> : null;
            if (typeof firstRoom?.id === 'string') {
                return { contextType: 'room', contextId: firstRoom.id };
            }
        }

        if (call.name === 'search_deals') {
            const firstDeal = Array.isArray(payload.deals) ? payload.deals[0] as Record<string, unknown> : null;
            if (typeof firstDeal?.id === 'string') {
                return { contextType: 'deal', contextId: firstDeal.id };
            }

            if (payload.hasLockedPremiumDeals) {
                return { contextType: 'premium', contextId: 'rommz_plus' };
            }
        }

        if (call.name === 'search_partners') {
            const firstPartner = Array.isArray(payload.partners) ? payload.partners[0] as Record<string, unknown> : null;
            if (typeof firstPartner?.id === 'string') {
                return { contextType: 'service', contextId: firstPartner.id };
            }
        }

        if (call.name === 'get_app_info' && typeof payload.topic === 'string') {
            if (payload.topic === 'rommz_plus') {
                return { contextType: 'premium', contextId: 'rommz_plus' };
            }
            if (payload.topic === 'swap_room') {
                return { contextType: 'swap', contextId: 'swap_room' };
            }
            if (payload.topic === 'roommate_matching') {
                return { contextType: 'roommate', contextId: 'roommate_matching' };
            }
            if (payload.topic === 'services' || payload.topic === 'perks') {
                return { contextType: 'service', contextId: payload.topic };
            }
        }
    }

    return { contextType: 'general', contextId: null };
}

function buildSources(functionCallResults: Array<{ name: ToolName; result: unknown }>) {
    const sources = new Set<string>();

    for (const call of functionCallResults) {
        const payload = (typeof call.result === 'object' && call.result !== null ? call.result : {}) as Record<string, unknown>;

        if (call.name === 'search_rooms' || call.name === 'get_room_details') {
            sources.add('Nguồn phòng đang mở');
        }
        if (call.name === 'search_deals') {
            sources.add('Local Passport');
        }
        if (call.name === 'search_partners') {
            sources.add('Đối tác RommZ');
        }
        if (call.name === 'search_locations') {
            sources.add('Location catalog');
        }
        if (call.name === 'get_app_info') {
            sources.add('RommZ product knowledge');
        }

        const searchContext = (payload.searchContext ?? {}) as Record<string, unknown>;
        const locationLabel = [searchContext.district, searchContext.city]
            .filter(Boolean)
            .map(String)
            .join(', ');
        if (locationLabel) {
            sources.add(locationLabel);
        }
    }

    return [...sources].slice(0, 3);
}

function buildToolCallSummaries(functionCallResults: Array<{ name: ToolName; result: unknown }>) {
    return functionCallResults.map((call) => ({
        name: call.name,
        status: 'completed' as const,
        result: call.result,
    }));
}

function buildSessionPayload(
    session: SessionRow,
    preview: string | null,
    previewRole: 'user' | 'assistant' | 'system' | null,
    lastMessageAt: string,
    intent: string,
    contextType: string,
) {
    return {
        ...session,
        updated_at: lastMessageAt,
        preview,
        previewRole,
        lastMessageAt,
        intent,
        contextType,
        experienceVersion: session.experience_version,
        journeyState: session.journey_state || {},
    };
}

function emitChunkedText(emit: StreamEmitter, text: string) {
    const words = text.split(/(\s+)/).filter(Boolean);
    let chunk = '';

    for (const word of words) {
        if ((chunk + word).length > 42 && chunk.trim()) {
            emit({ type: 'token', text: chunk });
            chunk = word;
            continue;
        }

        chunk += word;
    }

    if (chunk.trim()) {
        emit({ type: 'token', text: chunk });
    }
}

function createStreamResponse(
    corsHeaders: Record<string, string>,
    handler: (emit: StreamEmitter) => Promise<void>,
) {
    const encoder = new TextEncoder();

    return new Response(
        new ReadableStream({
            async start(controller) {
                const emit: StreamEmitter = (event) => {
                    controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
                };

                try {
                    await handler(emit);
                } catch (error) {
                    const err = error as { code?: string; message?: string; details?: string | null };
                    emit({
                        type: 'error',
                        code: err.code || 'GEMINI_ERROR',
                        message: err.message || 'ROMI chưa thể hoàn tất yêu cầu này.',
                        details: err.details || null,
                    });
                } finally {
                    controller.close();
                }
            },
        }),
        {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/x-ndjson; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                'X-Accel-Buffering': 'no',
            },
        },
    );
}

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);
    let telemetryUserId: string | null = null;
    let telemetrySessionId: string | null = null;

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const requestBody = await req.json();
        const {
            message,
            sessionId,
            stream: requestStream,
            viewerMode: requestedViewerMode,
            entryPoint = 'romi_page',
            pageContext,
            journeyState: requestedJourneyState,
            history: clientHistory,
        } = requestBody as {
            message?: string;
            sessionId?: string | null;
            stream?: boolean;
            viewerMode?: RomiViewerMode;
            entryPoint?: string;
            pageContext?: Record<string, unknown>;
            journeyState?: Partial<RomiJourneyState>;
            history?: AIChatHistoryEntry[];
        };

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

        const authHeader = req.headers.get('Authorization');
        const requestedMode = requestedViewerMode || (authHeader ? 'user' : 'guest');
        let user: { id: string } | null = null;

        if (authHeader) {
            const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
                global: { headers: { Authorization: authHeader } },
            });
            const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();
            if (!authError && authUser) {
                user = { id: authUser.id };
            } else if (requestedMode !== 'guest') {
                return new Response(
                    JSON.stringify({ error: 'Token đăng nhập không hợp lệ.', code: 'AUTH_ERROR' }),
                    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        if (requestedMode === 'user' && !user) {
            return new Response(
                JSON.stringify({ error: 'Thiếu thông tin xác thực.', code: 'AUTH_ERROR' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }
        telemetryUserId = user?.id || null;
        const effectiveViewerMode: RomiViewerMode = user ? requestedMode : 'guest';

        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const trimmedMessage = message.trim();
        const guestRateKey = getGuestRateKey(req);

        if (effectiveViewerMode === 'user' && user) {
            if (!(await checkRateLimit(user.id, adminClient))) {
                return new Response(
                    JSON.stringify({ error: 'Bạn đang gửi quá nhiều tin nhắn. Vui lòng đợi 1 phút.', code: 'RATE_LIMITED' }),
                    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        } else if (!checkGuestRateLimit(guestRateKey)) {
            return new Response(
                JSON.stringify({ error: 'Bạn đang gửi quá nhiều tin nhắn. Vui lòng đợi 1 phút.', code: 'RATE_LIMITED' }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        let currentSessionId = effectiveViewerMode === 'user' ? sessionId || null : null;
        let sessionRecord: SessionRow | null = null;

        if (currentSessionId && user) {
            const { data: existingSession, error: existingSessionError } = await adminClient
                .from('ai_chat_sessions')
                .select('id, user_id, title, created_at, updated_at, experience_version, journey_state')
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

            sessionRecord = existingSession as SessionRow;
            if (sessionRecord.experience_version !== ROMI_EXPERIENCE_VERSION) {
                return new Response(
                    JSON.stringify({ error: 'Phiên chat này thuộc trải nghiệm cũ và không còn dùng cho ROMI mới.', code: 'INVALID_SESSION' }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        const baseJourneyState = mergeJourneyState(
            sessionRecord?.journey_state || {},
            requestedJourneyState || {},
        );
        const intakeAnalysis = analyzeRomiIntake(trimmedMessage, baseJourneyState, effectiveViewerMode);
        let currentJourneyState = finalizeJourneyState(intakeAnalysis.journeyState, effectiveViewerMode);
        let clarification = intakeAnalysis.clarification;
        const handoff = buildGuestHandoff(effectiveViewerMode, intakeAnalysis.intent, currentJourneyState);
        const budgetTerseReplyFilled =
            baseJourneyState.lastAskedField === 'ngan_sach'
            && clarification == null
            && currentJourneyState.budgetConstraintType === 'soft_cap'
            && typeof currentJourneyState.budgetMax === 'number';
        const flags = await getRomiFeatureFlags(adminClient);
        const effectiveHistory = Array.isArray(clientHistory) ? clientHistory.slice(-12) : [];

        if (!currentSessionId && user && effectiveViewerMode === 'user') {
            const { data: newSession, error: sessionError } = await adminClient
                .from('ai_chat_sessions')
                .insert({
                    user_id: user.id,
                    title: trimmedMessage.substring(0, 100),
                    experience_version: ROMI_EXPERIENCE_VERSION,
                    journey_state: currentJourneyState,
                })
                .select('id, user_id, title, created_at, updated_at, experience_version, journey_state')
                .single();

            if (sessionError) throw sessionError;
            sessionRecord = newSession as SessionRow;
            currentSessionId = sessionRecord.id;
        }

        telemetrySessionId = currentSessionId;

        const userMessageTimestamp = new Date().toISOString();

        let historyRows: HistoryMessage[] = [];

        if (effectiveViewerMode === 'user' && currentSessionId) {
            await adminClient.from('ai_chat_messages').insert({
                session_id: currentSessionId,
                role: 'user',
                content: trimmedMessage,
                metadata: {
                    intent: intakeAnalysis.intent,
                    journeyState: currentJourneyState,
                    viewerMode: effectiveViewerMode,
                    source: 'romi_v3',
                },
            });

            await adminClient
                .from('ai_chat_sessions')
                .update({
                    updated_at: userMessageTimestamp,
                    journey_state: currentJourneyState,
                })
                .eq('id', currentSessionId);

            sessionRecord = {
                ...(sessionRecord as SessionRow),
                updated_at: userMessageTimestamp,
                journey_state: currentJourneyState,
            };

            const { data: history } = await adminClient
                .from('ai_chat_messages')
                .select('role, content, metadata')
                .eq('session_id', currentSessionId)
                .order('created_at', { ascending: true })
                .limit(20);

            historyRows = (history || []) as HistoryMessage[];
        } else {
            historyRows = [
                ...effectiveHistory.map((entry) => ({
                    role: entry.role,
                    content: entry.content,
                    metadata: entry.metadata || {},
                })),
                {
                    role: 'user',
                    content: trimmedMessage,
                    metadata: {
                        intent: intakeAnalysis.intent,
                        journeyState: currentJourneyState,
                        viewerMode: effectiveViewerMode,
                        source: 'romi_v3_guest',
                    },
                },
            ];
        }

        const selectedTools = getToolsForMessage(message, historyRows);
        const selectedToolNames = selectedTools.map(t => t.name) as ToolName[];
        const shouldRetrieveKnowledge = shouldRetrieveKnowledgeForTurn(
            intakeAnalysis.intent,
            intakeAnalysis.requestedTopics,
            selectedToolNames,
            flags,
        );
        const knowledgeSources = shouldRetrieveKnowledge
            ? await (async () => {
                await ensureKnowledgeCorpus(adminClient);
                return await retrieveKnowledgeSources(
                    adminClient,
                    trimmedMessage,
                    effectiveViewerMode,
                    inferKnowledgeSection(intakeAnalysis.requestedTopics),
                );
            })()
            : [];
        const knowledgeContext = buildKnowledgeContext(knowledgeSources);

        // Build model request via Vercel AI SDK
        const messages = historyRows.map(msg => ({
            role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
            content: String(msg.content || ''),
        }));

        const shouldPauseForClarification = Boolean(clarification);
        const forceFunctionNames = selectedToolNames.filter(
            (name): name is ToolName =>
                name === 'search_rooms' ||
                name === 'search_partners' ||
                name === 'search_deals' ||
                name === 'search_locations' ||
                name === 'get_room_details'
        );
        const activeToolNames = shouldPauseForClarification
            ? []
            : forceFunctionNames.length > 0
                ? forceFunctionNames
                : selectedToolNames;
        const toolset = createToolset(activeToolNames, adminClient, user?.id || guestRateKey);
        const hasTools = Object.keys(toolset).length > 0;
        const baseIntent = intakeAnalysis.intent;
        const languageModel = getLanguageModel();

        if (telemetryUserId) {
            await trackRomiAnalyticsEvent(
                adminClient,
                telemetryUserId,
                currentSessionId,
                'romi_message_sent',
                {
                    message_length: trimmedMessage.length,
                    viewer_mode: effectiveViewerMode,
                    entry_point: entryPoint,
                    page_context: pageContext || null,
                    selected_tools: selectedToolNames,
                    active_tools: activeToolNames,
                    is_new_session: !sessionId,
                    stream: requestStream === true,
                    knowledge_source_count: knowledgeSources.length,
                }
            );
        }

        let responseText = '';
        let finishReason = 'rule_based';
        let geminiCallCount = 0;
        let usage: unknown = null;
        let responseSource = 'rule_based';
        let functionCallResults: Array<{ name: ToolName; result: unknown }> = [];
        let romiActions: RomiAction[] = [];
        let searchAttempts: RoomSearchAttemptSummary[] = [];
        let searchNormalizationWarnings: string[] = [];
        let normalizationConfidence: RomiNormalizationConfidence | null = null;
        let autoBroadenApplied = false;
        let resolutionOutcome: RomiResolutionOutcome | null = currentJourneyState.resolutionOutcome || null;
        let knowledgeAppended = false;

        if (knowledgeSources.length > 0 && baseIntent !== 'room_search') {
            knowledgeAppended = true;
        }

        if (requestStream === true) {
            return createStreamResponse(corsHeaders, async (emit) => {
                const initialSession = sessionRecord
                    ? buildSessionPayload(
                        sessionRecord,
                        getSessionPreview(trimmedMessage),
                        'user',
                        userMessageTimestamp,
                        baseIntent,
                        'general',
                    )
                    : null;

                emit({
                    type: 'start',
                    sessionId: currentSessionId,
                    session: initialSession,
                });
                emit({
                    type: 'status',
                    stage: 'intake',
                    message: shouldPauseForClarification
                        ? 'ROMI đang chốt phần còn thiếu trước khi dùng dữ liệu thật.'
                        : selectedToolNames.length
                            ? 'ROMI đang phân loại ý định và chọn đúng miền dữ liệu.'
                            : 'ROMI đang chốt ý định để giữ đúng flow tìm chỗ ở.',
                    intent: baseIntent,
                    contextType: 'general',
                    tools: activeToolNames,
                });
                emit({
                    type: 'journey_update',
                    journeyState: currentJourneyState,
                    message: currentJourneyState.summary || undefined,
                });
                if (knowledgeSources.length > 0) {
                    emit({
                        type: 'status',
                        stage: 'retrieval',
                        message: 'ROMI đang kéo knowledge context liên quan để giữ câu trả lời bám sản phẩm.',
                        intent: baseIntent,
                        contextType: 'general',
                    });
                }

                let streamResponseText = '';
                let streamFinishReason = 'stream';
                let streamGeminiCallCount = 0;
                let streamUsage: unknown = null;
                let streamResponseSource = 'stream_model';
                const streamedToolCalls = new Map<string, ToolCallSummary>();
                let streamedToolResults: Array<{ name: ToolName; result: unknown }> = [];
                let forcedStreamActions: RomiAction[] = [];

                const finalizeStream = async () => {
                    const streamActions = forcedStreamActions.length > 0
                        ? forcedStreamActions
                        : buildRomiActions(streamedToolResults);
                    const streamToolCalls = [
                        ...streamedToolCalls.values(),
                        ...buildToolCallSummaries(streamedToolResults).filter((summary) => !streamedToolCalls.has(summary.name)),
                    ];
                    const { contextType, contextId } = inferContext(streamedToolResults);
                    const streamIntent = inferIntent(trimmedMessage, selectedToolNames, streamedToolResults);
                    const streamSources = buildSources(streamedToolResults);
                    const finalJourneyState = finalizeJourneyState(
                        mergeJourneyState(currentJourneyState, {
                            lastIntent: streamIntent,
                            stage: handoff ? 'handoff' : clarification ? 'clarify' : streamedToolResults.length > 0 ? 'recommend' : currentJourneyState.stage,
                            groundedBy: [
                                ...(currentJourneyState.groundedBy || []),
                                ...(knowledgeAppended ? knowledgeSources.map((source) => source.documentTitle) : []),
                                ...streamSources,
                            ],
                            resolutionOutcome: resolutionOutcome || currentJourneyState.resolutionOutcome,
                        }),
                        effectiveViewerMode,
                    );
                    const responseMetadata: Record<string, unknown> = {
                        source: streamResponseSource,
                        geminiCallCount: streamGeminiCallCount || 1,
                        finishReason: streamFinishReason,
                        usage: streamUsage,
                        intent: streamIntent,
                        contextType,
                        contextId,
                        toolCalls: streamToolCalls,
                        journeyState: finalJourneyState,
                        knowledgeSources,
                        viewerMode: effectiveViewerMode,
                        budgetConstraintType: finalJourneyState.budgetConstraintType ?? null,
                        normalizationConfidence,
                        searchNormalizationWarnings,
                        searchAttempts,
                        clarificationLoopCount: clarification?.missingFields?.[0]
                            ? finalJourneyState.clarificationLoopCounts?.[clarification.missingFields[0]] ?? 0
                            : 0,
                        autoBroadenApplied,
                        resolutionOutcome: resolutionOutcome || finalJourneyState.resolutionOutcome || null,
                    };

                    if (streamedToolResults.length > 0) {
                        responseMetadata.functionCalls = streamedToolResults;
                    }

                    if (streamActions.length > 0) {
                        responseMetadata.actions = streamActions;
                    }

                    if (streamSources.length > 0) {
                        responseMetadata.sources = streamSources;
                    }

                    if (clarification) {
                        responseMetadata.clarification = clarification;
                    }

                    if (handoff) {
                        responseMetadata.handoff = handoff;
                    }

                    if (streamedToolResults.length > 0 && telemetryUserId) {
                        await Promise.all(streamedToolResults.map((call) =>
                            trackRomiAnalyticsEvent(
                                adminClient,
                                telemetryUserId,
                                currentSessionId,
                                'romi_tool_called',
                                summarizeToolOutput(call.name, call.result),
                            )
                        ));
                    }

                    const assistantCreatedAt = new Date().toISOString();
                    let messageId = `guest-${Date.now()}`;
                    let finalSession = initialSession;

                    if (effectiveViewerMode === 'user' && currentSessionId) {
                        const { data: insertedAssistant, error: insertAssistantError } = await adminClient
                            .from('ai_chat_messages')
                            .insert({
                                session_id: currentSessionId,
                                role: 'assistant',
                                content: streamResponseText,
                                metadata: responseMetadata,
                            })
                            .select('id')
                            .single();

                        if (insertAssistantError) throw insertAssistantError;
                        messageId = insertedAssistant.id;

                        await adminClient
                            .from('ai_chat_sessions')
                            .update({
                                updated_at: assistantCreatedAt,
                                journey_state: finalJourneyState,
                            })
                            .eq('id', currentSessionId);

                        finalSession = buildSessionPayload(
                            {
                                ...(sessionRecord as SessionRow),
                                updated_at: assistantCreatedAt,
                                journey_state: finalJourneyState,
                            },
                            buildSessionPreviewFromJourney(streamResponseText, finalJourneyState, handoff),
                            'assistant',
                            assistantCreatedAt,
                            streamIntent,
                            contextType,
                        );
                    }

                    if (telemetryUserId) {
                        await trackRomiAnalyticsEvent(
                            adminClient,
                            telemetryUserId,
                            currentSessionId,
                            'romi_response_received',
                            {
                                response_length: streamResponseText.length,
                                tool_count: streamedToolResults.length,
                                tool_names: streamedToolResults.map((call) => call.name),
                                finish_reason: streamFinishReason,
                                gemini_call_count: streamGeminiCallCount || 1,
                                source: streamResponseSource,
                                intent: streamIntent,
                                context_type: contextType,
                                knowledge_source_count: knowledgeSources.length,
                                search_attempt_count: searchAttempts.length,
                                normalization_confidence: normalizationConfidence,
                                auto_broaden_applied: autoBroadenApplied,
                                resolution_outcome: resolutionOutcome,
                            }
                        );
                        await trackRomiHardeningEvents(
                            adminClient,
                            telemetryUserId,
                            currentSessionId,
                            {
                                clarification,
                                clarificationLoopCount: clarification?.missingFields?.[0]
                                    ? finalJourneyState.clarificationLoopCounts?.[clarification.missingFields[0]] ?? 0
                                    : 0,
                                searchAttempts,
                                searchNormalizationWarnings,
                                autoBroadenApplied,
                                resolutionOutcome,
                                knowledgeAppended,
                                budgetTerseReplyFilled,
                            },
                        );
                    }

                    emit({
                        type: 'final',
                        sessionId: currentSessionId,
                        messageId,
                        message: streamResponseText,
                        metadata: responseMetadata,
                        session: finalSession,
                    });
                };

                try {
                    if (!hasTools && isGreetingMessage(normalizeText(message))) {
                        streamResponseText = buildGreetingReply();
                        streamResponseSource = 'rule_based_greeting';
                        streamFinishReason = 'rule_based';
                        forcedStreamActions = [
                            { type: 'open_search', label: 'Tìm phòng', href: '/search' },
                            { type: 'open_roommates', label: 'Tìm bạn cùng phòng', href: '/roommates' },
                        ];
                        emit({
                            type: 'status',
                            stage: 'synthesis',
                            message: 'ROMI đang mở luồng hội thoại và giữ điểm bắt đầu thật gọn.',
                            intent: baseIntent,
                            contextType: 'general',
                        });
                        emitChunkedText(emit, streamResponseText);
                        await finalizeStream();
                        return;
                    }

                    if (clarification) {
                        streamResponseText = buildClarificationReply(clarification);
                        streamResponseSource = 'clarification';
                        streamFinishReason = 'clarification_requested';
                        emit({
                            type: 'clarification_request',
                            clarification,
                            journeyState: currentJourneyState,
                        });
                        emit({
                            type: 'status',
                            stage: 'handoff',
                            message: 'ROMI đang dừng ở bước làm rõ để tránh trả lời sai miền dữ liệu.',
                            intent: baseIntent,
                            contextType: 'general',
                        });
                        emitChunkedText(emit, streamResponseText);
                        await finalizeStream();
                        return;
                    }

                    if (baseIntent === 'room_search' && flags.romi_normalization_v2) {
                        const roomSearchExecution = await executeRoomSearchFlow(
                            adminClient,
                            user?.id || guestRateKey,
                            currentJourneyState,
                            flags,
                            effectiveViewerMode,
                            knowledgeSources,
                        );
                        clarification = roomSearchExecution.clarification;
                        currentJourneyState = roomSearchExecution.journeyState;
                        streamedToolResults = roomSearchExecution.functionCallResults;
                        streamResponseText = roomSearchExecution.responseText;
                        streamResponseSource = roomSearchExecution.responseSource;
                        streamFinishReason = roomSearchExecution.clarification ? 'clarification_requested' : 'deterministic_room_search';
                        forcedStreamActions = roomSearchExecution.romiActions;
                        searchAttempts = roomSearchExecution.searchAttempts;
                        searchNormalizationWarnings = roomSearchExecution.searchNormalizationWarnings;
                        normalizationConfidence = roomSearchExecution.normalizationConfidence;
                        autoBroadenApplied = roomSearchExecution.autoBroadenApplied;
                        resolutionOutcome = roomSearchExecution.resolutionOutcome;
                        knowledgeAppended = roomSearchExecution.knowledgeAppended;

                        for (const call of roomSearchExecution.functionCallResults) {
                            emit({
                                type: 'tool_call',
                                tool: {
                                    name: call.name,
                                    status: 'running',
                                },
                            });
                            emit({
                                type: 'tool_result',
                                tool: {
                                    name: call.name,
                                    status: 'completed',
                                    result: call.result,
                                },
                                actions: buildRomiActionsFromToolResult(call.name, call.result),
                                sources: buildSources([{ name: call.name, result: call.result }]),
                            });
                        }

                        if (roomSearchExecution.clarification) {
                            emit({
                                type: 'clarification_request',
                                clarification: roomSearchExecution.clarification,
                                journeyState: currentJourneyState,
                            });
                        }

                        emit({
                            type: 'journey_update',
                            journeyState: currentJourneyState,
                            message: currentJourneyState.summary || undefined,
                        });
                        emit({
                            type: 'status',
                            stage: roomSearchExecution.clarification ? 'handoff' : 'synthesis',
                            message: roomSearchExecution.clarification
                                ? 'ROMI đang quay lại bước làm rõ để tránh trả kết quả sai khu vực.'
                                : 'ROMI đã khóa đúng vùng tìm kiếm và đang ghép kết quả theo thứ tự ưu tiên.',
                            intent: baseIntent,
                            contextType: 'general',
                        });
                        emitChunkedText(emit, streamResponseText);
                        await finalizeStream();
                        return;
                    }

                    if (!languageModel) {
                        const fallback = buildRateLimitedFallback(selectedToolNames);
                        streamResponseText = knowledgeSources.length > 0
                            ? buildKnowledgeOnlyReply(knowledgeSources, currentJourneyState)
                            : fallback.message;
                        streamFinishReason = 'provider_not_configured';
                        streamResponseSource = knowledgeSources.length > 0
                            ? 'knowledge_only_fallback'
                            : 'provider_not_configured_fallback';
                        forcedStreamActions = handoff
                            ? [{ type: 'open_login', label: handoff.label, href: handoff.href, description: handoff.reason }]
                            : fallback.actions;
                        emit({
                            type: 'status',
                            stage: 'synthesis',
                            message: 'ROMI chưa có model runtime, đang chuyển sang lối trả lời an toàn hơn.',
                            intent: baseIntent,
                            contextType: 'general',
                        });
                        if (handoff) {
                            emit({ type: 'handoff', handoff, journeyState: currentJourneyState });
                        }
                        emitChunkedText(emit, streamResponseText);
                        await finalizeStream();
                        return;
                    }

                    emit({
                        type: 'status',
                        stage: activeToolNames.length > 0 ? 'tool_execution' : 'synthesis',
                        message: activeToolNames.length > 0
                            ? 'ROMI đang gọi đúng dữ liệu để trả lời trong ngữ cảnh tìm chỗ ở.'
                            : 'ROMI đang tổng hợp câu trả lời trực tiếp cho câu hỏi của bạn.',
                        intent: baseIntent,
                        contextType: 'general',
                        tools: activeToolNames,
                    });
                    const streamResult = streamText({
                        model: languageModel,
                        system: buildRomiSystemPrompt({
                            viewerMode: effectiveViewerMode,
                            entryPoint,
                            intakeIntent: baseIntent,
                            journeyState: currentJourneyState,
                            knowledgeContext,
                        }),
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

                    for await (const part of streamResult.fullStream as AsyncIterable<any>) {
                        switch (part.type) {
                            case 'text-delta':
                                if (part.textDelta) {
                                    streamResponseText += part.textDelta;
                                    emit({ type: 'token', text: part.textDelta });
                                }
                                break;
                            case 'tool-call':
                            case 'tool-input-end': {
                                const toolSummary: ToolCallSummary = {
                                    name: part.toolName,
                                    status: 'running',
                                    input: part.input ?? part.args ?? undefined,
                                };
                                streamedToolCalls.set(part.toolName, toolSummary);
                                emit({ type: 'tool_call', tool: toolSummary });
                                break;
                            }
                            case 'tool-result': {
                                const toolSummary: ToolCallSummary = {
                                    name: part.toolName,
                                    status: 'completed',
                                    input: part.input ?? undefined,
                                    result: part.output,
                                };
                                streamedToolCalls.set(part.toolName, toolSummary);
                                streamedToolResults.push({
                                    name: part.toolName,
                                    result: part.output,
                                });
                                emit({
                                    type: 'tool_result',
                                    tool: toolSummary,
                                    actions: buildRomiActionsFromToolResult(part.toolName, part.output),
                                    sources: buildSources([{ name: part.toolName, result: part.output }]),
                                });
                                break;
                            }
                            case 'finish-step':
                                streamGeminiCallCount += 1;
                                break;
                            case 'finish':
                                streamFinishReason = String(part.finishReason || streamFinishReason);
                                streamUsage = part.usage ?? part.totalUsage ?? streamUsage;
                                break;
                            case 'error':
                                throw new Error(part.errorText || 'ROMI stream error');
                            default:
                                break;
                        }
                    }

                    if (!streamResponseText.trim() && streamedToolResults.length > 0) {
                        streamResponseText = streamedToolResults
                            .map((call, index) => {
                                const formatted = formatToolResultReply(call.name, call.result);
                                if (streamedToolResults.length === 1) return formatted;
                                return `Kết quả ${index + 1} (${call.name}):\n${formatted}`;
                            })
                            .join('\n\n');
                        emit({
                            type: 'status',
                            stage: 'synthesis',
                            message: 'ROMI đã có dữ liệu và đang ghép lại thành câu trả lời gọn hơn.',
                            intent: baseIntent,
                            contextType: 'general',
                        });
                        emitChunkedText(emit, streamResponseText);
                    }

                    if (!streamResponseText.trim()) {
                        streamResponseText = 'Xin lỗi, ROMI chưa thể xử lý yêu cầu này lúc này. Bạn thử lại giúp mình nhé.';
                        emitChunkedText(emit, streamResponseText);
                    }

                    if (handoff) {
                        emit({ type: 'handoff', handoff, journeyState: currentJourneyState });
                    }

                    await finalizeStream();
                } catch (modelError) {
                    if (!isRateLimitError(modelError) && !isRecoverableProviderError(modelError)) {
                        if (telemetryUserId) {
                            await trackRomiAnalyticsEvent(
                                adminClient,
                                telemetryUserId,
                                currentSessionId,
                                'romi_error',
                                EXPOSE_INTERNAL_ERRORS
                                    ? buildErrorDebugDetails(modelError)
                                    : {
                                        code: 'STREAM_RUNTIME',
                                        message: (modelError as Error)?.message || null,
                                    }
                            );
                        }
                        throw modelError;
                    }

                    const fallback = buildRateLimitedFallback(selectedToolNames);
                    streamResponseText = knowledgeSources.length > 0
                        ? buildKnowledgeOnlyReply(knowledgeSources, currentJourneyState)
                        : fallback.message;
                    streamFinishReason = isRateLimitError(modelError)
                        ? 'provider_rate_limited'
                        : 'provider_unavailable';
                    streamResponseSource = knowledgeSources.length > 0
                        ? 'knowledge_only_fallback'
                        : isRateLimitError(modelError)
                            ? 'provider_rate_limited_fallback'
                            : 'provider_unavailable_fallback';
                    forcedStreamActions = handoff
                        ? [{ type: 'open_login', label: handoff.label, href: handoff.href, description: handoff.reason }]
                        : fallback.actions;
                    emit({
                        type: 'status',
                        stage: 'synthesis',
                        message: 'ROMI đang chuyển sang chế độ trả lời nhanh để tránh đứng khựng quá lâu.',
                        intent: baseIntent,
                        contextType: 'general',
                    });
                    if (handoff) {
                        emit({ type: 'handoff', handoff, journeyState: currentJourneyState });
                    }
                    emitChunkedText(emit, streamResponseText);
                    await finalizeStream();
                }
            });
        }

        if (!hasTools && isGreetingMessage(normalizeText(message))) {
            responseText = buildGreetingReply();
            romiActions = [
                { type: 'open_search', label: 'Tìm phòng', href: '/search' },
                { type: 'open_roommates', label: 'Tìm bạn cùng phòng', href: '/roommates' },
            ];
            responseSource = 'rule_based_greeting';
        } else if (clarification) {
            responseText = buildClarificationReply(clarification);
            finishReason = 'clarification_requested';
            responseSource = 'clarification';
        } else if (baseIntent === 'room_search' && flags.romi_normalization_v2) {
            const roomSearchExecution = await executeRoomSearchFlow(
                adminClient,
                user?.id || guestRateKey,
                currentJourneyState,
                flags,
                effectiveViewerMode,
                knowledgeSources,
            );
            clarification = roomSearchExecution.clarification;
            currentJourneyState = roomSearchExecution.journeyState;
            functionCallResults = roomSearchExecution.functionCallResults;
            responseText = roomSearchExecution.responseText;
            finishReason = roomSearchExecution.clarification ? 'clarification_requested' : 'deterministic_room_search';
            responseSource = roomSearchExecution.responseSource;
            romiActions = roomSearchExecution.romiActions;
            searchAttempts = roomSearchExecution.searchAttempts;
            searchNormalizationWarnings = roomSearchExecution.searchNormalizationWarnings;
            normalizationConfidence = roomSearchExecution.normalizationConfidence;
            autoBroadenApplied = roomSearchExecution.autoBroadenApplied;
            resolutionOutcome = roomSearchExecution.resolutionOutcome;
            knowledgeAppended = roomSearchExecution.knowledgeAppended;
        } else if (!languageModel) {
            const fallback = buildRateLimitedFallback(selectedToolNames);
            responseText = knowledgeSources.length > 0
                ? buildKnowledgeOnlyReply(knowledgeSources, currentJourneyState)
                : fallback.message;
            romiActions = handoff
                ? [{ type: 'open_login', label: handoff.label, href: handoff.href, description: handoff.reason }]
                : fallback.actions;
            finishReason = 'provider_not_configured';
            responseSource = knowledgeSources.length > 0
                ? 'knowledge_only_fallback'
                : 'provider_not_configured_fallback';
        } else {
            try {
                const aiResult = await generateTextWithRetry({
                    model: languageModel,
                    system: buildRomiSystemPrompt({
                        viewerMode: effectiveViewerMode,
                        entryPoint,
                        intakeIntent: baseIntent,
                        journeyState: currentJourneyState,
                        knowledgeContext,
                    }),
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
                    name: result.toolName as ToolName,
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
                romiActions = buildRomiActions(functionCallResults);
            } catch (modelError) {
                if (!isRateLimitError(modelError) && !isRecoverableProviderError(modelError)) {
                    throw modelError;
                }
                const fallback = buildRateLimitedFallback(selectedToolNames);
                responseText = knowledgeSources.length > 0
                    ? buildKnowledgeOnlyReply(knowledgeSources, currentJourneyState)
                    : fallback.message;
                romiActions = handoff
                    ? [{ type: 'open_login', label: handoff.label, href: handoff.href, description: handoff.reason }]
                    : fallback.actions;
                finishReason = isRateLimitError(modelError)
                    ? 'provider_rate_limited'
                    : 'provider_unavailable';
                responseSource = knowledgeSources.length > 0
                    ? 'knowledge_only_fallback'
                    : isRateLimitError(modelError)
                        ? 'provider_rate_limited_fallback'
                        : 'provider_unavailable_fallback';
            }
        }

        const { contextType, contextId } = inferContext(functionCallResults);
        const intent = inferIntent(trimmedMessage, selectedToolNames, functionCallResults);
        const sources = buildSources(functionCallResults);
        const finalJourneyState = finalizeJourneyState(
            mergeJourneyState(currentJourneyState, {
                lastIntent: intent,
                stage: handoff ? 'handoff' : clarification ? 'clarify' : functionCallResults.length > 0 ? 'recommend' : currentJourneyState.stage,
                groundedBy: [
                    ...(currentJourneyState.groundedBy || []),
                    ...(knowledgeAppended ? knowledgeSources.map((source) => source.documentTitle) : []),
                    ...sources,
                ],
                resolutionOutcome: resolutionOutcome || currentJourneyState.resolutionOutcome,
            }),
            effectiveViewerMode,
        );
        const responseMetadata: Record<string, unknown> = {
            source: responseSource,
            geminiCallCount,
            finishReason,
            usage,
            intent,
            contextType,
            contextId,
            toolCalls: buildToolCallSummaries(functionCallResults),
            journeyState: finalJourneyState,
            knowledgeSources,
            viewerMode: effectiveViewerMode,
            budgetConstraintType: finalJourneyState.budgetConstraintType ?? null,
            normalizationConfidence,
            searchNormalizationWarnings,
            searchAttempts,
            clarificationLoopCount: clarification?.missingFields?.[0]
                ? finalJourneyState.clarificationLoopCounts?.[clarification.missingFields[0]] ?? 0
                : 0,
            autoBroadenApplied,
            resolutionOutcome: resolutionOutcome || finalJourneyState.resolutionOutcome || null,
        };

        if (functionCallResults.length > 0) {
            responseMetadata.functionCalls = functionCallResults;
        }

        if (romiActions.length > 0) {
            responseMetadata.actions = romiActions;
        }

        if (sources.length > 0) {
            responseMetadata.sources = sources;
        }

        if (clarification) {
            responseMetadata.clarification = clarification;
        }

        if (handoff) {
            responseMetadata.handoff = handoff;
        }

        if (functionCallResults.length > 0 && telemetryUserId) {
            await Promise.all(functionCallResults.map((call) =>
                trackRomiAnalyticsEvent(
                    adminClient,
                    telemetryUserId,
                    currentSessionId,
                    'romi_tool_called',
                    summarizeToolOutput(call.name, call.result),
                )
            ));
        }

        const assistantCreatedAt = new Date().toISOString();
        let messageId = `guest-${Date.now()}`;
        let responseSession = sessionRecord
            ? buildSessionPayload(
                {
                    ...sessionRecord,
                    journey_state: finalJourneyState,
                },
                buildSessionPreviewFromJourney(responseText, finalJourneyState, handoff),
                'assistant',
                assistantCreatedAt,
                intent,
                contextType,
            )
            : null;

        if (effectiveViewerMode === 'user' && currentSessionId) {
            const { data: insertedAssistant, error: insertAssistantError } = await adminClient
                .from('ai_chat_messages')
                .insert({
                    session_id: currentSessionId,
                    role: 'assistant',
                    content: responseText,
                    metadata: responseMetadata,
                })
                .select('id')
                .single();

            if (insertAssistantError) throw insertAssistantError;
            messageId = insertedAssistant.id;

            await adminClient
                .from('ai_chat_sessions')
                .update({
                    updated_at: assistantCreatedAt,
                    journey_state: finalJourneyState,
                })
                .eq('id', currentSessionId);

            responseSession = buildSessionPayload(
                {
                    ...(sessionRecord as SessionRow),
                    updated_at: assistantCreatedAt,
                    journey_state: finalJourneyState,
                },
                buildSessionPreviewFromJourney(responseText, finalJourneyState, handoff),
                'assistant',
                assistantCreatedAt,
                intent,
                contextType,
            );
        }

        if (telemetryUserId) {
            await trackRomiAnalyticsEvent(
                adminClient,
                telemetryUserId,
                currentSessionId,
                'romi_response_received',
                {
                    response_length: responseText.length,
                    tool_count: functionCallResults.length,
                    tool_names: functionCallResults.map((call) => call.name),
                    finish_reason: finishReason,
                    gemini_call_count: geminiCallCount,
                    source: responseSource,
                    intent,
                    context_type: contextType,
                    knowledge_source_count: knowledgeSources.length,
                    search_attempt_count: searchAttempts.length,
                    normalization_confidence: normalizationConfidence,
                    auto_broaden_applied: autoBroadenApplied,
                    resolution_outcome: resolutionOutcome,
                }
            );
            await trackRomiHardeningEvents(
                adminClient,
                telemetryUserId,
                currentSessionId,
                {
                    clarification,
                    clarificationLoopCount: clarification?.missingFields?.[0]
                        ? finalJourneyState.clarificationLoopCounts?.[clarification.missingFields[0]] ?? 0
                        : 0,
                    searchAttempts,
                    searchNormalizationWarnings,
                    autoBroadenApplied,
                    resolutionOutcome,
                    knowledgeAppended,
                    budgetTerseReplyFilled,
                },
            );
        }

        return new Response(
            JSON.stringify({
                message: responseText,
                sessionId: currentSessionId,
                metadata: responseMetadata,
                session: responseSession,
                messageId,
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
