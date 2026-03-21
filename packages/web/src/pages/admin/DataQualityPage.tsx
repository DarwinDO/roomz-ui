import { useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Database,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Play,
  RefreshCcw,
  ShieldX,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dataQualityKeys, useDataQualityDashboard } from '@/hooks/useDataQuality';
import { useRunCrawlSource, useSyncCrawlJob, useUpdateCrawlSource } from '@/hooks/useIngestionReview';
import type {
  CrawlQueueHealthIssue,
  LocationCatalogHealthIssue,
  QualityIssueTag,
  RoomLocationIssue,
  SourceHealthIssue,
} from '@/services/dataQuality';

function formatDate(value: string | null) {
  if (!value) {
    return 'Chưa có';
  }

  return new Date(value).toLocaleString('vi-VN');
}

function getSeverityBadge(severity: 'critical' | 'warning') {
  if (severity === 'critical') {
    return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Cần xử lý ngay</Badge>;
  }

  return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Theo dõi sớm</Badge>;
}

function getIssueTagBadge(issue: QualityIssueTag) {
  if (issue.severity === 'critical') {
    return (
      <Badge key={issue.type} variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
        {issue.label}
      </Badge>
    );
  }

  return (
    <Badge key={issue.type} variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
      {issue.label}
    </Badge>
  );
}

