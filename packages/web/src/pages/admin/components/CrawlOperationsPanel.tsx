import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateCrawlSource,
  useCrawlJobs,
  useCrawlSources,
  useDeleteCrawlSource,
  usePreviewCrawlSource,
  useRunCrawlSource,
  useSyncCrawlJob,
  useUpdateCrawlSource,
  useUploadCrawlRecords,
} from '@/hooks/useIngestionReview';
import {
  extractUploadRecords,
  type CrawlEntityType,
  type CrawlJob,
  type CrawlSourceMode,
  type CrawlSource,
  type CrawlSourcePreviewResult,
} from '@/services/ingestionReview';
import {
  FileJson,
  Globe,
  Loader2,
  Pencil,
  Play,
  RefreshCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

interface CrawlOperationsPanelProps {
  entityType: CrawlEntityType;
}

interface SourceFormState {
  name: string;
  sourceMode: CrawlSourceMode;
  sourceUrl: string;
  discoveryQuery: string;
  discoveryLocation: string;
  discoveryCountry: string;
  discoveryLimit: string;
  description: string;
  isActive: boolean;
  configText: string;
}

type JobDebugSample = {
  id?: string;
  label?: string;
  reason?: string;
  reviewStatus?: string;
  sourceUrl?: string | null;
  website?: string | null;
  dedupeKey?: string | null;
};

const EMPTY_SOURCE_FORM: SourceFormState = {
  name: '',
  sourceMode: 'url',
  sourceUrl: '',
  discoveryQuery: '',
  discoveryLocation: '',
  discoveryCountry: 'VN',
  discoveryLimit: '5',
  description: '',
  isActive: true,
  configText: '{\n  "enableWebSearch": false\n}',
};

function getEntityLabel(entityType: CrawlEntityType) {
  return entityType === 'partner' ? 'đối tác' : 'location';
}

function getJobBadge(job: CrawlJob) {
  switch (job.status) {
    case 'succeeded':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Hoàn tất</Badge>;
    case 'partial':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Một phần</Badge>;
    case 'failed':
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Lỗi</Badge>;
    case 'running':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Đang chạy</Badge>;
    default:
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Chờ xử lý</Badge>;
  }
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'Chưa có';
  }
  return new Date(value).toLocaleString('vi-VN');
}

function getSourceSummary(source: CrawlSource) {
  if (source.source_mode === 'keyword') {
    const parts = [source.discovery_query];
    if (source.discovery_location) {
      parts.push(source.discovery_location);
    }
    if (source.discovery_country) {
      parts.push(source.discovery_country);
    }
    const summary = parts.filter(Boolean).join(' • ');
    return summary || 'Keyword discovery chưa có đủ cấu hình';
  }

  return source.source_url || 'Chưa có URL nguồn';
}

function getSourceDetail(source: CrawlSource) {
  if (source.source_mode !== 'keyword') {
    return null;
  }

  return `Tối đa ${source.discovery_limit ?? 5} URL${source.discovery_location ? ` • ${source.discovery_location}` : ''}`;
}

function getJobAttachmentLabel(job: CrawlJob) {
  const discoveryQuery = typeof job.log?.discovery_query === 'string'
    ? job.log.discovery_query
    : null;
  const discoveryLocation = typeof job.log?.discovery_location === 'string'
    ? job.log.discovery_location
    : null;
  const discoveredUrlCount = typeof job.log?.discovered_url_count === 'number'
    ? job.log.discovered_url_count
    : null;

  if (discoveryQuery) {
    const segments = [discoveryQuery];
    if (discoveryLocation) {
      segments.push(discoveryLocation);
    }
    if (discoveredUrlCount !== null) {
      segments.push(`${discoveredUrlCount} URL`);
    }
    return segments.join(' • ');
  }

  return job.source_url || job.file_name || 'Không có nguồn đính kèm';
}

function getJobCount(job: CrawlJob, key: string) {
  const counts = (job.log?.counts_by_status ?? {}) as Record<string, unknown>;
  const raw = counts[key];
  return typeof raw === 'number' ? raw : 0;
}

function getJobReasonEntries(job: CrawlJob) {
  const processingDebug = (job.log?.processing_debug ?? {}) as Record<string, unknown>;
  const reasons = (processingDebug.reasons ?? {}) as Record<string, unknown>;

  return Object.entries(reasons)
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]));
}

