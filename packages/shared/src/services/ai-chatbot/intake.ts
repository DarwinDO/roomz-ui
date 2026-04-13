import type {
  RomiBudgetConstraintType,
  RomiClarificationRequest,
  RomiIntent,
  RomiJourneyState,
  RomiViewerMode,
} from './types.ts';
import { buildJourneySummary, mergeJourneyState } from './journey.ts';
import { normalizeVietnameseText } from './text.ts';

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
const POI_KEYWORDS = /(dai hoc|truong|campus|ga|ben xe|landmark|diem moc|vincom|cho|san bay)/i;
const BUDGET_REPLY_HINT = /(trieu|tr|m|k|duoi|tren|toi da|toi thieu|max|min|khoang|tam|tro xuong|tro len|\d)/i;
const LOCATION_REPLY_HINT = /(gan|o|tai|quan|huyen|thu duc|ha noi|tp\.?hcm|ho chi minh|da nang|can tho|truong|dai hoc|campus|landmark|ga|ben xe)/i;
const ROOM_SEARCH_BUDGET_HINT = /(phong|tro|can ho|studio|ngan sach|budget|gia|thue)/i;
const ROOM_SEARCH_CONTEXT_FOLLOW_UP_HINT =
  /\b(?:gan|quan|huyen|thu duc|ha noi|tp\.?hcm|ho chi minh|da nang|can tho|truong|dai hoc|campus|landmark|ga|ben xe|duoi|tren|toi da|toi thieu|trieu|budget|gia|thue|xem|chi tiet|thong tin|ma|id|so\s*\d+)\b/i;
const NEAR_PREFIX_PATTERN = /\b(?:gan|near)\s+/i;
const TRAILING_POI_CLAUSE_PATTERN =
  /\s+(?:va|tu|duoi|tren|tro xuong|tro len|toi da|toi thieu|it nhat|khong qua|ngan sach|budget|khoang|tam)(?=\s|$)/i;

type BudgetSignal = {
  min?: number | null;
  max?: number | null;
  constraintType?: RomiBudgetConstraintType | null;
};

function normalizeText(input: string) {
  return normalizeVietnameseText(input);
}

function trimNullable(value: string | null | undefined) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseMoneyValue(amount: string, unit: string | undefined) {
  const numeric = Number(amount.replace(',', '.'));
  if (!Number.isFinite(numeric)) return null;

  if (unit === 'k') return Math.round(numeric * 1_000);
  return Math.round(numeric * 1_000_000);
}

function detectCity(input: string) {
  const normalized = normalizeText(input);

  if (normalized.includes('ha noi')) return 'Hà Nội';
  if (
    normalized.includes('tp.hcm')
    || normalized.includes('tphcm')
    || normalized.includes('sai gon')
    || normalized.includes('ho chi minh')
  ) {
    return 'TP.HCM';
  }
  if (normalized.includes('da nang')) return 'Đà Nẵng';
  if (normalized.includes('can tho')) return 'Cần Thơ';

  return CITY_LABELS.find((city) => normalized.includes(normalizeText(city))) || undefined;
}

function detectDistrict(input: string) {
  const normalized = normalizeText(input);
  const match = input.match(/(Quận|Quan|Q\.?|Huyện|Huyen)\s*([0-9A-Za-zÀ-ỹ]+)/i);
  if (match?.[2]) {
    const normalizedPrefix = /huyen/i.test(match[1]) ? 'Huyện' : 'Quận';
    return `${normalizedPrefix} ${match[2]}`.trim();
  }

  if (/\bthu duc\b/i.test(normalized)) {
    return 'Thành phố Thủ Đức';
  }

  return undefined;
}

function stripTrailingBudgetClause(input: string) {
  const normalized = normalizeText(input);
  const clauseIndex = normalized.search(TRAILING_POI_CLAUSE_PATTERN);
  const rawValue = clauseIndex >= 0 ? input.slice(0, clauseIndex) : input;

  return rawValue.replace(/[,.!?;:]+$/g, '').trim();
}

