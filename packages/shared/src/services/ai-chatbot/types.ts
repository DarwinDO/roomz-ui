/**
 * AI Chatbot Types (Shared)
 */

export type RomiIntent =
    | 'room_search'
    | 'room_detail'
    | 'deals'
    | 'services'
    | 'premium'
    | 'roommates'
    | 'swap'
    | 'product_help'
    | 'general';

export type RomiContextType =
    | 'room'
    | 'deal'
    | 'service'
    | 'premium'
    | 'roommate'
    | 'swap'
    | 'general';

export type RomiViewerMode = 'guest' | 'user';
export type RomiEntryPoint = 'launcher' | 'romi_page' | 'contextual_handoff';
export type RomiJourneyStage = 'discover' | 'clarify' | 'recommend' | 'handoff' | 'resolved';
export type RomiBudgetConstraintType = 'hard_cap' | 'soft_cap' | 'range' | 'min_only' | 'unspecified';
export type RomiNormalizationConfidence = 'high' | 'medium' | 'low';
export type RomiResolutionOutcome =
    | 'results'
    | 'broadened_results'
    | 'needs_clarification'
    | 'repair_after_failed_extraction'
    | 'no_match';

export interface RomiPageContext {
    route: string;
    roomId?: string;
    surface?: string;
}

export interface RomiKnowledgeSource {
    chunkId: string;
    documentSlug: string;
    documentTitle: string;
    section: string;
    label: string;
    summary?: string | null;
    snippet?: string | null;
    similarity?: number | null;
}

export interface RomiClarificationRequest {
    prompt: string;
    missingFields: string[];
    mode?: 'needs_clarification' | 'repair_after_failed_extraction';
}

export interface RomiHandoff {
    href: string;
    label: string;
    reason: string;
    requiresAuth?: boolean;
}

export interface RomiJourneyState {
    stage?: RomiJourneyStage | null;
    goal?: 'discover' | 'find_room' | 'find_service' | 'find_deal' | 'learn_product' | 'seek_support' | null;
    city?: string | null;
    district?: string | null;
    areaHint?: string | null;
    poiHint?: string | null;
    budgetMin?: number | null;
    budgetMax?: number | null;
    budgetConstraintType?: RomiBudgetConstraintType | null;
    roomType?: 'private' | 'shared' | 'studio' | 'entire' | null;
    moveInPeriod?: string | null;
    urgency?: 'immediate' | 'soon' | 'flexible' | null;
    serviceCategory?: string | null;
    dealCategory?: string | null;
    productTopic?: string | null;
    summary?: string | null;
    missingFields?: string[];
    lastIntent?: RomiIntent | null;
    lastAskedField?: string | null;
    lastAskedTurnIndex?: number | null;
    clarificationLoopCounts?: Record<string, number> | null;
    needsLogin?: boolean;
    groundedBy?: string[];
    resolutionOutcome?: RomiResolutionOutcome | null;
}

export interface RomiToolCallSummary {
    name: string;
    status: 'planned' | 'running' | 'completed' | 'failed';
    input?: unknown;
    result?: unknown;
}

export interface AIChatMessageMetadata {
    functionCalls?: Array<{
        name: string;
        result: unknown;
    }>;
    actions?: RomiChatAction[];
    sources?: string[];
    knowledgeSources?: RomiKnowledgeSource[];
    geminiCallCount?: number;
    intent?: RomiIntent | null;
    contextType?: RomiContextType | null;
    contextId?: string | null;
    toolCalls?: RomiToolCallSummary[];
    journeyState?: RomiJourneyState;
    clarification?: RomiClarificationRequest | null;
    handoff?: RomiHandoff | null;
    viewerMode?: RomiViewerMode;
    source?: string;
    finishReason?: string;
    usage?: unknown;
    budgetConstraintType?: RomiBudgetConstraintType | null;
    normalizationConfidence?: RomiNormalizationConfidence | null;
    searchNormalizationWarnings?: string[];
    searchAttempts?: Array<{
        mode: 'exact' | 'broaden_location' | 'broaden_budget';
        resultCount: number;
        appliedFilters: Record<string, unknown>;
    }>;
    clarificationLoopCount?: number;
    autoBroadenApplied?: boolean;
    resolutionOutcome?: RomiResolutionOutcome | null;
}

export interface AIChatMessage {
    id: string;
    session_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: AIChatMessageMetadata;
    created_at: string;
}

export interface AIChatHistoryEntry {
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: AIChatMessageMetadata;
}

export interface AIChatSession {
    id: string;
    user_id: string;
    title: string | null;
    created_at: string;
    updated_at: string;
    preview?: string | null;
    previewRole?: 'user' | 'assistant' | 'system' | null;
    lastMessageAt?: string | null;
    intent?: RomiIntent | null;
    contextType?: RomiContextType | null;
    experienceVersion?: string;
    journeyState?: RomiJourneyState;
}

export interface AIChatRequest {
    message: string;
    sessionId?: string | null;
    stream?: boolean;
    viewerMode?: RomiViewerMode;
    entryPoint?: RomiEntryPoint;
    pageContext?: RomiPageContext;
    journeyState?: Partial<RomiJourneyState>;
    history?: AIChatHistoryEntry[];
}

export type RomiChatActionType =
    | 'open_search'
    | 'open_room'
    | 'open_local_passport'
    | 'open_payment'
    | 'open_support_services'
    | 'open_verification'
    | 'open_roommates'
    | 'open_swap'
    | 'open_login';

export interface RomiChatAction {
    type: RomiChatActionType;
    label: string;
    href: string;
    description?: string;
}

export interface AIChatResponse {
    message: string;
    sessionId: string | null;
    messageId?: string;
    metadata?: AIChatMessageMetadata;
    session?: AIChatSession | null;
}

export interface AIChatError {
    error: string;
    code:
        | 'RATE_LIMITED'
        | 'GEMINI_ERROR'
        | 'AUTH_ERROR'
        | 'INVALID_INPUT'
        | 'INVALID_SESSION'
        | 'DB_SCHEMA_MISSING';
    details?: string | null;
}

export type AIChatStreamEvent =
    | {
        type: 'start';
        sessionId: string | null;
        session: AIChatSession | null;
    }
    | {
        type: 'status';
        stage: 'intake' | 'planner' | 'retrieval' | 'tool_execution' | 'synthesis' | 'handoff';
        message: string;
        intent?: RomiIntent | null;
        contextType?: RomiContextType | null;
        tools?: string[];
    }
    | {
        type: 'journey_update';
        journeyState: RomiJourneyState;
        message?: string;
    }
    | {
        type: 'clarification_request';
        clarification: RomiClarificationRequest;
        journeyState: RomiJourneyState;
    }
    | {
        type: 'handoff';
        handoff: RomiHandoff;
        journeyState?: RomiJourneyState;
    }
    | {
        type: 'tool_call';
        tool: RomiToolCallSummary;
    }
    | {
        type: 'tool_result';
        tool: RomiToolCallSummary;
        actions?: RomiChatAction[];
        sources?: string[];
        knowledgeSources?: RomiKnowledgeSource[];
    }
    | {
        type: 'token';
        text: string;
    }
    | {
        type: 'final';
        sessionId: string | null;
        messageId: string;
        message: string;
        metadata?: AIChatMessageMetadata;
        session: AIChatSession | null;
    }
    | {
        type: 'error';
        code: AIChatError['code'];
        message: string;
        details?: string | null;
    };
