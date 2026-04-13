import type {
  AIChatMessageMetadata,
  RomiContextType,
  RomiIntent,
  RomiJourneyState,
  RomiResultSetType,
  RomiSelectionResolvedFrom,
} from '../../../packages/shared/src/services/ai-chatbot/types.ts';
import { normalizeVietnameseText } from '../../../packages/shared/src/services/ai-chatbot/text.ts';

export type PlannerToolName =
  | 'search_rooms'
  | 'search_partners'
  | 'search_deals'
  | 'search_locations'
  | 'get_room_details'
  | 'get_partner_details'
  | 'get_deal_details'
  | 'get_app_info';

export type PlannerTurnMode = 'search' | 'detail' | 'clarify' | 'handoff' | 'knowledge';

export type PlannerHistoryMessage = {
  role: string;
  content: string;
  metadata?: AIChatMessageMetadata | unknown;
};

export interface RomiTurnPlan {
  primaryIntent: RomiIntent;
  turnMode: PlannerTurnMode;
  targetEntityType: RomiContextType | null;
  targetEntityId: string | null;
  resolvedFrom: RomiSelectionResolvedFrom;
  selectedToolNames: PlannerToolName[];
  forceToolNames: PlannerToolName[];
  selectionRequested: boolean;
  selectionOrdinal: number | null;
  selectionFailurePrompt: string | null;
}

type ToolResult = {
  name: PlannerToolName;
  result: unknown;
};

const UUID_REGEX = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const DETAIL_PHRASE_REGEX = /(chi tiet|thong tin|mo sau|xem ro|xem them|xem ky)/;

function normalizeText(input: string) {
  return normalizeVietnameseText(input);
}

function resolveToolNameForEntity(entityType: RomiContextType | null): PlannerToolName | null {
  if (entityType === 'room') return 'get_room_details';
  if (entityType === 'service') return 'get_partner_details';
  if (entityType === 'deal') return 'get_deal_details';
  return null;
}

function resolveResultSetTypeToEntityType(resultSetType: RomiResultSetType | null | undefined) {
  if (resultSetType === 'room') return 'room';
  if (resultSetType === 'service') return 'service';
  if (resultSetType === 'deal') return 'deal';
  return null;
}

function resolveEntityTypeFromMessage(
  normalized: string,
  journeyState: Partial<RomiJourneyState>,
  primaryIntent: RomiIntent,
): RomiContextType | null {
  if (/\b(phong|room)\b/.test(normalized)) return 'room';
  if (/\b(deal|uu dai|voucher)\b/.test(normalized)) return 'deal';
  if (/\b(doi tac|dich vu|partner)\b/.test(normalized)) return 'service';

  if (primaryIntent === 'room_detail' || primaryIntent === 'room_search') return 'room';
  if (primaryIntent === 'deals') return 'deal';
  if (primaryIntent === 'services') return 'service';

  return resolveResultSetTypeToEntityType(journeyState.lastResultSetType) ?? journeyState.activeEntityType ?? null;
}

function extractSelectionOrdinal(normalized: string) {
  const match = normalized.match(/\b(?:phong|room|deal|uu dai|voucher|doi tac|dich vu)\s*(?:so|thu)?\s*(\d+)\b/);
  if (!match?.[1]) return null;

  const ordinal = Number.parseInt(match[1], 10);
  return Number.isFinite(ordinal) && ordinal > 0 ? ordinal : null;
}

function isExplicitDetailRequest(normalized: string) {
  if (!DETAIL_PHRASE_REGEX.test(normalized)) return false;
  return /\b(phong|room|deal|uu dai|voucher|doi tac|dich vu|nay|do)\b/.test(normalized);
}

function buildSelectionFailurePrompt(
  entityType: RomiContextType | null,
  journeyState: Partial<RomiJourneyState>,
  ordinal: number | null,
) {
  const count = journeyState.lastResultIds?.length || 0;
  const label = entityType === 'deal'
    ? 'deal'
    : entityType === 'service'
      ? 'đối tác'
      : 'phòng';

  if (ordinal != null && count > 0) {
    return `Mình đang giữ ${count} ${label} gần nhất thôi. Bạn chọn lại từ 1 đến ${count} hoặc gửi ID cụ thể giúp mình nhé.`;
  }

  if (count > 0) {
    return `Bạn nhắn "${label} số 2" hoặc gửi ID của ${label} cần mở chi tiết giúp mình nhé.`;
  }

  return `Mình chưa giữ danh sách ${label} nào trong ngữ cảnh hiện tại. Bạn cho mình tìm lại trước rồi mình mở chi tiết tiếp cho đúng item.`;
}

