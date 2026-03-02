import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, X, Save } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useRoommateProfile } from '@/src/hooks/useRoommateProfile';
import { useAuth } from '@/src/contexts/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { createRoommateProfile, updateRoommateProfile, type RoommateProfileInput } from '@roomz/shared';

// Predefined hobbies list
const PREDEFINED_HOBBIES = [
    'Đọc sách', 'Du lịch', 'Nấu ăn', 'Thể thao', 'Âm nhạc',
    'Phim ảnh', 'Chơi game', 'Nhiếp ảnh', 'Yoga', 'Vẽ',
    'Lập trình', 'Thiền', 'Thú cưng', 'Vườn tược', 'Nhảy múa',
];

type GenderPreference = 'male' | 'female' | 'any';
type OccupationType = 'student' | 'worker' | 'freelancer' | 'other';

const CITIES = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'];

export default function RoommateProfileSetupScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { profile, isLoading: isProfileLoading } = useRoommateProfile();

    const isEditMode = !!profile;

    // Form state
    const [city, setCity] = useState('');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');
    const [moveInDate, setMoveInDate] = useState<Date | null>(null);
    const [dateInput, setDateInput] = useState('');
    const [preferredGender, setPreferredGender] = useState<GenderPreference>('any');
    const [occupation, setOccupation] = useState<OccupationType>('student');
    const [bio, setBio] = useState('');
    const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Initialize form with existing profile data
    useEffect(() => {
        if (profile) {
            setCity(profile.city || '');
            setBudgetMin(profile.budget_min?.toString() || '');
            setBudgetMax(profile.budget_max?.toString() || '');
            if (profile.move_in_date) {
                const date = new Date(profile.move_in_date);
                setMoveInDate(date);
                setDateInput(date.toLocaleDateString('vi-VN'));
            }
            setPreferredGender(profile.preferred_gender || 'any');
            setOccupation(profile.occupation || 'student');
            setBio(profile.bio || '');
            setSelectedHobbies(profile.hobbies || []);
        }
    }, [profile]);

    // Mutation for saving profile
    const saveMutation = useMutation({
        mutationFn: async (data: RoommateProfileInput) => {
            if (!user?.id) throw new Error('User not authenticated');
            if (isEditMode) {
                return updateRoommateProfile(supabase, user.id, data);
            }
            return createRoommateProfile(supabase, user.id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roommate-profile', user?.id] });
            router.back();
        },
    });

    // Toggle hobby selection
    const toggleHobby = useCallback((hobby: string) => {
        setSelectedHobbies(prev =>
            prev.includes(hobby)
                ? prev.filter(h => h !== hobby)
                : [...prev, hobby]
        );
    }, []);

    // Handle date input change (DD/MM/YYYY format)
    const handleDateInputChange = (text: string) => {
        // Allow only numbers and slashes
        const cleaned = text.replace(/[^\d/]/g, '');
        setDateInput(cleaned);

        // Parse date if format is valid (DD/MM/YYYY)
        const parts = cleaned.split('/');
        if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
            const year = parseInt(parts[2], 10);
            const date = new Date(year, month, day);

            if (!isNaN(date.getTime()) && date >= new Date()) {
                setMoveInDate(date);
            }
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!city) {
            newErrors.city = 'Vui lòng chọn thành phố';
        }

        const minBudget = parseInt(budgetMin, 10);
        const maxBudget = parseInt(budgetMax, 10);

        if (budgetMin && budgetMax && minBudget > maxBudget) {
            newErrors.budget = 'Ngân sách tối thiểu phải nhỏ hơn ngân sách tối đa';
        }

        if (bio.length > 500) {
            newErrors.bio = 'Giới thiệu không được vượt quá 500 ký tự';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle save
    const handleSave = () => {
        if (!validateForm()) return;

        const profileData: RoommateProfileInput = {
            city,
            budget_min: budgetMin ? parseInt(budgetMin, 10) : undefined,
            budget_max: budgetMax ? parseInt(budgetMax, 10) : undefined,
            move_in_date: moveInDate?.toISOString(),
            preferred_gender: preferredGender,
            occupation,
            bio: bio || undefined,
            hobbies: selectedHobbies,
        };

        saveMutation.mutate(profileData);
    };

    // Gender options
    const genderOptions: { value: GenderPreference; label: string }[] = [
        { value: 'male', label: 'Nam' },
        { value: 'female', label: 'Nữ' },
        { value: 'any', label: 'Bất kỳ' },
    ];

    // Occupation options
    const occupationOptions: { value: OccupationType; label: string }[] = [
        { value: 'student', label: 'Sinh viên' },
        { value: 'worker', label: 'Đi làm' },
        { value: 'freelancer', label: 'Freelancer' },
        { value: 'other', label: 'Khác' },
    ];

    if (isProfileLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={['top']}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="text-text-secondary mt-4">Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
                    <Pressable
                        onPress={() => router.back()}
                        className="p-2 -ml-2 active:opacity-60"
                    >
                        <X size={24} color="#374151" />
                    </Pressable>
                    <Text className="text-lg font-semibold text-text-primary">
                        {isEditMode ? 'Chỉnh sửa hồ sơ' : 'Tạo hồ sơ'}
                    </Text>
                    <Pressable
                        onPress={handleSave}
                        disabled={saveMutation.isPending}
                        className={`p-2 -mr-2 ${saveMutation.isPending ? 'opacity-50' : 'active:opacity-60'}`}
                    >
                        {saveMutation.isPending ? (
                            <ActivityIndicator size="small" color="#3b82f6" />
                        ) : (
                            <Save size={24} color="#3b82f6" />
                        )}
                    </Pressable>
                </View>

                <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    {/* City Selector */}
                    <View className="mt-4 mb-4">
                        <Text className="text-sm font-medium text-text-primary mb-2">
                            Thành phố <Text className="text-red-500">*</Text>
                        </Text>
                        <Pressable
                            onPress={() => setShowCityDropdown(!showCityDropdown)}
                            className="flex-row items-center justify-between bg-surface border border-gray-200 rounded-xl px-4 py-3"
                        >
                            <Text className={city ? 'text-text-primary' : 'text-text-secondary'}>
                                {city || 'Chọn thành phố'}
                            </Text>
                            <ChevronDown size={20} color="#6b7280" />
                        </Pressable>
                        {showCityDropdown && (
                            <View className="mt-2 bg-surface border border-gray-200 rounded-xl overflow-hidden">
                                {CITIES.map((c) => (
                                    <Pressable
                                        key={c}
                                        onPress={() => {
                                            setCity(c);
                                            setShowCityDropdown(false);
                                            if (errors.city) {
                                                setErrors(prev => ({ ...prev, city: '' }));
                                            }
                                        }}
                                        className="px-4 py-3 border-b border-gray-100 active:bg-gray-50"
                                    >
                                        <Text className="text-text-primary">{c}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                        {errors.city && (
                            <Text className="text-red-500 text-xs mt-1">{errors.city}</Text>
                        )}
                    </View>

                    {/* Budget Range */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-text-primary mb-2">
                            Ngân sách (VNĐ/tháng)
                        </Text>
                        <View className="flex-row gap-3">
                            <View className="flex-1">
                                <TextInput
                                    placeholder="Tối thiểu"
                                    value={budgetMin}
                                    onChangeText={setBudgetMin}
                                    keyboardType="numeric"
                                    className="bg-surface border border-gray-200 rounded-xl px-4 py-3 text-text-primary"
                                />
                            </View>
                            <View className="flex-1">
                                <TextInput
                                    placeholder="Tối đa"
                                    value={budgetMax}
                                    onChangeText={setBudgetMax}
                                    keyboardType="numeric"
                                    className="bg-surface border border-gray-200 rounded-xl px-4 py-3 text-text-primary"
                                />
                            </View>
                        </View>
                        {errors.budget && (
                            <Text className="text-red-500 text-xs mt-1">{errors.budget}</Text>
                        )}
                    </View>

                    {/* Move-in Date */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-text-primary mb-2">
                            Ngày dự kiến chuyển vào (DD/MM/YYYY)
                        </Text>
                        <TextInput
                            placeholder="VD: 15/06/2025"
                            value={dateInput}
                            onChangeText={handleDateInputChange}
                            keyboardType="numeric"
                            className="bg-surface border border-gray-200 rounded-xl px-4 py-3 text-text-primary"
                        />
                        {moveInDate && (
                            <Text className="text-xs text-text-secondary mt-1">
                                Đã chọn: {moveInDate.toLocaleDateString('vi-VN')}
                            </Text>
                        )}
                    </View>

                    {/* Gender Preference */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-text-primary mb-2">
                            Giới tính bạn cùng phòng mong muốn
                        </Text>
                        <View className="flex-row gap-2">
                            {genderOptions.map((option) => (
                                <Pressable
                                    key={option.value}
                                    onPress={() => setPreferredGender(option.value)}
                                    className={`flex-1 py-3 px-2 rounded-xl items-center ${preferredGender === option.value
                                        ? 'bg-primary-500'
                                        : 'bg-surface border border-gray-200'
                                        }`}
                                >
                                    <Text
                                        className={`text-sm font-medium ${preferredGender === option.value
                                            ? 'text-white'
                                            : 'text-text-primary'
                                            }`}
                                    >
                                        {option.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Occupation */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-text-primary mb-2">
                            Nghề nghiệp
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                            {occupationOptions.map((option) => (
                                <Pressable
                                    key={option.value}
                                    onPress={() => setOccupation(option.value)}
                                    className={`py-2 px-4 rounded-full ${occupation === option.value
                                        ? 'bg-primary-500'
                                        : 'bg-surface border border-gray-200'
                                        }`}
                                >
                                    <Text
                                        className={`text-sm font-medium ${occupation === option.value
                                            ? 'text-white'
                                            : 'text-text-primary'
                                            }`}
                                    >
                                        {option.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Bio */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-text-primary mb-2">
                            Giới thiệu bản thân
                        </Text>
                        <TextInput
                            placeholder="Giới thiệu ngắn gọn về bản thân..."
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            className="bg-surface border border-gray-200 rounded-xl px-4 py-3 text-text-primary min-h-[100px]"
                            maxLength={500}
                        />
                        <Text className="text-xs text-text-secondary mt-1 text-right">
                            {bio.length}/500
                        </Text>
                        {errors.bio && (
                            <Text className="text-red-500 text-xs mt-1">{errors.bio}</Text>
                        )}
                    </View>

                    {/* Hobbies */}
                    <View className="mb-6">
                        <Text className="text-sm font-medium text-text-primary mb-2">
                            Sở thích (chọn nhiều)
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                            {PREDEFINED_HOBBIES.map((hobby) => (
                                <Pressable
                                    key={hobby}
                                    onPress={() => toggleHobby(hobby)}
                                    className={`py-2 px-4 rounded-full ${selectedHobbies.includes(hobby)
                                        ? 'bg-primary-500'
                                        : 'bg-surface border border-gray-200'
                                        }`}
                                >
                                    <Text
                                        className={`text-sm font-medium ${selectedHobbies.includes(hobby)
                                            ? 'text-white'
                                            : 'text-text-primary'
                                            }`}
                                    >
                                        {hobby}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Error message from mutation */}
                    {saveMutation.error && (
                        <Text className="text-red-500 text-sm text-center mb-4">
                            {saveMutation.error instanceof Error
                                ? saveMutation.error.message
                                : 'Đã xảy ra lỗi, vui lòng thử lại'}
                        </Text>
                    )}

                    {/* Bottom padding */}
                    <View className="h-8" />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
