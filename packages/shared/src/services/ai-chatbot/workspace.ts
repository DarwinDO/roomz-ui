import {
  ROMI_NAME,
  ROMI_WELCOME_MESSAGE,
} from '../../constants/romi.ts';
import type {
  AIChatHistoryEntry,
  AIChatMessage,
  AIChatMessageMetadata,
  AIChatSession,
  AIChatStreamEvent,
  RomiChatAction,
  RomiClarificationRequest,
  RomiContextType,
  RomiHandoff,
  RomiJourneyState,
  RomiKnowledgeSource,
  RomiViewerMode,
} from './types.ts';

export interface RomiDisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  actions?: RomiChatAction[];
  sources?: string[];
  knowledgeSources?: RomiKnowledgeSource[];
  intent?: string | null;
  contextType?: RomiContextType | null;
  contextId?: string | null;
  clarification?: RomiClarificationRequest | null;
  handoff?: RomiHandoff | null;
  journeyState?: RomiJourneyState | null;
  selection?: AIChatMessageMetadata['selection'] | null;
  isStreaming?: boolean;
}

export interface RomiWorkspaceState {
  viewerMode: RomiViewerMode;
  session: AIChatSession | null;
  messages: RomiDisplayMessage[];
  streamStatus: Extract<AIChatStreamEvent, { type: 'status' }> | null;
  journeyState: RomiJourneyState;
  clarification: RomiClarificationRequest | null;
  handoff: RomiHandoff | null;
}

export type RomiWorkspaceAction =
  | { type: 'bootstrap'; viewerMode: RomiViewerMode; session: AIChatSession | null; messages: RomiDisplayMessage[] }
  | { type: 'reset'; viewerMode: RomiViewerMode }
  | { type: 'user_message'; message: RomiDisplayMessage }
  | { type: 'assistant_placeholder'; id: string; createdAt: string }
  | { type: 'stream_event'; event: AIChatStreamEvent; placeholderId: string; createdAt: string }
  | { type: 'set_session'; session: AIChatSession | null };

export const DEFAULT_JOURNEY_SUMMARY = `${ROMI_NAME} đang chờ bạn mô tả nhu cầu.`;

function mergeActions(current: RomiChatAction[] | undefined, next: RomiChatAction[] | undefined) {
  const deduped = new Map<string, RomiChatAction>();
  for (const action of current || []) deduped.set(`${action.type}:${action.href}`, action);
  for (const action of next || []) deduped.set(`${action.type}:${action.href}`, action);
  return [...deduped.values()];
}

function mergeStrings(current: string[] | undefined, next: string[] | undefined) {
  return [...new Set([...(current || []), ...(next || [])])];
}

function mergeKnowledgeSources(
  current: RomiKnowledgeSource[] | undefined,
  next: RomiKnowledgeSource[] | undefined,
) {
  const deduped = new Map<string, RomiKnowledgeSource>();
  for (const source of current || []) deduped.set(source.chunkId, source);
  for (const source of next || []) deduped.set(source.chunkId, source);
  return [...deduped.values()];
}

function updatePlaceholder(
  messages: RomiDisplayMessage[],
  placeholderId: string,
  recipe: (message: RomiDisplayMessage) => RomiDisplayMessage,
) {
  let updated = false;
  const nextMessages = messages.map((message) => {
    if (message.id !== placeholderId) return message;
    updated = true;
    return recipe(message);
  });

  return {
    updated,
    messages: nextMessages,
  };
}

export function createWelcomeMessage(viewerMode: RomiViewerMode): RomiDisplayMessage {
  return {
    id: `${viewerMode}-welcome`,
    role: 'assistant',
    text: viewerMode === 'guest'
      ? `${ROMI_WELCOME_MESSAGE}\n\nBạn đang ở guest mode, nên ROMI sẽ ưu tiên hướng dẫn và dữ liệu công khai trước.`
      : ROMI_WELCOME_MESSAGE,
    createdAt: new Date().toISOString(),
    contextType: 'general',
  };
}

export function mapStoredMessage(message: AIChatMessage): RomiDisplayMessage {
  return {
    id: message.id,
    role: message.role === 'user' ? 'user' : 'assistant',
    text: message.content || '',
    createdAt: message.created_at,
    actions: message.metadata?.actions,
    sources: message.metadata?.sources,
    knowledgeSources: message.metadata?.knowledgeSources,
    intent: message.metadata?.intent ?? null,
    contextType: message.metadata?.contextType ?? null,
    contextId: message.metadata?.contextId ?? null,
    clarification: message.metadata?.clarification ?? null,
    handoff: message.metadata?.handoff ?? null,
    journeyState: message.metadata?.journeyState ?? null,
    selection: message.metadata?.selection,
  };
}

export function buildGuestHistory(messages: RomiDisplayMessage[]): AIChatHistoryEntry[] {
  return messages
    .filter((message) => !message.isStreaming)
    .slice(-10)
    .map((message) => ({
      role: message.role,
      content: message.text,
      metadata: {
        actions: message.actions,
        sources: message.sources,
        knowledgeSources: message.knowledgeSources,
        intent: message.intent as never,
        contextType: message.contextType ?? null,
        contextId: message.contextId ?? null,
        clarification: message.clarification ?? null,
        handoff: message.handoff ?? null,
        journeyState: message.journeyState ?? undefined,
        selection: message.selection ?? undefined,
      },
    }));
}

export function hasMeaningfulJourneySummary(journeyState: RomiJourneyState) {
  const summary = journeyState.summary?.trim();
  return Boolean(summary && summary !== DEFAULT_JOURNEY_SUMMARY);
}

