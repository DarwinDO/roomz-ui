/**
 * PostSubletPage
 * 2-step form for non-landlord users to create a sublet listing.
 * All state and logic lives in usePostSubletForm hook.
 */

import { useRef } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    Home,
    Calendar,
    Loader2,
    ImagePlus,
    X,
    MapPin,
    DollarSign,
    Info,
    AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    usePostSubletForm,
    ROOM_TYPES,
    MAX_IMAGES,
    MAX_DESCRIPTION_LENGTH,
    MAX_FILE_SIZE_MB,
} from '@/hooks/usePostSubletForm';

export default function PostSubletPage() {
    const form = usePostSubletForm();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        form.processFiles(Array.from(e.target.files || []));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        form.processFiles(Array.from(e.dataTransfer.files));
    };

    // -- Not logged in --
    if (!form.user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <Card className="max-w-md w-full border-none shadow-lg">
                    <CardContent className="py-16 text-center">
                        <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Vui lòng đăng nhập</h2>
                        <p className="text-muted-foreground mb-6">Bạn cần đăng nhập để đăng tin cho thuê lại.</p>
                        <Button onClick={() => form.navigate('/login')} className="rounded-xl">Đăng nhập ngay</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // -- Success --
    if (form.isSuccess) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4 animate-fade-in">
                <Card className="max-w-md w-full border-none shadow-lg">
                    <CardContent className="pt-12 pb-10 text-center">
                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Đăng tin thành công!</h2>
                        <p className="text-muted-foreground mb-8">
                            Tin cho thuê lại đã hiển thị trên SwapRoom. Quản lý tin đăng trong mục <strong>"Tin đăng của tôi"</strong>.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => form.navigate('/my-sublets')}>
                                Tin đăng của tôi
                            </Button>
                            <Button className="w-full h-12 rounded-xl shadow-lg shadow-primary/20" onClick={() => form.navigate('/swap')}>
                                Khám phá SwapRoom
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // -- Form --
    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={form.handleBack} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold">Đăng tin cho thuê lại</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Bước {form.step} / 2</span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span>{form.step === 1 ? 'Thông tin phòng' : 'Chi tiết cho thuê'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                    {[1, 2].map(s => (
                        <div
                            key={s}
                            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${s <= form.step ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]' : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>

                {/* ===== STEP 1: Room Info ===== */}
                {form.step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    Thông tin phòng gốc
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Title */}
                                <div>
                                    <Label htmlFor="title">Tiêu đề <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="title"
                                        placeholder="VD: Phòng trọ Q.Bình Thạnh gần ĐH Hutech"
                                        value={form.roomData.title}
                                        onChange={e => form.handleRoomChange('title', e.target.value)}
                                        className="mt-1.5"
                                    />
                                </div>

                                {/* Address */}
                                <div>
                                    <Label htmlFor="address">Địa chỉ <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="address"
                                        placeholder="Số nhà, đường, phường"
                                        value={form.roomData.address}
                                        onChange={e => form.handleRoomChange('address', e.target.value)}
                                        className="mt-1.5"
                                    />
                                </div>

                                {/* City + District */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Tỉnh/Thành phố <span className="text-destructive">*</span></Label>
                                        <Select
                                            value={form.roomData.city}
                                            onValueChange={v => form.handleRoomChange('city', v)}
                                            disabled={form.isLoadingProvinces}
                                        >
                                            <SelectTrigger className="mt-1.5">
                                                <SelectValue placeholder={form.isLoadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành'} />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {form.provinces.map(p => (
                                                    <SelectItem key={p.code} value={p.name}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Quận/Huyện</Label>
                                        <Select
                                            value={form.roomData.district}
                                            onValueChange={v => form.handleRoomChange('district', v)}
                                            disabled={form.isLoadingDistricts || form.districts.length === 0}
                                        >
                                            <SelectTrigger className="mt-1.5">
                                                <SelectValue placeholder={form.isLoadingDistricts ? 'Đang tải...' : 'Chọn quận/huyện'} />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {form.districts.map(d => (
                                                    <SelectItem key={d.code} value={d.name}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Room type + Price */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Loại phòng</Label>
                                        <Select value={form.roomData.room_type} onValueChange={v => form.handleRoomChange('room_type', v as typeof form.roomData.room_type)}>
                                            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {ROOM_TYPES.map(t => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="price_per_month">Giá gốc/tháng (VNĐ) <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="price_per_month"
                                            type="number"
                                            min="0"
                                            placeholder="3000000"
                                            value={form.roomData.price_per_month}
                                            onChange={e => form.handleRoomChange('price_per_month', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                </div>

                                {/* Area + Bedrooms + Bathrooms */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="area_sqm">Diện tích (m²)</Label>
                                        <Input
                                            id="area_sqm"
                                            type="number"
                                            min="0"
                                            placeholder="25"
                                            value={form.roomData.area_sqm}
                                            onChange={e => form.handleRoomChange('area_sqm', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label>Phòng ngủ</Label>
                                        <Select value={form.roomData.bedroom_count} onValueChange={v => form.handleRoomChange('bedroom_count', v)}>
                                            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4].map(n => (
                                                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Phòng tắm</Label>
                                        <Select value={form.roomData.bathroom_count} onValueChange={v => form.handleRoomChange('bathroom_count', v)}>
                                            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3].map(n => (
                                                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Furnished */}
                                <div className="flex items-center justify-between rounded-xl border p-4">
                                    <Label htmlFor="furnished" className="cursor-pointer">Đầy đủ nội thất</Label>
                                    <Switch
                                        id="furnished"
                                        checked={form.roomData.furnished}
                                        onCheckedChange={v => form.handleRoomChange('furnished', v)}
                                    />
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <Label>Ảnh phòng</Label>
                                        <span className="text-xs text-muted-foreground">
                                            {form.selectedFiles.length}/{MAX_IMAGES} ảnh
                                        </span>
                                    </div>
                                    <div
                                        className={`mt-1.5 border-2 border-dashed rounded-xl p-6 text-center transition-colors ${form.selectedFiles.length >= MAX_IMAGES
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5'
                                            }`}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={form.selectedFiles.length >= MAX_IMAGES ? undefined : handleDrop}
                                        onClick={form.selectedFiles.length >= MAX_IMAGES ? undefined : () => fileInputRef.current?.click()}
                                    >
                                        <ImagePlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            {form.selectedFiles.length >= MAX_IMAGES
                                                ? `Đã đạt tối đa ${MAX_IMAGES} ảnh`
                                                : 'Kéo thả hoặc click để chọn ảnh'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">Tối đa {MAX_FILE_SIZE_MB}MB / ảnh</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileInput}
                                        />
                                    </div>

                                    {form.previewUrls.length > 0 && (
                                        <div className="grid grid-cols-4 gap-2 mt-3">
                                            {form.previewUrls.map((url, i) => (
                                                <div key={url} className="relative aspect-square rounded-lg overflow-hidden group">
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={e => { e.stopPropagation(); form.removeImage(i); }}
                                                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                    {i === 0 && (
                                                        <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
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
                            className="w-full h-12 rounded-xl shadow-lg shadow-primary/20"
                            disabled={!form.isStep1Valid}
                            onClick={() => form.setStep(2)}
                        >
                            Tiếp tục
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}

                {/* ===== STEP 2: Sublet Details ===== */}
                {form.step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Room Summary */}
                        <div className="bg-muted/40 rounded-xl p-4 flex items-start gap-3">
                            <Home className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                            <div className="text-sm space-y-1 min-w-0">
                                <p className="font-semibold truncate">{form.roomData.title}</p>
                                <p className="text-muted-foreground truncate">
                                    {form.roomData.address}
                                    {form.roomData.district ? `, ${form.roomData.district}` : ''}
                                    {form.roomData.city ? `, ${form.roomData.city}` : ''}
                                </p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                                    <span>{ROOM_TYPES.find(t => t.value === form.roomData.room_type)?.label}</span>
                                    {form.parsedPrices.original > 0 && (
                                        <span>{form.parsedPrices.original.toLocaleString('vi-VN')} VNĐ/tháng</span>
                                    )}
                                    {form.roomData.area_sqm && <span>{form.roomData.area_sqm} m²</span>}
                                    {form.selectedFiles.length > 0 && <span>{form.selectedFiles.length} ảnh</span>}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => form.setStep(1)}
                                    className="text-primary text-xs font-medium hover:underline mt-1"
                                >
                                    Chỉnh sửa thông tin phòng
                                </button>
                            </div>
                        </div>

                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    Chi tiết cho thuê lại
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Dates */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="start_date">Ngày bắt đầu <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            min={form.today}
                                            value={form.subletData.start_date}
                                            onChange={e => form.handleSubletChange('start_date', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="end_date">Ngày kết thúc <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="end_date"
                                            type="date"
                                            min={form.subletData.start_date || form.today}
                                            value={form.subletData.end_date}
                                            onChange={e => form.handleSubletChange('end_date', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                </div>

                                {form.dateError && (
                                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        {form.dateError}
                                    </div>
                                )}

                                {/* Prices */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="sublet_price" className="flex items-center gap-1">
                                            <DollarSign className="w-3.5 h-3.5" />
                                            Giá cho thuê lại (VNĐ) <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="sublet_price"
                                            type="number"
                                            min="0"
                                            placeholder="2500000"
                                            value={form.subletData.sublet_price}
                                            onChange={e => form.handleSubletChange('sublet_price', e.target.value)}
                                            className={`mt-1.5 ${form.priceCapExceeded ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                        />
                                        {form.parsedPrices.original > 0 && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Tối đa {(form.parsedPrices.original * 1.2).toLocaleString('vi-VN')} VNĐ (120% giá gốc)
                                            </p>
                                        )}
                                        {form.priceCapExceeded && (
                                            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
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
                                            onChange={e => form.handleSubletChange('deposit_required', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="description">Mô tả thêm</Label>
                                        <span className={`text-xs ${form.subletData.description.length > MAX_DESCRIPTION_LENGTH
                                                ? 'text-destructive font-medium'
                                                : 'text-muted-foreground'
                                            }`}>
                                            {form.subletData.description.length}/{MAX_DESCRIPTION_LENGTH}
                                        </span>
                                    </div>
                                    <Textarea
                                        id="description"
                                        placeholder="Lý do cho thuê lại, yêu cầu đặc biệt, thông tin thêm về phòng..."
                                        value={form.subletData.description}
                                        onChange={e => {
                                            if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                                                form.handleSubletChange('description', e.target.value);
                                            }
                                        }}
                                        className="mt-1.5 min-h-[100px]"
                                    />
                                </div>

                                {/* Price comparison */}
                                {form.parsedPrices.original > 0 && form.parsedPrices.sublet > 0 && !form.priceCapExceeded && (
                                    <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Info className="w-4 h-4 text-primary" />
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
                                                <span className="text-muted-foreground">Giá pass:</span>
                                                <span className={`ml-2 font-semibold ${form.parsedPrices.sublet <= form.parsedPrices.original
                                                        ? 'text-green-600'
                                                        : 'text-amber-600'
                                                    }`}>
                                                    {form.parsedPrices.sublet.toLocaleString('vi-VN')} VNĐ
                                                </span>
                                            </div>
                                        </div>
                                        {form.parsedPrices.sublet < form.parsedPrices.original && (
                                            <p className="text-xs text-green-600 font-medium">
                                                ✨ Tiết kiệm {(form.parsedPrices.original - form.parsedPrices.sublet).toLocaleString('vi-VN')} VNĐ so với giá gốc
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => form.setStep(1)}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Quay lại
                            </Button>
                            <Button
                                className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20"
                                disabled={!form.isStep2Valid || form.isPending || form.isUploading}
                                onClick={form.handleSubmit}
                            >
                                {form.isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang tải ảnh...
                                    </>
                                ) : form.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang đăng tin...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
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
