/**
 * RoommateFilters - Filter panel for roommate results
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from '@/components/ui/sheet';
import { Filter, RotateCcw } from 'lucide-react';

export interface FilterOptions {
    gender: 'any' | 'male' | 'female';
    ageMin: number;
    ageMax: number;
    budgetMin: number;
    budgetMax: number;
    occupation: 'any' | 'student' | 'worker' | 'freelancer';
}

interface RoommateFiltersProps {
    filters: FilterOptions;
    onFiltersChange: (filters: FilterOptions) => void;
    resultCount: number;
}

const DEFAULT_FILTERS: FilterOptions = {
    gender: 'any',
    ageMin: 18,
    ageMax: 40,
    budgetMin: 0,
    budgetMax: 10,
    occupation: 'any',
};

export function RoommateFilters({
    filters,
    onFiltersChange,
    resultCount,
}: RoommateFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

    const handleApply = () => {
        onFiltersChange(localFilters);
        setIsOpen(false);
    };

    const handleReset = () => {
        setLocalFilters(DEFAULT_FILTERS);
        onFiltersChange(DEFAULT_FILTERS);
    };

    const hasActiveFilters =
        filters.gender !== 'any' ||
        filters.ageMin !== 18 ||
        filters.ageMax !== 40 ||
        filters.budgetMin !== 0 ||
        filters.budgetMax !== 10 ||
        filters.occupation !== 'any';

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                    <Filter className="w-4 h-4 mr-2" />
                    Bộ lọc
                    {hasActiveFilters && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent className="w-[350px] sm:w-[400px]">
                <SheetHeader>
                    <SheetTitle>Bộ lọc tìm kiếm</SheetTitle>
                    <SheetDescription>
                        Lọc kết quả theo tiêu chí của bạn
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* Gender */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">
                            Giới tính
                        </Label>
                        <Select
                            value={localFilters.gender}
                            onValueChange={(v) =>
                                setLocalFilters({ ...localFilters, gender: v as FilterOptions['gender'] })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">Tất cả</SelectItem>
                                <SelectItem value="male">Nam</SelectItem>
                                <SelectItem value="female">Nữ</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Age Range */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium">Độ tuổi</Label>
                            <span className="text-sm text-muted-foreground">
                                {localFilters.ageMin} - {localFilters.ageMax} tuổi
                            </span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <span className="text-xs text-muted-foreground">Từ</span>
                                <Slider
                                    value={[localFilters.ageMin]}
                                    onValueChange={([v]) =>
                                        setLocalFilters({
                                            ...localFilters,
                                            ageMin: Math.min(v, localFilters.ageMax - 1),
                                        })
                                    }
                                    min={18}
                                    max={50}
                                    step={1}
                                />
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">Đến</span>
                                <Slider
                                    value={[localFilters.ageMax]}
                                    onValueChange={([v]) =>
                                        setLocalFilters({
                                            ...localFilters,
                                            ageMax: Math.max(v, localFilters.ageMin + 1),
                                        })
                                    }
                                    min={18}
                                    max={50}
                                    step={1}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Budget Range */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium">Ngân sách</Label>
                            <span className="text-sm text-muted-foreground">
                                {localFilters.budgetMin} - {localFilters.budgetMax} triệu
                            </span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <span className="text-xs text-muted-foreground">Từ</span>
                                <Slider
                                    value={[localFilters.budgetMin]}
                                    onValueChange={([v]) =>
                                        setLocalFilters({
                                            ...localFilters,
                                            budgetMin: Math.min(v, localFilters.budgetMax - 1),
                                        })
                                    }
                                    min={0}
                                    max={15}
                                    step={0.5}
                                />
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">Đến</span>
                                <Slider
                                    value={[localFilters.budgetMax]}
                                    onValueChange={([v]) =>
                                        setLocalFilters({
                                            ...localFilters,
                                            budgetMax: Math.max(v, localFilters.budgetMin + 0.5),
                                        })
                                    }
                                    min={0}
                                    max={15}
                                    step={0.5}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Occupation */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">
                            Nghề nghiệp
                        </Label>
                        <Select
                            value={localFilters.occupation}
                            onValueChange={(v) =>
                                setLocalFilters({
                                    ...localFilters,
                                    occupation: v as FilterOptions['occupation'],
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">Tất cả</SelectItem>
                                <SelectItem value="student">Sinh viên</SelectItem>
                                <SelectItem value="worker">Đi làm</SelectItem>
                                <SelectItem value="freelancer">Freelancer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <SheetFooter className="flex gap-2">
                    <Button variant="outline" onClick={handleReset} className="flex-1">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Đặt lại
                    </Button>
                    <Button onClick={handleApply} className="flex-1">
                        Áp dụng ({resultCount})
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
