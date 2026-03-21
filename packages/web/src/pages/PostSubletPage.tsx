/**
 * PostSubletPage
 * 2-step form for users to create a short-stay listing.
 * All state and logic lives in usePostSubletForm hook.
 */

import { useRef, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle,
  DollarSign,
  Home,
  ImagePlus,
  Info,
  Loader2,
  MapPin,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_FILE_SIZE_MB,
  MAX_IMAGES,
  ROOM_TYPES,
  usePostSubletForm,
} from '@/hooks/usePostSubletForm';

export default function PostSubletPage() {
  const form = usePostSubletForm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    form.processFiles(Array.from(event.target.files || []));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    form.processFiles(Array.from(event.dataTransfer.files));
  };

  const handleUploadZoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (form.selectedFiles.length >= MAX_IMAGES) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  if (!form.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-none shadow-lg">
          <CardContent className="py-16 text-center">
            <Home className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-bold">Vui lòng đăng nhập</h2>
            <p className="mb-6 text-muted-foreground">
              Bạn cần đăng nhập để đăng tin ở ngắn hạn.
            </p>
            <Button onClick={() => form.navigate('/login')} className="rounded-xl">
              Đăng nhập ngay
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (form.isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 animate-fade-in">
        <Card className="w-full max-w-md border-none shadow-lg">
          <CardContent className="pt-12 pb-10 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 animate-scale-in items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Đăng tin thành công</h2>
            <p className="mb-8 text-muted-foreground">
              Tin ở ngắn hạn đã xuất hiện trong mục <strong>"Chỗ ở ngắn hạn của tôi"</strong>.
              Bạn có thể quay lại để xem đơn quan tâm hoặc chỉnh sửa thời gian ở.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="h-12 w-full rounded-xl"
                onClick={() => form.navigate('/my-sublets')}
              >
                Chỗ ở ngắn hạn của tôi
              </Button>
              <Button
                className="h-12 w-full rounded-xl shadow-lg shadow-primary/20"
                onClick={() => form.navigate('/swap')}
              >
                Khám phá ở ngắn hạn
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div lang="vi" className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <Button variant="ghost" size="icon" onClick={form.handleBack} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Đăng chỗ ở ngắn hạn</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Bước {form.step} / 2</span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <span>{form.step === 1 ? 'Thông tin chỗ ở' : 'Thiết lập thời gian ở'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 flex gap-2">
          {[1, 2].map((stepNumber) => (
            <div
              key={stepNumber}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                stepNumber <= form.step
                  ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {form.step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Thông tin chỗ ở
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label htmlFor="title">
                    Tiêu đề <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="VD: Phòng trọ Q.Bình Thạnh gần ĐH Hutech"
                    value={form.roomData.title}
                    onChange={(event) => form.handleRoomChange('title', event.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="address">
                    Địa chỉ <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="Số nhà, đường, phường"
                    value={form.roomData.address}
                    onChange={(event) => form.handleRoomChange('address', event.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>
                      Tỉnh/Thành phố <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.roomData.city}
                      onValueChange={(value) => form.handleRoomChange('city', value)}
                      disabled={form.isLoadingProvinces}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue
                          placeholder={form.isLoadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành'}
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {form.provinces.map((province) => (
                          <SelectItem key={province.code} value={province.name}>
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quận/Huyện</Label>
                    <Select
                      value={form.roomData.district}
                      onValueChange={(value) => form.handleRoomChange('district', value)}
                      disabled={form.isLoadingDistricts || form.districts.length === 0}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue
                          placeholder={form.isLoadingDistricts ? 'Đang tải...' : 'Chọn quận/huyện'}
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {form.districts.map((district) => (
                          <SelectItem key={district.code} value={district.name}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Loại phòng</Label>
                    <Select
                      value={form.roomData.room_type}
                      onValueChange={(value) =>
                        form.handleRoomChange('room_type', value as (typeof form.roomData.room_type))
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOM_TYPES.map((roomType) => (
                          <SelectItem key={roomType.value} value={roomType.value}>
                            {roomType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="price_per_month">
                      Giá gốc/tháng (VNĐ) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="price_per_month"
                      type="number"
                      min="0"
                      placeholder="3000000"
                      value={form.roomData.price_per_month}
                      onChange={(event) =>
                        form.handleRoomChange('price_per_month', event.target.value)
                      }
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="area_sqm">Diện tích (m²)</Label>
                    <Input
                      id="area_sqm"
                      type="number"
                      min="0"
                      placeholder="25"
                      value={form.roomData.area_sqm}
                      onChange={(event) => form.handleRoomChange('area_sqm', event.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Phòng ngủ</Label>
                    <Select
                      value={form.roomData.bedroom_count}
                      onValueChange={(value) => form.handleRoomChange('bedroom_count', value)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map((count) => (
                          <SelectItem key={count} value={String(count)}>
                            {count}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Phòng tắm</Label>
                    <Select
                      value={form.roomData.bathroom_count}
                      onValueChange={(value) => form.handleRoomChange('bathroom_count', value)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3].map((count) => (
                          <SelectItem key={count} value={String(count)}>
                            {count}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border p-4">
                  <Label htmlFor="furnished" className="cursor-pointer">
                    Đầy đủ nội thất
                  </Label>
                  <Switch
                    id="furnished"
                    checked={form.roomData.furnished}
                    onCheckedChange={(value) => form.handleRoomChange('furnished', value)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label>Ảnh phòng</Label>
                    <span className="text-xs text-muted-foreground">
                      {form.selectedFiles.length}/{MAX_IMAGES} ảnh
                    </span>
                  </div>
                  <div
                    className={`mt-1.5 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                      form.selectedFiles.length >= MAX_IMAGES
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:border-primary/50 hover:bg-primary/5'
                    }`}
                    role="button"
                    tabIndex={form.selectedFiles.length >= MAX_IMAGES ? -1 : 0}
                    aria-label="Tải ảnh chỗ ở"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={form.selectedFiles.length >= MAX_IMAGES ? undefined : handleDrop}
                    onKeyDown={handleUploadZoneKeyDown}
                    onClick={
                      form.selectedFiles.length >= MAX_IMAGES
                        ? undefined
                        : () => fileInputRef.current?.click()
                    }
                  >
                    <ImagePlus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {form.selectedFiles.length >= MAX_IMAGES
                        ? `Đã đạt tối đa ${MAX_IMAGES} ảnh`
                        : 'Kéo thả hoặc click để chọn ảnh'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tối đa {MAX_FILE_SIZE_MB}MB / ảnh
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      aria-label="Chọn ảnh chỗ ở"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </div>

                  {form.previewUrls.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {form.previewUrls.map((url, index) => (
                        <div
                          key={url}
                          className="group relative aspect-square overflow-hidden rounded-lg"
                        >
                          <img src={url} alt={`Xem trước ảnh chỗ ở ${index + 1}`} className="h-full w-full object-cover" />
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              form.removeImage(index);
                            }}
                            className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          {index === 0 && (
                            <span className="absolute bottom-1 left-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                              Ảnh chính
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button
              className="h-12 w-full rounded-xl shadow-lg shadow-primary/20"
              disabled={!form.isStep1Valid}
              onClick={() => form.setStep(2)}
            >
              Tiếp tục
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {form.step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4">
              <Home className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 space-y-1 text-sm">
                <p className="truncate font-semibold">{form.roomData.title}</p>
                <p className="truncate text-muted-foreground">
                  {form.roomData.address}
                  {form.roomData.district ? `, ${form.roomData.district}` : ''}
                  {form.roomData.city ? `, ${form.roomData.city}` : ''}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                  <span>{ROOM_TYPES.find((type) => type.value === form.roomData.room_type)?.label}</span>
                  {form.parsedPrices.original > 0 && (
                    <span>{form.parsedPrices.original.toLocaleString('vi-VN')} VNĐ/tháng</span>
                  )}
                  {form.roomData.area_sqm && <span>{form.roomData.area_sqm} m²</span>}
                  {form.selectedFiles.length > 0 && <span>{form.selectedFiles.length} ảnh</span>}
                </div>
                <button
                  type="button"
                  onClick={() => form.setStep(1)}
                  className="mt-1 text-xs font-medium text-primary hover:underline"
                >
                  Chỉnh sửa thông tin phòng
                </button>
              </div>
            </div>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  Thiết lập ở ngắn hạn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="start_date">
                      Ngày bắt đầu <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="start_date"
                      type="date"
                      min={form.today}
                      value={form.subletData.start_date}
                      onChange={(event) => form.handleSubletChange('start_date', event.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">
                      Ngày kết thúc <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="end_date"
                      type="date"
                      min={form.subletData.start_date || form.today}
                      value={form.subletData.end_date}
                      onChange={(event) => form.handleSubletChange('end_date', event.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                {form.dateError && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {form.dateError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="sublet_price" className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      Giá ở ngắn hạn (VNĐ) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="sublet_price"
                      type="number"
                      min="0"
                      placeholder="2500000"
                      value={form.subletData.sublet_price}
                      onChange={(event) => form.handleSubletChange('sublet_price', event.target.value)}
                      className={`mt-1.5 ${
                        form.priceCapExceeded ? 'border-destructive focus-visible:ring-destructive' : ''
                      }`}
                    />
                    {form.parsedPrices.original > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Tối đa {(form.parsedPrices.original * 1.2).toLocaleString('vi-VN')} VNĐ (120%
                        giá gốc)
                      </p>
                    )}
                    {form.priceCapExceeded && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        Giá vượt quá 120% giá gốc, vui lòng giảm giá
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="deposit">Tiền cọc (VNĐ)</Label>
                    <Input
                      id="deposit"
                      type="number"
                      min="0"
                      placeholder="500000"
                      value={form.subletData.deposit_required}
                      onChange={(event) =>
                        form.handleSubletChange('deposit_required', event.target.value)
                      }
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Mô tả thêm</Label>
                    <span
                      className={`text-xs ${
                        form.subletData.description.length > MAX_DESCRIPTION_LENGTH
                          ? 'font-medium text-destructive'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {form.subletData.description.length}/{MAX_DESCRIPTION_LENGTH}
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    placeholder="Nói rõ lý do cho ở ngắn hạn, yêu cầu đặc biệt và thông tin thêm về chỗ ở..."
                    value={form.subletData.description}
                    onChange={(event) => {
                      if (event.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                        form.handleSubletChange('description', event.target.value);
                      }
                    }}
                    className="mt-1.5 min-h-[100px]"
                  />
                </div>

                {form.parsedPrices.original > 0 &&
                  form.parsedPrices.sublet > 0 &&
                  !form.priceCapExceeded && (
                    <div className="space-y-2 rounded-xl bg-muted/50 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Info className="h-4 w-4 text-primary" />
                        So sánh giá
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Giá gốc:</span>
                          <span className="ml-2 font-semibold">
                            {form.parsedPrices.original.toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Giá ở ngắn hạn:</span>
                          <span
                            className={`ml-2 font-semibold ${
                              form.parsedPrices.sublet <= form.parsedPrices.original
                                ? 'text-green-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {form.parsedPrices.sublet.toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>
                      </div>
                      {form.parsedPrices.sublet < form.parsedPrices.original && (
                        <p className="text-xs font-medium text-green-600">
                          ✨ Tiết kiệm{' '}
                          {(form.parsedPrices.original - form.parsedPrices.sublet).toLocaleString('vi-VN')}{' '}
                          VNĐ so với giá gốc
                        </p>
                      )}
                    </div>
                  )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-xl"
                onClick={() => form.setStep(1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
              </Button>
              <Button
                className="h-12 flex-1 rounded-xl shadow-lg shadow-primary/20"
                disabled={!form.isStep2Valid || form.isPending || form.isUploading}
                onClick={form.handleSubmit}
              >
                {form.isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tải ảnh...
                  </>
                ) : form.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng tin...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Đăng tin
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
