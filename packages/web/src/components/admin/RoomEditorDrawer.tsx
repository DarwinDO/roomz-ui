import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ExternalLink,
  ImagePlus,
  Loader2,
  MapPin,
  Plus,
  RefreshCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { geocodeRoomLocation } from '@/services/mapboxGeocoding';
import {
  deleteRoomImages,
  uploadMultipleRoomImages,
  uploadRoomImage,
  validateRoomImage,
} from '@/services/roomImages';
import type { AdminRoom } from '@/services/admin';
import {
  buildAdminRoomDraft,
  collectRemovedManagedRoomImageUrls,
  roomEditorAmenityFields,
  type AdminGenderRestriction,
  type AdminImageType,
  type AdminRoomStatus,
  type AdminRoomType,
  type AdminRoomUpdateDraft,
} from '@/services/adminRoomEditor';
import { useUpdateAdminRoom } from '@/hooks/useAdminRoomEditor';

const ROOM_TYPE_OPTIONS: AdminRoomType[] = ['private', 'shared', 'studio', 'entire'];
const ROOM_STATUS_OPTIONS: NonNullable<AdminRoomStatus>[] = [
  'draft',
  'pending',
  'active',
  'rejected',
  'inactive',
  'rented',
];
const GENDER_OPTIONS: NonNullable<AdminGenderRestriction>[] = ['none', 'male_only', 'female_only'];
const IMAGE_TYPE_OPTIONS: AdminImageType[] = ['photo', '360', 'video'];
const BOOLEAN_FIELD_OPTIONS = [
  ['furnished', 'Đã trang bị nội thất'],
  ['is_available', 'Đang còn trống'],
  ['is_verified', 'Đã xác thực'],
  ['utilities_included', 'Đã bao gồm tiện ích'],
  ['pet_allowed', 'Cho phép nuôi thú cưng'],
  ['smoking_allowed', 'Cho phép hút thuốc'],
  ['has_360_photos', 'Có ảnh 360'],
] as const;

type BooleanField = (typeof BOOLEAN_FIELD_OPTIONS)[number][0];

const ROOM_TYPE_LABELS: Record<AdminRoomType, string> = {
  private: 'Phòng riêng',
  shared: 'Ở ghép',
  studio: 'Studio',
  entire: 'Nguyên căn',
};

const ROOM_STATUS_LABELS: Record<NonNullable<AdminRoomStatus>, string> = {
  draft: 'Nháp',
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  rejected: 'Bị từ chối',
  inactive: 'Tạm tắt',
  rented: 'Đã cho thuê',
};

const GENDER_LABELS: Record<NonNullable<AdminGenderRestriction>, string> = {
  none: 'Không giới hạn',
  male_only: 'Chỉ nam',
  female_only: 'Chỉ nữ',
};

const AMENITY_LABELS: Record<(typeof roomEditorAmenityFields)[number], string> = {
  wifi: 'Wi-Fi',
  air_conditioning: 'Điều hòa',
  parking: 'Chỗ đỗ xe',
  washing_machine: 'Máy giặt',
  refrigerator: 'Tủ lạnh',
  heater: 'Máy nước nóng',
  security_camera: 'Camera',
  balcony: 'Ban công',
  dryer: 'Máy sấy',
  elevator: 'Thang máy',
  fingerprint_lock: 'Khóa vân tay',
  gym: 'Phòng gym',
  kitchen: 'Khu bếp',
  microwave: 'Lò vi sóng',
  security_guard: 'Bảo vệ',
  swimming_pool: 'Hồ bơi',
  tv: 'TV',
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Chưa có';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Chưa có';
  }

  return date.toLocaleString('vi-VN');
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

interface RoomEditorDrawerProps {
  room: AdminRoom | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoomEditorDrawer({ room, open, onOpenChange }: RoomEditorDrawerProps) {
  const updateRoom = useUpdateAdminRoom();
  const [draft, setDraft] = useState<AdminRoomUpdateDraft | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);

  useEffect(() => {
    if (!room) {
      setDraft(null);
      return;
    }

    setDraft(buildAdminRoomDraft(room));
  }, [room]);

  const metadata = useMemo(() => {
    if (!room) {
      return null;
    }

    return {
      created_at: formatDateTime(room.created_at),
      updated_at: formatDateTime(room.updated_at),
      view_count: `${room.view_count ?? 0} lượt xem`,
      favorite_count: `${room.favorite_count ?? 0} lượt thích`,
      landlord: room.landlord?.full_name ?? room.landlord_id,
    };
  }, [room]);

