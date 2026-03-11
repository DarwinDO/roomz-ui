import { supabase } from '@/lib/supabase';
import {
  getCrawlJobs,
  getCrawlSources,
  getLocationCrawlReviewQueue,
  getPartnerCrawlReviewQueue,
  type CrawlJob,
  type CrawlSource,
  type LocationCrawlReviewItem,
  type PartnerCrawlReviewItem,
} from '@/services/ingestionReview';

type QualityClient = typeof supabase & {
  from: (relation: string) => {
    select: (columns: string) => {
      is: (column: string, value: null) => {
        in: (column: string, values: string[]) => {
          order: (sortColumn: string, options: { ascending: boolean }) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
        };
      };
      eq: (column: string, value: string) => {
        order: (sortColumn: string, options: { ascending: boolean }) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
      };
    };
  };
};

const qualityClient = supabase as unknown as QualityClient;

export type DataQualitySeverity = 'critical' | 'warning';

export interface DataQualitySummary {
  criticalIssues: number;
  roomLocationIssues: number;
  sourceIssues: number;
  locationIssues: number;
  crawlQueueIssues: number;
  roomCoordinateCoverage: number;
  locationCoordinateCoverage: number;
  totalTrackedRooms: number;
  totalTrackedLocations: number;
}

export interface QualityIssueTag {
  type: string;
  label: string;
  severity: DataQualitySeverity;
}

export interface RoomLocationIssue {
  id: string;
  title: string;
  address: string | null;
  city: string | null;
  district: string | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
  updated_at: string;
  issues: QualityIssueTag[];
  severity: DataQualitySeverity;
}

export interface SourceHealthIssue {
  id: string;
  entity_type: 'partner' | 'location';
  name: string;
  source_url: string;
  source_domain: string | null;
  is_active: boolean;
  last_run_at: string | null;
  latest_job_id: string | null;
  latest_job_status: CrawlJob['status'] | null;
  latest_job_error: string | null;
  latest_job_started_at: string | null;
  issues: QualityIssueTag[];
  severity: DataQualitySeverity;
}

export interface LocationCatalogHealthIssue {
  id: string;
  name: string;
  location_type: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  source_name: string | null;
  source_url: string | null;
  updated_at: string;
  issues: QualityIssueTag[];
  severity: DataQualitySeverity;
}

export type CrawlQueueIssueKind = 'review' | 'job';

export interface CrawlQueueHealthIssue {
  id: string;
  kind: CrawlQueueIssueKind;
  entity_type: 'partner' | 'location';
  title: string;
  detail: string;
  created_at: string;
  source_name: string;
  source_id: string | null;
  job_id: string | null;
  issues: QualityIssueTag[];
  severity: DataQualitySeverity;
}

export interface DataQualityDashboardData {
  summary: DataQualitySummary;
  roomIssues: RoomLocationIssue[];
  sourceIssues: SourceHealthIssue[];
  locationIssues: LocationCatalogHealthIssue[];
  crawlQueueIssues: CrawlQueueHealthIssue[];
}

export interface RoomHealthRow {
  id: string;
  title: string;
  address: string | null;
  city: string | null;
  district: string | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
  updated_at: string;
}

