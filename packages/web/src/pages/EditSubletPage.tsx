/**
 * EditSubletPage
 * Edit an existing short-stay listing.
 */

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Home,
  Loader2,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts';
import { useSublet, useUpdateSublet } from '@/hooks/useSublets';
import { toast } from 'sonner';

export default function EditSubletPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { data: sublet, isLoading, error } = useSublet(id);
  const updateSublet = useUpdateSublet();

  const [formData, setFormData] = useState({
    description: '',
    sublet_price: 0,
    start_date: '',
    end_date: '',
    status: 'active' as 'active' | 'cancelled',
  });
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!sublet) {
      return;
    }

    setFormData({
      description: sublet.description || '',
      sublet_price: sublet.sublet_price || 0,
      start_date: sublet.start_date || '',
      end_date: sublet.end_date || '',
      status: (sublet.status as 'active' | 'cancelled') || 'active',
    });
  }, [sublet]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!id || !user) {
      toast.error('Không thể cập nhật chỗ ở ngắn hạn.');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error('Vui lòng chọn ngày bắt đầu và ngày kết thúc.');
      return;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);

    if (endDate <= startDate) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }

    if (formData.sublet_price <= 0) {
      toast.error('Vui lòng nhập mức giá hợp lệ.');
      return;
    }

    try {
      await updateSublet.mutateAsync({
        id,
        updates: {
          description: formData.description,
          sublet_price: formData.sublet_price,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status,
        },
      });

      setIsSuccess(true);
      toast.success('Đã cập nhật chỗ ở thành công.');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Không thể cập nhật chỗ ở ngắn hạn.';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang tải dữ liệu chỗ ở ngắn hạn...</p>
        </div>
      </div>
    );
  }

  if (error || !sublet) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md border-none shadow-lg">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <Home className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="mb-2 text-xl font-bold">Không tìm thấy chỗ ở ngắn hạn</h2>
            <p className="mb-8 text-muted-foreground">{error instanceof Error ? error.message : 'Chỗ ở ngắn hạn này không tồn tại hoặc đã bị gỡ.'}</p>
            <Button onClick={() => navigate('/my-sublets')} className="h-12 w-full max-w-xs rounded-xl">
              Quay về chỗ ở của tôi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sublet.owner_id !== user?.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md border-none shadow-lg">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <Home className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="mb-2 text-xl font-bold">Bạn không có quyền truy cập</h2>
            <p className="mb-8 text-muted-foreground">Listing này không thuộc tài khoản của bạn.</p>
            <Button onClick={() => navigate('/my-sublets')} className="h-12 w-full max-w-xs rounded-xl">
              Quay về chỗ ở của tôi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 animate-fade-in">
        <Card className="w-full max-w-md border-none shadow-lg">
          <CardContent className="pt-12 pb-10 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 animate-scale-in items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Đã cập nhật thành công</h2>

            <div className="mb-6 rounded-xl border border-warning/20 bg-warning/5 p-5 text-left shadow-sm">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <div>
                  <p className="text-sm font-semibold text-warning-foreground">Chỗ ở đã được lưu thay đổi</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Những thông tin mới sẽ xuất hiện ngay trong mục ở ngắn hạn và trên trang chi tiết chỗ ở.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button variant="outline" className="h-12 w-full rounded-xl border-primary/20 text-primary hover:bg-primary/5" onClick={() => navigate('/my-sublets')}>
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span>Quản lý chỗ ở của tôi</span>
                </div>
              </Button>
              <Button className="h-12 w-full rounded-xl shadow-lg shadow-primary/20" onClick={() => navigate(`/sublet/${id}`)}>
                <span>Xem chi tiết chỗ ở</span>
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm transition-all">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                navigate(-1);
              }
            }}
            className="rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold">
              <Edit className="h-4 w-4 text-primary" />
              Chỉnh sửa chỗ ở ngắn hạn
            </h1>
            <p className="text-sm text-muted-foreground">{sublet.room?.title || 'Chỗ ở ngắn hạn'}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card className="shadow-sm">
          <CardContent className="space-y-6 p-6">
            <div className="rounded-lg bg-muted/50 p-4">
              <h3 className="mb-2 font-medium">Thông tin chỗ ở gốc</h3>
              <p className="text-sm text-muted-foreground">{sublet.room?.title}</p>
              <p className="text-sm text-muted-foreground">{sublet.room?.address}, {sublet.room?.district}, {sublet.room?.city}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Mô tả thêm
              </Label>
              <Textarea
                id="description"
                placeholder="Nói rõ điều kiện ở, thời gian linh hoạt, chi phí phát sinh hoặc lưu ý cần trao đổi thêm."
                value={formData.description}
                onChange={(event) => handleInputChange('description', event.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Giá ở ngắn hạn (VNĐ/tháng) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={formData.sublet_price}
                onChange={(event) => handleInputChange('sublet_price', parseInt(event.target.value, 10) || 0)}
              />
              <p className="text-xs text-muted-foreground">Giá gốc: {sublet.original_price?.toLocaleString('vi-VN')} VNĐ/tháng</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.start_date}
                  onChange={(event) => handleInputChange('start_date', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ngày kết thúc <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.end_date}
                  onChange={(event) => handleInputChange('end_date', event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái chỗ ở</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(event) => handleInputChange('status', event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="active">Đang hoạt động</option>
                <option value="cancelled">Đã kết thúc</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={updateSublet.isPending} className="flex-1 bg-primary hover:bg-primary/90">
                {updateSublet.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : 'Lưu thay đổi'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
