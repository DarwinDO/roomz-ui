
import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/DataTable';
import { CrawlOperationsPanel } from '@/pages/admin/components/CrawlOperationsPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  useLocationCrawlReviewQueue,
  usePartnerCrawlReviewQueue,
  usePromoteLocationCrawlIngestion,
  usePromotePartnerCrawlIngestion,
  useRefreshLocationCrawlClassification,
  useRefreshPartnerCrawlClassification,
  useRejectLocationCrawlIngestion,
  useRejectPartnerCrawlIngestion,
  useUpdateLocationCrawlIngestion,
  useUpdatePartnerCrawlIngestion,
} from '@/hooks/useIngestionReview';
import {
  buildLocationCrawlIngestionUpdate,
  buildPartnerCrawlIngestionUpdate,
  type LocationCatalogType,
  type LocationCrawlReviewItem,
  type LocationCrawlReviewStatus,
  type PartnerCrawlReviewItem,
  type PartnerCrawlReviewStatus,
} from '@/services/ingestionReview';
import {
  Database,
  ExternalLink,
  FileJson,
  Loader2,
  MoreVertical,
  PencilLine,
  RefreshCcw,
  Save,
  ShieldX,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

type ReviewTab = 'partners' | 'locations';
type ReviewStatusFilter = 'all' | PartnerCrawlReviewStatus | LocationCrawlReviewStatus;

type PartnerDraft = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  serviceArea: string;
  serviceCategory: string;
  address: string;
  website: string;
  sourceUrl: string;
  externalId: string;
  notes: string;
  crawlConfidence: string;
};

type LocationDraft = {
  locationName: string;
  locationType: LocationCatalogType | '';
  city: string;
  district: string;
  address: string;
  latitude: string;
  longitude: string;
  tags: string;
  sourceUrl: string;
  externalId: string;
  notes: string;
  crawlConfidence: string;
};

const LOCATION_TYPES: LocationCatalogType[] = [
  'university',
  'district',
  'neighborhood',
  'poi',
  'campus',
  'station',
  'landmark',
];

function getPartnerStatusBadge(status: PartnerCrawlReviewStatus) {
  switch (status) {
    case 'ready':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Sẵn sàng</Badge>;
    case 'low_confidence':
      return <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">Cần review thêm</Badge>;
    case 'duplicate_partner':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Trùng đối tác</Badge>;
    case 'duplicate_lead':
      return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">Trùng lead</Badge>;
    case 'imported':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Đã import</Badge>;
    case 'rejected':
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Đã loại</Badge>;
    case 'error':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Lỗi dữ liệu</Badge>;
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
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Đã loại</Badge>;
    case 'error':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Lỗi dữ liệu</Badge>;
    default:
      return <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100">Chờ duyệt</Badge>;
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Chưa có';
  }

  return new Date(value).toLocaleString('vi-VN');
}

function formatJson(payload: Record<string, unknown>) {
  return JSON.stringify(payload, null, 2);
}

function buildPartnerDraft(item: PartnerCrawlReviewItem): PartnerDraft {
  return {
    companyName: item.company_name ?? '',
    contactName: item.contact_name ?? '',
    email: item.email ?? '',
    phone: item.phone ?? '',
    serviceArea: item.service_area ?? '',
    serviceCategory: item.service_category ?? '',
    address: item.address ?? '',
    website: item.website ?? '',
    sourceUrl: item.source_url ?? '',
    externalId: item.external_id ?? '',
    notes: item.notes ?? '',
    crawlConfidence: item.crawl_confidence?.toString() ?? '',
  };
}

function buildLocationDraft(item: LocationCrawlReviewItem): LocationDraft {
  return {
    locationName: item.location_name ?? '',
    locationType: (item.location_type as LocationCatalogType | null) ?? '',
    city: item.city ?? '',
    district: item.district ?? '',
    address: item.address ?? '',
    latitude: item.latitude?.toString() ?? '',
    longitude: item.longitude?.toString() ?? '',
    tags: item.tags.join(', '),
    sourceUrl: item.source_url ?? '',
    externalId: item.external_id ?? '',
    notes: item.notes ?? '',
    crawlConfidence: item.crawl_confidence?.toString() ?? '',
  };
}

