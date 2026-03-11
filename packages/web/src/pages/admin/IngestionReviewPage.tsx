import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useLocationCrawlReviewQueue,
  usePartnerCrawlReviewQueue,
  usePromoteLocationCrawlIngestion,
  usePromotePartnerCrawlIngestion,
  useRefreshLocationCrawlClassification,
  useRefreshPartnerCrawlClassification,
  useRejectLocationCrawlIngestion,
  useRejectPartnerCrawlIngestion,
} from '@/hooks/useIngestionReview';
import { CrawlOperationsPanel } from '@/pages/admin/components/CrawlOperationsPanel';
import {
  type LocationCrawlReviewItem,
  type LocationCrawlReviewStatus,
  type PartnerCrawlReviewItem,
  type PartnerCrawlReviewStatus,
} from '@/services/ingestionReview';
import {
  Database,
  ExternalLink,
  Eye,
  Loader2,
  MoreVertical,
  RefreshCcw,
  ShieldX,
  Sparkles,
  Tags,
} from 'lucide-react';
import { toast } from 'sonner';

type ReviewTab = 'partners' | 'locations';
type ReviewStatusFilter = 'all' | PartnerCrawlReviewStatus | LocationCrawlReviewStatus;

function getPartnerStatusBadge(status: PartnerCrawlReviewStatus) {
  switch (status) {
    case 'ready':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Sẵn sàng</Badge>;
    case 'duplicate_partner':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Trùng đối tác</Badge>;
    case 'duplicate_lead':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Trùng lead</Badge>;
    case 'imported':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Đã import</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Đã loại</Badge>;
    case 'error':
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Thiếu dữ liệu</Badge>;
    default:
      return <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100">Chờ duyệt</Badge>;
  }
}

