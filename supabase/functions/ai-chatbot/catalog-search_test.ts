import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { filterDealSearchRows, filterPartnerSearchRows } from './catalog-search.ts';

Deno.test('filterPartnerSearchRows filters before slicing so later matches are still returned', () => {
  const partners = filterPartnerSearchRows(
    [
      {
        id: 'partner-1',
        name: 'Laundry Quan 1',
        category: 'laundry',
        description: 'Giat ui khu trung tam',
        address: 'Quan 1, TP.HCM',
        phone: null,
        email: null,
        contact_info: null,
        specialization: null,
        discount: null,
        rating: 4.9,
        review_count: 30,
        hours: null,
        status: 'active',
      },
      {
        id: 'partner-2',
        name: 'Bike Fix Thu Duc',
        category: 'repair',
        description: 'Sua xe cho sinh vien',
        address: 'Thu Duc, TP.HCM',
        phone: null,
        email: null,
        contact_info: null,
        specialization: 'xe may',
        discount: 'giam 15%',
        rating: 4.6,
        review_count: 12,
        hours: null,
        status: 'active',
      },
    ],
    {
      query: 'xe may',
      city: '',
      category: null,
      limit: 1,
    },
  );

  assertEquals(partners.map((partner) => partner.id), ['partner-2']);
});

Deno.test('filterDealSearchRows filters before slicing and prefers unlocked matches first', () => {
  const deals = filterDealSearchRows(
    [
      {
        id: 'deal-1',
        title: 'Premium spa Quan 1',
        discount_value: '30%',
        description: 'uu dai cao cap',
        valid_until: '2099-01-01T00:00:00.000Z',
        is_premium_only: true,
        is_active: true,
        partner: {
          id: 'partner-1',
          name: 'Spa Quan 1',
          category: 'spa',
          address: 'Quan 1, TP.HCM',
          status: 'active',
        },
      },
      {
        id: 'deal-2',
        title: 'Sua xe Thu Duc',
        discount_value: '20%',
        description: 'uu dai cho sinh vien',
        valid_until: '2099-01-01T00:00:00.000Z',
        is_premium_only: false,
        is_active: true,
        partner: {
          id: 'partner-2',
          name: 'Bike Fix Thu Duc',
          category: 'repair',
          address: 'Thu Duc, TP.HCM',
          status: 'active',
        },
      },
    ],
    {
      query: 'thu duc',
      city: '',
      category: null,
      premiumOnly: false,
      limit: 1,
      nowIso: '2026-04-11T00:00:00.000Z',
    },
  );

  assertEquals(deals.map((deal) => deal.id), ['deal-2']);
});

Deno.test('filterDealSearchRows drops inactive or expired deals before applying the response limit', () => {
  const deals = filterDealSearchRows(
    [
      {
        id: 'deal-expired',
        title: 'Expired deal',
        discount_value: '50%',
        description: 'het han',
        valid_until: '2025-01-01T00:00:00.000Z',
        is_premium_only: false,
        is_active: true,
        partner: {
          id: 'partner-1',
          name: 'Expired Partner',
          category: 'laundry',
          address: 'Thu Duc, TP.HCM',
          status: 'active',
        },
      },
      {
        id: 'deal-inactive-partner',
        title: 'Inactive partner deal',
        discount_value: '15%',
        description: 'khong hop le',
        valid_until: '2099-01-01T00:00:00.000Z',
        is_premium_only: false,
        is_active: true,
        partner: {
          id: 'partner-2',
          name: 'Inactive Partner',
          category: 'laundry',
          address: 'Thu Duc, TP.HCM',
          status: 'inactive',
        },
      },
      {
        id: 'deal-active',
        title: 'Laundry Thu Duc',
        discount_value: '10%',
        description: 'co hieu luc',
        valid_until: '2099-01-01T00:00:00.000Z',
        is_premium_only: false,
        is_active: true,
        partner: {
          id: 'partner-3',
          name: 'Laundry Active',
          category: 'laundry',
          address: 'Thu Duc, TP.HCM',
          status: 'active',
        },
      },
    ],
    {
      query: 'thu duc',
      city: '',
      category: null,
      premiumOnly: false,
      limit: 2,
      nowIso: '2026-04-11T00:00:00.000Z',
    },
  );

  assertEquals(deals.map((deal) => deal.id), ['deal-active']);
});
