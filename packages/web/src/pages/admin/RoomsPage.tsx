import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  CheckCircle,
  Clock,
  Edit3,
  Eye,
  Home,
  Loader2,
  MoreVertical,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import { RejectionDialog } from '@/components/admin/RejectionDialog';
import { RoomEditorDrawer } from '@/components/admin/RoomEditorDrawer';
import { StatsCard } from '@/components/admin/StatsCard';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  adminKeys,
  useAdminRooms,
  useApproveRoom,
  useDeleteRoom,
  useRejectRoom,
} from '@/hooks/useAdmin';
import type { AdminRoom } from '@/services/admin';
import * as adminService from '@/services/admin';

function getStatusBadge(status: string | null) {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-100 text-emerald-700">Đang hoạt động</Badge>;
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-700">Chờ duyệt</Badge>;
    case 'inactive':
      return <Badge className="bg-rose-100 text-rose-700">Tạm tắt</Badge>;
    case 'rented':
      return <Badge className="bg-sky-100 text-sky-700">Đã cho thuê</Badge>;
    default:
      return <Badge className="bg-slate-100 text-slate-700">Nháp</Badge>;
  }
}

export default function RoomsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: rooms = [], isLoading, error, refetch } = useAdminRooms();
  const approveMutation = useApproveRoom();
  const rejectMutation = useRejectRoom();
  const deleteMutation = useDeleteRoom();

  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'verified'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedRoomForReject, setSelectedRoomForReject] = useState<AdminRoom | null>(null);
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState<AdminRoom | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    const focusId = searchParams.get('focus');
    if (!focusId || rooms.length === 0 || selectedRoomForEdit) {
      return;
    }

    const match = rooms.find((room) => room.id === focusId);
    if (!match) {
      return;
    }

    setSelectedRoomForEdit(match);
    setEditorOpen(true);
  }, [rooms, searchParams, selectedRoomForEdit]);

  const stats = useMemo(
    () => ({
      total: rooms.length,
      active: rooms.filter((room) => room.status === 'active').length,
      pending: rooms.filter((room) => room.status === 'pending').length,
      verified: rooms.filter((room) => room.is_verified).length,
    }),
    [rooms],
  );

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const haystack = [room.title, room.address, room.district, room.city, room.landlord?.full_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = haystack.includes(normalizedSearch);
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'active'
            ? room.status === 'active'
            : filter === 'pending'
              ? room.status === 'pending'
              : room.is_verified;

      return matchesSearch && matchesFilter;
    });
  }, [filter, rooms, searchTerm]);

  const openEditor = useCallback((room: AdminRoom) => {
    setSelectedRoomForEdit(room);
    setEditorOpen(true);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('focus', room.id);
      return next;
    });
  }, [setSearchParams]);

  const closeEditor = (open: boolean) => {
    setEditorOpen(open);
    if (!open) {
      setSelectedRoomForEdit(null);
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('focus');
        return next;
      });
    }
  };

  const handleApprove = useCallback(async (roomId: string) => {
    await approveMutation.mutateAsync(roomId);
  }, [approveMutation]);

  const handleDelete = useCallback(async (roomId: string) => {
    await deleteMutation.mutateAsync(roomId);
  }, [deleteMutation]);

  const handleRejectWithReason = async (reason: string) => {
    if (!selectedRoomForReject) {
      return;
    }

    await rejectMutation.mutateAsync({ roomId: selectedRoomForReject.id, reason });
    setSelectedRoomForReject(null);
  };

  const handlePrefetchRoom = useCallback((roomId: string) => {
    queryClient.prefetchQuery({
      queryKey: adminKeys.rooms.detail(roomId),
      queryFn: () => adminService.getAdminRooms().then((data) => data.find((room) => room.id === roomId)),
    });
  }, [queryClient]);

  const columns = useMemo<ColumnDef<AdminRoom>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Phòng',
        cell: ({ row }) => {
          const room = row.original;
          return (
            <div className="flex min-w-[280px] items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                <ImageWithFallback
                  src={room.images?.[0]?.image_url || ''}
                  alt={room.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-950">{room.title}</p>
                <p className="truncate text-sm text-slate-500">
                  {[room.district, room.city].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'price_per_month',
        header: 'Giá',
        cell: ({ row }) => {
          const value = row.original.price_per_month;
          return (
            <span className="font-semibold text-slate-900">
              {value ? `${(Number(value) / 1_000_000).toFixed(1)}tr/tháng` : '-'}
            </span>
          );
        },
      },
      {
        id: 'owner',
        header: 'Chủ nhà',
        cell: ({ row }) => {
          const room = row.original;
          return (
            <div className="min-w-[180px]">
              <p className="font-medium text-slate-800">{room.landlord?.full_name || 'Chưa rõ'}</p>
              <p className="text-xs text-slate-500">{room.landlord?.email || room.landlord_id}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => {
          const room = row.original;
          return (
            <div className="flex items-center gap-2">
              {getStatusBadge(room.status)}
              {room.is_verified ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> : null}
            </div>
          );
        },
      },
      {
        id: 'stats',
        header: 'Tương tác',
        cell: ({ row }) => {
          const room = row.original;
          return (
            <div className="text-sm text-slate-500">
              <p>{room.view_count || 0} lượt xem</p>
              <p>{room.favorite_count || 0} lượt thích</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Ngày đăng',
        cell: ({ row }) => (
          <span className="text-sm text-slate-500">
            {row.original.created_at
              ? new Date(row.original.created_at).toLocaleDateString('vi-VN')
              : '-'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
          const room = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditor(room)}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Sửa phòng
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate(`/room/${room.id}`)}
                  onMouseEnter={() => handlePrefetchRoom(room.id)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Xem chi tiết
                </DropdownMenuItem>
                {room.status === 'pending' ? (
                  <>
                    <DropdownMenuItem onClick={() => void handleApprove(room.id)}>
                      <Check className="mr-2 h-4 w-4" />
                      Phê duyệt
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSelectedRoomForReject(room);
                      setRejectionDialogOpen(true);
                    }}>
                      <X className="mr-2 h-4 w-4" />
                      Từ chối
                    </DropdownMenuItem>
                  </>
                ) : null}
                {room.status === 'inactive' ? (
                  <DropdownMenuItem onClick={() => void handleApprove(room.id)}>
                    <Check className="mr-2 h-4 w-4" />
                    Kích hoạt lại
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem className="text-rose-600" onClick={() => void handleDelete(room.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleApprove, handleDelete, handlePrefetchRoom, navigate, openEditor],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Quản lý phòng trọ</h1>
            <p className="mt-1 text-sm text-slate-500">
              Admin có thể duyệt, sửa toàn bộ listing và xử lý các issue chất lượng dữ liệu từ cùng một lane.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full border-slate-200">
            <Link to="/admin/data-quality">
              <AlertCircle className="h-4 w-4" />
              Mở data quality
            </Link>
          </Button>
        </div>

        {error ? (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
            <p className="text-sm text-rose-700">{error.message}</p>
            <Button variant="outline" size="sm" className="ml-auto rounded-full" onClick={() => void refetch()}>
              Thử lại
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard title="Tổng phòng" value={stats.total} icon={Home} variant="default" />
          <StatsCard title="Đang hoạt động" value={stats.active} icon={CheckCircle} variant="success" />
          <StatsCard title="Chờ duyệt" value={stats.pending} icon={Clock} variant="warning" />
          <StatsCard title="Đã xác thực" value={stats.verified} icon={Star} variant="info" />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Select value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="verified">Đã xác thực</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          data={filteredRooms}
          columns={columns}
          searchPlaceholder="Tìm theo tiêu đề, địa chỉ hoặc chủ nhà..."
          onSearch={setSearchTerm}
          pageSize={15}
        />
      </div>

      <RoomEditorDrawer room={selectedRoomForEdit} open={editorOpen} onOpenChange={closeEditor} />

      <RejectionDialog
        open={rejectionDialogOpen}
        onOpenChange={setRejectionDialogOpen}
        onConfirm={handleRejectWithReason}
        type="room"
        itemName={selectedRoomForReject?.title}
      />
    </>
  );
}



