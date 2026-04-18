import type { RomiJourneyState, RomiViewerMode } from './types.ts';

export const EMPTY_JOURNEY_SUMMARY = 'ROMI đang chờ bạn mô tả nhu cầu.';

function uniq(values: string[] | undefined) {
  return [...new Set((values || []).filter(Boolean))];
}

function uniqNullable(values: string[] | null | undefined) {
  if (values === undefined) return undefined;
  if (values === null) return null;
  return uniq(values);
}

function normalizeNullableString(value: string | null | undefined) {
  if (value == null) return value ?? null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mergeNullableString(current: string | null | undefined, patch: string | null | undefined) {
  if (patch === undefined) return normalizeNullableString(current);
  return normalizeNullableString(patch);
}

function mergeNullableNumber(current: number | null | undefined, patch: number | null | undefined) {
  if (patch === undefined) return typeof current === 'number' ? current : current ?? null;
  if (patch === null) return null;
  return Number.isFinite(patch) ? patch : current ?? null;
}

function mergeScalar<T>(current: T | null | undefined, patch: T | null | undefined) {
  return patch === undefined ? current ?? null : patch;
}

function mergeLoopCounts(
  current: Record<string, number> | null | undefined,
  patch: Record<string, number> | null | undefined,
) {
  if (patch === undefined) {
    return current ? { ...current } : null;
  }

  if (patch === null) {
    return null;
  }

  return Object.entries(patch).reduce<Record<string, number>>((accumulator, [field, value]) => {
    if (!Number.isFinite(value)) return accumulator;
    accumulator[field] = Math.max(0, Math.trunc(value));
    return accumulator;
  }, {});
}

export function mergeJourneyState(
  current: Partial<RomiJourneyState> | null | undefined,
  patch: Partial<RomiJourneyState> | null | undefined,
): RomiJourneyState {
  return {
    ...current,
    ...patch,
    stage: mergeScalar(current?.stage, patch?.stage),
    goal: mergeScalar(current?.goal, patch?.goal),
    city: mergeNullableString(current?.city, patch?.city),
    district: mergeNullableString(current?.district, patch?.district),
    areaHint: mergeNullableString(current?.areaHint, patch?.areaHint),
    poiHint: mergeNullableString(current?.poiHint, patch?.poiHint),
    budgetMin: mergeNullableNumber(current?.budgetMin, patch?.budgetMin),
    budgetMax: mergeNullableNumber(current?.budgetMax, patch?.budgetMax),
    budgetConstraintType: mergeScalar(current?.budgetConstraintType, patch?.budgetConstraintType),
    roomType: mergeScalar(current?.roomType, patch?.roomType),
    moveInPeriod: mergeNullableString(current?.moveInPeriod, patch?.moveInPeriod),
    urgency: mergeScalar(current?.urgency, patch?.urgency),
    serviceCategory: mergeNullableString(current?.serviceCategory, patch?.serviceCategory),
    dealCategory: mergeNullableString(current?.dealCategory, patch?.dealCategory),
    productTopic: mergeNullableString(current?.productTopic, patch?.productTopic),
    summary: mergeNullableString(current?.summary, patch?.summary),
    missingFields: patch?.missingFields ? uniq(patch.missingFields) : uniq(current?.missingFields),
    lastIntent: mergeScalar(current?.lastIntent, patch?.lastIntent),
    lastAskedField: mergeNullableString(current?.lastAskedField, patch?.lastAskedField),
    lastAskedTurnIndex: mergeNullableNumber(current?.lastAskedTurnIndex, patch?.lastAskedTurnIndex),
    clarificationLoopCounts: mergeLoopCounts(current?.clarificationLoopCounts, patch?.clarificationLoopCounts),
    needsLogin: patch?.needsLogin === undefined ? current?.needsLogin : patch.needsLogin,
    groundedBy: patch?.groundedBy ? uniq(patch.groundedBy) : uniq(current?.groundedBy),
    resolutionOutcome: mergeScalar(current?.resolutionOutcome, patch?.resolutionOutcome),
    activeEntityType: mergeScalar(current?.activeEntityType, patch?.activeEntityType),
    activeEntityId: mergeNullableString(current?.activeEntityId, patch?.activeEntityId),
    lastResultSetType: mergeScalar(current?.lastResultSetType, patch?.lastResultSetType),
    lastResultIds: uniqNullable(patch?.lastResultIds ?? current?.lastResultIds) ?? null,
    lastResultSourceIntent: mergeScalar(current?.lastResultSourceIntent, patch?.lastResultSourceIntent),
  };
}

export function formatJourneyRoomTypeLabel(roomType: RomiJourneyState['roomType']) {
  switch (roomType) {
    case 'private':
      return 'phòng riêng';
    case 'shared':
      return 'ở ghép';
    case 'studio':
      return 'studio';
    case 'entire':
      return 'căn hộ nguyên căn';
    default:
      return null;
  }
}

function formatBudgetDetail(state: Partial<RomiJourneyState>) {
  if (typeof state.budgetMin !== 'number' && typeof state.budgetMax !== 'number') {
    return null;
  }

  const min = typeof state.budgetMin === 'number'
    ? `${new Intl.NumberFormat('vi-VN').format(state.budgetMin)}đ`
    : null;
  const max = typeof state.budgetMax === 'number'
    ? `${new Intl.NumberFormat('vi-VN').format(state.budgetMax)}đ`
    : null;

  if (min && max) {
    return `với ngân sách ${min} - ${max}`;
  }

  if (max) {
    return `với ngân sách tối đa ${max}`;
  }

  if (min) {
    return `với ngân sách từ ${min}`;
  }

  return null;
}

function formatLocationDetail(state: Partial<RomiJourneyState>) {
  const location = [state.district, state.city].filter(Boolean).join(', ');
  if (location) {
    return `ở ${location}`;
  }

  if (state.poiHint) {
    return `gần ${state.poiHint}`;
  }

  if (state.areaHint) {
    return `gần ${state.areaHint}`;
  }

  return null;
}

function formatJourneyLead(state: Partial<RomiJourneyState>) {
  if (state.goal === 'find_room') {
    return 'Bạn đang tìm phòng';
  }

  if (state.goal === 'find_service') {
    return 'Bạn đang tìm dịch vụ';
  }

  if (state.goal === 'find_deal') {
    return 'Bạn đang tìm ưu đãi';
  }

  if (state.goal === 'learn_product') {
    return 'Bạn đang tìm hiểu về sản phẩm';
  }

  return null;
}

function formatActiveEntitySummary(state: Partial<RomiJourneyState>) {
  if (!state.activeEntityType || !state.activeEntityId) {
    return null;
  }

  switch (state.activeEntityType) {
    case 'room':
      return 'ROMI cũng đang theo thông tin từ tin phòng bạn vừa mở.';
    case 'deal':
      return 'ROMI cũng đang theo thông tin từ ưu đãi bạn vừa mở.';
    case 'service':
      return 'ROMI cũng đang theo thông tin từ dịch vụ bạn vừa xem.';
    case 'premium':
      return 'ROMI cũng đang theo thông tin từ gói RommZ+ bạn vừa xem.';
    case 'roommate':
      return 'ROMI cũng đang theo thông tin từ hồ sơ ở ghép bạn vừa mở.';
    case 'swap':
      return 'ROMI cũng đang theo thông tin từ lượt đổi phòng bạn vừa mở.';
    default:
      return null;
  }
}

export function buildJourneySummary(state: Partial<RomiJourneyState> | null | undefined) {
  if (!state) return EMPTY_JOURNEY_SUMMARY;

  const lead = formatJourneyLead(state);
  const roomTypeLabel = formatJourneyRoomTypeLabel(state.roomType);
  const details = [
    formatLocationDetail(state),
    formatBudgetDetail(state),
    roomTypeLabel ? `ưu tiên ${roomTypeLabel}` : null,
    state.serviceCategory ? `thuộc nhóm ${state.serviceCategory}` : null,
    state.dealCategory ? `về ưu đãi ${state.dealCategory}` : null,
    state.productTopic ? `liên quan đến ${state.productTopic}` : null,
  ].filter(Boolean) as string[];
  const activeEntitySummary = formatActiveEntitySummary(state);

  if (!lead && details.length === 0 && !activeEntitySummary) {
    return EMPTY_JOURNEY_SUMMARY;
  }

  const summaryLead = lead || 'ROMI đang theo nhu cầu bạn vừa nêu';
  const summary = details.length > 0
    ? `${summaryLead} ${details.join(', ')}.`
    : `${summaryLead}.`;

  return activeEntitySummary ? `${summary} ${activeEntitySummary}` : summary;
}

export function finalizeJourneyState(
  state: Partial<RomiJourneyState> | null | undefined,
  viewerMode: RomiViewerMode,
) {
  const next = mergeJourneyState(state, {
    summary: buildJourneySummary(state),
  });

  if (viewerMode === 'guest' && next.needsLogin == null) {
    next.needsLogin = false;
  }

  return next;
}