function detectPoiOrAreaHint(input: string) {
  const normalized = normalizeText(input);
  const nearMatch = normalized.match(NEAR_PREFIX_PATTERN);
  if (!nearMatch || nearMatch.index == null) {
    return { poiHint: undefined, areaHint: undefined };
  }

  const candidateStart = nearMatch.index + nearMatch[0].length;
  const rawCandidate = input.slice(candidateStart).match(/^[^,.!?]+/)?.[0] || '';
  const candidate = stripTrailingBudgetClause(trimNullable(rawCandidate) || '');
  if (!candidate) {
    return { poiHint: undefined, areaHint: undefined };
  }

  if (POI_KEYWORDS.test(normalizeText(candidate))) {
    return { poiHint: candidate, areaHint: undefined };
  }

  return { poiHint: undefined, areaHint: candidate };
}

function detectRoomType(input: string) {
  return ROOM_TYPE_LABELS.find(({ patterns }) => patterns.some((pattern) => pattern.test(input)))?.value || undefined;
}

function detectUrgency(input: string): RomiJourneyState['urgency'] {
  const normalized = normalizeText(input);
  if (/(ngay|gap|can gap|asap|som nhat)/.test(normalized)) return 'immediate';
  if (/(thang toi|sap toi|som)/.test(normalized)) return 'soon';
  if (/(linh hoat|chua gap|tham khao)/.test(normalized)) return 'flexible';
  return undefined;
}

function detectProductTopic(input: string) {
  const normalized = normalizeText(input);
  if (/(rommz\+|premium|goi plus|nang cap)/.test(normalized)) return 'rommz_plus';
  if (/(xac thuc|verify)/.test(normalized)) return 'verification';
  if (/(roommate|ban cung phong|o ghep)/.test(normalized)) return 'roommate_matching';
  if (/(swap|ngan han|o tam|thue lai)/.test(normalized)) return 'swap_room';
  if (/(local passport|uu dai|deal|voucher)/.test(normalized)) return 'perks';
  if (/(dich vu|doi tac|chuyen nha|don dep|noi that)/.test(normalized)) return 'services';
  return undefined;
}

function detectServiceCategory(input: string) {
  const normalized = normalizeText(input);
  if (/(chuyen nha|moving)/.test(normalized)) return 'moving';
  if (/(don dep|cleaning)/.test(normalized)) return 'cleaning';
  if (/(noi that|furniture)/.test(normalized)) return 'furniture';
  if (/(dien nuoc|utilities)/.test(normalized)) return 'utilities';
  if (/(coffee|ca phe)/.test(normalized)) return 'coffee';
  if (/(gym|fitness)/.test(normalized)) return 'gym';
  return undefined;
}

function isOnboardingQuery(input: string) {
  const normalized = normalizeText(input);
  return /(rommz la gi|bat dau tu dau|nen bat dau tu dau|moi dung|moi su dung|huong dan bat dau|lam quen voi rommz)/.test(
    normalized,
  );
}

function isBudgetReplyContext(state: Partial<RomiJourneyState>) {
  return state.lastAskedField === 'ngan_sach' || state.missingFields?.includes('ngan_sach') === true;
}

function isLocationReplyContext(state: Partial<RomiJourneyState>) {
  return state.lastAskedField === 'khu_vuc' || state.missingFields?.includes('khu_vuc') === true;
}

function detectFieldClear(
  input: string,
  field: 'ngan_sach' | 'khu_vuc',
  state: Partial<RomiJourneyState>,
) {
  const normalized = normalizeText(input).trim();
  const isContextual = field === 'ngan_sach' ? isBudgetReplyContext(state) : isLocationReplyContext(state);
  if (!isContextual) return false;

  return /^(khong|khong can|bo qua|chua co|khong co yeu cau)$/.test(normalized);
}

