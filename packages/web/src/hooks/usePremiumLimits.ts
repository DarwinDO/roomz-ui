/**
 * usePremiumLimits Hook
 * Provides premium status and limit information for gating features
 */

import { useAuth } from '@/contexts';
import { getAnonymousEntitlements, getUserEntitlements, type UserEntitlements } from '@/services/payments';
import { useQuery } from '@tanstack/react-query';

export interface PremiumLimits extends UserEntitlements {
  loading: boolean;
}

export function usePremiumLimits(): PremiumLimits {
  const { user } = useAuth();
  const anonymousEntitlements = getAnonymousEntitlements();
  const query = useQuery({
    queryKey: ['entitlements', user?.id ?? 'anonymous'],
    queryFn: () => getUserEntitlements(user!.id),
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const entitlements = user ? (query.data ?? anonymousEntitlements) : anonymousEntitlements;

  return {
    ...entitlements,
    loading: user ? query.isLoading : false,
  };
}
