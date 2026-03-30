import type {
  RomiClarificationRequest,
  RomiIntent,
  RomiJourneyState,
  RomiViewerMode,
} from './types.ts';
import { buildJourneySummary, mergeJourneyState } from './journey.ts';

export interface RomiIntakeAnalysis {
  intent: RomiIntent;
  journeyState: RomiJourneyState;
  clarification: RomiClarificationRequest | null;
  requestedTopics: string[];
  shouldUseKnowledge: boolean;
}

const CITY_LABELS = ['Hà Nội', 'TP.HCM', 'Thành phố Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ'];
const ROOM_TYPE_LABELS: Array<{ value: NonNullable<RomiJourneyState['roomType']>; patterns: RegExp[] }> = [
  { value: 'private', patterns: [/phong rieng/i, /private/i] },
  { value: 'shared', patterns: [/o ghep/i, /shared/i] },
  { value: 'studio', patterns: [/studio/i] },
  { value: 'entire', patterns: [/can ho/i, /entire/i] },
];

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function detectCity(input: string) {
  const normalized = normalizeText(input);

  if (normalized.includes('ha noi')) return 'Hà Nội';
  if (normalized.includes('tp.hcm') || normalized.includes('tphcm') || normalized.includes('sai gon') || normalized.includes('ho chi minh')) {
    return 'TP.HCM';
  }
  if (normalized.includes('da nang')) return 'Đà Nẵng';
  if (normalized.includes('can tho')) return 'Cần Thơ';

  return CITY_LABELS.find((city) => normalized.includes(normalizeText(city))) || null;
}

function detectDistrict(input: string) {
  const match = input.match(/(Quận|Quan|Q\.?|Huyện|Huyen)\s*([0-9A-Za-zÀ-ỹ]+)/i);
  if (!match) return null;

  const prefix = match[1].toLowerCase().startsWith('q') ? 'Quận' : match[1];
  const normalizedPrefix = /huyen/i.test(prefix) ? 'Huyện' : 'Quận';
  return `${normalizedPrefix} ${match[2]}`.trim();
}

function detectAreaHint(input: string) {
  const match = input.match(/gần\s+([^,.!?]+)/i);
  if (!match?.[1]) return null;
  return match[1].trim();
}

function detectBudgetMax(input: string) {
  const normalized = normalizeText(input);
  const match = normalized.match(/(?:duoi|toi da|max|khong qua)\s*(\d+(?:[.,]\d+)?)\s*(trieu|m|k)?/i)
    || normalized.match(/(\d+(?:[.,]\d+)?)\s*(trieu|m|k)\s*(?:tro xuong|toi da|duoi)/i);

  if (!match?.[1]) return null;
  const numeric = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(numeric)) return null;

  const unit = match[2];
  if (unit === 'k') return Math.round(numeric * 1000);
  return Math.round(numeric * 1_000_000);
}

function detectBudgetMin(input: string) {
  const normalized = normalizeText(input);
  const match = normalized.match(/(?:tu|tren|min)\s*(\d+(?:[.,]\d+)?)\s*(trieu|m|k)/i);
  if (!match?.[1]) return null;

  const numeric = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(numeric)) return null;

  return match[2] === 'k' ? Math.round(numeric * 1000) : Math.round(numeric * 1_000_000);
}

function detectRoomType(input: string) {
  return ROOM_TYPE_LABELS.find(({ patterns }) => patterns.some((pattern) => pattern.test(input)))?.value || null;
}

function detectUrgency(input: string): RomiJourneyState['urgency'] {
  const normalized = normalizeText(input);
  if (/(ngay|gap|can gap|asap|som nhat)/.test(normalized)) return 'immediate';
  if (/(thang toi|sap toi|som)/.test(normalized)) return 'soon';
  if (/(linh hoat|chua gap|tham khao)/.test(normalized)) return 'flexible';
  return null;
}

function detectProductTopic(input: string) {
  const normalized = normalizeText(input);
  if (/(rommz\+|premium|goi plus|nang cap)/.test(normalized)) return 'rommz_plus';
  if (/(xac thuc|verify)/.test(normalized)) return 'verification';
  if (/(roommate|ban cung phong|o ghep)/.test(normalized)) return 'roommate_matching';
  if (/(swap|ngan han|o tam|thue lai)/.test(normalized)) return 'swap_room';
  if (/(local passport|uu dai|deal|voucher)/.test(normalized)) return 'perks';
  if (/(dich vu|doi tac|chuyen nha|don dep|noi that)/.test(normalized)) return 'services';
  return null;
}

function detectServiceCategory(input: string) {
  const normalized = normalizeText(input);
  if (/(chuyen nha|moving)/.test(normalized)) return 'moving';
  if (/(don dep|cleaning)/.test(normalized)) return 'cleaning';
  if (/(noi that|furniture)/.test(normalized)) return 'furniture';
  if (/(dien nuoc|utilities)/.test(normalized)) return 'utilities';
  if (/(coffee|ca phe)/.test(normalized)) return 'coffee';
  if (/(gym|fitness)/.test(normalized)) return 'gym';
  return null;
}