function getJobSamples(job: CrawlJob, key: string): JobDebugSample[] {
  const processingDebug = (job.log?.processing_debug ?? {}) as Record<string, unknown>;
  const raw = processingDebug[key];
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item))
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : undefined,
      label: typeof item.label === 'string' ? item.label : undefined,
      reason: typeof item.reason === 'string' ? item.reason : undefined,
      reviewStatus: typeof item.reviewStatus === 'string' ? item.reviewStatus : undefined,
      sourceUrl: typeof item.sourceUrl === 'string' ? item.sourceUrl : null,
      website: typeof item.website === 'string' ? item.website : null,
      dedupeKey: typeof item.dedupeKey === 'string' ? item.dedupeKey : null,
    }));
}

function formatJobReason(reason: string) {
  switch (reason) {
    case 'duplicate_external_id':
      return 'Trùng external_id';
    case 'duplicate_dedupe_key':
      return 'Trùng dedupe_key';
    case 'missing_company_name':
      return 'Thiếu tên công ty';
    case 'missing_identity':
      return 'Thiếu dữ liệu nhận diện';
    case 'insert_failed':
      return 'Insert thất bại';
    case 'classify_failed':
      return 'Phân loại thất bại';
    case 'low_confidence':
      return 'Thiếu dữ liệu để promote';
    case 'duplicate_partner':
      return 'Trùng đối tác';
    case 'duplicate_lead':
      return 'Trùng lead';
    case 'duplicate_location':
      return 'Trùng location';
    case 'ready':
      return 'Sẵn sàng';
    default:
      return 'Lỗi';
  }
}

