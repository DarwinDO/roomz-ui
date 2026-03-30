import type { RomiJourneyState, RomiViewerMode } from './types.ts';

function uniq(values: string[] | undefined) {
  return [...new Set((values || []).filter(Boolean))];
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
  const next: RomiJourneyState = {
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
  };

  return next;
}

export function buildJourneySummary(state: Partial<RomiJourneyState> | null | undefined) {
  if (!state) return 'Chưa đủ dữ liệu để tóm tắt nhu cầu.';

  const fragments: string[] = [];

  if (state.goal === 'find_room') {
    fragments.push('Đang tìm phòng');
  } else if (state.goal === 'find_service') {
    fragments.push('Đang tìm dịch vụ');
  } else if (state.goal === 'find_deal') {
    fragments.push('Đang tìm ưu đãi');
  } else if (state.goal === 'learn_product') {
    fragments.push('Đang hỏi về sản phẩm');
  }

  const location = [state.district, state.city].filter(Boolean).join(', ');
  if (location) {
    fragments.push(`khu vực ${location}`);
  } else if (state.poiHint) {
    fragments.push(`gần ${state.poiHint}`);
  } else if (state.areaHint) {
    fragments.push(`gần ${state.areaHint}`);
  }

  if (typeof state.budgetMin === 'number' || typeof state.budgetMax === 'number') {
    const min = typeof state.budgetMin === 'number'
      ? `${new Intl.NumberFormat('vi-VN').format(state.budgetMin)}đ`
      : null;
    const max = typeof state.budgetMax === 'number'
      ? `${new Intl.NumberFormat('vi-VN').format(state.budgetMax)}đ`
      : null;

    if (min && max) {
      fragments.push(`ngân sách ${min} - ${max}`);
    } else if (max) {
      fragments.push(`ngân sách tối đa ${max}`);
    } else if (min) {
      fragments.push(`ngân sách từ ${min}`);
    }
  }

  if (state.roomType) {
    fragments.push(`loại phòng ${state.roomType}`);
  }

  if (state.serviceCategory) {
    fragments.push(`dịch vụ ${state.serviceCategory}`);
  }

  if (state.dealCategory) {
    fragments.push(`deal ${state.dealCategory}`);
  }

  if (state.productTopic) {
    fragments.push(`chủ đề ${state.productTopic}`);
  }

  if (!fragments.length) {
    return 'Chưa đủ dữ liệu để tóm tắt nhu cầu.';
  }

  return fragments.join(' • ');
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