function detectBudgetSignal(input: string, currentState: Partial<RomiJourneyState>): BudgetSignal {
  const normalized = normalizeText(input);
  const budgetReplyContext = isBudgetReplyContext(currentState);
  const roomSearchBudgetContext = ROOM_SEARCH_BUDGET_HINT.test(normalized);

  const rangeMatch =
    normalized.match(/(?:tu\s*)?(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|k)?\s*(?:-|den)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|k)?/i);
  if (rangeMatch?.[1] && rangeMatch[3]) {
    const sharedUnit = rangeMatch[2] || rangeMatch[4];
    const min = parseMoneyValue(rangeMatch[1], sharedUnit);
    const max = parseMoneyValue(rangeMatch[3], rangeMatch[4] || sharedUnit);
    if (min != null && max != null) {
      return { min, max, constraintType: 'range' };
    }
  }

  const malformedMaxMatch = normalized.match(/tu\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|k)\s*tro xuong/i);
  if (malformedMaxMatch?.[1]) {
    const max = parseMoneyValue(malformedMaxMatch[1], malformedMaxMatch[2]);
    if (max != null) {
      return { max, constraintType: 'hard_cap' };
    }
  }

  const maxMatch =
    normalized.match(/(?:duoi|toi da|max|khong qua)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|k)/i)
    || normalized.match(/(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|k)\s*(?:tro xuong|toi da|duoi)/i);
  if (maxMatch?.[1]) {
    const max = parseMoneyValue(maxMatch[1], maxMatch[2]);
    if (max != null) {
      return { max, constraintType: 'hard_cap' };
    }
  }

  const minMatch = normalized.match(/(?:tren|min|toi thieu|it nhat|tu)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|k)(?!\s*tro xuong)/i);
  if (minMatch?.[1]) {
    const min = parseMoneyValue(minMatch[1], minMatch[2]);
    if (min != null) {
      return { min, constraintType: 'min_only' };
    }
  }

  const approximateMatch = normalized.match(/(?:tam|khoang)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|k)/i);
  if (approximateMatch?.[1]) {
    const max = parseMoneyValue(approximateMatch[1], approximateMatch[2]);
    if (max != null) {
      return { max, constraintType: 'soft_cap' };
    }
  }

  if (budgetReplyContext || roomSearchBudgetContext) {
    const bareMatch = normalized.match(/^(?:tam|khoang)?\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|k)(?:\s+\w+)?$/i);
    if (bareMatch?.[1]) {
      const max = parseMoneyValue(bareMatch[1], bareMatch[2]);
      if (max != null) {
        return { max, constraintType: 'soft_cap' };
      }
    }
  }

  return {};
}

function attemptedFieldReply(input: string, field: 'ngan_sach' | 'khu_vuc') {
  const normalized = normalizeText(input);
  if (field === 'ngan_sach') {
    return BUDGET_REPLY_HINT.test(normalized);
  }

  return LOCATION_REPLY_HINT.test(normalized);
}