export function CrawlOperationsPanel({ entityType }: CrawlOperationsPanelProps) {
  const entityLabel = getEntityLabel(entityType);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<CrawlSource | null>(null);
  const [sourceForm, setSourceForm] = useState<SourceFormState>(EMPTY_SOURCE_FORM);
  const [previewResult, setPreviewResult] = useState<CrawlSourcePreviewResult | null>(null);
  const [uploadSourceName, setUploadSourceName] = useState(`manual-${entityType}-upload`);
  const [uploadSourceUrl, setUploadSourceUrl] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const { data: sources = [], isLoading: isLoadingSources } = useCrawlSources(entityType);
  const { data: jobs = [], isLoading: isLoadingJobs } = useCrawlJobs(entityType);
  const createSource = useCreateCrawlSource(entityType);
  const updateSource = useUpdateCrawlSource(entityType);
  const deleteSource = useDeleteCrawlSource(entityType);
  const previewSource = usePreviewCrawlSource(entityType);
  const runSource = useRunCrawlSource(entityType);
  const syncJob = useSyncCrawlJob(entityType);
  const uploadRecords = useUploadCrawlRecords(entityType);

  const runningJobs = useMemo(
    () => jobs.filter((job) => job.provider === 'firecrawl' && job.status === 'running'),
    [jobs],
  );

  useEffect(() => {
    if (runningJobs.length === 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      if (syncJob.isPending) {
        return;
      }

      void (async () => {
        for (const job of runningJobs) {
          try {
            await syncJob.mutateAsync(job.id);
          } catch {
            break;
          }
        }
      })();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [runningJobs, syncJob]);

  const recentJobs = jobs.slice(0, 8);

  const openCreateSourceDialog = () => {
    setEditingSource(null);
    setSourceForm(EMPTY_SOURCE_FORM);
    setIsSourceDialogOpen(true);
  };

  const openEditSourceDialog = (source: CrawlSource) => {
    setEditingSource(source);
    setSourceForm({
      name: source.name,
      sourceMode: source.source_mode,
      sourceUrl: source.source_url ?? '',
      discoveryQuery: source.discovery_query ?? '',
      discoveryLocation: source.discovery_location ?? '',
      discoveryCountry: source.discovery_country ?? 'VN',
      discoveryLimit: String(source.discovery_limit ?? 5),
      description: source.description ?? '',
      isActive: source.is_active,
      configText: JSON.stringify(source.config ?? {}, null, 2),
    });
    setIsSourceDialogOpen(true);
  };

  const handleSaveSource = async () => {
    let config: Record<string, unknown> = {};
    if (sourceForm.configText.trim()) {
      try {
        config = JSON.parse(sourceForm.configText) as Record<string, unknown>;
      } catch {
        toast.error('Config JSON không hợp lệ');
        return;
      }
    }

    try {
      if (editingSource) {
        await updateSource.mutateAsync({
          id: editingSource.id,
          input: {
            name: sourceForm.name,
            sourceMode: sourceForm.sourceMode,
            sourceUrl: sourceForm.sourceUrl,
            discoveryQuery: sourceForm.discoveryQuery,
            discoveryLocation: sourceForm.discoveryLocation,
            discoveryCountry: sourceForm.discoveryCountry,
            discoveryLimit: sourceForm.discoveryLimit,
            description: sourceForm.description,
            isActive: sourceForm.isActive,
            config,
          },
        });
        toast.success('Đã cập nhật nguồn crawl');
      } else {
        await createSource.mutateAsync({
          entityType,
          name: sourceForm.name,
          sourceMode: sourceForm.sourceMode,
          sourceUrl: sourceForm.sourceUrl,
          discoveryQuery: sourceForm.discoveryQuery,
          discoveryLocation: sourceForm.discoveryLocation,
          discoveryCountry: sourceForm.discoveryCountry,
          discoveryLimit: sourceForm.discoveryLimit,
          description: sourceForm.description,
          isActive: sourceForm.isActive,
          config,
        });
        toast.success('Đã tạo nguồn crawl');
      }

      setIsSourceDialogOpen(false);
      setEditingSource(null);
      setSourceForm(EMPTY_SOURCE_FORM);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu nguồn crawl');
    }
  };

  const handlePreviewSource = async (source: CrawlSource) => {
    try {
      const result = await previewSource.mutateAsync(source.id);
      setPreviewResult(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lấy preview URL từ keyword source');
    }
  };

  const handleToggleSource = async (source: CrawlSource, checked: boolean) => {
    try {
      await updateSource.mutateAsync({
        id: source.id,
        input: { isActive: checked },
      });
      toast.success(checked ? 'Đã bật nguồn crawl' : 'Đã tắt nguồn crawl');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái nguồn crawl');
    }
  };

  const handleDeleteSource = async (source: CrawlSource) => {
    try {
      await deleteSource.mutateAsync(source.id);
      toast.success('Đã xóa nguồn crawl');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa nguồn crawl');
    }
  };

  const handleRunSource = async (source: CrawlSource) => {
    try {
      const result = await runSource.mutateAsync(source.id);
      const discoveryMessage = result.discoveredUrlCount
        ? ` • ${result.discoveredUrlCount} URL`
        : '';
      toast.success(`Đã tạo job crawl ${source.name}${discoveryMessage}${result.providerJobId ? ` (${result.providerJobId})` : ''}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể chạy crawl source');
    }
  };

  const handleSyncJob = async (job: CrawlJob) => {
    try {
      const result = await syncJob.mutateAsync(job.id);
      if (result.status === 'running') {
        toast.info('Job vẫn đang chạy, hệ thống sẽ đồng bộ tiếp');
        return;
      }
      toast.success('Đã đồng bộ crawl job');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể đồng bộ crawl job');
    }
  };

  const handleUploadFile = async () => {
    if (!uploadFile) {
      toast.error('Hãy chọn file JSON trước');
      return;
    }

    try {
      const rawText = await uploadFile.text();
      const parsed = JSON.parse(rawText) as unknown;
      const records = extractUploadRecords(parsed);
      if (records.length === 0) {
        throw new Error('File JSON không có records hợp lệ trong root/items/data/results');
      }

      await uploadRecords.mutateAsync({
        entityType,
        sourceName: uploadSourceName,
        sourceUrl: uploadSourceUrl || undefined,
        fileName: uploadFile.name,
        records,
      });

      toast.success(`Đã upload ${records.length} records vào queue crawl ${entityLabel}`);
      setUploadFile(null);
      setUploadSourceUrl('');
      setUploadSourceName(`manual-${entityType}-upload`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể upload file crawl');
    }
  };

  const isBusy = createSource.isPending
    || updateSource.isPending
    || deleteSource.isPending
    || previewSource.isPending
    || runSource.isPending
    || syncJob.isPending
    || uploadRecords.isPending;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Nguồn crawl {entityLabel}</CardTitle>
              <CardDescription>
                Khai báo nguồn crawl theo URL cụ thể hoặc keyword discovery để admin chỉ cần bấm một nút là chạy crawl và đẩy vào queue review.
              </CardDescription>
            </div>
            <Button onClick={openCreateSourceDialog}>
              <Globe className="mr-2 h-4 w-4" />
              Thêm nguồn
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingSources ? (
              <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tải nguồn crawl...
              </div>
            ) : sources.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-sm text-gray-500">
                Chưa có nguồn crawl cho {entityLabel}. Tạo ít nhất một nguồn để dùng nút chạy crawl.
              </div>
            ) : (
              sources.map((source) => (
                <div key={source.id} className="rounded-2xl border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold text-gray-900">{source.name}</div>
                        <Badge variant="outline">{source.provider}</Badge>
                        <Badge variant="outline">{source.source_mode === 'keyword' ? 'keyword' : 'url'}</Badge>
                        {!source.is_active && <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Đang tắt</Badge>}
                      </div>
                      <div className="text-sm text-gray-600 break-all">{getSourceSummary(source)}</div>
                      {getSourceDetail(source) && (
                        <div className="text-xs text-gray-500">{getSourceDetail(source)}</div>
                      )}
                      {source.description && <div className="text-sm text-gray-500">{source.description}</div>}
                      <div className="text-xs text-gray-500">Lần chạy gần nhất: {formatTimestamp(source.last_run_at)}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
                        <span>{source.is_active ? 'Bật' : 'Tắt'}</span>
                        <Switch checked={source.is_active} onCheckedChange={(checked) => void handleToggleSource(source, checked)} />
                      </div>
                      <Button variant="outline" onClick={() => void handleRunSource(source)} disabled={!source.is_active || runSource.isPending}>
                        <Play className="mr-2 h-4 w-4" />
                        Chạy crawl
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void handlePreviewSource(source)}
                        disabled={previewSource.isPending}
                      >
                        {previewSource.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                        Xem URL
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditSourceDialog(source)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => void handleDeleteSource(source)}>
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload JSON crawl</CardTitle>
            <CardDescription>
              Dùng khi bạn đã có file JSON từ Firecrawl hoặc nguồn ngoài và muốn đưa thẳng vào staging queue mà không cần terminal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`upload-source-name-${entityType}`}>Source name</Label>
              <Input
                id={`upload-source-name-${entityType}`}
                value={uploadSourceName}
                onChange={(event) => setUploadSourceName(event.target.value)}
                placeholder={`manual-${entityType}-upload`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`upload-source-url-${entityType}`}>Source URL (optional)</Label>
              <Input
                id={`upload-source-url-${entityType}`}
                value={uploadSourceUrl}
                onChange={(event) => setUploadSourceUrl(event.target.value)}
                placeholder="https://example.com/source"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`upload-file-${entityType}`}>JSON file</Label>
              <Input
                id={`upload-file-${entityType}`}
                type="file"
                accept="application/json"
                onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-gray-500">
                Chấp nhận root array hoặc object chứa `items`, `data`, `results`.
              </p>
            </div>
            <Button className="w-full" onClick={() => void handleUploadFile()} disabled={!uploadFile || uploadRecords.isPending}>
              {uploadRecords.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload vào staging queue
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Recent crawl jobs</CardTitle>
            <CardDescription>
              Theo dõi các job chạy bằng nút crawl hoặc upload file. Job Firecrawl đang chạy sẽ tự đồng bộ nền mỗi 5 giây.
            </CardDescription>
          </div>
          <div className="text-sm text-gray-500">{recentJobs.length} job gần nhất</div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingJobs ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tải jobs...
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-gray-500">
              Chưa có crawl job nào cho {entityLabel}.
            </div>
          ) : (
            recentJobs.map((job) => (
              <div key={job.id} className="rounded-2xl border p-4">
                {(() => {
                  const lowConfidenceCount = getJobCount(job, 'low_confidence');
                  const reasonEntries = getJobReasonEntries(job);
                  const skippedSamples = getJobSamples(job, 'skipped_samples');
                  const lowConfidenceSamples = getJobSamples(job, 'low_confidence_samples');
                  const duplicateSamples = getJobSamples(job, 'duplicate_samples');
                  const errorSamples = getJobSamples(job, 'error_samples');

                  return (
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-gray-900">{job.source_name}</div>
                      {getJobBadge(job)}
                      <Badge variant="outline">{job.provider}</Badge>
                      <Badge variant="outline">{job.trigger_type}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {getJobAttachmentLabel(job)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Tạo: {formatTimestamp(job.created_at)}</span>
                      <span>Bắt đầu: {formatTimestamp(job.started_at)}</span>
                      <span>Kết thúc: {formatTimestamp(job.finished_at)}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                      <span>Total: {job.total_count}</span>
                      <span>Inserted: {job.inserted_count}</span>
                      <span>Ready: {job.ready_count}</span>
                      {lowConfidenceCount > 0 && <span>Low confidence: {lowConfidenceCount}</span>}
                      <span>Duplicate: {job.duplicate_count}</span>
                      <span>Error: {job.error_count}</span>
                      <span>Skipped: {job.skipped_count}</span>
                    </div>
                    {reasonEntries.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {reasonEntries.map(([reason, count]) => (
                          <Badge key={reason} variant="outline" className="text-xs">
                            {formatJobReason(reason)}: {Number(count)}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {job.error_message && (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {job.error_message}
                      </div>
                    )}
                    {(lowConfidenceSamples.length > 0 || duplicateSamples.length > 0 || skippedSamples.length > 0 || errorSamples.length > 0) && (
                      <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                        {lowConfidenceSamples.length > 0 && (
                          <div>
                            <div className="font-medium text-slate-900">Mẫu cần review thủ công</div>
                            <div className="mt-1 space-y-1">
                              {lowConfidenceSamples.map((sample) => (
                                <div key={sample.id ?? `${sample.label}-${sample.reason}`} className="break-words">
                                  <span className="font-medium">{sample.label || 'Không rõ tên'}</span>
                                  {sample.website && <span> • {sample.website}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {duplicateSamples.length > 0 && (
                          <div>
                            <div className="font-medium text-slate-900">Mẫu bị nhận diện là trùng</div>
                            <div className="mt-1 space-y-1">
                              {duplicateSamples.map((sample) => (
                                <div key={sample.id ?? `${sample.label}-${sample.reason}`} className="break-words">
                                  <span className="font-medium">{sample.label || 'Không rõ tên'}</span>
                                  {sample.reason && <span> • {formatJobReason(sample.reason)}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {skippedSamples.length > 0 && (
                          <div>
                            <div className="font-medium text-slate-900">Mẫu bị bỏ qua</div>
                            <div className="mt-1 space-y-1">
                              {skippedSamples.map((sample) => (
                                <div key={sample.id ?? `${sample.label}-${sample.reason}`} className="break-words">
                                  <span className="font-medium">{sample.label || 'Không rõ tên'}</span>
                                  {sample.reason && <span> • {formatJobReason(sample.reason)}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {errorSamples.length > 0 && (
                          <div>
                            <div className="font-medium text-slate-900">Mẫu lỗi</div>
                            <div className="mt-1 space-y-1">
                              {errorSamples.map((sample) => (
                                <div key={sample.id ?? `${sample.label}-${sample.reason}`} className="break-words">
                                  <span className="font-medium">{sample.label || 'Không rõ tên'}</span>
                                  {sample.reason && <span> • {formatJobReason(sample.reason)}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {job.provider === 'firecrawl' && (
                      <Button variant="outline" onClick={() => void handleSyncJob(job)} disabled={syncJob.isPending}>
                        {syncJob.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                        Đồng bộ job
                      </Button>
                    )}
                    {job.file_name && (
                      <Badge variant="outline" className="gap-1">
                        <FileJson className="h-3.5 w-3.5" />
                        {job.file_name}
                      </Badge>
                    )}
                  </div>
                </div>
                  );
                })()}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSource ? 'Cập nhật nguồn crawl' : 'Tạo nguồn crawl mới'}</DialogTitle>
            <DialogDescription>
              Nguồn crawl có thể chạy theo URL cụ thể hoặc discovery theo keyword. Config JSON là optional, chỉ cần khi muốn override prompt/schema mặc định.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`source-name-${entityType}`}>Tên nguồn</Label>
                <Input
                  id={`source-name-${entityType}`}
                  value={sourceForm.name}
                  onChange={(event) => setSourceForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder={`Crawl ${entityLabel} Hà Nội`}
                />
              </div>
              <div className="space-y-2">
                <Label>Chế độ nguồn</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={sourceForm.sourceMode === 'url' ? 'default' : 'outline'}
                    onClick={() => setSourceForm((prev) => ({ ...prev, sourceMode: 'url' }))}
                  >
                    URL cụ thể
                  </Button>
                  <Button
                    type="button"
                    variant={sourceForm.sourceMode === 'keyword' ? 'default' : 'outline'}
                    onClick={() => setSourceForm((prev) => ({ ...prev, sourceMode: 'keyword' }))}
                  >
                    Keyword discovery
                  </Button>
                </div>
              </div>
            </div>

            {sourceForm.sourceMode === 'url' ? (
              <div className="space-y-2">
                <Label htmlFor={`source-url-${entityType}`}>Source URL *</Label>
                <Input
                  id={`source-url-${entityType}`}
                  value={sourceForm.sourceUrl}
                  onChange={(event) => setSourceForm((prev) => ({ ...prev, sourceUrl: event.target.value }))}
                  placeholder="https://example.com/listing"
                />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`source-discovery-query-${entityType}`}>Từ khóa discovery *</Label>
                  <Input
                    id={`source-discovery-query-${entityType}`}
                    value={sourceForm.discoveryQuery}
                    onChange={(event) => setSourceForm((prev) => ({ ...prev, discoveryQuery: event.target.value }))}
                    placeholder={`dịch vụ ${entityLabel} sinh viên tphcm`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`source-discovery-location-${entityType}`}>Khu vực / thành phố</Label>
                  <Input
                    id={`source-discovery-location-${entityType}`}
                    value={sourceForm.discoveryLocation}
                    onChange={(event) => setSourceForm((prev) => ({ ...prev, discoveryLocation: event.target.value }))}
                    placeholder="Thành phố Hồ Chí Minh"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-2">
                    <Label htmlFor={`source-discovery-country-${entityType}`}>Country code</Label>
                    <Input
                      id={`source-discovery-country-${entityType}`}
                      value={sourceForm.discoveryCountry}
                      onChange={(event) => setSourceForm((prev) => ({ ...prev, discoveryCountry: event.target.value }))}
                      placeholder="VN"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`source-discovery-limit-${entityType}`}>Số URL tối đa</Label>
                    <Input
                      id={`source-discovery-limit-${entityType}`}
                      type="number"
                      min={1}
                      max={10}
                      value={sourceForm.discoveryLimit}
                      onChange={(event) => setSourceForm((prev) => ({ ...prev, discoveryLimit: event.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor={`source-description-${entityType}`}>Mô tả</Label>
              <Textarea
                id={`source-description-${entityType}`}
                value={sourceForm.description}
                onChange={(event) => setSourceForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Ghi chú ngắn về loại dữ liệu sẽ lấy từ nguồn này"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium text-gray-900">Bật nguồn ngay sau khi lưu</div>
                <div className="text-sm text-gray-500">Nguồn tắt sẽ vẫn tồn tại nhưng không chạy được bằng nút crawl.</div>
              </div>
              <Switch
                checked={sourceForm.isActive}
                onCheckedChange={(checked) => setSourceForm((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`source-config-${entityType}`}>Config JSON (optional)</Label>
              <Textarea
                id={`source-config-${entityType}`}
                className="min-h-44 font-mono text-xs"
                value={sourceForm.configText}
                onChange={(event) => setSourceForm((prev) => ({ ...prev, configText: event.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSourceDialogOpen(false)}>Hủy</Button>
            <Button onClick={() => void handleSaveSource()} disabled={isBusy}>
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu nguồn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewResult)} onOpenChange={(open) => !open && setPreviewResult(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Xem trước URL discovery</DialogTitle>
            <DialogDescription>
              {previewResult?.sourceMode === 'keyword'
                ? 'Danh sách URL ứng viên sẽ được đưa vào bước extract khi chạy crawl theo keyword.'
                : 'Nguồn URL cụ thể sẽ được crawl trực tiếp như bên dưới.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
              <div className="font-medium text-slate-900">{previewResult?.sourceName}</div>
              <div className="mt-1">
                {previewResult?.query || 'Không có keyword'}{previewResult?.location ? ` • ${previewResult.location}` : ''}{previewResult?.country ? ` • ${previewResult.country}` : ''}
              </div>
              <div className="mt-1 text-xs text-slate-500">{previewResult?.count ?? 0} URL ứng viên</div>
            </div>

            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {(previewResult?.candidates ?? []).length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-sm text-slate-500">
                  Không tìm thấy URL ứng viên cho source này.
                </div>
              ) : (
                previewResult?.candidates.map((candidate, index) => (
                  <div key={`${candidate.url}-${index}`} className="rounded-xl border p-4">
                    <div className="font-medium text-slate-900">{candidate.title || `URL #${index + 1}`}</div>
                    <div className="mt-1 break-all text-sm text-slate-600">{candidate.url}</div>
                    {candidate.description && (
                      <div className="mt-2 text-sm text-slate-500">{candidate.description}</div>
                    )}
                    {candidate.sourceDomain && (
                      <div className="mt-2 text-xs text-slate-500">Domain: {candidate.sourceDomain}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewResult(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
