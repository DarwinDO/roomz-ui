import type { RomiViewerMode } from '../../../packages/shared/src/services/ai-chatbot/types.ts';

export function getRequestedViewerMode(
  requestedViewerMode: unknown,
  hasAuthorizationHeader: boolean,
): RomiViewerMode {
  if (requestedViewerMode === 'guest' || requestedViewerMode === 'user') {
    return requestedViewerMode;
  }

  return hasAuthorizationHeader ? 'user' : 'guest';
}

export function resolveEffectiveViewerMode(hasAuthenticatedUser: boolean): RomiViewerMode {
  return hasAuthenticatedUser ? 'user' : 'guest';
}