function toPartnerUpdateInput(draft: PartnerDraft) {
  return {
    companyName: draft.companyName,
    contactName: draft.contactName,
    email: draft.email,
    phone: draft.phone,
    serviceArea: draft.serviceArea,
    serviceCategory: draft.serviceCategory,
    address: draft.address,
    website: draft.website,
    sourceUrl: draft.sourceUrl,
    externalId: draft.externalId,
    notes: draft.notes,
    crawlConfidence: draft.crawlConfidence === '' ? null : Number(draft.crawlConfidence),
  };
}

function toLocationUpdateInput(draft: LocationDraft) {
  return {
    locationName: draft.locationName,
    locationType: draft.locationType,
    city: draft.city,
    district: draft.district,
    address: draft.address,
    latitude: draft.latitude,
    longitude: draft.longitude,
    tags: draft.tags,
    sourceUrl: draft.sourceUrl,
    externalId: draft.externalId,
    notes: draft.notes,
    crawlConfidence: draft.crawlConfidence === '' ? null : Number(draft.crawlConfidence),
  };
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'slate' | 'emerald' | 'violet' | 'amber' | 'rose';
}) {
  const toneClass = {
    slate: 'border-slate-200 bg-white text-slate-950',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
  } as const;

  return (
    <Card className={`rounded-2xl border shadow-sm ${toneClass[tone]}`}>
      <CardContent className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[68%] break-words text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

function JsonPanel({ title, payload }: { title: string; payload: Record<string, unknown> }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <FileJson className="h-4 w-4" />
        {title}
      </div>
      <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
        {formatJson(payload)}
      </pre>
    </div>
  );
}

function getLocationTypeLabel(type: LocationCatalogType) {
  switch (type) {
    case 'university':
      return 'Trường đại học';
    case 'district':
      return 'Quận / huyện';
    case 'neighborhood':
      return 'Khu vực';
    case 'poi':
      return 'Điểm quan tâm';
    case 'campus':
      return 'Campus';
    case 'station':
      return 'Ga / bến';
    case 'landmark':
      return 'Mốc địa danh';
    default:
      return type;
  }
}
export default function IngestionReviewPage() {
  const [activeTab, setActiveTab] = useState<ReviewTab>('partners');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedPartner, setSelectedPartner] = useState<PartnerCrawlReviewItem | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationCrawlReviewItem | null>(null);
  const [partnerDraft, setPartnerDraft] = useState<PartnerDraft | null>(null);
  const [locationDraft, setLocationDraft] = useState<LocationDraft | null>(null);

  const { data: partnerRows = [], isLoading: isLoadingPartners } = usePartnerCrawlReviewQueue();
  const { data: locationRows = [], isLoading: isLoadingLocations } = useLocationCrawlReviewQueue();

  const updatePartner = useUpdatePartnerCrawlIngestion();
  const updateLocation = useUpdateLocationCrawlIngestion();
  const promotePartner = usePromotePartnerCrawlIngestion();
  const promoteLocation = usePromoteLocationCrawlIngestion();
  const rejectPartner = useRejectPartnerCrawlIngestion();
  const rejectLocation = useRejectLocationCrawlIngestion();
  const refreshPartner = useRefreshPartnerCrawlClassification();
  const refreshLocation = useRefreshLocationCrawlClassification();

  useEffect(() => {
    setStatusFilter('all');
    setSourceFilter('all');
    setSearchTerm('');
  }, [activeTab]);

  const sourceOptions = useMemo(() => {
    const names = activeTab === 'partners'
      ? partnerRows.map((row) => row.source_name)
      : locationRows.map((row) => row.source_name);

    return Array.from(new Set(names.filter(Boolean))).sort((left, right) => left.localeCompare(right, 'vi'));
  }, [activeTab, locationRows, partnerRows]);

  const filteredPartners = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return partnerRows.filter((row) => {
      const matchesStatus = statusFilter === 'all' || row.review_status === statusFilter;
      const matchesSource = sourceFilter === 'all' || row.source_name === sourceFilter;
      const matchesSearch = !term
        || row.company_name?.toLowerCase().includes(term)
        || row.contact_name?.toLowerCase().includes(term)
        || row.email?.toLowerCase().includes(term)
        || row.phone?.toLowerCase().includes(term)
        || row.website?.toLowerCase().includes(term)
        || row.service_area?.toLowerCase().includes(term)
        || row.source_name?.toLowerCase().includes(term);

      return matchesStatus && matchesSource && matchesSearch;
    });
  }, [partnerRows, searchTerm, sourceFilter, statusFilter]);

  const filteredLocations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return locationRows.filter((row) => {
      const matchesStatus = statusFilter === 'all' || row.review_status === statusFilter;
      const matchesSource = sourceFilter === 'all' || row.source_name === sourceFilter;
      const matchesSearch = !term
        || row.location_name?.toLowerCase().includes(term)
        || row.city?.toLowerCase().includes(term)
        || row.district?.toLowerCase().includes(term)
        || row.address?.toLowerCase().includes(term)
        || row.source_name?.toLowerCase().includes(term);

      return matchesStatus && matchesSource && matchesSearch;
    });
  }, [locationRows, searchTerm, sourceFilter, statusFilter]);

  const stats = useMemo(() => {
    if (activeTab === 'partners') {
      return {
        total: filteredPartners.length,
        ready: filteredPartners.filter((row) => row.review_status === 'ready').length,
        lowConfidence: filteredPartners.filter((row) => row.review_status === 'low_confidence').length,
        duplicates: filteredPartners.filter(
          (row) => row.review_status === 'duplicate_partner' || row.review_status === 'duplicate_lead',
        ).length,
        errors: filteredPartners.filter((row) => row.review_status === 'error').length,
      };
    }

    return {
      total: filteredLocations.length,
      ready: filteredLocations.filter((row) => row.review_status === 'ready').length,
      lowConfidence: 0,
      duplicates: filteredLocations.filter((row) => row.review_status === 'duplicate_location').length,
      errors: filteredLocations.filter((row) => row.review_status === 'error').length,
    };
  }, [activeTab, filteredLocations, filteredPartners]);

  const openPartnerDialog = (item: PartnerCrawlReviewItem) => {
    setSelectedPartner(item);
    setPartnerDraft(buildPartnerDraft(item));
  };

  const openLocationDialog = (item: LocationCrawlReviewItem) => {
    setSelectedLocation(item);
    setLocationDraft(buildLocationDraft(item));
  };

  const closePartnerDialog = () => {
    setSelectedPartner(null);
    setPartnerDraft(null);
  };

  const closeLocationDialog = () => {
    setSelectedLocation(null);
    setLocationDraft(null);
  };

  const savePartnerDraft = async (reclassifyAfterSave = false) => {
    if (!selectedPartner || !partnerDraft) {
      return;
    }

    try {
      const input = toPartnerUpdateInput(partnerDraft);
      await updatePartner.mutateAsync({ id: selectedPartner.id, input });

      if (reclassifyAfterSave) {
        await refreshPartner.mutateAsync(selectedPartner.id);
        toast.success('Đã lưu thay đổi và phân loại lại record crawl đối tác.');
        closePartnerDialog();
        return;
      }

      toast.success('Đã lưu thay đổi record crawl đối tác.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu record crawl đối tác.');
    }
  };

  const saveLocationDraft = async (reclassifyAfterSave = false) => {
    if (!selectedLocation || !locationDraft) {
      return;
    }

    try {
      const input = toLocationUpdateInput(locationDraft);
      await updateLocation.mutateAsync({ id: selectedLocation.id, input });

      if (reclassifyAfterSave) {
        await refreshLocation.mutateAsync(selectedLocation.id);
        toast.success('Đã lưu thay đổi và phân loại lại record crawl location.');
        closeLocationDialog();
        return;
      }

      toast.success('Đã lưu thay đổi record crawl location.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu record crawl location.');
    }
  };

  const handleRefreshPartner = async (item: PartnerCrawlReviewItem) => {
    try {
      await refreshPartner.mutateAsync(item.id);
      toast.success('Đã phân loại lại record crawl đối tác.');
      if (selectedPartner?.id === item.id) {
        closePartnerDialog();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể phân loại lại record crawl đối tác.');
    }
  };

  const handleRefreshLocation = async (item: LocationCrawlReviewItem) => {
    try {
      await refreshLocation.mutateAsync(item.id);
      toast.success('Đã phân loại lại record crawl location.');
      if (selectedLocation?.id === item.id) {
        closeLocationDialog();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể phân loại lại record crawl location.');
    }
  };

  const handlePromotePartner = async (item: PartnerCrawlReviewItem) => {
    try {
      await promotePartner.mutateAsync(item.id);
      toast.success('Đã promote record crawl đối tác vào hệ thống.');
      if (selectedPartner?.id === item.id) {
        closePartnerDialog();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể promote record crawl đối tác.');
    }
  };

  const handlePromoteLocation = async (item: LocationCrawlReviewItem) => {
    try {
      await promoteLocation.mutateAsync(item.id);
      toast.success('Đã promote record crawl location vào catalog.');
      if (selectedLocation?.id === item.id) {
        closeLocationDialog();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể promote record crawl location.');
    }
  };

  const handleRejectPartner = async (item: PartnerCrawlReviewItem) => {
    try {
      await rejectPartner.mutateAsync({ id: item.id });
      toast.success('Đã loại record crawl đối tác khỏi queue.');
      if (selectedPartner?.id === item.id) {
        closePartnerDialog();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể loại record crawl đối tác.');
    }
  };

  const handleRejectLocation = async (item: LocationCrawlReviewItem) => {
    try {
      await rejectLocation.mutateAsync({ id: item.id });
      toast.success('Đã loại record crawl location khỏi queue.');
      if (selectedLocation?.id === item.id) {
        closeLocationDialog();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể loại record crawl location.');
    }
  };
  const partnerColumns: ColumnDef<PartnerCrawlReviewItem>[] = [
    {
      id: 'company',
      header: 'Record crawl',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="min-w-[240px] space-y-1">
            <div className="font-medium text-slate-950">{item.company_name || 'Chưa có tên công ty'}</div>
            <div className="text-xs text-slate-500">
              {item.contact_name || item.email || item.phone || item.website || 'Thiếu thông tin liên hệ'}
            </div>
          </div>
        );
      },
    },
    {
      id: 'source',
      header: 'Nguồn',
      cell: ({ row }) => (
        <div className="min-w-[180px] space-y-1">
          <div className="font-medium text-slate-950">{row.original.source_name}</div>
          <div className="text-xs text-slate-500">{row.original.source_domain || row.original.source_type}</div>
        </div>
      ),
    },
    {
      id: 'service_area',
      header: 'Khu vực / category',
      cell: ({ row }) => (
        <div className="space-y-1 text-sm text-slate-600">
          <div>{row.original.service_area || row.original.address || 'Chưa rõ khu vực'}</div>
          <div className="text-xs text-slate-400">{row.original.service_category || 'Chưa gán category'}</div>
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
        <span className="text-sm text-slate-600">
          {row.original.crawl_confidence != null ? `${row.original.crawl_confidence}%` : 'N/A'}
        </span>
      ),
    },
    {
      id: 'created_at',
      header: 'Vào queue',
      cell: ({ row }) => <span className="text-sm text-slate-600">{formatDate(row.original.created_at)}</span>,
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => {
        const item = row.original;
        const canPromote = item.review_status === 'ready' || item.review_status === 'duplicate_lead';

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openPartnerDialog(item)}>
                <PencilLine className="mr-2 h-4 w-4" />
                Xem và chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleRefreshPartner(item)}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Phân loại lại
              </DropdownMenuItem>
              {canPromote ? (
                <DropdownMenuItem onClick={() => void handlePromotePartner(item)}>
                  <Sparkles className="mr-2 h-4 w-4 text-emerald-600" />
                  Promote
                </DropdownMenuItem>
              ) : null}
              {item.review_status !== 'imported' && item.review_status !== 'rejected' ? (
                <DropdownMenuItem onClick={() => void handleRejectPartner(item)}>
                  <ShieldX className="mr-2 h-4 w-4 text-rose-600" />
                  Loại khỏi queue
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const locationColumns: ColumnDef<LocationCrawlReviewItem>[] = [
    {
      id: 'location',
      header: 'Location crawl',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="min-w-[240px] space-y-1">
            <div className="font-medium text-slate-950">{item.location_name || 'Chưa có tên location'}</div>
            <div className="text-xs text-slate-500">{item.location_type || 'Chưa rõ loại location'}</div>
          </div>
        );
      },
    },
    {
      id: 'area',
      header: 'Khu vực',
      cell: ({ row }) => (
        <div className="text-sm text-slate-600">
          {[row.original.district, row.original.city].filter(Boolean).join(', ') || row.original.address || 'Chưa rõ khu vực'}
        </div>
      ),
    },
    {
      id: 'source',
      header: 'Nguồn',
      cell: ({ row }) => (
        <div className="min-w-[180px] space-y-1">
          <div className="font-medium text-slate-950">{row.original.source_name}</div>
          <div className="text-xs text-slate-500">{row.original.source_domain || row.original.source_type}</div>
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
        <span className="text-sm text-slate-600">
          {row.original.crawl_confidence != null ? `${row.original.crawl_confidence}%` : 'N/A'}
        </span>
      ),
    },
    {
      id: 'created_at',
      header: 'Vào queue',
      cell: ({ row }) => <span className="text-sm text-slate-600">{formatDate(row.original.created_at)}</span>,
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => {
        const item = row.original;
        const canPromote = item.review_status === 'ready' || item.review_status === 'duplicate_location';

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openLocationDialog(item)}>
                <PencilLine className="mr-2 h-4 w-4" />
                Xem và chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleRefreshLocation(item)}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Phân loại lại
              </DropdownMenuItem>
              {canPromote ? (
                <DropdownMenuItem onClick={() => void handlePromoteLocation(item)}>
                  <Sparkles className="mr-2 h-4 w-4 text-emerald-600" />
                  Promote
                </DropdownMenuItem>
              ) : null}
              {item.review_status !== 'imported' && item.review_status !== 'rejected' ? (
                <DropdownMenuItem onClick={() => void handleRejectLocation(item)}>
                  <ShieldX className="mr-2 h-4 w-4 text-rose-600" />
                  Loại khỏi queue
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const partnerPreviewPayload = useMemo(
    () => (partnerDraft ? buildPartnerCrawlIngestionUpdate(toPartnerUpdateInput(partnerDraft)).normalized_payload : {}),
    [partnerDraft],
  );
  const locationPreviewPayload = useMemo(
    () => (locationDraft ? buildLocationCrawlIngestionUpdate(toLocationUpdateInput(locationDraft)).normalized_payload : {}),
    [locationDraft],
  );

  const isLoading = isLoadingPartners || isLoadingLocations;
  const isPartnerMutating = updatePartner.isPending || promotePartner.isPending || rejectPartner.isPending || refreshPartner.isPending;
  const isLocationMutating = updateLocation.isPending || promoteLocation.isPending || rejectLocation.isPending || refreshLocation.isPending;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Duyệt crawl</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
            Rà soát queue crawl trước khi promote vào lead queue hoặc location catalog. Admin có thể chỉnh record ngay trong dialog, lưu lại, rồi mới phân loại lại hoặc promote.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Database className="h-4 w-4" />
          <span>{activeTab === 'partners' ? filteredPartners.length : filteredLocations.length} mục theo bộ lọc hiện tại</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReviewTab)}>
          <TabsList>
            <TabsTrigger value="partners">Partner Crawl</TabsTrigger>
            <TabsTrigger value="locations">Location Crawl</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ReviewStatusFilter)}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="ready">Sẵn sàng</SelectItem>
              {activeTab === 'partners' ? <SelectItem value="low_confidence">Cần review thêm</SelectItem> : null}
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
              <SelectItem value="error">Lỗi dữ liệu</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-[260px]">
              <SelectValue placeholder="Lọc theo nguồn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nguồn</SelectItem>
              {sourceOptions.map((sourceName) => (
                <SelectItem key={sourceName} value={sourceName}>{sourceName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <CrawlOperationsPanel entityType={activeTab === 'partners' ? 'partner' : 'location'} />

      <div className={`grid gap-4 ${activeTab === 'partners' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
        <SummaryCard label="Tổng mục" value={stats.total} tone="slate" />
        <SummaryCard label="Sẵn sàng" value={stats.ready} tone="emerald" />
        {activeTab === 'partners' ? <SummaryCard label="Low confidence" value={stats.lowConfidence} tone="violet" /> : null}
        <SummaryCard label="Trùng lặp" value={stats.duplicates} tone="amber" />
        <SummaryCard label="Lỗi dữ liệu" value={stats.errors} tone="rose" />
      </div>

      {activeTab === 'partners' ? (
        <DataTable
          key="partners"
          data={filteredPartners}
          columns={partnerColumns}
          searchPlaceholder="Tìm theo công ty, email, phone, website hoặc nguồn..."
          onSearch={setSearchTerm}
        />
      ) : (
        <DataTable
          key="locations"
          data={filteredLocations}
          columns={locationColumns}
          searchPlaceholder="Tìm theo tên location, city, district, địa chỉ hoặc nguồn..."
          onSearch={setSearchTerm}
        />
      )}
      <Dialog open={!!selectedPartner} onOpenChange={(open) => !open && closePartnerDialog()}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>{selectedPartner?.company_name || 'Record crawl đối tác'}</DialogTitle>
            <DialogDescription>
              Chỉnh trực tiếp dữ liệu đã crawl, lưu lại rồi mới phân loại lại hoặc promote để giảm lỗi dedupe.
            </DialogDescription>
          </DialogHeader>

          {selectedPartner && partnerDraft ? (
            <Tabs defaultValue="editor" className="space-y-4">
              <TabsList>
                <TabsTrigger value="editor">Chỉnh dữ liệu</TabsTrigger>
                <TabsTrigger value="debug">Payload debug</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <Card className="rounded-2xl border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Thông tin đối tác</CardTitle>
                      <CardDescription>Lưu xong, dùng nút “Lưu và phân loại lại” để cập nhật review status.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="partner-company-name">Tên công ty</Label>
                          <Input id="partner-company-name" value={partnerDraft.companyName} onChange={(event) => setPartnerDraft((current) => current ? { ...current, companyName: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="partner-contact-name">Người liên hệ</Label>
                          <Input id="partner-contact-name" value={partnerDraft.contactName} onChange={(event) => setPartnerDraft((current) => current ? { ...current, contactName: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="partner-email">Email</Label>
                          <Input id="partner-email" value={partnerDraft.email} onChange={(event) => setPartnerDraft((current) => current ? { ...current, email: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="partner-phone">Số điện thoại</Label>
                          <Input id="partner-phone" value={partnerDraft.phone} onChange={(event) => setPartnerDraft((current) => current ? { ...current, phone: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="partner-service-area">Khu vực phục vụ</Label>
                          <Input id="partner-service-area" value={partnerDraft.serviceArea} onChange={(event) => setPartnerDraft((current) => current ? { ...current, serviceArea: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="partner-service-category">Danh mục dịch vụ</Label>
                          <Input id="partner-service-category" value={partnerDraft.serviceCategory} onChange={(event) => setPartnerDraft((current) => current ? { ...current, serviceCategory: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="partner-address">Địa chỉ</Label>
                          <Input id="partner-address" value={partnerDraft.address} onChange={(event) => setPartnerDraft((current) => current ? { ...current, address: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="partner-website">Website</Label>
                          <Input id="partner-website" value={partnerDraft.website} onChange={(event) => setPartnerDraft((current) => current ? { ...current, website: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="partner-source-url">Source URL</Label>
                          <Input id="partner-source-url" value={partnerDraft.sourceUrl} onChange={(event) => setPartnerDraft((current) => current ? { ...current, sourceUrl: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="partner-external-id">External ID</Label>
                          <Input id="partner-external-id" value={partnerDraft.externalId} onChange={(event) => setPartnerDraft((current) => current ? { ...current, externalId: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="partner-confidence">Độ tin cậy</Label>
                          <Input id="partner-confidence" inputMode="decimal" value={partnerDraft.crawlConfidence} onChange={(event) => setPartnerDraft((current) => current ? { ...current, crawlConfidence: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="partner-notes">Ghi chú</Label>
                          <Textarea id="partner-notes" rows={5} value={partnerDraft.notes} onChange={(event) => setPartnerDraft((current) => current ? { ...current, notes: event.target.value } : current)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card className="rounded-2xl border shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">Tổng quan review</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        <MetadataRow label="Trạng thái" value={selectedPartner.review_status} />
                        <MetadataRow label="Nguồn" value={selectedPartner.source_name} />
                        <MetadataRow label="Dedupe key" value={selectedPartner.dedupe_key || 'Chưa có'} />
                        <MetadataRow label="Queue time" value={formatDate(selectedPartner.created_at)} />
                        <MetadataRow label="Reviewed at" value={formatDate(selectedPartner.reviewed_at)} />
                        <MetadataRow label="Match hiện tại" value={selectedPartner.matched_partner_name || selectedPartner.matched_partner_lead_name || 'Không có'} />
                        {selectedPartner.source_url ? (
                          <a href={selectedPartner.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                            Mở URL nguồn <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                      </CardContent>
                    </Card>

                    <JsonPanel title="Normalized preview sau khi lưu" payload={partnerPreviewPayload} />

                    {selectedPartner.import_error ? (
                      <Card className="rounded-2xl border border-rose-200 bg-rose-50 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base text-rose-700">Lỗi import gần nhất</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm leading-6 text-rose-700">{selectedPartner.import_error}</CardContent>
                      </Card>
                    ) : null}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="debug" className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-2">
                  <JsonPanel title="Normalized payload hiện tại" payload={selectedPartner.normalized_payload} />
                  <JsonPanel title="Raw payload gốc" payload={selectedPartner.raw_payload} />
                </div>
              </TabsContent>
            </Tabs>
          ) : null}

          <DialogFooter className="flex-wrap gap-2 sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={closePartnerDialog}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.currentTarget.blur();
                  }
                }}
              >
                Đóng
              </Button>
              <Button variant="outline" disabled={isPartnerMutating || !selectedPartner} onClick={() => selectedPartner && void handleRefreshPartner(selectedPartner)}>
                {refreshPartner.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Phân loại lại
              </Button>
              {selectedPartner && (selectedPartner.review_status === 'ready' || selectedPartner.review_status === 'duplicate_lead') ? (
                <Button variant="secondary" disabled={isPartnerMutating} onClick={() => void handlePromotePartner(selectedPartner)}>
                  {promotePartner.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Promote
                </Button>
              ) : null}
              {selectedPartner && selectedPartner.review_status !== 'imported' && selectedPartner.review_status !== 'rejected' ? (
                <Button variant="destructive" disabled={isPartnerMutating} onClick={() => void handleRejectPartner(selectedPartner)}>
                  {rejectPartner.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4" />}
                  Loại khỏi queue
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={isPartnerMutating || !partnerDraft} onClick={() => void savePartnerDraft(false)}>
                {updatePartner.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu thay đổi
              </Button>
              <Button disabled={isPartnerMutating || !partnerDraft} onClick={() => void savePartnerDraft(true)}>
                {updatePartner.isPending || refreshPartner.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Lưu và phân loại lại
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!selectedLocation} onOpenChange={(open) => !open && closeLocationDialog()}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>{selectedLocation?.location_name || 'Record crawl location'}</DialogTitle>
            <DialogDescription>
              Chỉnh dữ liệu location trước khi promote vào <code>location_catalog</code>. Luồng này phù hợp để sửa city, district, lat/lng và tags ngay trong queue.
            </DialogDescription>
          </DialogHeader>

          {selectedLocation && locationDraft ? (
            <Tabs defaultValue="editor" className="space-y-4">
              <TabsList>
                <TabsTrigger value="editor">Chỉnh dữ liệu</TabsTrigger>
                <TabsTrigger value="debug">Payload debug</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <Card className="rounded-2xl border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Thông tin location</CardTitle>
                      <CardDescription>Lưu xong, dùng “Lưu và phân loại lại” để cập nhật dedupe và review status.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="location-name">Tên location</Label>
                          <Input id="location-name" value={locationDraft.locationName} onChange={(event) => setLocationDraft((current) => current ? { ...current, locationName: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location-type">Loại location</Label>
                          <Select value={locationDraft.locationType || '__empty__'} onValueChange={(value) => setLocationDraft((current) => current ? { ...current, locationType: value === '__empty__' ? '' : value as LocationCatalogType } : current)}>
                            <SelectTrigger id="location-type">
                              <SelectValue placeholder="Chọn loại location" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__empty__">Chưa gán</SelectItem>
                              {LOCATION_TYPES.map((locationType) => (
                                <SelectItem key={locationType} value={locationType}>{getLocationTypeLabel(locationType)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location-confidence">Độ tin cậy</Label>
                          <Input id="location-confidence" inputMode="decimal" value={locationDraft.crawlConfidence} onChange={(event) => setLocationDraft((current) => current ? { ...current, crawlConfidence: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location-city">City</Label>
                          <Input id="location-city" value={locationDraft.city} onChange={(event) => setLocationDraft((current) => current ? { ...current, city: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location-district">District</Label>
                          <Input id="location-district" value={locationDraft.district} onChange={(event) => setLocationDraft((current) => current ? { ...current, district: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="location-address">Địa chỉ</Label>
                          <Input id="location-address" value={locationDraft.address} onChange={(event) => setLocationDraft((current) => current ? { ...current, address: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location-latitude">Latitude</Label>
                          <Input id="location-latitude" inputMode="decimal" value={locationDraft.latitude} onChange={(event) => setLocationDraft((current) => current ? { ...current, latitude: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location-longitude">Longitude</Label>
                          <Input id="location-longitude" inputMode="decimal" value={locationDraft.longitude} onChange={(event) => setLocationDraft((current) => current ? { ...current, longitude: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="location-tags">Tags</Label>
                          <Input id="location-tags" value={locationDraft.tags} onChange={(event) => setLocationDraft((current) => current ? { ...current, tags: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location-source-url">Source URL</Label>
                          <Input id="location-source-url" value={locationDraft.sourceUrl} onChange={(event) => setLocationDraft((current) => current ? { ...current, sourceUrl: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location-external-id">External ID</Label>
                          <Input id="location-external-id" value={locationDraft.externalId} onChange={(event) => setLocationDraft((current) => current ? { ...current, externalId: event.target.value } : current)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="location-notes">Ghi chú</Label>
                          <Textarea id="location-notes" rows={5} value={locationDraft.notes} onChange={(event) => setLocationDraft((current) => current ? { ...current, notes: event.target.value } : current)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card className="rounded-2xl border shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">Tổng quan review</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        <MetadataRow label="Trạng thái" value={selectedLocation.review_status} />
                        <MetadataRow label="Nguồn" value={selectedLocation.source_name} />
                        <MetadataRow label="Dedupe key" value={selectedLocation.dedupe_key || 'Chưa có'} />
                        <MetadataRow label="Queue time" value={formatDate(selectedLocation.created_at)} />
                        <MetadataRow label="Reviewed at" value={formatDate(selectedLocation.reviewed_at)} />
                        <MetadataRow label="Match hiện tại" value={selectedLocation.matched_location_name || 'Không có'} />
                        {selectedLocation.source_url ? (
                          <a href={selectedLocation.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                            Mở URL nguồn <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                      </CardContent>
                    </Card>

                    <JsonPanel title="Normalized preview sau khi lưu" payload={locationPreviewPayload} />

                    {selectedLocation.import_error ? (
                      <Card className="rounded-2xl border border-rose-200 bg-rose-50 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base text-rose-700">Lỗi import gần nhất</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm leading-6 text-rose-700">{selectedLocation.import_error}</CardContent>
                      </Card>
                    ) : null}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="debug" className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-2">
                  <JsonPanel title="Normalized payload hiện tại" payload={selectedLocation.normalized_payload} />
                  <JsonPanel title="Raw payload gốc" payload={selectedLocation.raw_payload} />
                </div>
              </TabsContent>
            </Tabs>
          ) : null}

          <DialogFooter className="flex-wrap gap-2 sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={closeLocationDialog}>Đóng</Button>
              <Button variant="outline" disabled={isLocationMutating || !selectedLocation} onClick={() => selectedLocation && void handleRefreshLocation(selectedLocation)}>
                {refreshLocation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Phân loại lại
              </Button>
              {selectedLocation && (selectedLocation.review_status === 'ready' || selectedLocation.review_status === 'duplicate_location') ? (
                <Button variant="secondary" disabled={isLocationMutating} onClick={() => void handlePromoteLocation(selectedLocation)}>
                  {promoteLocation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Promote
                </Button>
              ) : null}
              {selectedLocation && selectedLocation.review_status !== 'imported' && selectedLocation.review_status !== 'rejected' ? (
                <Button variant="destructive" disabled={isLocationMutating} onClick={() => void handleRejectLocation(selectedLocation)}>
                  {rejectLocation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4" />}
                  Loại khỏi queue
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={isLocationMutating || !locationDraft} onClick={() => void saveLocationDraft(false)}>
                {updateLocation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu thay đổi
              </Button>
              <Button disabled={isLocationMutating || !locationDraft} onClick={() => void saveLocationDraft(true)}>
                {updateLocation.isPending || refreshLocation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Lưu và phân loại lại
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
