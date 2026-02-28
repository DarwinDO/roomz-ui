/**
 * usePostSubletForm
 * Custom hook encapsulating all state, validation, and submission logic
 * for the PostSubletPage. Keeps the page component focused on rendering.
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts';
import { uploadMultipleRoomImages } from '@/services/roomImages';
import { useCreateSubletWithRoom } from '@/hooks/useSublets';
import { getProvinces, getDistricts } from '@/services/vietnamLocations';
import { toast } from 'sonner';

export const MAX_IMAGES = 8;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const STALE_TIME_24H = 24 * 60 * 60 * 1000;

export const ROOM_TYPES = [
    { value: 'private', label: 'Phòng riêng' },
    { value: 'shared', label: 'Phòng chung' },
    { value: 'studio', label: 'Studio' },
    { value: 'entire', label: 'Nguyên căn' },
] as const;

type RoomType = (typeof ROOM_TYPES)[number]['value'];

export interface RoomFormData {
    title: string;
    address: string;
    district: string;
    city: string;
    room_type: RoomType;
    price_per_month: string;
    area_sqm: string;
    bedroom_count: string;
    bathroom_count: string;
    furnished: boolean;
}

export interface SubletFormData {
    start_date: string;
    end_date: string;
    sublet_price: string;
    deposit_required: string;
    description: string;
}

const INITIAL_ROOM_DATA: RoomFormData = {
    title: '',
    address: '',
    district: '',
    city: '',
    room_type: 'private',
    price_per_month: '',
    area_sqm: '',
    bedroom_count: '1',
    bathroom_count: '1',
    furnished: false,
};

const INITIAL_SUBLET_DATA: SubletFormData = {
    start_date: '',
    end_date: '',
    sublet_price: '',
    deposit_required: '',
    description: '',
};

function getTodayString(): string {
    return new Date().toISOString().split('T')[0];
}

export function usePostSubletForm() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const createSublet = useCreateSubletWithRoom();

    const [step, setStep] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [roomData, setRoomData] = useState<RoomFormData>(INITIAL_ROOM_DATA);
    const [subletData, setSubletData] = useState<SubletFormData>(INITIAL_SUBLET_DATA);

    // -- Location: TanStack Query --
    const { data: provinces = [], isLoading: isLoadingProvinces } = useQuery({
        queryKey: ['provinces'],
        queryFn: getProvinces,
        staleTime: STALE_TIME_24H,
    });

    const selectedProvince = useMemo(
        () => provinces.find(p => p.name === roomData.city),
        [provinces, roomData.city],
    );

    const { data: districts = [], isLoading: isLoadingDistricts } = useQuery({
        queryKey: ['districts', selectedProvince?.code],
        queryFn: () => getDistricts(selectedProvince!.code, selectedProvince!.name),
        enabled: !!selectedProvince,
        staleTime: STALE_TIME_24H,
    });

    // -- Image previews via ObjectURL --
    const previewUrls = useMemo(
        () => selectedFiles.map(f => URL.createObjectURL(f)),
        [selectedFiles],
    );

    useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
        // Only revoke on unmount or when files change (previewUrls is derived)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFiles]);

    // -- Parsed prices (DRY) --
    const parsedPrices = useMemo(() => ({
        original: parseFloat(roomData.price_per_month) || 0,
        sublet: parseFloat(subletData.sublet_price) || 0,
    }), [roomData.price_per_month, subletData.sublet_price]);

    // -- Validation --
    const today = useMemo(() => getTodayString(), []);

    const isStep1Valid = useMemo(
        () => !!(roomData.title && roomData.address && roomData.city && parsedPrices.original > 0),
        [roomData.title, roomData.address, roomData.city, parsedPrices.original],
    );

    const dateError = useMemo(() => {
        if (!subletData.start_date || !subletData.end_date) return null;
        if (subletData.start_date < today) return 'Ngày bắt đầu không thể trong quá khứ';
        if (subletData.end_date <= subletData.start_date) return 'Ngày kết thúc phải sau ngày bắt đầu';
        return null;
    }, [subletData.start_date, subletData.end_date, today]);

    const priceCapExceeded = useMemo(() => {
        if (!parsedPrices.original || !parsedPrices.sublet) return false;
        return parsedPrices.sublet > parsedPrices.original * 1.2;
    }, [parsedPrices]);

    const isStep2Valid = useMemo(
        () => !!(
            subletData.start_date &&
            subletData.end_date &&
            parsedPrices.sublet > 0 &&
            !dateError &&
            !priceCapExceeded
        ),
        [subletData.start_date, subletData.end_date, parsedPrices.sublet, dateError, priceCapExceeded],
    );

    // -- Handlers (type-safe) --
    const handleRoomChange = <K extends keyof RoomFormData>(field: K, value: RoomFormData[K]) => {
        setRoomData(prev => {
            const next = { ...prev, [field]: value };
            if (field === 'city') next.district = '';
            return next;
        });
    };

    const handleSubletChange = <K extends keyof SubletFormData>(field: K, value: SubletFormData[K]) => {
        setSubletData(prev => ({ ...prev, [field]: value }));
    };

    // -- Image handling (no unsafe cast) --
    const processFiles = (files: File[]) => {
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
            if (file.size > MAX_FILE_SIZE_BYTES) {
                toast.error(`${file.name} vượt quá ${MAX_FILE_SIZE_MB}MB`);
                return false;
            }
            return true;
        });

        if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles]);
        }
    };

    const removeImage = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // -- Navigation --
    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        } else {
            navigate(-1);
        }
    };

    // -- Submit --
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
                try {
                    imageUrls = await uploadMultipleRoomImages(user.id, selectedFiles);
                } catch (err) {
                    console.error('[PostSublet] Image upload failed:', err);
                    toast.error('Không thể tải ảnh lên. Vui lòng thử lại.');
                    setIsUploading(false);
                    return;
                }
                setIsUploading(false);
            }

            await createSublet.mutateAsync({
                title: roomData.title,
                address: roomData.address,
                district: roomData.district || undefined,
                city: roomData.city,
                room_type: roomData.room_type,
                price_per_month: parsedPrices.original,
                area_sqm: roomData.area_sqm ? parseFloat(roomData.area_sqm) : undefined,
                bedroom_count: parseInt(roomData.bedroom_count) || 1,
                bathroom_count: parseInt(roomData.bathroom_count) || 1,
                furnished: roomData.furnished,
                image_urls: imageUrls.length > 0 ? imageUrls : undefined,
                start_date: subletData.start_date,
                end_date: subletData.end_date,
                sublet_price: parsedPrices.sublet,
                deposit_required: subletData.deposit_required
                    ? parseFloat(subletData.deposit_required)
                    : undefined,
                description: subletData.description || undefined,
            });

            setIsSuccess(true);
        } catch (err) {
            console.error('[PostSublet] Submit failed:', err);
            setIsUploading(false);
        }
    };

    return {
        // State
        user,
        step,
        setStep,
        roomData,
        subletData,
        selectedFiles,
        isUploading,
        isSuccess,
        isPending: createSublet.isPending,

        // Location
        provinces,
        districts,
        isLoadingProvinces,
        isLoadingDistricts,

        // Derived
        previewUrls,
        parsedPrices,
        today,
        isStep1Valid,
        isStep2Valid,
        dateError,
        priceCapExceeded,

        // Handlers
        handleRoomChange,
        handleSubletChange,
        processFiles,
        removeImage,
        handleSubmit,
        handleBack,
        navigate,
    };
}
