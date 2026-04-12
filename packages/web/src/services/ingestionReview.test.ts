import { describe, expect, test } from 'vitest';
import {
  buildCrawlFunctionErrorMessage,
  buildCrawlSourceMutationPayload,
  buildLocationCrawlIngestionUpdate,
  buildPartnerCrawlIngestionUpdate,
  extractUploadRecords,
  normalizeCrawlSourceUrl,
  normalizeLocationUploadRecord,
  normalizePartnerUploadRecord,
} from './ingestionReview';

describe('extractUploadRecords', () => {
  test('returns root array as-is', () => {
    expect(extractUploadRecords([{ id: 1 }, { id: 2 }])).toHaveLength(2);
  });

  test('reads items/data/results wrappers', () => {
    expect(extractUploadRecords({ items: [{ id: 'items' }] })).toEqual([{ id: 'items' }]);
    expect(extractUploadRecords({ data: [{ id: 'data' }] })).toEqual([{ id: 'data' }]);
    expect(extractUploadRecords({ results: [{ id: 'results' }] })).toEqual([{ id: 'results' }]);
  });

  test('returns empty array for unsupported payloads', () => {
    expect(extractUploadRecords({ foo: 'bar' })).toEqual([]);
    expect(extractUploadRecords(null)).toEqual([]);
  });
});

describe('normalizePartnerUploadRecord', () => {
  test('normalizes partner upload payload into ingestion row shape', () => {
    const record = normalizePartnerUploadRecord({
      companyName: '  Moving   Pro  ',
      contactEmail: 'INFO@EXAMPLE.COM',
      hotline: '+84 912 345 678',
      category: 'moving',
      address: '12 Nguyen Trai, Ha Noi',
      website: 'moving.example.com',
    }, 'admin-upload');

    expect(record.company_name).toBe('Moving Pro');
    expect(record.email).toBe('info@example.com');
    expect(record.phone).toBe('84912345678');
    expect(record.service_category).toBe('moving');
    expect(record.website).toBe('https://moving.example.com/');
    expect(record.source_type).toBe('admin_import');
  });
});

describe('normalizeLocationUploadRecord', () => {
  test('normalizes location payload and infers aliases', () => {
    const record = normalizeLocationUploadRecord({
      name: '  Dai hoc Bach Khoa Ha Noi ',
      type: 'school',
      city: 'Ha Noi',
      district: 'Hai Ba Trung',
      coordinates: { lat: '21.004', lng: '105.843' },
      labels: ['university', ' engineering '],
    }, 'admin-upload', 'https://example.com/locations');

    expect(record.location_name).toBe('Dai hoc Bach Khoa Ha Noi');
    expect(record.location_type).toBe('university');
    expect(record.latitude).toBe(21.004);
    expect(record.longitude).toBe(105.843);
    expect(record.tags).toEqual(['university', 'engineering']);
    expect(record.source_domain).toBe('example.com');
  });
});

describe('buildCrawlFunctionErrorMessage', () => {
  test('adds actionable hint for verify_jwt misconfiguration', () => {
    expect(buildCrawlFunctionErrorMessage('Invalid JWT')).toContain('verify_jwt = false');
  });
});

describe('buildPartnerCrawlIngestionUpdate', () => {
  test('sanitizes fields and recomputes dedupe metadata', () => {
    const payload = buildPartnerCrawlIngestionUpdate({
      companyName: '  Moving Pro ',
      email: 'INFO@example.com',
      phone: '+84 912 345 678',
      website: 'moving.example.com',
      sourceUrl: 'https://topbrands.vn/article',
      crawlConfidence: 130,
    });

    expect(payload.company_name).toBe('Moving Pro');
    expect(payload.email).toBe('info@example.com');
    expect(payload.phone).toBe('84912345678');
    expect(payload.website).toBe('https://moving.example.com/');
    expect(payload.source_domain).toBe('topbrands.vn');
    expect(payload.crawl_confidence).toBe(100);
    expect(payload.dedupe_key).toBe('email:info@example.com');
  });
});

describe('buildLocationCrawlIngestionUpdate', () => {
  test('normalizes location identity for manual review edits', () => {
    const payload = buildLocationCrawlIngestionUpdate({
      locationName: ' Đại học Bách Khoa Hà Nội ',
      locationType: 'university',
      city: 'Thành phố Hà Nội',
      district: 'Quận Hai Bà Trưng',
      latitude: '21.004',
      longitude: '105.843',
      tags: 'university, engineering',
    });

    expect(payload.location_name).toBe('Đại học Bách Khoa Hà Nội');
    expect(payload.normalized_name).toBe('đại học bách khoa hà nội');
    expect(payload.latitude).toBe(21.004);
    expect(payload.longitude).toBe(105.843);
    expect(payload.tags).toEqual(['university', 'engineering']);
    expect(payload.dedupe_key).toBe(
      'university|đại học bách khoa hà nội|thành phố hà nội|quận hai bà trưng',
    );
  });
});

describe('normalizeCrawlSourceUrl', () => {
  test('returns undefined for empty or invalid values and normalizes bare domains', () => {
    expect(normalizeCrawlSourceUrl('')).toBeUndefined();
    expect(normalizeCrawlSourceUrl('not a url')).toBeUndefined();
    expect(normalizeCrawlSourceUrl('example.com/path')).toBe('https://example.com/path');
  });
});

describe('buildCrawlSourceMutationPayload', () => {
  test('builds url mode payload and clears discovery fields', () => {
    const payload = buildCrawlSourceMutationPayload({
      name: ' Crawl partner HCM ',
      sourceMode: 'url',
      sourceUrl: 'topbrands.vn/top-dich-vu-chuyen-nha-tro-sinh-vien-tot-nhat-tai-tphcm',
      description: ' listicle source ',
      isActive: true,
    });

    expect(payload).toMatchObject({
      name: 'Crawl partner HCM',
      source_mode: 'url',
      source_url: 'https://topbrands.vn/top-dich-vu-chuyen-nha-tro-sinh-vien-tot-nhat-tai-tphcm',
      source_domain: 'topbrands.vn',
      discovery_query: null,
      discovery_location: null,
      discovery_country: null,
      discovery_limit: 5,
    });
  });

  test('builds keyword mode payload and clears source url', () => {
    const payload = buildCrawlSourceMutationPayload({
      name: ' Crawl partner HCM ',
      sourceMode: 'keyword',
      discoveryQuery: ' dịch vụ chuyển nhà trọ sinh viên tphcm ',
      discoveryLocation: ' Thành phố Hồ Chí Minh ',
      discoveryCountry: 'vn',
      discoveryLimit: '8',
    });

    expect(payload).toMatchObject({
      name: 'Crawl partner HCM',
      source_mode: 'keyword',
      source_url: null,
      source_domain: null,
      discovery_query: 'dịch vụ chuyển nhà trọ sinh viên tphcm',
      discovery_location: 'Thành phố Hồ Chí Minh',
      discovery_country: 'VN',
      discovery_limit: 8,
    });
  });

  test('throws for invalid url mode payload', () => {
    expect(() => buildCrawlSourceMutationPayload({
      sourceMode: 'url',
      sourceUrl: 'not a url',
    })).toThrow('Source URL là bắt buộc và phải hợp lệ');
  });

  test('throws for empty keyword mode payload', () => {
    expect(() => buildCrawlSourceMutationPayload({
      sourceMode: 'keyword',
      discoveryQuery: '   ',
    })).toThrow('Từ khóa discovery là bắt buộc');
  });
});
