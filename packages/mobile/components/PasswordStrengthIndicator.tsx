import { useMemo } from 'react';
import { View, Text } from 'react-native';

interface PasswordStrengthIndicatorProps {
    password: string;
}

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

interface StrengthResult {
    level: StrengthLevel;
    score: number; // 0-4
    message: string;
}

/**
 * NIST-inspired password strength checker
 * Focuses on length over complexity
 * https://pages.nist.gov/800-63-3/sp800-63b.html
 */
function calculateStrength(password: string): StrengthResult {
    if (!password) {
        return { level: 'weak', score: 0, message: '' };
    }

    let score = 0;

    // Length is the primary factor (NIST approach)
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Minor bonus for variety (not required)
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    const varietyCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (varietyCount >= 3) score += 1;

    // Map score to level and message
    if (score <= 1) {
        return { level: 'weak', score, message: 'Yếu - Nên dùng ít nhất 12 ký tự' };
    }
    if (score === 2) {
        return { level: 'fair', score, message: 'Trung bình - Thêm độ dài để tốt hơn' };
    }
    if (score === 3) {
        return { level: 'good', score, message: 'Tốt - Mật khẩu an toàn' };
    }
    return { level: 'strong', score, message: 'Mạnh - Mật khẩu rất an toàn' };
}

const levelConfig: Record<StrengthLevel, { color: string; bg: string }> = {
    weak: { color: '#ef4444', bg: '#ef4444' }, // red-500
    fair: { color: '#eab308', bg: '#eab308' }, // yellow-500
    good: { color: '#3b82f6', bg: '#3b82f6' }, // blue-500
    strong: { color: '#22c55e', bg: '#22c55e' }, // green-500
};

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
    const strength = useMemo(() => calculateStrength(password), [password]);

    if (!password) {
        return (
            <View className="mt-1 space-y-1">
                <View className="flex-row gap-1 h-1">
                    {[...Array(4)].map((_, i) => (
                        <View key={i} className="flex-1 bg-gray-200 rounded-full" />
                    ))}
                </View>
                <Text className="text-xs text-gray-500">
                    Nên dùng 12+ ký tự. Độ dài quan trọng hơn độ phức tạp.
                </Text>
            </View>
        );
    }

    const config = levelConfig[strength.level];

    return (
        <View className="mt-1 space-y-1">
            <View className="flex-row gap-1 h-1">
                {[...Array(4)].map((_, i) => (
                    <View
                        key={i}
                        className="flex-1 rounded-full"
                        style={{ backgroundColor: i < strength.score ? config.bg : '#e5e7eb' }}
                    />
                ))}
            </View>
            <Text className="text-xs" style={{ color: config.color }}>
                {strength.message}
            </Text>
        </View>
    );
}
