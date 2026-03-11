import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ExternalLink,
  Loader2,
  MapPin,
  PencilLine,
  RefreshCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatLocationCatalogSubtitle, formatLocationTypeLabel } from '@/services/locations';
import { geocodeRoomLocation } from '@/services/mapboxGeocoding';
import {
  type AdminLocation,
  type AdminLocationStatus,
  type AdminLocationType,
  type AdminLocationUpdateDraft,
} from '@/services/adminLocations';
import {
  useAdminLocations,
  useToggleAdminLocationStatus,
  useUpdateAdminLocation,
} from '@/hooks/useAdminLocations';

const LOCATION_TYPES: AdminLocationType[] = [
  'university',
  'district',
  'neighborhood',
  'poi',
  'campus',
  'station',
  'landmark',
];

function buildDraft(location: AdminLocation): AdminLocationUpdateDraft {
  return {
    name: location.name,
    location_type: location.location_type,
    city: location.city ?? '',
    district: location.district ?? '',
    address: location.address ?? '',
    latitude: location.latitude?.toString() ?? '',
    longitude: location.longitude?.toString() ?? '',
    source_name: location.source_name ?? '',
    source_url: location.source_url ?? '',
    tags: location.tags.join(', '),
    status: location.status,
  };
}

function formatUpdatedAt(value: string) {
  return new Date(value).toLocaleString('vi-VN');
}