function getLocationStatusBadge(status: LocationCrawlReviewStatus) {
  switch (status) {
    case 'ready':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Sẵn sàng</Badge>;
    case 'duplicate_location':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Trùng location</Badge>;
    case 'imported':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Đã import</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Đã loại</Badge>;
    case 'error':
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Thiếu dữ liệu</Badge>;
    default:
      return <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100">Chờ duyệt</Badge>;
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN');
}

export default function IngestionReviewPage() {
  const [activeTab, setActiveTab] = useState<ReviewTab>('partners');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>('all');
  const [selectedPartner, setSelectedPartner] = useState<PartnerCrawlReviewItem | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationCrawlReviewItem | null>(null);

  const {
    data: partnerRows = [],
    isLoading: isLoadingPartners,
  } = usePartnerCrawlReviewQueue();
  const {
    data: locationRows = [],
    isLoading: isLoadingLocations,
  } = useLocationCrawlReviewQueue();

  const promotePartner = usePromotePartnerCrawlIngestion();
  const promoteLocation = usePromoteLocationCrawlIngestion();
  const rejectPartner = useRejectPartnerCrawlIngestion();
  const rejectLocation = useRejectLocationCrawlIngestion();
  const refreshPartner = useRefreshPartnerCrawlClassification();
  const refreshLocation = useRefreshLocationCrawlClassification();

  const filteredPartners = useMemo(() => {
    return partnerRows.filter((row) => {
      const matchesStatus = statusFilter === 'all' || row.review_status === statusFilter;
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = !term
        || row.company_name?.toLowerCase().includes(term)
        || row.email?.toLowerCase().includes(term)
        || row.phone?.toLowerCase().includes(term)
        || row.service_area?.toLowerCase().includes(term)
        || row.source_name?.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [partnerRows, searchTerm, statusFilter]);

  const filteredLocations = useMemo(() => {
    return locationRows.filter((row) => {
      const matchesStatus = statusFilter === 'all' || row.review_status === statusFilter;
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = !term
        || row.location_name?.toLowerCase().includes(term)
        || row.city?.toLowerCase().includes(term)
        || row.district?.toLowerCase().includes(term)
        || row.location_type?.toLowerCase().includes(term)
        || row.source_name?.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [locationRows, searchTerm, statusFilter]);

  const activeEntityType = activeTab === 'partners' ? 'partner' : 'location';
  const activeRows = activeTab === 'partners' ? filteredPartners : filteredLocations;
  const stats = useMemo(() => {
    if (activeTab === 'partners') {
      return {
        total: filteredPartners.length,
        ready: filteredPartners.filter((row) => row.review_status === 'ready').length,
        duplicates: filteredPartners.filter((row) => row.review_status === 'duplicate_partner' || row.review_status === 'duplicate_lead').length,
        errors: filteredPartners.filter((row) => row.review_status === 'error').length,
      };
    }

    return {
      total: filteredLocations.length,
      ready: filteredLocations.filter((row) => row.review_status === 'ready').length,
      duplicates: filteredLocations.filter((row) => row.review_status === 'duplicate_location').length,
      errors: filteredLocations.filter((row) => row.review_status === 'error').length,
    };
  }, [activeTab, filteredLocations, filteredPartners]);

  const handlePromotePartner = async (row: PartnerCrawlReviewItem) => {
    try {
      await promotePartner.mutateAsync(row.id);
      toast.success('Đã promote crawl đối tác vào hệ thống');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể promote crawl đối tác');
    }
  };

  const handlePromoteLocation = async (row: LocationCrawlReviewItem) => {
    try {
      await promoteLocation.mutateAsync(row.id);
      toast.success('Đã promote location vào catalog');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể promote location');
    }
  };

  const handleRejectPartner = async (row: PartnerCrawlReviewItem) => {
    try {
      await rejectPartner.mutateAsync({ id: row.id });
      toast.success('Đã loại crawl đối tác');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể loại crawl đối tác');
    }
  };

  const handleRejectLocation = async (row: LocationCrawlReviewItem) => {
    try {
      await rejectLocation.mutateAsync({ id: row.id });
      toast.success('Đã loại crawl location');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể loại crawl location');
    }
  };

  const handleRefreshPartner = async (row: PartnerCrawlReviewItem) => {
    try {
      await refreshPartner.mutateAsync(row.id);
      toast.success('Đã phân loại lại crawl đối tác');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể phân loại lại crawl đối tác');
    }
  };

  const handleRefreshLocation = async (row: LocationCrawlReviewItem) => {
    try {
      await refreshLocation.mutateAsync(row.id);
      toast.success('Đã phân loại lại crawl location');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể phân loại lại crawl location');
    }
  };

  const partnerColumns: ColumnDef<PartnerCrawlReviewItem>[] = [
    {
      id: 'company',
      header: 'Đối tác crawl',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.company_name || 'Chưa có tên'}</div>
          <div className="text-xs text-gray-500">{row.original.contact_name || row.original.email || 'Thiếu liên hệ'}</div>
        </div>
      ),
    },
    {
      id: 'source',
      header: 'Nguồn',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.source_name}</div>
          <div className="text-xs text-gray-500">{row.original.source_domain || row.original.source_type}</div>
        </div>
      ),
    },
    {
      id: 'service_area',
      header: 'Khu vực',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.service_area || row.original.address || 'Chưa rõ'}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => getPartnerStatusBadge(row.original.review_status),
    },
    {
      id: 'confidence',
      header: 'Độ tin cậy',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.crawl_confidence != null ? `${row.original.crawl_confidence}%` : 'N/A'}
        </span>
      ),
    },
    {
      id: 'created_at',
      header: 'Ngày vào queue',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{formatDate(row.original.created_at)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedPartner(item)}>
                <Eye className="h-4 w-4 mr-2" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRefreshPartner(item)}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Phân loại lại
              </DropdownMenuItem>
              {(item.review_status === 'ready' || item.review_status === 'duplicate_lead') && (
                <DropdownMenuItem onClick={() => handlePromotePartner(item)}>
                  <Sparkles className="h-4 w-4 mr-2 text-emerald-600" />
                  Promote
                </DropdownMenuItem>
              )}
              {item.review_status !== 'imported' && item.review_status !== 'rejected' && (
                <DropdownMenuItem onClick={() => handleRejectPartner(item)}>
                  <ShieldX className="h-4 w-4 mr-2 text-red-600" />
                  Loại bỏ
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const locationColumns: ColumnDef<LocationCrawlReviewItem>[] = [
    {
      id: 'location_name',
      header: 'Location crawl',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.location_name || 'Chưa có tên'}</div>
          <div className="text-xs text-gray-500">{row.original.location_type || 'Chưa rõ loại'}</div>
        </div>
      ),
    },
    {
      id: 'area',
      header: 'Khu vực',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {[row.original.district, row.original.city].filter(Boolean).join(', ') || row.original.address || 'Chưa rõ'}
        </div>
      ),
    },
    {
      id: 'source',
      header: 'Nguồn',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.source_name}</div>
          <div className="text-xs text-gray-500">{row.original.source_domain || row.original.source_type}</div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => getLocationStatusBadge(row.original.review_status),
    },
    {
      id: 'confidence',
      header: 'Độ tin cậy',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.crawl_confidence != null ? `${row.original.crawl_confidence}%` : 'N/A'}
        </span>
      ),
    },
    {
      id: 'created_at',
      header: 'Ngày vào queue',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{formatDate(row.original.created_at)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedLocation(item)}>
                <Eye className="h-4 w-4 mr-2" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRefreshLocation(item)}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Phân loại lại
              </DropdownMenuItem>
              {(item.review_status === 'ready' || item.review_status === 'duplicate_location') && (
                <DropdownMenuItem onClick={() => handlePromoteLocation(item)}>
                  <Sparkles className="h-4 w-4 mr-2 text-emerald-600" />
                  Promote
                </DropdownMenuItem>
              )}
              {item.review_status !== 'imported' && item.review_status !== 'rejected' && (
                <DropdownMenuItem onClick={() => handleRejectLocation(item)}>
                  <ShieldX className="h-4 w-4 mr-2 text-red-600" />
                  Loại bỏ
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoadingPartners || isLoadingLocations) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Duyệt Crawl</h1>
          <p className="text-gray-600 mt-1">
            Kiểm soát dữ liệu crawl trước khi đẩy vào lead queue hoặc catalog location.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Database className="h-4 w-4" />
          <span>{activeRows.length} mục theo bộ lọc hiện tại</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReviewTab)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <TabsList>
            <TabsTrigger value="partners">Partner Crawl</TabsTrigger>
            <TabsTrigger value="locations">Location Crawl</TabsTrigger>
          </TabsList>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ReviewStatusFilter)}>
            <SelectTrigger className="w-full lg:w-[220px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="ready">Sẵn sàng</SelectItem>
              {activeTab === 'partners' ? (
                <>
                  <SelectItem value="duplicate_partner">Trùng đối tác</SelectItem>
                  <SelectItem value="duplicate_lead">Trùng lead</SelectItem>
                </>
              ) : (
                <SelectItem value="duplicate_location">Trùng location</SelectItem>
              )}
              <SelectItem value="imported">Đã import</SelectItem>
              <SelectItem value="rejected">Đã loại</SelectItem>
              <SelectItem value="error">Thiếu dữ liệu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Tabs>

      <CrawlOperationsPanel entityType={activeEntityType} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="p-4 border rounded-lg bg-white">
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
          <div className="text-sm text-gray-600 mt-1">Tổng mục</div>
        </div>
        <div className="p-4 border rounded-lg bg-emerald-50 border-emerald-200">
          <div className="text-2xl font-bold text-emerald-600">{stats.ready}</div>
          <div className="text-sm text-emerald-700 mt-1">Sẵn sàng</div>
        </div>
        <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
          <div className="text-2xl font-bold text-amber-600">{stats.duplicates}</div>
          <div className="text-sm text-amber-700 mt-1">Trùng lặp</div>
        </div>
        <div className="p-4 border rounded-lg bg-rose-50 border-rose-200">
          <div className="text-2xl font-bold text-rose-600">{stats.errors}</div>
          <div className="text-sm text-rose-700 mt-1">Thiếu dữ liệu</div>
        </div>
      </div>

      {activeTab === 'partners' ? (
        <DataTable
          data={filteredPartners}
          columns={partnerColumns}
          searchPlaceholder="Tìm theo tên công ty, email, phone, nguồn..."
          onSearch={setSearchTerm}
        />
      ) : (
        <DataTable
          data={filteredLocations}
          columns={locationColumns}
          searchPlaceholder="Tìm theo tên location, city, district, loại..."
          onSearch={setSearchTerm}
        />
      )}

      <Dialog open={!!selectedPartner} onOpenChange={(open) => !open && setSelectedPartner(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPartner?.company_name || 'Chi tiết crawl đối tác'}</DialogTitle>
            <DialogDescription>
              Review crawl đối tác trước khi promote vào lead queue.
            </DialogDescription>
          </DialogHeader>

          {selectedPartner && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-muted/40 p-3">
                  <div className="text-xs uppercase text-gray-500">Liên hệ</div>
                  <div className="font-medium mt-1">{selectedPartner.contact_name || 'Chưa rõ'}</div>
                  <div>{selectedPartner.email || 'Không có email'}</div>
                  <div>{selectedPartner.phone || 'Không có phone'}</div>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <div className="text-xs uppercase text-gray-500">Nguồn</div>
                  <div className="font-medium mt-1">{selectedPartner.source_name}</div>
                  <div>{selectedPartner.source_domain || selectedPartner.source_type}</div>
                  {selectedPartner.source_url && (
                    <a href={selectedPartner.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-primary">
                      Mở nguồn <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-xl border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Trạng thái</span>
                  {getPartnerStatusBadge(selectedPartner.review_status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Khu vực</span>
                  <span>{selectedPartner.service_area || selectedPartner.address || 'Chưa rõ'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Category</span>
                  <span>{selectedPartner.service_category || 'Chưa gán'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Độ tin cậy</span>
                  <span>{selectedPartner.crawl_confidence != null ? `${selectedPartner.crawl_confidence}%` : 'N/A'}</span>
                </div>
                {(selectedPartner.matched_partner_name || selectedPartner.matched_partner_lead_name) && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Match hiện tại</span>
                    <span>{selectedPartner.matched_partner_name || selectedPartner.matched_partner_lead_name}</span>
                  </div>
                )}
                {selectedPartner.import_error && (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-rose-700">
                    {selectedPartner.import_error}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPartner(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedLocation} onOpenChange={(open) => !open && setSelectedLocation(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedLocation?.location_name || 'Chi tiết crawl location'}</DialogTitle>
            <DialogDescription>
              Review metadata địa điểm trước khi promote vào location catalog.
            </DialogDescription>
          </DialogHeader>

          {selectedLocation && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-muted/40 p-3">
                  <div className="text-xs uppercase text-gray-500">Loại location</div>
                  <div className="font-medium mt-1">{selectedLocation.location_type || 'Chưa rõ'}</div>
                  <div>{[selectedLocation.district, selectedLocation.city].filter(Boolean).join(', ') || 'Chưa rõ khu vực'}</div>
                  <div>{selectedLocation.address || 'Không có địa chỉ chi tiết'}</div>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <div className="text-xs uppercase text-gray-500">Nguồn</div>
                  <div className="font-medium mt-1">{selectedLocation.source_name}</div>
                  <div>{selectedLocation.source_domain || selectedLocation.source_type}</div>
                  {selectedLocation.source_url && (
                    <a href={selectedLocation.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-primary">
                      Mở nguồn <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-xl border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Trạng thái</span>
                  {getLocationStatusBadge(selectedLocation.review_status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Tọa độ</span>
                  <span>
                    {selectedLocation.latitude != null && selectedLocation.longitude != null
                      ? `${selectedLocation.latitude}, ${selectedLocation.longitude}`
                      : 'Chưa có'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Độ tin cậy</span>
                  <span>{selectedLocation.crawl_confidence != null ? `${selectedLocation.crawl_confidence}%` : 'N/A'}</span>
                </div>
                {selectedLocation.tags.length > 0 && (
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-gray-500 flex items-center gap-1"><Tags className="h-3.5 w-3.5" /> Tags</span>
                    <div className="flex flex-wrap justify-end gap-2">
                      {selectedLocation.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedLocation.matched_location_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Match hiện tại</span>
                    <span>{selectedLocation.matched_location_name}</span>
                  </div>
                )}
                {selectedLocation.import_error && (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-rose-700">
                    {selectedLocation.import_error}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLocation(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
