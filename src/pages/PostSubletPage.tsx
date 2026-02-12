/**
 * PostSubletPage
 * 2-step form for non-landlord users to create a sublet listing
 * Step 1: Room Info (address, type, price, images)
 * Step 2: Sublet Details (dates, sublet price, description)
 */

import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAuth } from '@/contexts';
import { uploadMultipleRoomImages } from '@/services/roomImages';
import { useCreateSubletWithRoom } from '@/hooks/useSublets';
import { toast } from 'sonner';

const ROOM_TYPES = [
    { value: 'private', label: 'Phòng riêng' },
    { value: 'shared', label: 'Phòng chung' },
    { value: 'studio', label: 'Studio' },
    { value: 'entire', label: 'Nguyên căn' },
] as const;

const MAX_IMAGES = 8;
const MAX_DESCRIPTION_LENGTH = 1000;

function getTodayString(): string {
    return new Date().toISOString().split('T')[0];
}

export default function PostSubletPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const createSublet = useCreateSubletWithRoom();

    const [step, setStep] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Image state
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    // Step 1: Room info
    const [roomData, setRoomData] = useState({
        title: '',
        address: '',
        district: '',
        city: 'Hà Nội',
        room_type: 'private' as 'private' | 'shared' | 'studio' | 'entire',
        price_per_month: '',
        area_sqm: '',
        bedroom_count: '1',
        bathroom_count: '1',
        furnished: false,
    });

    // Step 2: Sublet info
    const [subletData, setSubletData] = useState({
        start_date: '',
        end_date: '',
        sublet_price: '',
        deposit_required: '',
        description: '',
    });

    const handleRoomChange = (field: string, value: string | boolean) => {
        setRoomData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubletChange = (field: string, value: string) => {
        setSubletData(prev => ({ ...prev, [field]: value }));
    };

    // Image handlers
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        const remaining = MAX_IMAGES - selectedFiles.length;
        if (remaining <= 0) {
            toast.error(`Tối đa ${MAX_IMAGES} ảnh`);
            return;
        }

        const sliced = files.slice(0, remaining);
        if (sliced.length < files.length) {
            toast.info(`Chỉ thêm được ${remaining} ảnh nữa (tối đa ${MAX_IMAGES})`);
        }

        const validFiles = sliced.filter(file => {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} không phải là file ảnh`);
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} vượt quá 5MB`);
                return false;
            }
            return true;
        });

        if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles]);
            validFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewUrls(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const input = fileInputRef.current;
        if (input) {
            const dt = new DataTransfer();
            files.forEach(file => dt.items.add(file));
            input.files = dt.files;
            handleFileSelect({ target: input } as unknown as React.ChangeEvent<HTMLInputElement>);
        }
    };

    // Validation
    const today = useMemo(() => getTodayString(), []);

    const isStep1Valid = roomData.title && roomData.address && roomData.price_per_month && parseFloat(roomData.price_per_month) > 0;

    const dateError = useMemo(() => {
        if (!subletData.start_date || !subletData.end_date) return null;
        if (subletData.start_date < today) return 'Ngày bắt đầu không thể trong quá khứ';
        if (subletData.end_date <= subletData.start_date) return 'Ngày kết thúc phải sau ngày bắt đầu';
        return null;
    }, [subletData.start_date, subletData.end_date, today]);

    const priceCapExceeded = useMemo(() => {
        if (!roomData.price_per_month || !subletData.sublet_price) return false;
        return parseFloat(subletData.sublet_price) > parseFloat(roomData.price_per_month) * 1.2;
    }, [roomData.price_per_month, subletData.sublet_price]);

    const isStep2Valid =
        subletData.start_date &&
        subletData.end_date &&
        subletData.sublet_price &&
        parseFloat(subletData.sublet_price) > 0 &&
        !dateError &&
        !priceCapExceeded;

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        } else {
            navigate(-1);
        }
    };

    const handleSubmit = async () => {
        if (!user) {
            toast.error('Vui lòng đăng nhập');
            return;
        }

        if (!isStep2Valid) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            let imageUrls: string[] = [];
            if (selectedFiles.length > 0) {
                setIsUploading(true);
                imageUrls = await uploadMultipleRoomImages(user.id, selectedFiles);
                setIsUploading(false);
            }

            await createSublet.mutateAsync({
                title: roomData.title,
                address: roomData.address,
                district: roomData.district || undefined,
                city: roomData.city,
                room_type: roomData.room_type,
                price_per_month: parseFloat(roomData.price_per_month),
                area_sqm: roomData.area_sqm ? parseFloat(roomData.area_sqm) : undefined,
                bedroom_count: parseInt(roomData.bedroom_count) || 1,
                bathroom_count: parseInt(roomData.bathroom_count) || 1,
                furnished: roomData.furnished,
                image_urls: imageUrls.length > 0 ? imageUrls : undefined,
                start_date: subletData.start_date,
                end_date: subletData.end_date,
                sublet_price: parseFloat(subletData.sublet_price),
                deposit_required: subletData.deposit_required
                    ? parseFloat(subletData.deposit_required)
                    : undefined,
                description: subletData.description || undefined,
            });

            setIsSuccess(true);
        } catch {
            setIsUploading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <Card className="max-w-md w-full border-none shadow-lg">
                    <CardContent className="py-16 text-center">
                        <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Vui lòng đăng nhập</h2>
                        <p className="text-muted-foreground mb-6">Bạn cần đăng nhập để đăng tin cho thuê lại.</p>
                        <Button onClick={() => navigate('/login')} className="rounded-xl">Đăng nhập ngay</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isSuccess) {
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
                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-xl"
                                onClick={() => navigate('/my-sublets')}
                            >
                                Tin đăng của tôi
                            </Button>
                            <Button
                                className="w-full h-12 rounded-xl shadow-lg shadow-primary/20"
                                onClick={() => navigate('/swap')}
                            >
                                Khám phá SwapRoom
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold">Đăng tin cho thuê lại</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Bước {step} / 2</span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span>{step === 1 ? 'Thông tin phòng' : 'Chi tiết cho thuê'}</span>
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
                            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${s <= step ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]' : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>

                {/* Step 1: Room Info */}
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    Thông tin phòng gốc
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div>
                                    <Label htmlFor="title">Tiêu đề <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="title"
                                        placeholder="VD: Phòng trọ Q.Bình Thạnh gần ĐH Hutech"
                                        value={roomData.title}
                                        onChange={e => handleRoomChange('title', e.target.value)}
                                        className="mt-1.5"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="address">Địa chỉ <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="address"
                                        placeholder="Số nhà, đường, phường"
                                        value={roomData.address}
                                        onChange={e => handleRoomChange('address', e.target.value)}
                                        className="mt-1.5"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="district">Quận/Huyện</Label>
                                        <Input
                                            id="district"
                                            placeholder="VD: Bình Thạnh"
                                            value={roomData.district}
                                            onChange={e => handleRoomChange('district', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="city">Thành phố</Label>
                                        <Select value={roomData.city} onValueChange={v => handleRoomChange('city', v)}>
                                            <SelectTrigger className="mt-1.5">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Hà Nội">Hà Nội</SelectItem>
                                                <SelectItem value="TP.HCM">TP.HCM</SelectItem>
                                                <SelectItem value="Đà Nẵng">Đà Nẵng</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Loại phòng</Label>
                                        <Select value={roomData.room_type} onValueChange={v => handleRoomChange('room_type', v)}>
                                            <SelectTrigger className="mt-1.5">
                                                <SelectValue />
                                            </SelectTrigger>
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
                                            value={roomData.price_per_month}
                                            onChange={e => handleRoomChange('price_per_month', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="area_sqm">Diện tích (m²)</Label>
                                        <Input
                                            id="area_sqm"
                                            type="number"
                                            min="0"
                                            placeholder="25"
                                            value={roomData.area_sqm}
                                            onChange={e => handleRoomChange('area_sqm', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="bedroom">Phòng ngủ</Label>
                                        <Select value={roomData.bedroom_count} onValueChange={v => handleRoomChange('bedroom_count', v)}>
                                            <SelectTrigger className="mt-1.5">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4].map(n => (
                                                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="bathroom">Phòng tắm</Label>
                                        <Select value={roomData.bathroom_count} onValueChange={v => handleRoomChange('bathroom_count', v)}>
                                            <SelectTrigger className="mt-1.5">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3].map(n => (
                                                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between rounded-xl border p-4">
                                    <Label htmlFor="furnished" className="cursor-pointer">Đầy đủ nội thất</Label>
                                    <Switch
                                        id="furnished"
                                        checked={roomData.furnished}
                                        onCheckedChange={v => handleRoomChange('furnished', v)}
                                    />
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <Label>Ảnh phòng</Label>
                                        <span className="text-xs text-muted-foreground">
                                            {selectedFiles.length}/{MAX_IMAGES} ảnh
                                        </span>
                                    </div>
                                    <div
                                        className={`mt-1.5 border-2 border-dashed rounded-xl p-6 text-center transition-colors ${selectedFiles.length >= MAX_IMAGES
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5'
                                            }`}
                                        onDragOver={e => { e.preventDefault(); }}
                                        onDrop={selectedFiles.length >= MAX_IMAGES ? undefined : handleDrop}
                                        onClick={selectedFiles.length >= MAX_IMAGES ? undefined : () => fileInputRef.current?.click()}
                                    >
                                        <ImagePlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            {selectedFiles.length >= MAX_IMAGES
                                                ? `Đã đạt tối đa ${MAX_IMAGES} ảnh`
                                                : 'Kéo thả hoặc click để chọn ảnh'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">Tối đa 5MB / ảnh</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                    </div>

                                    {previewUrls.length > 0 && (
                                        <div className="grid grid-cols-4 gap-2 mt-3">
                                            {previewUrls.map((url, i) => (
                                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
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
                            disabled={!isStep1Valid}
                            onClick={() => setStep(2)}
                        >
                            Tiếp tục
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}

                {/* Step 2: Sublet Details */}
                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Room Summary */}
                        <div className="bg-muted/40 rounded-xl p-4 flex items-start gap-3">
                            <Home className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                            <div className="text-sm space-y-1 min-w-0">
                                <p className="font-semibold truncate">{roomData.title}</p>
                                <p className="text-muted-foreground truncate">{roomData.address}{roomData.district ? `, ${roomData.district}` : ''}, {roomData.city}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                                    <span>{ROOM_TYPES.find(t => t.value === roomData.room_type)?.label}</span>
                                    <span>{parseFloat(roomData.price_per_month).toLocaleString('vi-VN')} VNĐ/tháng</span>
                                    {roomData.area_sqm && <span>{roomData.area_sqm} m²</span>}
                                    {selectedFiles.length > 0 && <span>{selectedFiles.length} ảnh</span>}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="start_date">Ngày bắt đầu <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            min={today}
                                            value={subletData.start_date}
                                            onChange={e => handleSubletChange('start_date', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="end_date">Ngày kết thúc <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="end_date"
                                            type="date"
                                            min={subletData.start_date || today}
                                            value={subletData.end_date}
                                            onChange={e => handleSubletChange('end_date', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                </div>

                                {dateError && (
                                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        {dateError}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
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
                                            value={subletData.sublet_price}
                                            onChange={e => handleSubletChange('sublet_price', e.target.value)}
                                            className={`mt-1.5 ${priceCapExceeded ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                        />
                                        {roomData.price_per_month && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Tối đa {(parseFloat(roomData.price_per_month) * 1.2).toLocaleString('vi-VN')} VNĐ (120% giá gốc)
                                            </p>
                                        )}
                                        {priceCapExceeded && (
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
                                            value={subletData.deposit_required}
                                            onChange={e => handleSubletChange('deposit_required', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="description">Mô tả thêm</Label>
                                        <span className={`text-xs ${subletData.description.length > MAX_DESCRIPTION_LENGTH
                                                ? 'text-destructive font-medium'
                                                : 'text-muted-foreground'
                                            }`}>
                                            {subletData.description.length}/{MAX_DESCRIPTION_LENGTH}
                                        </span>
                                    </div>
                                    <Textarea
                                        id="description"
                                        placeholder="Lý do cho thuê lại, yêu cầu đặc biệt, thông tin thêm về phòng..."
                                        value={subletData.description}
                                        onChange={e => {
                                            if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                                                handleSubletChange('description', e.target.value);
                                            }
                                        }}
                                        className="mt-1.5 min-h-[100px]"
                                    />
                                </div>

                                {/* Price comparison */}
                                {roomData.price_per_month && subletData.sublet_price && !priceCapExceeded && (
                                    <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Info className="w-4 h-4 text-primary" />
                                            So sánh giá
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Giá gốc:</span>
                                                <span className="ml-2 font-semibold">
                                                    {parseFloat(roomData.price_per_month).toLocaleString('vi-VN')} VNĐ
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Giá pass:</span>
                                                <span className={`ml-2 font-semibold ${parseFloat(subletData.sublet_price) <= parseFloat(roomData.price_per_month)
                                                        ? 'text-green-600'
                                                        : 'text-amber-600'
                                                    }`}>
                                                    {parseFloat(subletData.sublet_price).toLocaleString('vi-VN')} VNĐ
                                                </span>
                                            </div>
                                        </div>
                                        {parseFloat(subletData.sublet_price) < parseFloat(roomData.price_per_month) && (
                                            <p className="text-xs text-green-600 font-medium">
                                                ✨ Tiết kiệm {(parseFloat(roomData.price_per_month) - parseFloat(subletData.sublet_price)).toLocaleString('vi-VN')} VNĐ so với giá gốc
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 h-12 rounded-xl"
                                onClick={() => setStep(1)}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Quay lại
                            </Button>
                            <Button
                                className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20"
                                disabled={!isStep2Valid || createSublet.isPending || isUploading}
                                onClick={handleSubmit}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang tải ảnh...
                                    </>
                                ) : createSublet.isPending ? (
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