function isValidCoordinate(latitude: number | null, longitude: number | null) {
  return latitude !== null && longitude !== null;
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <Card className="rounded-2xl border-none shadow-soft">
      <CardHeader className="pb-3">
        <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-950">{value}</div>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function LocationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: locations = [], isLoading, error } = useAdminLocations();
  const updateLocation = useUpdateAdminLocation();
  const toggleLocationStatus = useToggleAdminLocationStatus();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminLocationStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | AdminLocationType>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<AdminLocation | null>(null);
  const [draft, setDraft] = useState<AdminLocationUpdateDraft | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      const haystack = [
        location.name,
        location.city,
        location.district,
        location.address,
        location.source_name,
        location.tags.join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = haystack.includes(searchTerm.trim().toLowerCase());
      const matchesStatus = statusFilter === 'all' || location.status === statusFilter;
      const matchesType = typeFilter === 'all' || location.location_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [locations, searchTerm, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const active = locations.filter((location) => location.status === 'active').length;
    const missingArea = locations.filter((location) => !location.city || !location.district).length;
    const missingCoordinates = locations.filter(
      (location) => !isValidCoordinate(location.latitude, location.longitude),
    ).length;

    return {
      total: locations.length,
      active,
      missingArea,
      missingCoordinates,
    };
  }, [locations]);

  useEffect(() => {
    const focusId = searchParams.get('focus');
    if (!focusId || locations.length === 0 || selectedLocation) {
      return;
    }

    const match = locations.find((location) => location.id === focusId);
    if (!match) {
      return;
    }

    setSelectedLocation(match);
    setDraft(buildDraft(match));
    setEditorOpen(true);
  }, [locations, searchParams, selectedLocation]);

  const openEditor = useCallback((location: AdminLocation) => {
    setSelectedLocation(location);
    setDraft(buildDraft(location));
    setEditorOpen(true);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('focus', location.id);
      return next;
    });
  }, [setSearchParams]);

  const closeEditor = useCallback((open: boolean) => {
    setEditorOpen(open);
    if (!open) {
      setSelectedLocation(null);
      setDraft(null);
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('focus');
        return next;
      });
    }
  }, [setSearchParams]);

  const updateDraftField = <K extends keyof AdminLocationUpdateDraft>(
    field: K,
    value: AdminLocationUpdateDraft[K],
  ) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleGeocode = async () => {
    if (!draft) {
      return;
    }

    setIsGeocoding(true);
    try {
      const result = await geocodeRoomLocation({
        address: draft.address.trim() || draft.name.trim(),
        district: draft.district,
        city: draft.city,
      });

      if (!result) {
        toast.error('Không tìm thấy tọa độ phù hợp cho location này');
        return;
      }

      setDraft((current) =>
        current
          ? {
              ...current,
              city: result.city ?? current.city,
              district: result.district ?? current.district,
              latitude: result.latitude.toString(),
              longitude: result.longitude.toString(),
            }
          : current,
      );
      toast.success('Đã geocode lại location');
    } catch (geocodeError) {
      toast.error(
        geocodeError instanceof Error ? geocodeError.message : 'Không thể geocode location',
      );
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSave = async () => {
    if (!selectedLocation || !draft) {
      return;
    }

    if (!draft.name.trim()) {
      toast.error('Tên location không được để trống');
      return;
    }

    await updateLocation.mutateAsync({
      id: selectedLocation.id,
      draft,
    });

    closeEditor(false);
  };

  const handleToggleStatus = useCallback(async (location: AdminLocation) => {
    const nextStatus: AdminLocationStatus = location.status === 'active' ? 'inactive' : 'active';
    await toggleLocationStatus.mutateAsync({ id: location.id, nextStatus });
  }, [toggleLocationStatus]);

  const columns = useMemo<ColumnDef<AdminLocation>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Location',
        cell: ({ row }) => {
          const location = row.original;
          return (
            <div className="min-w-[260px]">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-950">{location.name}</p>
                <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-600">
                  {formatLocationTypeLabel(location.location_type)}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {formatLocationCatalogSubtitle(location)}
              </p>
            </div>
          );
        },
      },
      {
        id: 'source',
        header: 'Nguồn',
        cell: ({ row }) => {
          const location = row.original;
          return (
            <div className="min-w-[180px]">
              <p className="font-medium text-slate-800">{location.source_name ?? 'Thủ công / seed'}</p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                {location.source_url ?? 'Không có source URL'}
              </p>
            </div>
          );
        },
      },
      {
        id: 'quality',
        header: 'Tình trạng',
        cell: ({ row }) => {
          const location = row.original;
          const hasAreaGap = !location.city || !location.district;
          const hasCoordinateGap = !isValidCoordinate(location.latitude, location.longitude);

          return (
            <div className="flex flex-wrap gap-2">
              <Badge
                className={
                  location.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-700'
                }
              >
                {location.status === 'active' ? 'Đang hoạt động' : 'Đã tắt'}
              </Badge>
              {hasAreaGap ? (
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                  Thiếu khu vực
                </Badge>
              ) : null}
              {hasCoordinateGap ? (
                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                  Thiếu tọa độ
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: 'updated_at',
        header: 'Cập nhật',
        cell: ({ row }) => (
          <span className="text-sm text-slate-500">{formatUpdatedAt(row.original.updated_at)}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
          const location = row.original;
          const isToggling =
            toggleLocationStatus.isPending && toggleLocationStatus.variables?.id === location.id;

          return (
            <div className="flex flex-wrap justify-end gap-2">
              <Button size="sm" variant="outline" className="rounded-full border-slate-200" onClick={() => openEditor(location)}>
                <PencilLine className="h-4 w-4" />
                Sửa
              </Button>
              {location.source_url ? (
                <Button asChild size="sm" variant="outline" className="rounded-full border-slate-200">
                  <a href={location.source_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Nguồn
                  </a>
                </Button>
              ) : null}
              <Button
                size="sm"
                className="rounded-full"
                variant={location.status === 'active' ? 'secondary' : 'default'}
                disabled={isToggling}
                onClick={() => void handleToggleStatus(location)}
              >
                {isToggling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {location.status === 'active' ? 'Tắt' : 'Kích hoạt'}
              </Button>
            </div>
          );
        },
      },
    ],
    [handleToggleStatus, openEditor, toggleLocationStatus.isPending, toggleLocationStatus.variables],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-[28px] border-none shadow-soft">
        <CardContent className="py-14 text-center">
          <p className="text-lg font-semibold text-slate-950">Không tải được lane location</p>
          <p className="mt-2 text-sm text-slate-500">
            {error instanceof Error ? error.message : 'Đã có lỗi khi tải location catalog.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Quản lý location catalog</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
              Quản lý trực tiếp dữ liệu đã publish trong <code>location_catalog</code>. Từ đây admin
              có thể sửa area context, source, tọa độ và trạng thái mà không phải quay lại review
              queue.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-full border-slate-200">
              <Link to="/admin/data-quality">
                <Sparkles className="h-4 w-4" />
                Quay lại data quality
              </Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link to="/admin/ingestion-review">
                <Search className="h-4 w-4" />
                Mở review queue
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Tổng location" value={stats.total} description="Tổng số record đã publish trong catalog." />
          <SummaryCard title="Đang hoạt động" value={stats.active} description="Record đang được dùng cho search, nearby places và local passport." />
          <SummaryCard title="Thiếu area" value={stats.missingArea} description="Thiếu city hoặc district, dễ làm giảm chất lượng search theo khu vực." />
          <SummaryCard title="Thiếu tọa độ" value={stats.missingCoordinates} description="Cần geocode lại để map và nearby places hoạt động ổn định." />
        </div>

        <Card className="rounded-[26px] border-none shadow-soft">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-950">Danh sách location catalog</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-slate-500">
                Tìm theo tên, nguồn, tags hoặc khu vực. Bấm sửa để mở form quản lý chi tiết.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | AdminLocationStatus)}>
                <SelectTrigger className="w-[180px] rounded-full border-slate-200">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Đã tắt</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as 'all' | AdminLocationType)}>
                <SelectTrigger className="w-[200px] rounded-full border-slate-200">
                  <SelectValue placeholder="Tất cả loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  {LOCATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatLocationTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <DataTable
              data={filteredLocations}
              columns={columns}
              searchPlaceholder="Tìm location theo tên, nguồn hoặc khu vực..."
              onSearch={setSearchTerm}
              pageSize={12}
            />
          </CardContent>
        </Card>
      </div>

      <Drawer direction="right" open={editorOpen} onOpenChange={closeEditor}>
        <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-[720px]">
          <DrawerHeader className="border-b border-slate-100 px-6 py-5">
            <DrawerTitle className="text-xl font-semibold text-slate-950">Chỉnh sửa location</DrawerTitle>
            <DrawerDescription className="text-sm leading-6 text-slate-500">
              Cập nhật location đã publish để search, nearby places và local passport dùng dữ liệu
              đúng hơn.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {draft ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location-name">Tên location</Label>
                    <Input
                      id="location-name"
                      value={draft.name}
                      onChange={(event) => updateDraftField('name', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-type">Loại location</Label>
                    <Select
                      value={draft.location_type}
                      onValueChange={(value) => updateDraftField('location_type', value as AdminLocationType)}
                    >
                      <SelectTrigger id="location-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {formatLocationTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location-city">City</Label>
                    <Input
                      id="location-city"
                      value={draft.city}
                      onChange={(event) => updateDraftField('city', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-district">District</Label>
                    <Input
                      id="location-district"
                      value={draft.district}
                      onChange={(event) => updateDraftField('district', event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location-address">Địa chỉ</Label>
                  <Input
                    id="location-address"
                    value={draft.address}
                    onChange={(event) => updateDraftField('address', event.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location-latitude">Latitude</Label>
                    <Input
                      id="location-latitude"
                      value={draft.latitude}
                      onChange={(event) => updateDraftField('latitude', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-longitude">Longitude</Label>
                    <Input
                      id="location-longitude"
                      value={draft.longitude}
                      onChange={(event) => updateDraftField('longitude', event.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location-source-name">Source name</Label>
                    <Input
                      id="location-source-name"
                      value={draft.source_name}
                      onChange={(event) => updateDraftField('source_name', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-status">Trạng thái</Label>
                    <Select
                      value={draft.status}
                      onValueChange={(value) => updateDraftField('status', value as AdminLocationStatus)}
                    >
                      <SelectTrigger id="location-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Đang hoạt động</SelectItem>
                        <SelectItem value="inactive">Đã tắt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location-source-url">Source URL</Label>
                  <Input
                    id="location-source-url"
                    value={draft.source_url}
                    onChange={(event) => updateDraftField('source_url', event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location-tags">Tags</Label>
                  <Input
                    id="location-tags"
                    value={draft.tags}
                    onChange={(event) => updateDraftField('tags', event.target.value)}
                    placeholder="university, engineering, hanoi"
                  />
                </div>

                <Card className="rounded-2xl border border-slate-200 shadow-none">
                  <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-950">Geocode lại location</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Dùng địa chỉ, district và city hiện tại để lấy lại tọa độ chính xác hơn.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-slate-200"
                      disabled={isGeocoding}
                      onClick={() => void handleGeocode()}
                    >
                      {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                      Geocode lại
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>

          <DrawerFooter className="border-t border-slate-100 px-6 py-5 sm:flex-row sm:justify-end">
            <DrawerClose asChild>
              <Button variant="outline" className="rounded-full border-slate-200">
                Đóng
              </Button>
            </DrawerClose>
            <Button
              className="rounded-full"
              disabled={updateLocation.isPending || !draft}
              onClick={() => void handleSave()}
            >
              {updateLocation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              Lưu thay đổi
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
