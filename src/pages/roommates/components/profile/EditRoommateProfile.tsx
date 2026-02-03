/**
 * EditRoommateProfile - Edit existing roommate profile
 * Allows users to update their roommate finder profile information
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
    ArrowLeft,
    Save,
    Loader2,
    MapPin,
    User,
    Wallet,
    Heart,
} from 'lucide-react';
import { useRoommateProfile } from '@/hooks/useRoommates';
import { toast } from 'sonner';

const HOBBY_OPTIONS = [
    'Âm nhạc', 'Nấu ăn', 'Leo núi', 'Chơi game', 'Đọc sách',
    'Yoga', 'Gym', 'Du lịch', 'Nhiếp ảnh', 'Vẽ tranh',
    'Xem phim', 'Thể thao', 'Học ngoại ngữ', 'Làm vườn',
];

const OCCUPATION_OPTIONS = [
    { value: 'student', label: 'Sinh viên' },
    { value: 'worker', label: 'Đi làm' },
    { value: 'freelancer', label: 'Freelancer' },
    { value: 'other', label: 'Khác' },
];

const GENDER_OPTIONS = [
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
    { value: 'other', label: 'Khác' },
];

const PREFERRED_GENDER_OPTIONS = [
    { value: 'any', label: 'Không phân biệt' },
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
];

export function EditRoommateProfile() {
    const navigate = useNavigate();
    const { profile, loading, updateProfile } = useRoommateProfile();
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        bio: '',
        hobbies: [] as string[],
        age: '',
        gender: '',
        occupation: '',
        preferred_gender: 'any',
        budget_min: 0,
        budget_max: 10,
        city: '',
        district: '',
        search_radius_km: 5,
    });

    // Load existing profile data
    useEffect(() => {
        if (profile) {
            setFormData({
                bio: profile.bio || '',
                hobbies: profile.hobbies || [],
                age: profile.age?.toString() || '',
                gender: profile.gender || '',
                occupation: profile.occupation || '',
                preferred_gender: profile.preferred_gender || 'any',
                budget_min: profile.budget_min ? profile.budget_min / 1000000 : 0,
                budget_max: profile.budget_max ? profile.budget_max / 1000000 : 10,
                city: profile.city || '',
                district: profile.district || '',
                search_radius_km: profile.search_radius_km || 5,
            });
        }
    }, [profile]);

    const handleHobbyToggle = (hobby: string) => {
        setFormData(prev => ({
            ...prev,
            hobbies: prev.hobbies.includes(hobby)
                ? prev.hobbies.filter(h => h !== hobby)
                : [...prev.hobbies, hobby].slice(0, 6),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await updateProfile({
                bio: formData.bio || undefined,
                hobbies: formData.hobbies.length > 0 ? formData.hobbies : undefined,
                age: formData.age ? parseInt(formData.age) : undefined,
                gender: (formData.gender || undefined) as 'male' | 'female' | 'other' | undefined,
                occupation: (formData.occupation || undefined) as 'student' | 'worker' | 'freelancer' | 'other' | undefined,
                preferred_gender: formData.preferred_gender as 'male' | 'female' | 'any',
                budget_min: formData.budget_min * 1000000,
                budget_max: formData.budget_max * 1000000,
                city: formData.city,
                district: formData.district || undefined,
                search_radius_km: formData.search_radius_km,
            });

            navigate('/roommates/profile');
        } catch (error) {
            toast.error('Không thể cập nhật profile. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <Card className="p-8 text-center">
                    <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Chưa có profile</h2>
                    <p className="text-muted-foreground mb-4">
                        Tạo profile để bắt đầu tìm bạn cùng phòng
                    </p>
                    <Button onClick={() => navigate('/roommates')}>
                        Tạo profile ngay
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" size="sm" onClick={() => navigate('/roommates/profile')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại
                </Button>
                <h1 className="text-xl font-bold">Chỉnh sửa Profile</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info Card */}
                <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold">Thông tin cơ bản</h2>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <Label htmlFor="bio">Giới thiệu bản thân</Label>
                        <Textarea
                            id="bio"
                            placeholder="Viết vài dòng giới thiệu về bản thân..."
                            value={formData.bio}
                            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                            rows={4}
                            maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {formData.bio.length}/500
                        </p>
                    </div>

                    {/* Age & Gender */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="age">Tuổi</Label>
                            <Input
                                id="age"
                                type="number"
                                min="18"
                                max="60"
                                placeholder="25"
                                value={formData.age}
                                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gender">Giới tính</Label>
                            <Select
                                value={formData.gender}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v }))}
                            >
                                <SelectTrigger id="gender">
                                    <SelectValue placeholder="Chọn giới tính" />
                                </SelectTrigger>
                                <SelectContent>
                                    {GENDER_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Occupation */}
                    <div className="space-y-2">
                        <Label htmlFor="occupation">Nghề nghiệp</Label>
                        <Select
                            value={formData.occupation}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, occupation: v }))}
                        >
                            <SelectTrigger id="occupation">
                                <SelectValue placeholder="Chọn nghề nghiệp" />
                            </SelectTrigger>
                            <SelectContent>
                                {OCCUPATION_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {/* Hobbies Card */}
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Heart className="w-5 h-5 text-pink-500" />
                        <h2 className="font-semibold">Sở thích</h2>
                        <span className="text-sm text-muted-foreground ml-auto">
                            {formData.hobbies.length}/6
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {HOBBY_OPTIONS.map(hobby => (
                            <Badge
                                key={hobby}
                                variant={formData.hobbies.includes(hobby) ? 'default' : 'outline'}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleHobbyToggle(hobby)}
                            >
                                {hobby}
                            </Badge>
                        ))}
                    </div>
                </Card>

                {/* Roommate Preferences Card */}
                <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-blue-500" />
                        <h2 className="font-semibold">Yêu cầu bạn cùng phòng</h2>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="preferred_gender">Muốn ở cùng</Label>
                        <Select
                            value={formData.preferred_gender}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, preferred_gender: v }))}
                        >
                            <SelectTrigger id="preferred_gender">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PREFERRED_GENDER_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {/* Budget Card */}
                <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Wallet className="w-5 h-5 text-green-500" />
                        <h2 className="font-semibold">Ngân sách</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span>Từ {formData.budget_min.toFixed(1)} triệu</span>
                            <span>đến {formData.budget_max.toFixed(1)} triệu/tháng</span>
                        </div>
                        <Slider
                            value={[formData.budget_min, formData.budget_max]}
                            min={0}
                            max={20}
                            step={0.5}
                            onValueChange={([min, max]) => {
                                setFormData(prev => ({
                                    ...prev,
                                    budget_min: min,
                                    budget_max: max,
                                }));
                            }}
                        />
                    </div>
                </Card>

                {/* Location Card */}
                <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-red-500" />
                        <h2 className="font-semibold">Khu vực tìm kiếm</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">Thành phố</Label>
                            <Input
                                id="city"
                                placeholder="Hà Nội"
                                value={formData.city}
                                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="district">Quận/Huyện</Label>
                            <Input
                                id="district"
                                placeholder="Cầu Giấy"
                                value={formData.district}
                                onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>Bán kính tìm kiếm</Label>
                            <span className="text-sm font-medium">{formData.search_radius_km} km</span>
                        </div>
                        <Slider
                            value={[formData.search_radius_km]}
                            min={1}
                            max={20}
                            step={1}
                            onValueChange={([value]) => {
                                setFormData(prev => ({ ...prev, search_radius_km: value }));
                            }}
                        />
                    </div>
                </Card>

                {/* Submit Button */}
                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate('/roommates/profile')}
                    >
                        Hủy
                    </Button>
                    <Button type="submit" className="flex-1" disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Lưu thay đổi
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </>
    );
}
