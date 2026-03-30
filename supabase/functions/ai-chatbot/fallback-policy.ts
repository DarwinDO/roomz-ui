import type {
  RomiClarificationRequest,
  RomiHandoff,
  RomiIntent,
  RomiJourneyState,
  RomiViewerMode,
} from '../../../packages/shared/src/services/ai-chatbot/types.ts';

export function buildClarificationReply(clarification: RomiClarificationRequest) {
  return clarification.prompt;
}

export function buildGuestHandoff(
  viewerMode: RomiViewerMode,
  intent: RomiIntent,
  journeyState: RomiJourneyState,
): RomiHandoff | null {
  if (viewerMode !== 'guest' || !journeyState.needsLogin) {
    return null;
  }

  if (intent === 'roommates') {
    return {
      href: '/login',
      label: 'Đăng nhập để mở roommate',
      reason: 'Flow roommate cần hồ sơ cá nhân và lịch sử tương tác.',
      requiresAuth: true,
    };
  }

  if (intent === 'swap') {
    return {
      href: '/login',
      label: 'Đăng nhập để dùng ở ngắn hạn',
      reason: 'Đăng listing hoặc xem match ở ngắn hạn cần tài khoản.',
      requiresAuth: true,
    };
  }

  return {
    href: '/login',
    label: 'Đăng nhập để tiếp tục sâu hơn',
    reason: 'Bước tiếp theo cần lưu ngữ cảnh hoặc entitlement cá nhân.',
    requiresAuth: true,
  };
}

export function appendHandoffHint(message: string, handoff: RomiHandoff | null) {
  if (!handoff) return message;
  return `${message}\n\n${handoff.reason} Bạn có thể chọn "${handoff.label}" để đi tiếp đúng flow.`;
}
