/**
 * SubletFilter Component
 * Filter panel for sublet listings
 * Following UX Psychology - Hick's Law: limit options
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Calendar, Tag, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import type { SubletFilters } from '@roomz/shared/types/swap';

interface SubletFilterProps {
    filters: SubletFilters;
    onChange: (filters: SubletFilters) => void;
    onReset: () => void;
}

const PRICE_RANGES = [
    { label: 'Dưới 2 triệu', min: 0, max: 2000000 },
    { label: '2-3 triệu', min: 2000000, max: 3000000 },
    { label: '3-5 triệu', min: 3000000, max: 5000000 },
    { label: '5-7 triệu', min: 5000000, max: 7000000 },
    { label: 'Trên 7 triệu', min: 7000000, max: Infinity },
];

const ROOM_TYPES = [
    { value: 'private', label: 'Phòng riêng' },
    { value: 'shared', label: 'Phòng chung' },
    { value: 'studio', label: 'Studio' },
    { value: 'entire', label: 'Căn hộ nguyên căn' },
];

export function SubletFilter({ filters, onChange, onReset }: SubletFilterProps) {
    const [localFilters, setLocalFilters] = useState<SubletFilters>(filters);

    // Use ref to store onChange callback to avoid infinite loop
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // Debounce the local filters to reduce API calls
    const debouncedFilters = useDebounce(localFilters, 300);

    // Trigger onChange when debounced filters change
    useEffect(() => {
        onChangeRef.current(debouncedFilters);
    }, [debouncedFilters]);

    // Sync local filters when external filters change
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleChange = useCallback((updates: Partial<SubletFilters>) => {
        setLocalFilters(prev => ({ ...prev, ...updates }));
    }, []);

    const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
        if (key === 'page' || key === 'pageSize') return false;
        return value !== undefined && value !== '';
    }).length;

    return (
        <Card className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Bộ lọc</h3>
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary">{activeFilterCount}</Badge>
                    )}
                </div>
                {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={onReset}>
                        Đặt lại
                    </Button>
                )}
            </div>

            {/* Location */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Khu vực
                </Label>
                <Input
                    placeholder="Nhập quận/thành phố..."
                    value={localFilters.district || ''}
                    onChange={(e) => handleChange({ district: e.target.value })}
                />
            </div>

            {/* Price Range */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Khoảng giá
                </Label>
                <div className="flex flex-wrap gap-2">
                    {PRICE_RANGES.map((range) => {
                        const isActive =
                            filters.min_price === range.min && filters.max_price === range.max;
                        return (
                            <Badge
                                key={range.label}
                                variant={isActive ? 'default' : 'outline'}
                                className="cursor-pointer hover:bg-primary/10"
                                onClick={() =>
                                    handleChange({
                                        min_price: isActive ? undefined : range.min,
                                        max_price: isActive ? undefined : range.max,
                                    })
                                }
                            >
                                {range.label}
                            </Badge>
                        );
                    })}
                </div>
            </div>

            {/* Room Type */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Loại phòng
                </Label>
                <div className="flex flex-wrap gap-2">
                    {ROOM_TYPES.map((type) => {
                        const isActive = filters.room_type === type.value;
                        return (
                            <Badge
                                key={type.value}
                                variant={isActive ? 'default' : 'outline'}
                                className="cursor-pointer hover:bg-primary/10"
                                onClick={() =>
                                    handleChange({
                                        room_type: isActive ? undefined : type.value as SubletFilters['room_type'],
                                    })
                                }
                            >
                                {type.label}
                            </Badge>
                        );
                    })}
                </div>
            </div>

            {/* Dates */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Thời gian
                </Label>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label className="text-xs text-muted-foreground">Từ ngày</Label>
                        <Input
                            type="date"
                            value={localFilters.start_date || ''}
                            onChange={(e) => handleChange({ start_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Đến ngày</Label>
                        <Input
                            type="date"
                            value={localFilters.end_date || ''}
                            onChange={(e) => handleChange({ end_date: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
}