function SummaryCard({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: string | number;
  description: string;
  tone: 'rose' | 'sky' | 'amber' | 'emerald';
}) {
  const toneStyles = {
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  } as const;

  return (
    <Card className="gap-0 rounded-2xl border shadow-sm">
      <CardHeader className="gap-2 pb-3">
        <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {title}
        </CardDescription>
        <div className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${toneStyles[tone]}`}>
          {description}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-950">{value}</div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-slate-500">
      <p className="font-medium text-slate-700">{title}</p>
      <p className="mt-1 leading-6">{description}</p>
    </div>
  );
}

function SectionShell({
  title,
  description,
  count,
  action,
  children,
}: {
  title: string;
  description: string;
  count: number;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-[26px] border-none shadow-soft">
      <CardHeader className="border-b border-slate-100 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-950">{title}</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 text-slate-500">{description}</CardDescription>
          </div>
          <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-slate-700">
            {count} mục
          </Badge>
        </div>
        {action ? <div className="pt-3">{action}</div> : null}
      </CardHeader>
      <CardContent className="space-y-4 pt-5">{children}</CardContent>
    </Card>
  );
}

function RoomIssueItem({ issue }: { issue: RoomLocationIssue }) {
  const address = [issue.address, issue.district, issue.city].filter(Boolean).join(', ') || 'Địa chỉ chưa rõ';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-950">{issue.title}</p>
            {getSeverityBadge(issue.severity)}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">{address}</p>
          <div className="mt-3 flex flex-wrap gap-2">{issue.issues.map(getIssueTagBadge)}</div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button asChild variant="outline" size="sm" className="rounded-full border-slate-200">
            <a href={`/room/${issue.id}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Xem phòng
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link to={`/admin/rooms?focus=${issue.id}`}>
              Sửa phòng
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function LocationIssueItem({ issue }: { issue: LocationCatalogHealthIssue }) {
  const area = [issue.district, issue.city].filter(Boolean).join(', ') || issue.address || 'Thiếu city hoặc district';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-950">{issue.name}</p>
            {getSeverityBadge(issue.severity)}
            {issue.location_type ? (
              <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-600">
                {issue.location_type}
              </Badge>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">{area}</p>
          <div className="mt-3 flex flex-wrap gap-2">{issue.issues.map(getIssueTagBadge)}</div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {issue.source_url ? (
            <Button asChild variant="outline" size="sm" className="rounded-full border-slate-200">
              <a href={issue.source_url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                Nguồn gốc
              </a>
            </Button>
          ) : null}
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link to={`/admin/locations?focus=${issue.id}`}>
              Quản lý location
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function CrawlQueueIssueItem({
  issue,
  onRunSource,
  onSyncJob,
  isRunning,
  isSyncing,
}: {
  issue: CrawlQueueHealthIssue;
  onRunSource: (sourceId: string) => Promise<void>;
  onSyncJob: (jobId: string) => Promise<void>;
  isRunning: boolean;
  isSyncing: boolean;
}) {
  const canRetrySource = Boolean(issue.source_id && issue.kind === 'job');
  const canSyncJob = Boolean(issue.job_id && issue.issues.some((tag) => tag.type === 'stalled_job'));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-950">{issue.title}</p>
            {getSeverityBadge(issue.severity)}
            <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-600">
              {issue.entity_type === 'partner' ? 'Partner' : 'Location'}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">{issue.detail}</p>
          <div className="mt-3 flex flex-wrap gap-2">{issue.issues.map(getIssueTagBadge)}</div>
          <p className="mt-3 text-xs text-slate-400">
            Nguồn: {issue.source_name} • {formatDate(issue.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {canSyncJob ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full border-slate-200"
              disabled={isSyncing}
              onClick={() => void onSyncJob(issue.job_id!)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.currentTarget.blur();
                }
              }}
            >
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Đồng bộ
            </Button>
          ) : null}
          {canRetrySource ? (
            <Button size="sm" className="rounded-full" disabled={isRunning} onClick={() => void onRunSource(issue.source_id!)}>
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Chạy lại nguồn
            </Button>
          ) : null}
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link to="/admin/ingestion-review">
              Mở duyệt crawl
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function SourceIssueItem({
  issue,
  onDeactivate,
  onRun,
  onSync,
  isUpdating,
  isRunning,
  isSyncing,
}: {
  issue: SourceHealthIssue;
  onDeactivate: (sourceId: string) => Promise<void>;
  onRun: (sourceId: string) => Promise<void>;
  onSync: (jobId: string) => Promise<void>;
  isUpdating: boolean;
  isRunning: boolean;
  isSyncing: boolean;
}) {
  const canRun = issue.is_active && issue.source_url.length > 0;
  const canDeactivate = issue.is_active && issue.issues.some((tag) => tag.type === 'missing_source_url');
  const canSync = Boolean(issue.latest_job_id && issue.issues.some((tag) => tag.type === 'stalled_job'));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-950">{issue.name}</p>
            {getSeverityBadge(issue.severity)}
            <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-600">
              {issue.entity_type === 'partner' ? 'Partner source' : 'Location source'}
            </Badge>
          </div>
          <p className="mt-2 break-all text-sm leading-6 text-slate-500">{issue.source_url || 'Source URL đang trống'}</p>
          <div className="mt-3 flex flex-wrap gap-2">{issue.issues.map(getIssueTagBadge)}</div>
          <p className="mt-3 text-xs text-slate-400">
            Lần chạy gần nhất: {formatDate(issue.last_run_at)}
            {issue.latest_job_status ? ` • Job gần nhất: ${issue.latest_job_status}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {canSync ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full border-slate-200"
              disabled={isSyncing}
              onClick={() => void onSync(issue.latest_job_id!)}
            >
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Đồng bộ job
            </Button>
          ) : null}
          {canRun ? (
            <Button size="sm" className="rounded-full" disabled={isRunning} onClick={() => void onRun(issue.id)}>
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Chạy lại
            </Button>
          ) : null}
          {canDeactivate ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              disabled={isUpdating}
              onClick={() => void onDeactivate(issue.id)}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4" />}
              Tắt source
            </Button>
          ) : null}
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link to="/admin/ingestion-review">
              Mở duyệt crawl
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DataQualityPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useDataQualityDashboard();
  const updateSource = useUpdateCrawlSource();
  const runSource = useRunCrawlSource();
  const syncJob = useSyncCrawlJob();

  const roomIssues = data?.roomIssues.slice(0, 6) ?? [];
  const sourceIssues = data?.sourceIssues.slice(0, 6) ?? [];
  const locationIssues = data?.locationIssues.slice(0, 6) ?? [];
  const crawlQueueIssues = data?.crawlQueueIssues.slice(0, 6) ?? [];

  const priorityHighlights = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      ...data.roomIssues.map((issue) => ({
        id: `room-${issue.id}`,
        title: issue.title,
        detail: issue.issues.map((item) => item.label).join(' • '),
        severity: issue.severity,
      })),
      ...data.sourceIssues.map((issue) => ({
        id: `source-${issue.id}`,
        title: issue.name,
        detail: issue.issues.map((item) => item.label).join(' • '),
        severity: issue.severity,
      })),
      ...data.locationIssues.map((issue) => ({
        id: `location-${issue.id}`,
        title: issue.name,
        detail: issue.issues.map((item) => item.label).join(' • '),
        severity: issue.severity,
      })),
      ...data.crawlQueueIssues.map((issue) => ({
        id: `queue-${issue.id}`,
        title: issue.title,
        detail: issue.issues.map((item) => item.label).join(' • '),
        severity: issue.severity,
      })),
    ]
      .sort((left, right) => {
        if (left.severity !== right.severity) {
          return left.severity === 'critical' ? -1 : 1;
        }

        return left.title.localeCompare(right.title);
      })
      .slice(0, 5);
  }, [data]);

  const refreshDashboard = async () => {
    await queryClient.invalidateQueries({ queryKey: dataQualityKeys.dashboard() });
  };

  const handleDeactivateSource = async (sourceId: string) => {
    try {
      await updateSource.mutateAsync({ id: sourceId, input: { isActive: false } });
      await refreshDashboard();
      toast.success('Đã tắt nguồn crawl lỗi');
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Không thể tắt nguồn crawl');
    }
  };

  const handleRunSource = async (sourceId: string) => {
    try {
      await runSource.mutateAsync(sourceId);
      await refreshDashboard();
      toast.success('Đã tạo lại job crawl cho nguồn này');
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Không thể chạy lại nguồn crawl');
    }
  };

  const handleSyncJob = async (jobId: string) => {
    try {
      await syncJob.mutateAsync(jobId);
      await refreshDashboard();
      toast.success('Đã đồng bộ trạng thái crawl job');
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Không thể đồng bộ crawl job');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="rounded-[28px] border-none shadow-soft">
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <AlertTriangle className="h-10 w-10 text-rose-500" />
          <div>
            <p className="text-lg font-semibold text-slate-950">Không tải được dashboard chất lượng dữ liệu</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error instanceof Error ? error.message : 'Đã có lỗi xảy ra khi lấy dữ liệu kiểm tra chất lượng.'}
            </p>
          </div>
          <Button onClick={() => void refetch()}>Thử lại</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Chất lượng dữ liệu</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
            Theo dõi các điểm đang chặn search, map, crawl và location catalog. Màn này ưu tiên phát hiện record lỗi sớm để
            admin xử lý trước khi ảnh hưởng người dùng.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-full border-slate-200">
            <Link to="/admin/rooms">
              <MapPin className="h-4 w-4" />
              Quản lý phòng
            </Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/admin/ingestion-review">
              <Database className="h-4 w-4" />
              Duyệt crawl
            </Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-[28px] border-none bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_48%,#eff6ff_100%)] shadow-soft">
        <CardContent className="grid gap-6 py-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
              <AlertTriangle className="h-4 w-4" />
              Ưu tiên vận hành
            </div>
            <p className="mt-4 text-4xl font-black text-slate-950">{data.summary.criticalIssues} lỗi cần xử lý ngay</p>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
              Tập trung trước vào phòng thiếu tọa độ, source crawl lỗi, location catalog thiếu context và các record crawl bị
              error. Đây là các điểm có tác động trực tiếp tới search, map và pipeline dữ liệu.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="bg-white text-slate-700 hover:bg-white">Coverage phòng {data.summary.roomCoordinateCoverage}%</Badge>
              <Badge className="bg-white text-slate-700 hover:bg-white">
                Coverage location {data.summary.locationCoordinateCoverage}%
              </Badge>
              <Badge className="bg-white text-slate-700 hover:bg-white">Queue lỗi {data.summary.crawlQueueIssues}</Badge>
            </div>
          </div>
          <div className="grid gap-3">
            {priorityHighlights.length > 0 ? (
              priorityHighlights.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    {getSeverityBadge(item.severity)}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.detail}</p>
                </div>
              ))
            ) : (
              <EmptyState
                title="Chưa có điểm nghẽn nghiêm trọng"
                description="Coverage và crawl queue hiện ổn. Bạn vẫn nên kiểm tra định kỳ sau mỗi lần import dữ liệu mới."
              />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Lỗi room / map"
          value={data.summary.roomLocationIssues}
          description={`${data.summary.totalTrackedRooms} phòng active hoặc pending`}
          tone="rose"
        />
        <SummaryCard
          title="Nguồn crawl"
          value={data.summary.sourceIssues}
          description="Source cần chỉnh hoặc chạy lại"
          tone="amber"
        />
        <SummaryCard
          title="Location catalog"
          value={data.summary.locationIssues}
          description={`${data.summary.totalTrackedLocations} location đang theo dõi`}
          tone="sky"
        />
        <SummaryCard
          title="Queue / review"
          value={data.summary.crawlQueueIssues}
          description="Duplicate, error, job fail hoặc stalled"
          tone="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionShell
          title="Room location health"
          description={`Theo dõi phòng active hoặc pending đang thiếu tọa độ hoặc có lat/lng ngoài phạm vi Việt Nam. Coverage hiện tại: ${data.summary.roomCoordinateCoverage}%`}
          count={data.summary.roomLocationIssues}
          action={
            <Button asChild variant="ghost" size="sm" className="rounded-full px-0 text-primary hover:bg-transparent hover:text-primary/80">
              <Link to="/admin/rooms">
                Mở danh sách phòng
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        >
          {roomIssues.length > 0 ? (
            roomIssues.map((issue) => <RoomIssueItem key={issue.id} issue={issue} />)
          ) : (
            <EmptyState
              title="Không có room issue nổi bật"
              description="Toàn bộ phòng đang theo dõi đã có tọa độ hợp lệ. Đây là baseline tốt cho search và map."
            />
          )}
        </SectionShell>

        <SectionShell
          title="Source health"
          description="Tập trung vào các source crawl thiếu URL, chưa từng chạy, fail gần nhất hoặc có job chạy quá lâu."
          count={data.summary.sourceIssues}
          action={
            <Button asChild variant="ghost" size="sm" className="rounded-full px-0 text-primary hover:bg-transparent hover:text-primary/80">
              <Link to="/admin/ingestion-review">
                Quản lý source crawl
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        >
          {sourceIssues.length > 0 ? (
            sourceIssues.map((issue) => (
              <SourceIssueItem
                key={issue.id}
                issue={issue}
                onDeactivate={handleDeactivateSource}
                onRun={handleRunSource}
                onSync={handleSyncJob}
                isUpdating={updateSource.isPending}
                isRunning={runSource.isPending}
                isSyncing={syncJob.isPending}
              />
            ))
          ) : (
            <EmptyState
              title="Source crawl đang ổn"
              description="Không có nguồn nào thiếu URL hoặc có dấu hiệu fail/stalled ở lần chạy gần nhất."
            />
          )}
        </SectionShell>

        <SectionShell
          title="Location catalog health"
          description={`Theo dõi location active đang thiếu city/district hoặc thiếu tọa độ. Coverage hiện tại: ${data.summary.locationCoordinateCoverage}%`}
          count={data.summary.locationIssues}
          action={
            <Button asChild variant="ghost" size="sm" className="rounded-full px-0 text-primary hover:bg-transparent hover:text-primary/80">
              <Link to="/admin/locations">
                Mở lane location
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        >
          {locationIssues.length > 0 ? (
            locationIssues.map((issue) => <LocationIssueItem key={issue.id} issue={issue} />)
          ) : (
            <EmptyState
              title="Location catalog đang sạch"
              description="Các location active hiện đã có đủ area context và tọa độ hợp lệ để phục vụ search, nearby places và local passport."
            />
          )}
        </SectionShell>

        <SectionShell
          title="Crawl queue health"
          description="Đây là nơi gom các record duplicate/error trong review queue và các crawl job fail hoặc chạy quá lâu cần admin can thiệp."
          count={data.summary.crawlQueueIssues}
          action={
            <Button asChild variant="ghost" size="sm" className="rounded-full px-0 text-primary hover:bg-transparent hover:text-primary/80">
              <Link to="/admin/ingestion-review">
                Mở review queue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        >
          {crawlQueueIssues.length > 0 ? (
            crawlQueueIssues.map((issue) => (
              <CrawlQueueIssueItem
                key={`${issue.kind}-${issue.id}`}
                issue={issue}
                onRunSource={handleRunSource}
                onSyncJob={handleSyncJob}
                isRunning={runSource.isPending}
                isSyncing={syncJob.isPending}
              />
            ))
          ) : (
            <EmptyState
              title="Queue hiện không có bottleneck lớn"
              description="Không thấy duplicate/error nổi bật trong review queue và cũng chưa có crawl job fail hoặc stalled cần admin xử lý."
            />
          )}
        </SectionShell>
      </div>

      <Card className="rounded-[26px] border-none shadow-soft">
        <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Nhịp kiểm tra khuyến nghị</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Sau mỗi lần import crawl, backfill tọa độ hoặc thêm seed lớn, nên rà lại màn này trước khi test search và map
              để tránh lặp lại các lỗi vận hành cũ.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5">
              <Clock className="h-4 w-4" />
              kiểm tra hằng ngày ở staging
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5">
              <Globe className="h-4 w-4" />
              kiểm tra ngay sau mỗi crawl run
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