function detectIntent(input: string, existingState: Partial<RomiJourneyState>) {
  const normalized = normalizeText(input);
  const hasExplicitRoomSearchCue = /(phong|tro|can ho|studio)/.test(normalized);
  const shouldInheritRoomSearchIntent =
    existingState.goal === 'find_room'
    && (
      hasExplicitRoomSearchCue
      || ROOM_SEARCH_CONTEXT_FOLLOW_UP_HINT.test(normalized)
      || isBudgetReplyContext(existingState)
      || isLocationReplyContext(existingState)
    );

  if (/(chi tiet phong|ma phong|room id|phong nay|phong kia)/.test(normalized)) {
    return 'room_detail' as const;
  }

  if (hasExplicitRoomSearchCue || shouldInheritRoomSearchIntent) {
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

function buildClarification(
  intent: RomiIntent,
  state: RomiJourneyState,
  currentState: Partial<RomiJourneyState>,
  message: string,
): RomiClarificationRequest | null {
  if (intent !== 'room_search') return null;

  const missingFields: string[] = [];
  if (!state.city && !state.district && !state.areaHint && !state.poiHint) {
    missingFields.push('khu_vuc');
  }
  if (
    typeof state.budgetMax !== 'number'
    && typeof state.budgetMin !== 'number'
    && state.budgetConstraintType !== 'unspecified'
  ) {
    missingFields.push('ngan_sach');
  }

  if (!missingFields.length) return null;

  const primaryField = missingFields[0];
  const repeatedField = currentState.lastAskedField;
  const isRepair = primaryField === repeatedField && attemptedFieldReply(message, primaryField as 'ngan_sach' | 'khu_vuc');

  if (primaryField === 'ngan_sach' && isRepair) {
    return {
      prompt: 'Mình chưa chốt được ngân sách từ câu vừa rồi. Nếu được, bạn nói theo kiểu "dưới 5 triệu" hoặc "3 đến 5 triệu" nhé.',
      missingFields,
      mode: 'repair_after_failed_extraction',
    };
  }

  if (primaryField === 'khu_vuc' && isRepair) {
    return {
      prompt: 'Mình chưa khóa được khu vực từ câu vừa rồi. Bạn cho mình quận, thành phố hoặc landmark rõ hơn nhé.',
      missingFields,
      mode: 'repair_after_failed_extraction',
    };
  }

  const prompt = missingFields.length === 1
    ? primaryField === 'khu_vuc'
      ? 'Bạn muốn tìm ở khu vực nào? Nói quận, thành phố hoặc địa điểm gần trường là đủ.'
      : 'Ngân sách bạn muốn giữ ở khoảng nào mỗi tháng?'
    : 'Để lọc sát hơn, bạn cho mình thêm 2 ý: khu vực muốn ở và khoảng ngân sách mỗi tháng nhé.';

  return {
    prompt,
    missingFields,
    mode: 'needs_clarification',
  };
}

function needsLogin(intent: RomiIntent, input: string, viewerMode: RomiViewerMode) {
  if (viewerMode !== 'guest') return false;

  const normalized = normalizeText(input);
  if (intent === 'roommates' || intent === 'swap') return true;

  return /(lien he|luu|lich su|ca nhan hoa|nang cap|thanh toan|xac thuc)/.test(normalized);
}

function shouldUseKnowledge(intent: RomiIntent, requestedTopics: string[]) {
  if (intent === 'room_search' || intent === 'room_detail' || intent === 'deals' || intent === 'services') {
    return requestedTopics.length > 0;
  }

  return intent === 'product_help' || intent === 'premium' || intent === 'roommates' || intent === 'swap' || intent === 'general';
}

function updateLoopCounts(
  currentState: Partial<RomiJourneyState>,
  clarification: RomiClarificationRequest | null,
) {
  const counts = { ...(currentState.clarificationLoopCounts || {}) };

  if (!clarification) {
    if (currentState.lastAskedField) {
      delete counts[currentState.lastAskedField];
    }
    return counts;
  }

  const primaryField = clarification.missingFields[0];
  if (!primaryField) return counts;

  if (currentState.lastAskedField === primaryField) {
    counts[primaryField] = (counts[primaryField] || 0) + 1;
  } else {
    counts[primaryField] = 1;
  }

  return counts;
}

export function analyzeRomiIntake(
  message: string,
  currentState: Partial<RomiJourneyState> = {},
  viewerMode: RomiViewerMode = 'user',
): RomiIntakeAnalysis {
  const intent = detectIntent(message, currentState);
  const productTopic = detectProductTopic(message);
  const serviceCategory = detectServiceCategory(message);
  const budgetSignal = detectBudgetSignal(message, currentState);
  const { poiHint, areaHint } = detectPoiOrAreaHint(message);
  const clearBudget = detectFieldClear(message, 'ngan_sach', currentState);
  const clearLocation = detectFieldClear(message, 'khu_vuc', currentState);

  const nextState = mergeJourneyState(currentState, {
    city: clearLocation ? null : detectCity(message),
    district: clearLocation ? null : detectDistrict(message),
    areaHint: clearLocation ? null : areaHint,
    poiHint: clearLocation ? null : poiHint,
    budgetMin: clearBudget ? null : budgetSignal.min,
    budgetMax: clearBudget ? null : budgetSignal.max,
    budgetConstraintType: clearBudget ? 'unspecified' : budgetSignal.constraintType,
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

  const clarification = buildClarification(intent, nextState, currentState, message);
  const clarificationLoopCounts = updateLoopCounts(currentState, clarification);
  const primaryClarificationField = clarification?.missingFields[0] || null;
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
    lastAskedField: clarification ? primaryClarificationField : null,
    lastAskedTurnIndex: clarification ? (currentState.lastAskedTurnIndex || 0) + 1 : null,
    clarificationLoopCounts,
    resolutionOutcome: clarification?.mode || undefined,
  });

  const requestedTopics = [isOnboardingQuery(message) ? 'onboarding' : null, productTopic, serviceCategory]
    .filter(Boolean) as string[];

  return {
    intent,
    journeyState,
    clarification,
    requestedTopics,
    shouldUseKnowledge: shouldUseKnowledge(intent, requestedTopics),
  };
}