function selectSearchTools(
  primaryIntent: RomiIntent,
  normalized: string,
  journeyState: Partial<RomiJourneyState>,
) {
  const tools: PlannerToolName[] = [];

  if (primaryIntent === 'room_search') {
    tools.push('search_rooms');
  } else if (primaryIntent === 'services') {
    tools.push('search_partners');
  } else if (primaryIntent === 'deals') {
    tools.push('search_deals');
  }

  if (
    primaryIntent === 'general' ||
    primaryIntent === 'product_help' ||
    primaryIntent === 'premium' ||
    primaryIntent === 'roommates' ||
    primaryIntent === 'swap'
  ) {
    if (journeyState.productTopic || /(rommz\+|premium|verification|roommate|swap|perk|service)/.test(normalized)) {
      tools.push('get_app_info');
    }
  }

  return [...new Set(tools)];
}

export function planRomiTurn(
  message: string,
  primaryIntent: RomiIntent,
  journeyState: Partial<RomiJourneyState>,
  options: {
    clarificationPending?: boolean;
    handoffPending?: boolean;
  } = {},
): RomiTurnPlan {
  const normalized = normalizeText(message);
  const explicitUuid = message.match(UUID_REGEX)?.[0] ?? null;
  const selectionOrdinal = extractSelectionOrdinal(normalized);
  const explicitDetailRequest = isExplicitDetailRequest(normalized);
  const targetEntityType = resolveEntityTypeFromMessage(normalized, journeyState, primaryIntent);
  const detailTool = resolveToolNameForEntity(targetEntityType);
  const selectionRequested = Boolean(explicitUuid || selectionOrdinal || explicitDetailRequest);

  if (explicitUuid && detailTool) {
    const detailIntent = targetEntityType === 'room'
      ? 'room_detail' as const
      : targetEntityType === 'deal'
        ? 'deals' as const
        : targetEntityType === 'service'
          ? 'services' as const
          : primaryIntent;
    return {
      primaryIntent: detailIntent,
      turnMode: 'detail',
      targetEntityType,
      targetEntityId: explicitUuid,
      resolvedFrom: 'uuid',
      selectedToolNames: [detailTool],
      forceToolNames: [detailTool],
      selectionRequested: true,
      selectionOrdinal,
      selectionFailurePrompt: null,
    };
  }

  if (selectionOrdinal != null && detailTool) {
    const targetEntityId = journeyState.lastResultIds?.[selectionOrdinal - 1] ?? null;
    if (targetEntityId) {
      const detailIntent = targetEntityType === 'room'
        ? 'room_detail' as const
        : targetEntityType === 'deal'
          ? 'deals' as const
          : targetEntityType === 'service'
            ? 'services' as const
            : primaryIntent;
      return {
        primaryIntent: detailIntent,
        turnMode: 'detail',
        targetEntityType,
        targetEntityId,
        resolvedFrom: 'ordinal',
        selectedToolNames: [detailTool],
        forceToolNames: [detailTool],
        selectionRequested: true,
        selectionOrdinal,
        selectionFailurePrompt: null,
      };
    }
  }

  if (explicitDetailRequest && detailTool && journeyState.activeEntityId) {
    const detailIntent = targetEntityType === 'room'
      ? 'room_detail' as const
      : targetEntityType === 'deal'
        ? 'deals' as const
        : targetEntityType === 'service'
          ? 'services' as const
          : primaryIntent;
    return {
      primaryIntent: detailIntent,
      turnMode: 'detail',
      targetEntityType,
      targetEntityId: journeyState.activeEntityId,
      resolvedFrom: 'active_context',
      selectedToolNames: [detailTool],
      forceToolNames: [detailTool],
      selectionRequested: true,
      selectionOrdinal,
      selectionFailurePrompt: null,
    };
  }

  if (selectionRequested) {
    return {
      primaryIntent,
      turnMode: 'clarify',
      targetEntityType,
      targetEntityId: null,
      resolvedFrom: 'none',
      selectedToolNames: [],
      forceToolNames: [],
      selectionRequested,
      selectionOrdinal,
      selectionFailurePrompt: buildSelectionFailurePrompt(targetEntityType, journeyState, selectionOrdinal),
    };
  }

  if (options.handoffPending) {
    return {
      primaryIntent,
      turnMode: 'handoff',
      targetEntityType: null,
      targetEntityId: null,
      resolvedFrom: 'none',
      selectedToolNames: [],
      forceToolNames: [],
      selectionRequested: false,
      selectionOrdinal: null,
      selectionFailurePrompt: null,
    };
  }

  if (options.clarificationPending) {
    return {
      primaryIntent,
      turnMode: 'clarify',
      targetEntityType: null,
      targetEntityId: null,
      resolvedFrom: 'none',
      selectedToolNames: [],
      forceToolNames: [],
      selectionRequested: false,
      selectionOrdinal: null,
      selectionFailurePrompt: null,
    };
  }

  const selectedToolNames = selectSearchTools(primaryIntent, normalized, journeyState);
  const isKnowledgeOnly = selectedToolNames.length === 1 && selectedToolNames[0] === 'get_app_info';

  return {
    primaryIntent,
    turnMode: isKnowledgeOnly ? 'knowledge' : 'search',
    targetEntityType: null,
    targetEntityId: null,
    resolvedFrom: 'none',
    selectedToolNames,
    forceToolNames: selectedToolNames.filter((toolName) => toolName !== 'get_app_info'),
    selectionRequested: false,
    selectionOrdinal: null,
    selectionFailurePrompt: null,
  };
}

