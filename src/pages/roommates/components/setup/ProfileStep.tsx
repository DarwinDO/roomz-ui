/**
 * ProfileStep - Step 3 of Roommate Setup Wizard
 * User enters bio, hobbies, and additional info
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowLeft,
    User,
    Loader2,
    Gamepad2,
    Dumbbell,
    BookOpen,
    Music,
    Camera,
    Plane,
    Coffee,
    Film,
    Palette,
    Code,
    Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { RoommateProfileInput } from '@/services/roommates';

interface ProfileStepProps {
    onSubmit: (data: Partial<RoommateProfileInput>) => Promise<void>;
    onBack: () => void;
}

// Hobby options with icons
const hobbyOptions = [
    { value: 'gaming', label: 'Gaming', icon: Gamepad2 },
    { value: 'gym', label: 'Gym', icon: Dumbbell },
    { value: 'reading', label: 'Đọc sách', icon: BookOpen },
    { value: 'music', label: 'Âm nhạc', icon: Music },
    { value: 'photography', label: 'Chụp ảnh', icon: Camera },
    { value: 'travel', label: 'Du lịch', icon: Plane },
    { value: 'coffee', label: 'Cà phê', icon: Coffee },
    { value: 'movies', label: 'Xem phim', icon: Film },
    { value: 'art', label: 'Nghệ thuật', icon: Palette },
    { value: 'coding', label: 'Lập trình', icon: Code },
];

export function ProfileStep({ onSubmit, onBack }: ProfileStepProps) {
    const [loading, setLoading] = useState(false);

    // Form state
    const [bio, setBio] = useState('');
    const [hobbies, setHobbies] = useState<string[]>([]);
    const [age, setAge] = useState<string>('');
    const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
    const [preferredGender, setPreferredGender] = useState<'male' | 'female' | 'any'>('any');
    const [occupation, setOccupation] = useState<'student' | 'worker' | 'freelancer' | 'other' | ''>('');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');

    const toggleHobby = (hobby: string) => {
        if (hobbies.includes(hobby)) {
            setHobbies(hobbies.filter(h => h !== hobby));
        } else if (hobbies.length < 5) {
            setHobbies([...hobbies, hobby]);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSubmit({
                bio: bio || undefined,
                hobbies,
                age: age ? parseInt(age) : undefined,
                gender: gender || undefined,
                preferred_gender: preferredGender,
                occupation: occupation || undefined,
                budget_min: budgetMin ? parseInt(budgetMin) * 1000000 : undefined,
                budget_max: budgetMax ? parseInt(budgetMax) * 1000000 : undefined,
            });
        } finally {
            setLoading(false);
        }
    };

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
                        <User className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Hoàn tất profile</h1>
                    <p className="text-muted-foreground">
                        Giúp bạn cùng phòng tiềm năng hiểu thêm về bạn
                    </p>
                </div>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">
                    ✓
                </div>
                <div className="w-16 h-1 bg-primary rounded" />
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">
                    ✓
                </div>
                <div className="w-16 h-1 bg-primary rounded" />
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                    3
                </div>
            </div>

            {/* Form */}
            <Card className="p-6 rounded-2xl shadow-lg border-0 space-y-6">
                {/* Bio */}
                <div>
                    <Label htmlFor="bio" className="text-sm font-medium mb-2 block">
                        Giới thiệu về bạn
                    </Label>
                    <Textarea
                        id="bio"
                        placeholder="Ví dụ: Sinh viên CNTT năm 3, thích code và gym. Đang tìm bạn cùng phòng yên tĩnh để học tập!"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        maxLength={500}
                        className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                        {bio.length}/500
                    </p>
                </div>

                {/* Hobbies */}
                <div>
                    <Label className="text-sm font-medium mb-3 block">
                        Sở thích (chọn tối đa 5)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {hobbyOptions.map((hobby) => {
                            const Icon = hobby.icon;
                            const isSelected = hobbies.includes(hobby.value);
                            return (
                                <button
                                    key={hobby.value}
                                    type="button"
                                    onClick={() => toggleHobby(hobby.value)}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-2 rounded-full border transition-all',
                                        isSelected
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-muted hover:border-primary/50'
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-sm">{hobby.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Personal Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Age */}
                    <div>
                        <Label htmlFor="age" className="text-sm font-medium mb-2 block">
                            Tuổi
                        </Label>
                        <Input
                            id="age"
                            type="number"
                            placeholder="VD: 22"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            min={16}
                            max={60}
                        />
                    </div>

                    {/* Gender */}
                    <div>
                        <Label htmlFor="gender" className="text-sm font-medium mb-2 block">
                            Giới tính
                        </Label>
                        <Select value={gender} onValueChange={(v) => setGender(v as typeof gender)}>
                            <SelectTrigger id="gender">
                                <SelectValue placeholder="Chọn" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Nam</SelectItem>
                                <SelectItem value="female">Nữ</SelectItem>
                                <SelectItem value="other">Khác</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Occupation */}
                    <div>
                        <Label htmlFor="occupation" className="text-sm font-medium mb-2 block">
                            Nghề nghiệp
                        </Label>
                        <Select value={occupation} onValueChange={(v) => setOccupation(v as typeof occupation)}>
                            <SelectTrigger id="occupation">
                                <SelectValue placeholder="Chọn" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="student">Sinh viên</SelectItem>
                                <SelectItem value="worker">Đi làm</SelectItem>
                                <SelectItem value="freelancer">Freelancer</SelectItem>
                                <SelectItem value="other">Khác</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Preferred Gender */}
                    <div>
                        <Label htmlFor="preferredGender" className="text-sm font-medium mb-2 block">
                            Muốn ở cùng
                        </Label>
                        <Select value={preferredGender} onValueChange={(v) => setPreferredGender(v as typeof preferredGender)}>
                            <SelectTrigger id="preferredGender">
                                <SelectValue placeholder="Chọn" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">Không phân biệt</SelectItem>
                                <SelectItem value="male">Nam</SelectItem>
                                <SelectItem value="female">Nữ</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Budget */}
                <div>
                    <Label className="text-sm font-medium mb-3 block">
                        Ngân sách mong muốn (triệu VNĐ/tháng)
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Input
                                type="number"
                                placeholder="Từ"
                                value={budgetMin}
                                onChange={(e) => setBudgetMin(e.target.value)}
                                min={0}
                            />
                        </div>
                        <div>
                            <Input
                                type="number"
                                placeholder="Đến"
                                value={budgetMax}
                                onChange={(e) => setBudgetMax(e.target.value)}
                                min={0}
                            />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Đang xử lý...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Tìm bạn cùng phòng
                        </>
                    )}
                </Button>
            </Card>
        </motion.div>
    );
}
