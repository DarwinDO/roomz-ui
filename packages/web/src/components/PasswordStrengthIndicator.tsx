import { useMemo } from 'react';

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

const levelConfig: Record<StrengthLevel, { color: string; bg: string; width: string }> = {
    weak: { color: 'text-red-500', bg: 'bg-red-500', width: 'w-1/4' },
    fair: { color: 'text-yellow-500', bg: 'bg-yellow-500', width: 'w-2/4' },
    good: { color: 'text-blue-500', bg: 'bg-blue-500', width: 'w-3/4' },
    strong: { color: 'text-green-500', bg: 'bg-green-500', width: 'w-full' },
};

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
    const strength = useMemo(() => calculateStrength(password), [password]);

    if (!password) {
        return (
            <div className="space-y-1">
                <div className="flex gap-1 h-1">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex-1 bg-gray-200 rounded-full" />
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                    Nên dùng 12+ ký tự. Độ dài quan trọng hơn độ phức tạp.
                </p>
            </div>
        );
    }

    const config = levelConfig[strength.level];

    return (
        <div className="space-y-1">
            <div className="flex gap-1 h-1">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${i < strength.score ? config.bg : 'bg-gray-200'
                            }`}
                    />
                ))}
            </div>
            <p className={`text-xs ${config.color} transition-colors duration-300`}>
                {strength.message}
            </p>
        </div>
    );
}
