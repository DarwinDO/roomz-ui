import { expect, test } from '@playwright/test';
import {
  buildCrawlFunctionErrorMessage,
  extractUploadRecords,
  normalizeCrawlSourceUrl,
  normalizeLocationUploadRecord,
  normalizePartnerUploadRecord,
} from './ingestionReview';

test.describe('extractUploadRecords', () => {
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

test.describe('normalizePartnerUploadRecord', () => {
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

test.describe('normalizeLocationUploadRecord', () => {
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

test.describe('buildCrawlFunctionErrorMessage', () => {
  test('adds actionable hint for verify_jwt misconfiguration', () => {
    expect(buildCrawlFunctionErrorMessage('Invalid JWT')).toContain('verify_jwt = false');
  });
});

test.describe('normalizeCrawlSourceUrl', () => {
  test('returns undefined for empty or invalid values and normalizes bare domains', () => {
    expect(normalizeCrawlSourceUrl('')).toBeUndefined();
    expect(normalizeCrawlSourceUrl('not a url')).toBeUndefined();
    expect(normalizeCrawlSourceUrl('example.com/path')).toBe('https://example.com/path');
  });
});