export interface LocationCatalogHealthRow {
  id: string;
  name: string;
  location_type: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  source_name: string | null;
  source_url: string | null;
  status: string | null;
  updated_at: string;
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function getSeverityWeight(severity: DataQualitySeverity): number {
  return severity === 'critical' ? 2 : 1;
}

function sortBySeverityAndRecency<T extends { severity: DataQualitySeverity; updated_at?: string; created_at?: string }>(
  items: T[],
): T[] {
  return [...items].sort((left, right) => {
    const severityDelta = getSeverityWeight(right.severity) - getSeverityWeight(left.severity);
    if (severityDelta !== 0) {
      return severityDelta;
    }

    const leftTimestamp = new Date(left.updated_at ?? left.created_at ?? 0).getTime();
    const rightTimestamp = new Date(right.updated_at ?? right.created_at ?? 0).getTime();
    return rightTimestamp - leftTimestamp;
  });
}

function uniqueIssueTags(tags: QualityIssueTag[]): QualityIssueTag[] {
  const seen = new Set<string>();
  const result: QualityIssueTag[] = [];

  for (const tag of tags) {
    if (seen.has(tag.type)) {
      continue;
    }
    seen.add(tag.type);
    result.push(tag);
  }

  return result;
}

function getIssueSeverity(tags: QualityIssueTag[]): DataQualitySeverity {
  return tags.some((tag) => tag.severity === 'critical') ? 'critical' : 'warning';
}

export function isValidVietnamCoordinate(latitude: number | null, longitude: number | null): boolean {
  if (latitude === null || longitude === null) {
    return false;
  }

  return latitude >= 8 && latitude <= 24 && longitude >= 102 && longitude <= 110;
}

function isStaleRunningJob(startedAt: string | null): boolean {
  if (!startedAt) {
    return false;
  }

  const ageMs = Date.now() - new Date(startedAt).getTime();
  return ageMs > 30 * 60 * 1000;
}

function buildRoomIssues(rooms: RoomHealthRow[]): RoomLocationIssue[] {
  return sortBySeverityAndRecency(
    rooms
      .map((room) => {
        const issues: QualityIssueTag[] = [];

        if (room.latitude === null || room.longitude === null) {
          issues.push({ type: 'missing_coordinates', label: 'Thiếu tọa độ', severity: 'critical' });
        } else if (!isValidVietnamCoordinate(room.latitude, room.longitude)) {
          issues.push({ type: 'invalid_coordinates', label: 'Tọa độ ngoài phạm vi VN', severity: 'critical' });
        }

        if (issues.length === 0) {
          return null;
        }

        const dedupedIssues = uniqueIssueTags(issues);
        return {
          ...room,
          issues: dedupedIssues,
          severity: getIssueSeverity(dedupedIssues),
        } satisfies RoomLocationIssue;
      })
      .filter((room): room is RoomLocationIssue => room !== null),
  );
}

function buildSourceIssues(sources: CrawlSource[], jobs: CrawlJob[]): SourceHealthIssue[] {
  const latestJobBySourceId = new Map<string, CrawlJob>();

  for (const job of jobs) {
    if (!job.source_id) {
      continue;
    }

    const existing = latestJobBySourceId.get(job.source_id);
    if (!existing || new Date(job.created_at).getTime() > new Date(existing.created_at).getTime()) {
      latestJobBySourceId.set(job.source_id, job);
    }
  }

  return sortBySeverityAndRecency(
    sources
      .map((source) => {
        const issues: QualityIssueTag[] = [];
        const latestJob = latestJobBySourceId.get(source.id) ?? null;
        const sourceUrl = normalizeText(source.source_url);

        if (!sourceUrl) {
          issues.push({ type: 'missing_source_url', label: 'Thiếu source URL', severity: 'critical' });
        }

        if (source.is_active && !source.last_run_at) {
          issues.push({ type: 'never_run', label: 'Chưa từng chạy', severity: 'warning' });
        }

        if (latestJob?.status === 'failed') {
          issues.push({ type: 'failed_job', label: 'Job gần nhất bị lỗi', severity: 'critical' });
        }

        if (latestJob?.status === 'partial') {
          issues.push({ type: 'partial_job', label: 'Job gần nhất chỉ hoàn tất một phần', severity: 'warning' });
        }

        if (latestJob?.status === 'running' && isStaleRunningJob(latestJob.started_at)) {
          issues.push({ type: 'stalled_job', label: 'Job chạy quá lâu', severity: 'warning' });
        }

        if (issues.length === 0) {
          return null;
        }

        const dedupedIssues = uniqueIssueTags(issues);
        return {
          id: source.id,
          entity_type: source.entity_type,
          name: source.name,
          source_url: sourceUrl,
          source_domain: source.source_domain,
          is_active: source.is_active,
          last_run_at: source.last_run_at,
          latest_job_id: latestJob?.id ?? null,
          latest_job_status: latestJob?.status ?? null,
          latest_job_error: latestJob?.error_message ?? null,
          latest_job_started_at: latestJob?.started_at ?? null,
          issues: dedupedIssues,
          severity: getIssueSeverity(dedupedIssues),
          updated_at: source.updated_at,
        } satisfies SourceHealthIssue & { updated_at: string };
      })
      .filter((source): source is SourceHealthIssue & { updated_at: string } => source !== null),
  ) as SourceHealthIssue[];
}

function buildLocationIssues(locations: LocationCatalogHealthRow[]): LocationCatalogHealthIssue[] {
  return sortBySeverityAndRecency(
    locations
      .map((location) => {
        const issues: QualityIssueTag[] = [];

        if (!normalizeText(location.city) || !normalizeText(location.district)) {
          issues.push({ type: 'missing_area', label: 'Thiếu city hoặc district', severity: 'warning' });
        }

        if (location.latitude === null || location.longitude === null) {
          issues.push({ type: 'missing_coordinates', label: 'Thiếu tọa độ', severity: 'critical' });
        } else if (!isValidVietnamCoordinate(location.latitude, location.longitude)) {
          issues.push({ type: 'invalid_coordinates', label: 'Tọa độ ngoài phạm vi VN', severity: 'critical' });
        }

        if (issues.length === 0) {
          return null;
        }

        const dedupedIssues = uniqueIssueTags(issues);
        return {
          id: location.id,
          name: location.name,
          location_type: location.location_type,
          city: location.city,
          district: location.district,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          source_name: location.source_name,
          source_url: location.source_url,
          updated_at: location.updated_at,
          issues: dedupedIssues,
          severity: getIssueSeverity(dedupedIssues),
        } satisfies LocationCatalogHealthIssue;
      })
      .filter((location): location is LocationCatalogHealthIssue => location !== null),
  );
}

function buildQueueIssueFromPartnerReview(item: PartnerCrawlReviewItem): CrawlQueueHealthIssue | null {
  if (
    item.review_status !== 'duplicate_partner'
    && item.review_status !== 'duplicate_lead'
    && item.review_status !== 'low_confidence'
    && item.review_status !== 'error'
  ) {
    return null;
  }

  const issues: QualityIssueTag[] = [];
  if (item.review_status === 'error') {
    issues.push({ type: 'review_error', label: 'Record lỗi', severity: 'critical' });
  } else if (item.review_status === 'low_confidence') {
    issues.push({ type: 'review_error', label: 'Thiếu dữ liệu để promote', severity: 'warning' });
  } else {
    issues.push({ type: 'review_duplicate', label: 'Record trùng', severity: 'warning' });
  }

  return {
    id: item.id,
    kind: 'review',
    entity_type: 'partner',
    title: item.company_name || item.contact_name || 'Partner crawl record',
    detail: item.import_error || item.service_area || item.email || 'Cần admin xem lại record crawl đối tác này.',
    created_at: item.created_at,
    source_name: item.source_name,
    source_id: null,
    job_id: null,
    issues,
    severity: getIssueSeverity(issues),
  };
}

function buildQueueIssueFromLocationReview(item: LocationCrawlReviewItem): CrawlQueueHealthIssue | null {
  if (item.review_status !== 'duplicate_location' && item.review_status !== 'error') {
    return null;
  }

  const issues: QualityIssueTag[] = [];
  if (item.review_status === 'error') {
    issues.push({ type: 'review_error', label: 'Record lỗi', severity: 'critical' });
  } else {
    issues.push({ type: 'review_duplicate', label: 'Record trùng', severity: 'warning' });
  }

  return {
    id: item.id,
    kind: 'review',
    entity_type: 'location',
    title: item.location_name || 'Location crawl record',
    detail: item.import_error || [item.district, item.city].filter(Boolean).join(', ') || 'Cần admin xem lại record crawl location này.',
    created_at: item.created_at,
    source_name: item.source_name,
    source_id: null,
    job_id: null,
    issues,
    severity: getIssueSeverity(issues),
  };
}

function buildQueueIssueFromJob(job: CrawlJob): CrawlQueueHealthIssue | null {
  const issues: QualityIssueTag[] = [];

  if (job.status === 'failed') {
    issues.push({ type: 'failed_job', label: 'Job bị lỗi', severity: 'critical' });
  }

  if (job.status === 'partial') {
    issues.push({ type: 'partial_job', label: 'Job hoàn tất một phần', severity: 'warning' });
  }

  if (job.status === 'running' && isStaleRunningJob(job.started_at)) {
    issues.push({ type: 'stalled_job', label: 'Job chạy quá lâu', severity: 'warning' });
  }

  if (issues.length === 0) {
    return null;
  }

  const entityLabel = job.entity_type === 'partner' ? 'đối tác' : 'location';
  return {
    id: job.id,
    kind: 'job',
    entity_type: job.entity_type,
    title: `Job crawl ${entityLabel}`,
    detail: job.error_message || `Nguồn ${job.source_name} cần được kiểm tra lại.`,
    created_at: job.created_at,
    source_name: job.source_name,
    source_id: job.source_id,
    job_id: job.id,
    issues,
    severity: getIssueSeverity(issues),
  };
}

function buildCrawlQueueIssues(
  jobs: CrawlJob[],
  partnerQueue: PartnerCrawlReviewItem[],
  locationQueue: LocationCrawlReviewItem[],
): CrawlQueueHealthIssue[] {
  const reviewIssues = [
    ...partnerQueue.map(buildQueueIssueFromPartnerReview),
    ...locationQueue.map(buildQueueIssueFromLocationReview),
  ].filter((issue): issue is CrawlQueueHealthIssue => issue !== null);

  const orphanJobIssues = jobs
    .filter((job) => !job.source_id)
    .map(buildQueueIssueFromJob)
    .filter((issue): issue is CrawlQueueHealthIssue => issue !== null);

  return sortBySeverityAndRecency([...reviewIssues, ...orphanJobIssues]);
}

export function buildDataQualityDashboardData(input: {
  rooms: RoomHealthRow[];
  sources: CrawlSource[];
  jobs: CrawlJob[];
  locations: LocationCatalogHealthRow[];
  partnerQueue: PartnerCrawlReviewItem[];
  locationQueue: LocationCrawlReviewItem[];
}): DataQualityDashboardData {
  const roomIssues = buildRoomIssues(input.rooms);
  const sourceIssues = buildSourceIssues(input.sources, input.jobs);
  const locationIssues = buildLocationIssues(input.locations);
  const crawlQueueIssues = buildCrawlQueueIssues(input.jobs, input.partnerQueue, input.locationQueue);

  const roomsWithCoordinates = input.rooms.filter((room) => isValidVietnamCoordinate(room.latitude, room.longitude)).length;
  const locationsWithCoordinates = input.locations.filter((location) => isValidVietnamCoordinate(location.latitude, location.longitude)).length;

  return {
    summary: {
      criticalIssues:
        roomIssues.filter((issue) => issue.severity === 'critical').length +
        sourceIssues.filter((issue) => issue.severity === 'critical').length +
        locationIssues.filter((issue) => issue.severity === 'critical').length +
        crawlQueueIssues.filter((issue) => issue.severity === 'critical').length,
      roomLocationIssues: roomIssues.length,
      sourceIssues: sourceIssues.length,
      locationIssues: locationIssues.length,
      crawlQueueIssues: crawlQueueIssues.length,
      roomCoordinateCoverage: input.rooms.length === 0 ? 100 : Math.round((roomsWithCoordinates / input.rooms.length) * 100),
      locationCoordinateCoverage: input.locations.length === 0 ? 100 : Math.round((locationsWithCoordinates / input.locations.length) * 100),
      totalTrackedRooms: input.rooms.length,
      totalTrackedLocations: input.locations.length,
    },
    roomIssues,
    sourceIssues,
    locationIssues,
    crawlQueueIssues,
  };
}

async function getRoomHealthRows(): Promise<RoomHealthRow[]> {
  const { data, error } = await qualityClient
    .from('rooms')
    .select('id, title, address, city, district, status, latitude, longitude, updated_at')
    .is('deleted_at', null)
    .in('status', ['active', 'pending'])
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Không thể tải dữ liệu phòng cho dashboard chất lượng: ${error.message}`);
  }

  return (data ?? []) as RoomHealthRow[];
}

async function getLocationCatalogHealthRows(): Promise<LocationCatalogHealthRow[]> {
  const { data, error } = await qualityClient
    .from('location_catalog')
    .select('id, name, location_type, city, district, address, latitude, longitude, source_name, source_url, status, updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Không thể tải location catalog cho dashboard chất lượng: ${error.message}`);
  }

  return ((data ?? []) as unknown) as LocationCatalogHealthRow[];
}

export async function getDataQualityDashboard(): Promise<DataQualityDashboardData> {
  const [rooms, sources, jobs, locations, partnerQueue, locationQueue] = await Promise.all([
    getRoomHealthRows(),
    getCrawlSources(),
    getCrawlJobs(),
    getLocationCatalogHealthRows(),
    getPartnerCrawlReviewQueue(),
    getLocationCrawlReviewQueue(),
  ]);

  return buildDataQualityDashboardData({
    rooms,
    sources,
    jobs,
    locations,
    partnerQueue,
    locationQueue,
  });
}