export function createInitialWorkspaceState(viewerMode: RomiViewerMode): RomiWorkspaceState {
  return {
    viewerMode,
    session: null,
    messages: [createWelcomeMessage(viewerMode)],
    streamStatus: null,
    journeyState: {
      stage: 'discover',
      summary: DEFAULT_JOURNEY_SUMMARY,
    },
    clarification: null,
    handoff: null,
  };
}

function ensurePlaceholder(
  state: RomiWorkspaceState,
  placeholderId: string,
  createdAt: string,
) {
  if (state.messages.some((message) => message.id === placeholderId)) {
    return state.messages;
  }

  return [
    ...state.messages,
    {
      id: placeholderId,
      role: 'assistant' as const,
      text: '',
      createdAt,
      isStreaming: true,
    },
  ];
}

export function applyStreamEvent(
  state: RomiWorkspaceState,
  event: AIChatStreamEvent,
  placeholderId: string,
  createdAt: string,
): RomiWorkspaceState {
  if (event.type === 'start') {
    return {
      ...state,
      session: event.session ?? state.session,
    };
  }

  if (event.type === 'status') {
    return {
      ...state,
      streamStatus: event,
    };
  }

  if (event.type === 'journey_update') {
    return {
      ...state,
      journeyState: event.journeyState,
    };
  }

  if (event.type === 'clarification_request') {
    return {
      ...state,
      clarification: event.clarification,
      journeyState: event.journeyState,
    };
  }

  if (event.type === 'handoff') {
    return {
      ...state,
      handoff: event.handoff,
      journeyState: event.journeyState || state.journeyState,
    };
  }

  const messages = ensurePlaceholder(state, placeholderId, createdAt);

  if (event.type === 'token') {
    const next = updatePlaceholder(messages, placeholderId, (message) => ({
      ...message,
      text: `${message.text}${event.text}`,
      isStreaming: true,
    }));

    return {
      ...state,
      messages: next.messages,
    };
  }

  if (event.type === 'tool_result') {
    const next = updatePlaceholder(messages, placeholderId, (message) => ({
      ...message,
      actions: mergeActions(message.actions, event.actions),
      sources: mergeStrings(message.sources, event.sources),
      knowledgeSources: mergeKnowledgeSources(message.knowledgeSources, event.knowledgeSources),
    }));

    return {
      ...state,
      messages: next.messages,
    };
  }

  if (event.type === 'final') {
    const next = updatePlaceholder(messages, placeholderId, (message) => ({
      ...message,
      id: event.messageId,
      text: event.message,
      actions: mergeActions(message.actions, event.metadata?.actions),
      sources: mergeStrings(message.sources, event.metadata?.sources),
      knowledgeSources: mergeKnowledgeSources(message.knowledgeSources, event.metadata?.knowledgeSources),
      intent: event.metadata?.intent ?? message.intent ?? null,
      contextType: event.metadata?.contextType ?? message.contextType ?? null,
      contextId: event.metadata?.contextId ?? message.contextId ?? null,
      clarification: event.metadata?.clarification ?? message.clarification ?? null,
      handoff: event.metadata?.handoff ?? message.handoff ?? null,
      journeyState: event.metadata?.journeyState ?? message.journeyState ?? null,
      selection: event.metadata?.selection ?? message.selection ?? null,
      isStreaming: false,
    }));

    const finalMessages = next.updated
      ? next.messages
      : [
          ...messages,
          {
            id: event.messageId,
            role: 'assistant' as const,
            text: event.message,
            createdAt,
            actions: event.metadata?.actions,
            sources: event.metadata?.sources,
            knowledgeSources: event.metadata?.knowledgeSources,
            intent: event.metadata?.intent ?? null,
            contextType: event.metadata?.contextType ?? null,
            contextId: event.metadata?.contextId ?? null,
            clarification: event.metadata?.clarification ?? null,
            handoff: event.metadata?.handoff ?? null,
            journeyState: event.metadata?.journeyState ?? null,
            selection: event.metadata?.selection,
          },
        ];

    return {
      ...state,
      session: event.session ?? state.session,
      messages: finalMessages,
      streamStatus: null,
      clarification: event.metadata?.clarification ?? null,
      handoff: event.metadata?.handoff ?? null,
      journeyState: event.metadata?.journeyState ?? state.journeyState,
    };
  }

  if (event.type === 'error') {
    const next = updatePlaceholder(messages, placeholderId, (message) => ({
      ...message,
      text: event.message,
      isStreaming: false,
    }));

    return {
      ...state,
      messages: next.messages,
      streamStatus: null,
    };
  }

  return state;
}

export function romiWorkspaceReducer(
  state: RomiWorkspaceState,
  action: RomiWorkspaceAction,
): RomiWorkspaceState {
  switch (action.type) {
    case 'bootstrap':
      return {
        viewerMode: action.viewerMode,
        session: action.session,
        messages: action.messages.length
          ? action.messages
          : action.session
            ? []
            : [createWelcomeMessage(action.viewerMode)],
        streamStatus: null,
        journeyState: action.session?.journeyState || {
          stage: 'discover',
          summary: DEFAULT_JOURNEY_SUMMARY,
        },
        clarification: null,
        handoff: null,
      };
    case 'reset':
      return createInitialWorkspaceState(action.viewerMode);
    case 'user_message':
      return {
        ...state,
        messages: [...state.messages, action.message],
        streamStatus: null,
        clarification: null,
        handoff: null,
      };
    case 'assistant_placeholder':
      return {
        ...state,
        messages: ensurePlaceholder(state, action.id, action.createdAt),
      };
    case 'stream_event':
      return applyStreamEvent(state, action.event, action.placeholderId, action.createdAt);
    case 'set_session':
      return {
        ...state,
        session: action.session,
      };
    default:
      return state;
  }
}
