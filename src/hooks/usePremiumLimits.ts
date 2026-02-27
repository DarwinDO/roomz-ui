/**
 * usePremiumLimits Hook
 * Provides premium status and limit information for gating features
 */

import { useAuth } from '@/contexts';
import { hasPremiumAccess } from '@/services/payments';
import { useState, useEffect } from 'react';
import { FREE_LIMITS, PREMIUM_LIMITS } from '@/constants/premium';

export interface PremiumLimits {
    isPremium: boolean;
    viewLimit: number;
    requestLimit: number;
    favoriteLimit: number;
    phoneViewLimit: number;
    loading: boolean;
}

export function usePremiumLimits(): PremiumLimits {
    const { user } = useAuth();
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkPremium() {
            if (!user) {
                setLoading(false);
                setIsPremium(false);
                return;
            }

            try {
                const premium = await hasPremiumAccess(user.id);
                setIsPremium(premium);
            } catch {
                setIsPremium(false);
            } finally {
                setLoading(false);
            }
        }

        checkPremium();
    }, [user]);

    return {
        isPremium,
        viewLimit: isPremium ? PREMIUM_LIMITS.ROOMMATE_VIEWS_PER_DAY : FREE_LIMITS.ROOMMATE_VIEWS_PER_DAY,
        requestLimit: isPremium ? PREMIUM_LIMITS.ROOMMATE_REQUESTS_PER_DAY : FREE_LIMITS.ROOMMATE_REQUESTS_PER_DAY,
        favoriteLimit: isPremium ? PREMIUM_LIMITS.FAVORITES_MAX : FREE_LIMITS.FAVORITES_MAX,
        phoneViewLimit: isPremium ? PREMIUM_LIMITS.PHONE_VIEWS_PER_DAY : FREE_LIMITS.PHONE_VIEWS_PER_DAY,
        loading,
    };
}
