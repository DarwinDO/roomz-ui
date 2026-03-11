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
  useRunCrawlSource,
  useSyncCrawlJob,
  useUpdateCrawlSource,
  useUploadCrawlRecords,
} from '@/hooks/useIngestionReview';
import {
  extractUploadRecords,
  type CrawlEntityType,
  type CrawlJob,
  type CrawlSource,
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
  sourceUrl: string;
  description: string;
  isActive: boolean;
  configText: string;
}

const EMPTY_SOURCE_FORM: SourceFormState = {
  name: '',
  sourceUrl: '',
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

export function CrawlOperationsPanel({ entityType }: CrawlOperationsPanelProps) {
  const entityLabel = getEntityLabel(entityType);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<CrawlSource | null>(null);
  const [sourceForm, setSourceForm] = useState<SourceFormState>(EMPTY_SOURCE_FORM);
  const [uploadSourceName, setUploadSourceName] = useState(`manual-${entityType}-upload`);
  const [uploadSourceUrl, setUploadSourceUrl] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const { data: sources = [], isLoading: isLoadingSources } = useCrawlSources(entityType);
  const { data: jobs = [], isLoading: isLoadingJobs } = useCrawlJobs(entityType);
  const createSource = useCreateCrawlSource(entityType);
  const updateSource = useUpdateCrawlSource(entityType);
  const deleteSource = useDeleteCrawlSource(entityType);
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
      sourceUrl: source.source_url,
      description: source.description ?? '',
      isActive: source.is_active,
      configText: JSON.stringify(source.config ?? {}, null, 2),
    });
    setIsSourceDialogOpen(true);
  };

  const handleSaveSource = async () => {
    if (!sourceForm.sourceUrl.trim()) {
      toast.error('Source URL là bắt buộc');
      return;
    }

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
            sourceUrl: sourceForm.sourceUrl,
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
          sourceUrl: sourceForm.sourceUrl,
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
      toast.success(`Đã tạo job crawl ${source.name}${result.providerJobId ? ` (${result.providerJobId})` : ''}`);
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

  const isBusy = createSource.isPending || updateSource.isPending || deleteSource.isPending || runSource.isPending || syncJob.isPending || uploadRecords.isPending;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Nguồn crawl {entityLabel}</CardTitle>
              <CardDescription>
                Khai báo các URL nguồn để admin chỉ cần bấm một nút là chạy crawl và đẩy vào queue review.
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
                        {!source.is_active && <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Đang tắt</Badge>}
                      </div>
                      <div className="text-sm text-gray-600 break-all">{source.source_url}</div>
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
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-gray-900">{job.source_name}</div>
                      {getJobBadge(job)}
                      <Badge variant="outline">{job.provider}</Badge>
                      <Badge variant="outline">{job.trigger_type}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {job.source_url || job.file_name || 'Không có nguồn đính kèm'}
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
                      <span>Duplicate: {job.duplicate_count}</span>
                      <span>Error: {job.error_count}</span>
                      <span>Skipped: {job.skipped_count}</span>
                    </div>
                    {job.error_message && (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {job.error_message}
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
              Nguồn crawl sẽ được dùng cho nút chạy tự động ở admin. Config JSON là optional, chỉ cần khi muốn override prompt/schema mặc định.
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
                <Label htmlFor={`source-url-${entityType}`}>Source URL *</Label>
                <Input
                  id={`source-url-${entityType}`}
                  value={sourceForm.sourceUrl}
                  onChange={(event) => setSourceForm((prev) => ({ ...prev, sourceUrl: event.target.value }))}
                  placeholder="https://example.com/listing"
                />
              </div>
            </div>

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
    </div>
  );
}