  const updateDraftField = <K extends keyof AdminRoomUpdateDraft>(
    field: K,
    value: AdminRoomUpdateDraft[K],
  ) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const updateBooleanField = (field: BooleanField, checked: boolean) => {
    setDraft((current) => (current ? { ...current, [field]: checked } : current));
  };

  const updateAmenity = (field: (typeof roomEditorAmenityFields)[number], checked: boolean) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            amenities: {
              ...current.amenities,
              [field]: checked,
            },
          }
        : current,
    );
  };

  const updateImageField = <K extends keyof AdminRoomUpdateDraft['images'][number]>(
    index: number,
    field: K,
    value: AdminRoomUpdateDraft['images'][number][K],
  ) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const images = [...current.images];
      images[index] = { ...images[index], [field]: value };

      if (field === 'is_primary' && value) {
        for (let position = 0; position < images.length; position += 1) {
          images[position] = {
            ...images[position],
            is_primary: position === index,
          };
        }
      }

      return { ...current, images };
    });
  };

  const addImage = () => {
    setDraft((current) =>
      current
        ? {
            ...current,
            images: [
              ...current.images,
              {
                image_url: '',
                image_type: 'photo',
                is_primary: current.images.length === 0,
                display_order: current.images.length.toString(),
                caption: '',
              },
            ],
          }
        : current,
    );
  };

  const removeImage = (index: number) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const images = current.images.filter((_, position) => position !== index);
      if (images.length > 0 && !images.some((image) => image.is_primary)) {
        images[0] = { ...images[0], is_primary: true };
      }

      return { ...current, images };
    });
  };

  const handleGeocode = async () => {
    if (!draft) {
      return;
    }

    setIsGeocoding(true);
    try {
      const result = await geocodeRoomLocation({
        address: draft.address.trim(),
        district: draft.district.trim(),
        city: draft.city.trim(),
      });

      if (!result) {
        toast.error('Không tìm thấy tọa độ phù hợp cho địa chỉ này');
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
      toast.success('Đã geocode lại địa chỉ phòng');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể geocode địa chỉ phòng');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleImageUpload = async (index: number, file: File | null) => {
    if (!room || !file) {
      return;
    }

    const validation = validateRoomImage(file);
    if (!validation.isValid) {
      toast.error(validation.error ?? 'Ảnh không hợp lệ');
      return;
    }

    setUploadingImageIndex(index);
    try {
      const imageUrl = await uploadRoomImage(room.id, file);
      setDraft((current) => {
        if (!current) {
          return current;
        }

        const images = [...current.images];
        const currentImage = images[index];
        if (!currentImage) {
          return current;
        }

        images[index] = {
          ...currentImage,
          image_url: imageUrl,
        };

        return { ...current, images };
      });
      toast.success('Đã tải ảnh phòng lên storage');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải ảnh lên');
    } finally {
      setUploadingImageIndex(null);
    }
  };

  const handleMultiImageUpload = async (files: FileList | null) => {
    if (!room || !files || files.length === 0) {
      return;
    }

    const fileList = Array.from(files);
    const invalidFile = fileList.find((file) => !validateRoomImage(file).isValid);
    if (invalidFile) {
      const validation = validateRoomImage(invalidFile);
      toast.error(validation.error ?? 'Ảnh không hợp lệ');
      return;
    }

    setIsUploadingBatch(true);
    try {
      const uploadedUrls = await uploadMultipleRoomImages(room.id, fileList);
      setDraft((current) => {
        if (!current) {
          return current;
        }

        const hasPrimaryImage = current.images.some(
          (image) => image.is_primary && image.image_url.trim().length > 0,
        );
        const nextImages = uploadedUrls.map((imageUrl, index) => ({
          image_url: imageUrl,
          image_type: 'photo' as AdminImageType,
          is_primary: !hasPrimaryImage && index === 0,
          display_order: (current.images.length + index).toString(),
          caption: '',
        }));

        return {
          ...current,
          images: [...current.images, ...nextImages],
        };
      });

      toast.success(`Đã tải lên ${uploadedUrls.length} ảnh phòng`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải nhiều ảnh lên');
    } finally {
      setIsUploadingBatch(false);
    }
  };

  const handleSave = async () => {
    if (!room || !draft) {
      return;
    }

    const removedManagedImageUrls = collectRemovedManagedRoomImageUrls(room.images, draft.images);
    await updateRoom.mutateAsync({ roomId: room.id, draft });

    if (removedManagedImageUrls.length > 0) {
      try {
        await deleteRoomImages(removedManagedImageUrls);
      } catch (error) {
        toast.warning(
          error instanceof Error
            ? `Đã lưu thay đổi nhưng chưa thể dọn ${removedManagedImageUrls.length} ảnh cũ: ${error.message}`
            : `Đã lưu thay đổi nhưng chưa thể dọn ${removedManagedImageUrls.length} ảnh cũ`,
        );
      }
    }

    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[96vw] gap-0 p-0 sm:max-w-5xl">
        <SheetHeader className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-3 pr-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-2xl font-semibold text-slate-950">
                  {room?.title ?? 'Chỉnh sửa phòng'}
                </SheetTitle>
                {room?.status ? (
                  <Badge className="rounded-full bg-slate-100 text-slate-700">
                    {ROOM_STATUS_LABELS[room.status]}
                  </Badge>
                ) : null}
                {room?.is_verified ? (
                  <Badge className="rounded-full bg-emerald-100 text-emerald-700">Verified</Badge>
                ) : null}
              </div>
              <SheetDescription className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Drawer này cho phép admin sửa toàn bộ thông tin listing, tiện ích và ảnh liên quan đến phòng.
              </SheetDescription>
            </div>
            {room ? (
              <Button asChild variant="outline" className="rounded-full border-slate-200">
                <a href={`/room/${room.id}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Xem trang công khai
                </a>
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        {room && draft ? (
          <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.95fr)]">
              <div className="space-y-6">
                <Section title="Thông tin chính" description="Chỉnh tiêu đề, mô tả, loại phòng và người sở hữu listing.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Label htmlFor="room-title">Tiêu đề</Label>
                      <Input id="room-title" value={draft.title} onChange={(event) => updateDraftField('title', event.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="room-description">Mô tả</Label>
                      <Textarea id="room-description" value={draft.description} onChange={(event) => updateDraftField('description', event.target.value)} className="min-h-28" />
                    </div>
                    <div>
                      <Label htmlFor="room-landlord">ID chủ nhà</Label>
                      <Input id="room-landlord" value={draft.landlord_id} onChange={(event) => updateDraftField('landlord_id', event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="room-type">Loại phòng</Label>
                      <Select value={draft.room_type} onValueChange={(value) => updateDraftField('room_type', value as AdminRoomType)}>
                        <SelectTrigger id="room-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROOM_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {ROOM_TYPE_LABELS[option]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Section>

                <Section title="Địa chỉ và bản đồ" description="Sửa địa chỉ, district/city và geocode lại khi cần.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Label htmlFor="room-address">Địa chỉ</Label>
                      <Input id="room-address" value={draft.address} onChange={(event) => updateDraftField('address', event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="room-district">Quận / huyện</Label>
                      <Input id="room-district" value={draft.district} onChange={(event) => updateDraftField('district', event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="room-city">Tỉnh / thành</Label>
                      <Input id="room-city" value={draft.city} onChange={(event) => updateDraftField('city', event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="room-latitude">Latitude</Label>
                      <Input id="room-latitude" value={draft.latitude} onChange={(event) => updateDraftField('latitude', event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="room-longitude">Longitude</Label>
                      <Input id="room-longitude" value={draft.longitude} onChange={(event) => updateDraftField('longitude', event.target.value)} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button type="button" variant="outline" className="rounded-full border-slate-200" disabled={isGeocoding} onClick={() => void handleGeocode()}>
                      {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                      Geocode lại
                    </Button>
                  </div>
                </Section>

                <Section title="Giá và quy mô" description="Toàn bộ thông tin thương mại và quy mô phòng.">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="room-price">Giá thuê / tháng</Label>
                      <Input id="room-price" value={draft.price_per_month} onChange={(event) => updateDraftField('price_per_month', event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="room-deposit">Tiền cọc</Label>
                      <Input id="room-deposit" value={draft.deposit_amount} onChange={(event) => updateDraftField('deposit_amount', event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="room-area">Diện tích m²</Label>
                      <Input id="room-area" value={draft.area_sqm} onChange={(event) => updateDraftField('area_sqm', event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="room-bedroom-count">Phòng ngủ</Label>
                      <Input id="room-bedroom-count" value={draft.bedroom_count} onChange={(event) => updateDraftField('bedroom_count', event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="room-bathroom-count">Phòng tắm</Label>
                      <Input id="room-bathroom-count" value={draft.bathroom_count} onChange={(event) => updateDraftField('bathroom_count', event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="room-max-occupants">Số người tối đa</Label>
                      <Input id="room-max-occupants" value={draft.max_occupants} onChange={(event) => updateDraftField('max_occupants', event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="room-min-lease-term">Thời hạn thuê tối thiểu</Label>
                      <Input id="room-min-lease-term" value={draft.min_lease_term} onChange={(event) => updateDraftField('min_lease_term', event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="room-electricity-cost">Giá điện</Label>
                      <Input id="room-electricity-cost" value={draft.electricity_cost} onChange={(event) => updateDraftField('electricity_cost', event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="room-water-cost">Giá nước</Label>
                      <Input id="room-water-cost" value={draft.water_cost} onChange={(event) => updateDraftField('water_cost', event.target.value)} />
                    </div>
                  </div>
                </Section>

                <Section title="Moderation và trạng thái" description="Sửa toàn bộ field moderation, verification và rules liên quan.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="room-status">Trạng thái listing</Label>
                      <Select value={draft.status ?? 'pending'} onValueChange={(value) => updateDraftField('status', value as AdminRoomStatus)}>
                        <SelectTrigger id="room-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROOM_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {ROOM_STATUS_LABELS[option]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="room-gender">Giới hạn giới tính</Label>
                      <Select value={draft.gender_restriction ?? 'none'} onValueChange={(value) => updateDraftField('gender_restriction', value as AdminGenderRestriction)}>
                        <SelectTrigger id="room-gender">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {GENDER_LABELS[option]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="room-available-from">Ngày có thể vào ở</Label>
                      <Input id="room-available-from" type="date" value={draft.available_from} onChange={(event) => updateDraftField('available_from', event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="room-verification-date">Ngày xác thực</Label>
                      <Input id="room-verification-date" type="datetime-local" value={draft.verification_date} onChange={(event) => updateDraftField('verification_date', event.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="room-rejection-reason">Lý do từ chối / ghi chú moderation</Label>
                      <Textarea id="room-rejection-reason" value={draft.rejection_reason} onChange={(event) => updateDraftField('rejection_reason', event.target.value)} className="min-h-24" />
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {BOOLEAN_FIELD_OPTIONS.map(([field, label]) => (
                      <div key={field} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                        <Switch checked={draft[field]} onCheckedChange={(checked) => updateBooleanField(field, Boolean(checked))} />
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Tiện ích phòng" description="Admin có thể bật/tắt mọi amenity gắn với room.">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {roomEditorAmenityFields.map((field) => (
                      <div key={field} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">{AMENITY_LABELS[field]}</span>
                        <Switch checked={draft.amenities[field]} onCheckedChange={(checked) => updateAmenity(field, Boolean(checked))} />
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Ảnh phòng" description="Tải ảnh lên storage hoặc dán URL có sẵn. Danh sách ảnh này sẽ được ghi đè toàn bộ khi lưu drawer.">
                  <div className="space-y-4">
                    <input
                      id="room-image-batch-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        void handleMultiImageUpload(event.target.files);
                        event.currentTarget.value = '';
                      }}
                    />
                    {draft.images.map((image, index) => (
                      <div key={`${index}-${image.image_url}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-4 grid gap-4 lg:grid-cols-[148px_minmax(0,1fr)]">
                          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            {image.image_url.trim() ? (
                              <img
                                src={image.image_url}
                                alt={image.caption || `Ảnh phòng ${index + 1}`}
                                className="h-36 w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-36 items-center justify-center text-sm text-slate-400">
                                Chưa có ảnh
                              </div>
                            )}
                          </div>
                          <div className="space-y-3">
                            <input
                              id={`room-image-file-${index}`}
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              className="hidden"
                              onChange={(event) => {
                                void handleImageUpload(index, event.target.files?.[0] ?? null);
                                event.currentTarget.value = '';
                              }}
                            />
                            <div className="flex flex-wrap items-center gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-full border-slate-200"
                                disabled={uploadingImageIndex !== null || isUploadingBatch}
                                onClick={() => {
                                  const input = document.getElementById(
                                    `room-image-file-${index}`,
                                  ) as HTMLInputElement | null;
                                  input?.click();
                                }}
                              >
                                {uploadingImageIndex === index ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                                {uploadingImageIndex === index ? 'Đang tải ảnh...' : 'Tải ảnh lên'}
                              </Button>
                              <p className="text-sm leading-6 text-slate-500">
                                Hỗ trợ JPEG, PNG, WebP tối đa 5MB. Upload xong sẽ tự điền URL bên dưới.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <Label htmlFor={`room-image-url-${index}`}>Image URL #{index + 1}</Label>
                            <Input id={`room-image-url-${index}`} value={image.image_url} onChange={(event) => updateImageField(index, 'image_url', event.target.value)} />
                          </div>
                          <div>
                            <Label htmlFor={`room-image-type-${index}`}>Loại ảnh</Label>
                            <Select value={image.image_type} onValueChange={(value) => updateImageField(index, 'image_type', value as AdminImageType)}>
                              <SelectTrigger id={`room-image-type-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {IMAGE_TYPE_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`room-image-order-${index}`}>Thứ tự hiển thị</Label>
                            <Input id={`room-image-order-${index}`} value={image.display_order} onChange={(event) => updateImageField(index, 'display_order', event.target.value)} />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor={`room-image-caption-${index}`}>Caption</Label>
                            <Input id={`room-image-caption-${index}`} value={image.caption} onChange={(event) => updateImageField(index, 'caption', event.target.value)} />
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <Button type="button" variant={image.is_primary ? 'default' : 'outline'} className="rounded-full" onClick={() => updateImageField(index, 'is_primary', true)}>
                            <ImagePlus className="h-4 w-4" />
                            {image.is_primary ? 'Ảnh đại diện' : 'Đặt làm ảnh đại diện'}
                          </Button>
                          <Button type="button" variant="ghost" className="rounded-full text-rose-700 hover:bg-rose-50 hover:text-rose-700" onClick={() => removeImage(index)}>
                            <Trash2 className="h-4 w-4" />
                            Xóa ảnh
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-slate-200"
                        disabled={uploadingImageIndex !== null || isUploadingBatch}
                        onClick={() => {
                          const input = document.getElementById(
                            'room-image-batch-upload',
                          ) as HTMLInputElement | null;
                          input?.click();
                        }}
                      >
                        {isUploadingBatch ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {isUploadingBatch ? 'Đang tải nhiều ảnh...' : 'Tải nhiều ảnh'}
                      </Button>
                      <Button type="button" variant="outline" className="rounded-full border-dashed border-slate-300" onClick={addImage}>
                        <Plus className="h-4 w-4" />
                        Thêm slot URL
                      </Button>
                    </div>
                  </div>
                </Section>

                <Section title="Furniture details JSON" description="Dùng khi cần lưu metadata nội thất chi tiết ngoài các field cơ bản.">
                  <Textarea value={draft.furniture_details} onChange={(event) => updateDraftField('furniture_details', event.target.value)} className="min-h-48 font-mono text-xs" />
                </Section>
              </div>

              <div className="space-y-6">
                <Section title="Snapshot" description="Tóm tắt nhanh các metadata và số liệu phụ trợ của listing.">
                  <div className="grid gap-3">
                    <DetailPill label="Chủ phòng" value={metadata?.landlord ?? 'Chưa có'} />
                    <DetailPill label="Tạo lúc" value={metadata?.created_at ?? 'Chưa có'} />
                    <DetailPill label="Cập nhật lúc" value={metadata?.updated_at ?? 'Chưa có'} />
                    <DetailPill label="Lượt xem" value={metadata?.view_count ?? '0 lượt xem'} />
                    <DetailPill label="Yêu thích" value={metadata?.favorite_count ?? '0 lượt thích'} />
                    <DetailPill label="Ảnh hiện có" value={`${draft.images.filter((image) => image.image_url.trim().length > 0).length} ảnh`} />
                  </div>
                </Section>

                <Section title="Các điểm cần chú ý">
                  <div className="space-y-3 text-sm leading-6 text-slate-600">
                    <p>- Lưu drawer này sẽ ghi đè lại toàn bộ danh sách ảnh của phòng.</p>
                    <p>- Upload ảnh mới sẽ tự điền URL vào draft hiện tại; sau đó vẫn cần bấm lưu thay đổi để ghi xuống DB.</p>
                    <p>- Ảnh cũ trong bucket `room-images` sẽ được dọn sau khi lưu nếu admin đã thay hoặc xóa khỏi danh sách.</p>
                    <p>- Nếu đổi địa chỉ, nên bấm geocode lại để search/map giữ đúng tọa độ.</p>
                    <p>- `Furniture details` phải là JSON hợp lệ; để trống nếu không dùng.</p>
                    <p>- Trạng thái verified và verification date nên đi cùng nhau để dashboard moderation không lệch.</p>
                  </div>
                </Section>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        <SheetFooter className="border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">{room ? `Room ID: ${room.id}` : 'Đang tải room...'}</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="rounded-full border-slate-200" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            <Button className="rounded-full" disabled={!room || !draft || updateRoom.isPending || uploadingImageIndex !== null || isUploadingBatch} onClick={() => void handleSave()}>
              {updateRoom.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Lưu thay đổi
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

