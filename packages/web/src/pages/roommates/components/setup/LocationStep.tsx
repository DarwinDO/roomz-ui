/**
 * LocationStep - Step 1 of Roommate Setup Wizard
 * User selects their preferred location for finding roommates
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ArrowRight, MapPin, School, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getProvinces, getDistricts, type Province, type District } from '@/services/vietnamLocations';
import { useAuth } from '@/contexts/AuthContext';

interface LocationStepProps {
    onNext: (data: {
        city: string;
        district: string;
        search_radius_km: number;
        university_based: boolean;
    }) => void;
    onBack: () => void;
    initialData?: {
        city: string;
        district: string;
        search_radius_km: number;
        university_based: boolean;
    };
}

export function LocationStep({ onNext, onBack, initialData }: LocationStepProps) {
    const { profile } = useAuth();
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(true);
    const [loadingDistricts, setLoadingDistricts] = useState(false);

    // Form state
    const [city, setCity] = useState(initialData?.city || '');
    const [district, setDistrict] = useState(initialData?.district || '');
    const [searchRadius, setSearchRadius] = useState(initialData?.search_radius_km || 5);
    const [universityBased, setUniversityBased] = useState(initialData?.university_based || false);

    // Load provinces on mount
    useEffect(() => {
        async function loadProvinces() {
            setLoadingProvinces(true);
            try {
                const data = await getProvinces();
                setProvinces(data);
            } catch (err) {
                console.error('Failed to load provinces:', err);
            } finally {
                setLoadingProvinces(false);
            }
        }
        loadProvinces();
    }, []);

    // Load districts when city changes
    useEffect(() => {
        async function loadDistricts() {
            if (!city) {
                setDistricts([]);
                return;
            }

            setLoadingDistricts(true);
            try {
                // Find province code by name
                const province = provinces.find(p => p.name === city);
                if (province) {
                    const data = await getDistricts(province.code, province.name);
                    setDistricts(data);
                }
            } catch (err) {
                console.error('Failed to load districts:', err);
            } finally {
                setLoadingDistricts(false);
            }
        }
        loadDistricts();
    }, [city, provinces]);

    // Handle university-based toggle
    useEffect(() => {
        if (universityBased && profile?.university) {
            // Auto-set location based on university (simplified mapping)
            // In production, you'd have a proper university-to-location mapping
            const universityMappings: Record<string, { city: string; district: string }> = {
                'ĐH Bách Khoa TP.HCM': { city: 'Thành phố Hồ Chí Minh', district: 'Quận 10' },
                'ĐH Kinh tế TP.HCM': { city: 'Thành phố Hồ Chí Minh', district: 'Quận 3' },
                'ĐH Quốc Gia': { city: 'Thành phố Hồ Chí Minh', district: 'Thủ Đức' },
                'ĐH Khoa học Xã hội': { city: 'Thành phố Hồ Chí Minh', district: 'Quận 1' },
            };

            if (profile?.university && universityMappings[profile.university]) {
                setCity(universityMappings[profile.university].city);
                setDistrict(universityMappings[profile.university].district);
            }
        }
    }, [universityBased, profile?.university]);

    const handleSubmit = () => {
        if (!city) return;

        onNext({
            city,
            district,
            search_radius_km: searchRadius,
            university_based: universityBased,
        });
    };

    const isValid = city.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto px-4 py-8"
        >
            {/* Header */}
            <div className="mb-8">
                <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại
                </Button>

                <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Khu vực bạn muốn tìm phòng?</h1>
                    <p className="text-muted-foreground">
                        Chúng tôi sẽ tìm bạn cùng phòng phù hợp trong khu vực này
                    </p>
                </div>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                    1
                </div>
                <div className="w-16 h-1 bg-muted rounded" />
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                    2
                </div>
                <div className="w-16 h-1 bg-muted rounded" />
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                    3
                </div>
            </div>

            {/* Form */}
            <Card className="p-6 rounded-2xl shadow-lg border-0">
                {/* University-based option */}
                {profile?.university && (
                    <div className="flex items-center justify-between mb-6 p-4 bg-primary/5 rounded-xl">
                        <div className="flex items-center gap-3">
                            <School className="w-5 h-5 text-primary" />
                            <div>
                                <p className="font-medium text-sm">Gần trường của tôi</p>
                                <p className="text-xs text-muted-foreground">{profile.university}</p>
                            </div>
                        </div>
                        <Switch
                            checked={universityBased}
                            onCheckedChange={setUniversityBased}
                        />
                    </div>
                )}

                {/* City Select */}
                <div className="space-y-4 mb-6">
                    <div>
                        <Label htmlFor="city" className="text-sm font-medium mb-2 block">
                            Thành phố / Tỉnh <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={city}
                            onValueChange={(value) => {
                                setCity(value);
                                setDistrict('');
                            }}
                            disabled={loadingProvinces || universityBased}
                        >
                            <SelectTrigger id="city">
                                {loadingProvinces ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Đang tải...</span>
                                    </div>
                                ) : (
                                    <SelectValue placeholder="Chọn thành phố" />
                                )}
                            </SelectTrigger>
                            <SelectContent>
                                {provinces.map((province) => (
                                    <SelectItem key={province.code} value={province.name}>
                                        {province.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* District Select */}
                    <div>
                        <Label htmlFor="district" className="text-sm font-medium mb-2 block">
                            Quận / Huyện
                        </Label>
                        <Select
                            value={district}
                            onValueChange={setDistrict}
                            disabled={!city || loadingDistricts || universityBased}
                        >
                            <SelectTrigger id="district">
                                {loadingDistricts ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Đang tải...</span>
                                    </div>
                                ) : (
                                    <SelectValue placeholder="Chọn quận/huyện (tùy chọn)" />
                                )}
                            </SelectTrigger>
                            <SelectContent>
                                {districts.map((d) => (
                                    <SelectItem key={d.code} value={d.name}>
                                        {d.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Search Radius */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium">Bán kính tìm kiếm</Label>
                        <span className="text-sm font-semibold text-primary">{searchRadius} km</span>
                    </div>
                    <Slider
                        value={[searchRadius]}
                        onValueChange={(value) => setSearchRadius(value[0])}
                        min={1}
                        max={20}
                        step={1}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>1 km</span>
                        <span>20 km</span>
                    </div>
                </div>

                {/* Submit Button */}
                <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={!isValid}
                >
                    Tiếp tục
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </Card>
        </motion.div>
    );
}
