export type PartnerCategory = string;

export type PartnerSearchRow = {
  id: string;
  name: string;
  category: PartnerCategory;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contact_info: Record<string, unknown> | null;
  specialization: string | null;
  discount: string | null;
  rating: number | null;
  review_count: number | null;
  hours: string | null;
  status: string | null;
};

export type DealSearchRow = {
  id: string;
  title: string;
  discount_value: string | null;
  description: string | null;
  valid_until: string | null;
  is_premium_only: boolean | null;
  is_active: boolean | null;
  partner: {
    id: string;
    name: string;
    category: PartnerCategory | null;
    address: string | null;
    status: string | null;
  } | null;
};

type PartnerSearchFilters = {
  query: string;
  city: string;
  category: PartnerCategory | null;
  limit: number;
};

type DealSearchFilters = {
  query: string;
  city: string;
  category: PartnerCategory | null;
  premiumOnly: boolean;
  limit: number;
  nowIso: string;
};

import { normalizeVietnameseText } from '../../../packages/shared/src/services/ai-chatbot/text.ts';

function normalizeText(input: string) {
  return normalizeVietnameseText(input);
}

function normalizeOptionalText(input: unknown) {
  return typeof input === 'string' ? normalizeText(input) : '';
}

export function filterPartnerSearchRows(
  rows: PartnerSearchRow[],
  filters: PartnerSearchFilters,
) {
  const { query, city, category, limit } = filters;

  return rows
    .filter((partner) => !category || partner.category === category)
    .filter((partner) => {
      if (!city) return true;
      const haystack = [
        partner.address,
        partner.description,
        partner.specialization,
        partner.discount,
      ]
        .filter(Boolean)
        .map(normalizeOptionalText)
        .join(' ');
      return haystack.includes(city);
    })
    .filter((partner) => {
      if (!query) return true;
      const haystack = [
        partner.name,
        partner.description,
        partner.specialization,
        partner.discount,
        partner.address,
      ]
        .filter(Boolean)
        .map(normalizeOptionalText)
        .join(' ');
      return haystack.includes(query);
    })
    .slice(0, limit);
}

export function filterDealSearchRows(
  rows: DealSearchRow[],
  filters: DealSearchFilters,
) {
  const { query, city, category, premiumOnly, limit, nowIso } = filters;

  return rows
    .filter((deal) => deal.partner?.status === 'active')
    .filter((deal) => !deal.valid_until || deal.valid_until >= nowIso)
    .filter((deal) => !premiumOnly || deal.is_premium_only === true)
    .filter((deal) => !category || deal.partner?.category === category)
    .filter((deal) => {
      if (!city) return true;
      const haystack = [
        deal.partner?.address,
        deal.description,
        deal.title,
      ]
        .filter(Boolean)
        .map(normalizeOptionalText)
        .join(' ');
      return haystack.includes(city);
    })
    .filter((deal) => {
      if (!query) return true;
      const haystack = [
        deal.title,
        deal.description,
        deal.discount_value,
        deal.partner?.name,
        deal.partner?.address,
      ]
        .filter(Boolean)
        .map(normalizeOptionalText)
        .join(' ');
      return haystack.includes(query);
    })
    .sort((a, b) => Number(a.is_premium_only) - Number(b.is_premium_only))
    .slice(0, limit);
}
