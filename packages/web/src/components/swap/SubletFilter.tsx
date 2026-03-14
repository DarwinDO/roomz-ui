import { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar, Home, MapPin, Sofa, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/useDebounce';
import type { SubletFilters } from '@roomz/shared/types/swap';

interface SubletFilterProps {
  filters: SubletFilters;
  onChange: (filters: SubletFilters) => void;
  onReset: () => void;
}

const PRICE_RANGES = [
  { label: 'Dưới 2 triệu', min: 0, max: 2_000_000 },
  { label: '2-3 triệu', min: 2_000_000, max: 3_000_000 },
  { label: '3-5 triệu', min: 3_000_000, max: 5_000_000 },
  { label: '5-7 triệu', min: 5_000_000, max: 7_000_000 },
  { label: 'Trên 7 triệu', min: 7_000_000, max: Infinity },
] as const;

const ROOM_TYPES = [
  { value: 'private', label: 'Phòng riêng' },
  { value: 'shared', label: 'Phòng chung' },
  { value: 'studio', label: 'Studio' },
  { value: 'entire', label: 'Nguyên căn' },
] as const;

export function SubletFilter({ filters, onChange, onReset }: SubletFilterProps) {
  const [localFilters, setLocalFilters] = useState<SubletFilters>(filters);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const debouncedFilters = useDebounce(localFilters, 300);

  useEffect(() => {
    onChangeRef.current(debouncedFilters);
  }, [debouncedFilters]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = useCallback((updates: Partial<SubletFilters>) => {
    setLocalFilters((previous) => ({ ...previous, ...updates }));
  }, []);

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'page' || key === 'pageSize') return false;
    return value !== undefined && value !== '';
  }).length;

  return (
    <Card className="rounded-[26px] border border-slate-200 p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">Bộ lọc short-stay</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Giữ bộ lọc gọn để ra quyết định nhanh hơn, đúng với nhu cầu ở tạm thời.
          </p>
        </div>
        {activeFilterCount > 0 ? (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Đặt lại
          </Button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4" />
            Thành phố
          </Label>
          <Input
            placeholder="Ví dụ: Thành phố Hà Nội"
            value={localFilters.city || ''}
            onChange={(event) => handleChange({ city: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4" />
            Quận / khu vực
          </Label>
          <Input
            placeholder="Ví dụ: Quận Cầu Giấy"
            value={localFilters.district || ''}
            onChange={(event) => handleChange({ district: event.target.value })}
          />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Tag className="h-4 w-4" />
          Khoảng giá
        </Label>
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((range) => {
            const isActive = filters.min_price === range.min && filters.max_price === range.max;
            return (
              <Badge
                key={range.label}
                variant={isActive ? 'default' : 'outline'}
                className="cursor-pointer rounded-full px-3 py-1 hover:bg-primary/10"
                onClick={() => handleChange({ min_price: isActive ? undefined : range.min, max_price: isActive ? undefined : range.max })}
              >
                {range.label}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Home className="h-4 w-4" />
            Loại chỗ ở
          </Label>
          <div className="flex flex-wrap gap-2">
            {ROOM_TYPES.map((type) => {
              const isActive = filters.room_type === type.value;
              return (
                <Badge
                  key={type.value}
                  variant={isActive ? 'default' : 'outline'}
                  className="cursor-pointer rounded-full px-3 py-1 hover:bg-primary/10"
                  onClick={() => handleChange({ room_type: isActive ? undefined : type.value })}
                >
                  {type.label}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Sofa className="h-4 w-4" />
            Nội thất
          </Label>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={filters.furnished === true ? 'default' : 'outline'}
              className="cursor-pointer rounded-full px-3 py-1 hover:bg-primary/10"
              onClick={() => handleChange({ furnished: filters.furnished === true ? undefined : true })}
            >
              Có nội thất
            </Badge>
            <Badge
              variant={filters.furnished === false ? 'default' : 'outline'}
              className="cursor-pointer rounded-full px-3 py-1 hover:bg-primary/10"
              onClick={() => handleChange({ furnished: filters.furnished === false ? undefined : false })}
            >
              Không nội thất
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Từ ngày
          </Label>
          <Input type="date" value={localFilters.start_date || ''} onChange={(event) => handleChange({ start_date: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Đến ngày
          </Label>
          <Input type="date" value={localFilters.end_date || ''} onChange={(event) => handleChange({ end_date: event.target.value })} />
        </div>
      </div>
    </Card>
  );
}