function isOnboardingQuery(input: string) {
  const normalized = normalizeText(input);
  return /(rommz la gi|bat dau tu dau|nen bat dau tu dau|moi dung|moi su dung|huong dan bat dau|lam quen voi rommz)/.test(
    normalized,
  );
}

function detectIntent(input: string, existingState: Partial<RomiJourneyState>) {
  const normalized = normalizeText(input);

  if (/(chi tiet phong|ma phong|room id|phong nay|phong kia)/.test(normalized)) {
    return 'room_detail' as const;
  }

  if (/(phong|tro|can ho|studio)/.test(normalized) || existingState.goal === 'find_room') {
    return 'room_search' as const;
  }

  if (/(deal|uu dai|voucher|giam gia|local passport)/.test(normalized) || existingState.goal === 'find_deal') {
    return 'deals' as const;
  }

  if (/(dich vu|doi tac|chuyen nha|don dep|noi that|dien nuoc)/.test(normalized) || existingState.goal === 'find_service') {
    return 'services' as const;
  }

  const productTopic = detectProductTopic(input);
  if (productTopic === 'rommz_plus') return 'premium';
  if (productTopic === 'roommate_matching') return 'roommates';
  if (productTopic === 'swap_room') return 'swap';
  if (productTopic) return 'product_help';

  return 'general';
}

function buildClarification(intent: RomiIntent, state: RomiJourneyState): RomiClarificationRequest | null {
  if (intent !== 'room_search') return null;

  const missingFields: string[] = [];
  if (!state.city && !state.district && !state.areaHint) {
    missingFields.push('khu_vuc');
  }
  if (typeof state.budgetMax !== 'number' && typeof state.budgetMin !== 'number') {
    missingFields.push('ngan_sach');
  }

  if (!missingFields.length) return null;

  const prompt = missingFields.length === 1
    ? missingFields[0] === 'khu_vuc'
      ? 'Bạn muốn tìm ở khu vực nào? Nói quận, thành phố hoặc địa điểm gần trường là đủ.'
      : 'Ngân sách bạn muốn giữ ở khoảng nào mỗi tháng?'
    : 'Để lọc sát hơn, bạn cho mình thêm 2 ý: khu vực muốn ở và khoảng ngân sách mỗi tháng nhé.';

  return {
    prompt,
    missingFields,
  };
}

function needsLogin(intent: RomiIntent, input: string, viewerMode: RomiViewerMode) {
  if (viewerMode !== 'guest') return false;

  const normalized = normalizeText(input);
  if (intent === 'roommates' || intent === 'swap') return true;

  return /(lien he|luu|lich su|ca nhan hoa|nang cap|thanh toan|xac thuc)/.test(normalized);
}

export function analyzeRomiIntake(
  message: string,
  currentState: Partial<RomiJourneyState> = {},
  viewerMode: RomiViewerMode = 'user',
): RomiIntakeAnalysis {
  const intent = detectIntent(message, currentState);
  const productTopic = detectProductTopic(message);
  const serviceCategory = detectServiceCategory(message);
  const nextState = mergeJourneyState(currentState, {
    city: detectCity(message),
    district: detectDistrict(message),
    areaHint: detectAreaHint(message),
    budgetMin: detectBudgetMin(message),
    budgetMax: detectBudgetMax(message),
    roomType: detectRoomType(message),
    urgency: detectUrgency(message),
    productTopic,
    serviceCategory,
    dealCategory: /(deal|uu dai|voucher)/i.test(message) ? serviceCategory || 'general' : currentState.dealCategory,
    goal:
      intent === 'room_search'
        ? 'find_room'
        : intent === 'services'
          ? 'find_service'
          : intent === 'deals'
            ? 'find_deal'
            : intent === 'general'
              ? currentState.goal || 'discover'
              : 'learn_product',
    lastIntent: intent,
    needsLogin: needsLogin(intent, message, viewerMode),
  });

  const clarification = buildClarification(intent, nextState);
  const journeyState = mergeJourneyState(nextState, {
    stage: clarification
      ? 'clarify'
      : intent === 'general'
        ? 'discover'
        : nextState.needsLogin
          ? 'handoff'
          : 'recommend',
    missingFields: clarification?.missingFields || [],
    summary: buildJourneySummary(nextState),
  });

  return {
    intent,
    journeyState,
    clarification,
    requestedTopics: [isOnboardingQuery(message) ? 'onboarding' : null, productTopic, serviceCategory].filter(Boolean) as string[],
    shouldUseKnowledge: intent === 'product_help' || intent === 'premium' || intent === 'roommates' || intent === 'swap' || intent === 'general',
  };
}
