import type { RomiJourneyState, RomiViewerMode } from './types.ts';

function uniq(values: string[] | undefined) {
  return [...new Set((values || []).filter(Boolean))];
}

function normalizeNullableString(value: string | null | undefined) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function mergeJourneyState(
  current: Partial<RomiJourneyState> | null | undefined,
  patch: Partial<RomiJourneyState> | null | undefined,
): RomiJourneyState {
  const next: RomiJourneyState = {
    ...current,
    ...patch,
    city: normalizeNullableString(patch?.city ?? current?.city),
    district: normalizeNullableString(patch?.district ?? current?.district),
    areaHint: normalizeNullableString(patch?.areaHint ?? current?.areaHint),
    moveInPeriod: normalizeNullableString(patch?.moveInPeriod ?? current?.moveInPeriod),
    serviceCategory: normalizeNullableString(patch?.serviceCategory ?? current?.serviceCategory),
    dealCategory: normalizeNullableString(patch?.dealCategory ?? current?.dealCategory),
    productTopic: normalizeNullableString(patch?.productTopic ?? current?.productTopic),
    summary: normalizeNullableString(patch?.summary ?? current?.summary),
    missingFields: uniq([...(current?.missingFields || []), ...(patch?.missingFields || [])]),
    groundedBy: uniq([...(current?.groundedBy || []), ...(patch?.groundedBy || [])]),
  };

  if (patch?.missingFields) {
    next.missingFields = uniq(patch.missingFields);
  }

  if (patch?.groundedBy) {
    next.groundedBy = uniq(patch.groundedBy);
  }

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