function getResultIds(result: unknown, key: 'rooms' | 'partners' | 'deals' | 'locations') {
  const payload = typeof result === 'object' && result !== null ? result as Record<string, unknown> : {};
  const values = Array.isArray(payload[key]) ? payload[key] as Array<Record<string, unknown>> : [];
  return values
    .map((value) => typeof value.id === 'string' ? value.id : null)
    .filter((value): value is string => Boolean(value));
}

export function buildJourneySelectionPatch(
  currentJourneyState: Partial<RomiJourneyState>,
  toolResults: ToolResult[],
) {
  const patch: Partial<RomiJourneyState> = {};

  for (const toolResult of toolResults) {
    const payload = typeof toolResult.result === 'object' && toolResult.result !== null
      ? toolResult.result as Record<string, unknown>
      : {};

    if (toolResult.name === 'search_rooms') {
      patch.lastResultSetType = 'room';
      patch.lastResultIds = getResultIds(toolResult.result, 'rooms');
      patch.lastResultSourceIntent = 'room_search';
      continue;
    }

    if (toolResult.name === 'search_partners') {
      patch.lastResultSetType = 'service';
      patch.lastResultIds = getResultIds(toolResult.result, 'partners');
      patch.lastResultSourceIntent = 'services';
      continue;
    }

    if (toolResult.name === 'search_deals') {
      patch.lastResultSetType = 'deal';
      patch.lastResultIds = getResultIds(toolResult.result, 'deals');
      patch.lastResultSourceIntent = 'deals';
      continue;
    }

    if (toolResult.name === 'search_locations') {
      patch.lastResultSetType = 'location';
      patch.lastResultIds = getResultIds(toolResult.result, 'locations');
      patch.lastResultSourceIntent = 'room_search';
      continue;
    }

    if (toolResult.name === 'get_room_details' && typeof payload.id === 'string') {
      patch.activeEntityType = 'room';
      patch.activeEntityId = payload.id;
      continue;
    }

    if (toolResult.name === 'get_partner_details' && typeof payload.id === 'string') {
      patch.activeEntityType = 'service';
      patch.activeEntityId = payload.id;
      continue;
    }

    if (toolResult.name === 'get_deal_details' && typeof payload.id === 'string') {
      patch.activeEntityType = 'deal';
      patch.activeEntityId = payload.id;
    }
  }

  if (!patch.activeEntityId && currentJourneyState.activeEntityId) {
    patch.activeEntityId = currentJourneyState.activeEntityId;
    patch.activeEntityType = currentJourneyState.activeEntityType;
  }

  return patch;
}

export function resolveConversationContext(
  toolResults: ToolResult[],
  journeyState: Partial<RomiJourneyState>,
) {
  if (journeyState.activeEntityType && journeyState.activeEntityId) {
    return {
      contextType: journeyState.activeEntityType,
      contextId: journeyState.activeEntityId,
    };
  }

  const toolNames = new Set(toolResults.map((toolResult) => toolResult.name));
  if (toolNames.has('search_rooms')) return { contextType: 'room' as const, contextId: null };
  if (toolNames.has('search_partners')) return { contextType: 'service' as const, contextId: null };
  if (toolNames.has('search_deals')) return { contextType: 'deal' as const, contextId: null };

  const appInfoPayload = toolResults.find((toolResult) => toolResult.name === 'get_app_info')?.result as
    | { topic?: string }
    | undefined;
  if (appInfoPayload?.topic === 'rommz_plus') return { contextType: 'premium' as const, contextId: 'rommz_plus' };
  if (appInfoPayload?.topic === 'swap_room') return { contextType: 'swap' as const, contextId: 'swap_room' };
  if (appInfoPayload?.topic === 'roommate_matching') return { contextType: 'roommate' as const, contextId: 'roommate_matching' };
  if (appInfoPayload?.topic === 'services' || appInfoPayload?.topic === 'perks') {
    return { contextType: 'service' as const, contextId: appInfoPayload.topic };
  }

  return { contextType: 'general' as const, contextId: null };
}
