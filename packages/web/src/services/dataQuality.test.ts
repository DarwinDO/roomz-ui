import { expect, test } from '@playwright/test';
import { buildDataQualityDashboardData, isValidVietnamCoordinate, type LocationCatalogHealthRow, type RoomHealthRow } from './dataQuality';
import type { CrawlJob, CrawlSource, LocationCrawlReviewItem, PartnerCrawlReviewItem } from '@/services/ingestionReview';

function createRoom(overrides: Partial<RoomHealthRow> = {}): RoomHealthRow {
  return {
    id: 'room-1',
    title: 'Phong A',
    address: '123 Duy Tan',
    city: 'Thanh pho Ha Noi',
    district: 'Quan Cau Giay',
    status: 'active',
    latitude: 21.03,
    longitude: 105.78,
    updated_at: '2026-03-11T10:00:00.000Z',
    ...overrides,
  };
}

function createSource(overrides: Partial<CrawlSource> = {}): CrawlSource {
  return {
    id: 'source-1',
    entity_type: 'partner',
    provider: 'firecrawl',
    name: 'Nguon doi tac',
    source_url: 'https://example.com',
    source_domain: 'example.com',
    description: null,
    is_active: true,
    config: {},
    last_run_at: '2026-03-11T09:00:00.000Z',
    created_by: null,
    updated_by: null,
    created_at: '2026-03-10T10:00:00.000Z',
    updated_at: '2026-03-11T10:00:00.000Z',
    ...overrides,
  };
}

function createJob(overrides: Partial<CrawlJob> = {}): CrawlJob {
  return {
    id: 'job-1',
    source_id: 'source-1',
    entity_type: 'partner',
    provider: 'firecrawl',
    trigger_type: 'source_run',
    status: 'succeeded',
    source_name: 'Nguon doi tac',
    source_url: 'https://example.com',
    provider_job_id: null,
    file_name: null,
    total_count: 10,
    inserted_count: 10,
    ready_count: 10,
    duplicate_count: 0,
    error_count: 0,
    skipped_count: 0,
    created_by: null,
    started_at: '2026-03-11T09:00:00.000Z',
    finished_at: '2026-03-11T09:05:00.000Z',
    error_message: null,
    log: {},
    created_at: '2026-03-11T09:00:00.000Z',
    updated_at: '2026-03-11T09:05:00.000Z',
    ...overrides,
  };
}

function createLocation(overrides: Partial<LocationCatalogHealthRow> = {}): LocationCatalogHealthRow {
  return {
    id: 'location-1',
    name: 'Dai hoc Bach khoa Ha Noi',
    location_type: 'university',
    city: 'Thanh pho Ha Noi',
    district: 'Quan Hai Ba Trung',
    address: 'So 1 Dai Co Viet',
    latitude: 21.005,
    longitude: 105.843,
    source_name: 'catalog',
    source_url: 'https://example.com/location',
    status: 'active',
    updated_at: '2026-03-11T08:00:00.000Z',
    ...overrides,
  };
}

function createPartnerReview(overrides: Partial<PartnerCrawlReviewItem> = {}): PartnerCrawlReviewItem {
  return {
    id: 'partner-review-1',
    source_type: 'firecrawl',
    source_name: 'Nguon doi tac',
    source_url: 'https://example.com',
    source_domain: 'example.com',
    external_id: null,
    company_name: 'Cong ty A',
    contact_name: 'Nguyen Van A',
    email: 'a@example.com',
    phone: '0900000000',
    service_area: 'Ha Noi',
    service_category: 'moving',
    address: '123 Duy Tan',
    website: 'https://example.com',
    crawl_confidence: 88,
    review_status: 'ready',
    import_error: null,
    created_at: '2026-03-11T07:00:00.000Z',
    updated_at: '2026-03-11T07:00:00.000Z',
    reviewed_at: null,
    reviewed_by: null,
    matched_partner_id: null,
    matched_partner_lead_id: null,
    imported_partner_lead_id: null,
    matched_partner_name: null,
    matched_partner_lead_name: null,
    ...overrides,
  };
}

function createLocationReview(overrides: Partial<LocationCrawlReviewItem> = {}): LocationCrawlReviewItem {
  return {
    id: 'location-review-1',
    source_type: 'firecrawl',
    source_name: 'Nguon location',
    source_url: 'https://example.com/location',
    source_domain: 'example.com',
    external_id: null,
    location_name: 'Dia diem A',
    normalized_name: 'dia diem a',
    location_type: 'poi',
    city: 'Thanh pho Ha Noi',
    district: 'Quan Cau Giay',
    address: '123 Duy Tan',
    latitude: 21.03,
    longitude: 105.78,
    tags: [],
    notes: null,
    crawl_confidence: 72,
    review_status: 'ready',
    import_error: null,
    created_at: '2026-03-11T06:00:00.000Z',
    updated_at: '2026-03-11T06:00:00.000Z',
    reviewed_at: null,
    reviewed_by: null,
    matched_location_id: null,
    imported_location_id: null,
    matched_location_name: null,
    ...overrides,
  };
}

test.describe('data quality helpers', () => {
  test('validates Vietnam coordinate bounds', () => {
    expect(isValidVietnamCoordinate(21.03, 105.78)).toBe(true);
    expect(isValidVietnamCoordinate(35, 105.78)).toBe(false);
    expect(isValidVietnamCoordinate(null, 105.78)).toBe(false);
  });

  test('builds room, source, location and queue issues into one dashboard summary', () => {
    const dashboard = buildDataQualityDashboardData({
      rooms: [createRoom({ id: 'room-missing', latitude: null, longitude: null })],
      sources: [createSource({ source_url: '', last_run_at: null })],
      jobs: [createJob({ status: 'failed', error_message: 'Bad Request' })],
      locations: [createLocation({ city: null, district: null, latitude: null, longitude: null })],
      partnerQueue: [createPartnerReview({ review_status: 'duplicate_lead' })],
      locationQueue: [createLocationReview({ review_status: 'error', import_error: 'Missing address' })],
    });

    expect(dashboard.summary.roomLocationIssues).toBe(1);
    expect(dashboard.summary.sourceIssues).toBe(1);
    expect(dashboard.summary.locationIssues).toBe(1);
    expect(dashboard.summary.crawlQueueIssues).toBe(2);
    expect(dashboard.summary.criticalIssues).toBe(4);
    expect(dashboard.sourceIssues[0].issues.map((issue) => issue.type)).toEqual([
      'missing_source_url',
      'never_run',
      'failed_job',
    ]);
    expect(dashboard.locationIssues[0].issues.map((issue) => issue.type)).toEqual([
      'missing_area',
      'missing_coordinates',
    ]);
  });

  test('keeps clean records out of the issue queues', () => {
    const dashboard = buildDataQualityDashboardData({
      rooms: [createRoom()],
      sources: [createSource()],
      jobs: [createJob()],
      locations: [createLocation()],
      partnerQueue: [createPartnerReview()],
      locationQueue: [createLocationReview()],
    });

    expect(dashboard.roomIssues).toEqual([]);
    expect(dashboard.sourceIssues).toEqual([]);
    expect(dashboard.locationIssues).toEqual([]);
    expect(dashboard.crawlQueueIssues).toEqual([]);
    expect(dashboard.summary.roomCoordinateCoverage).toBe(100);
    expect(dashboard.summary.locationCoordinateCoverage).toBe(100);
  });
});