import { useState, useEffect, useCallback } from 'react';
import Purchases, {
    type PurchasesOffering,
    type PurchasesPackage,
    type CustomerInfo,
} from 'react-native-purchases';

export type SubscriptionPeriod = 'monthly' | 'quarterly';

interface UsePremiumReturn {
    isPremium: boolean;
    isLoading: boolean;
    offerings: PurchasesOffering | null;
    customerInfo: CustomerInfo | null;
    checkPremium: () => Promise<void>;
    purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo>;
    restorePurchases: () => Promise<CustomerInfo>;
    isPurchasing: boolean;
    error: Error | null;
}

/**
 * Hook for RevenueCat premium subscription management
 * - Checks premium status
 * - Fetches available offerings
 * - Handles purchases and restore
 */
export function usePremium(): UsePremiumReturn {
    const [isPremium, setIsPremium] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const checkPremiumStatus = useCallback(async (info?: CustomerInfo) => {
        try {
            const customer = info || await Purchases.getCustomerInfo();
            setCustomerInfo(customer);
            const hasPremium = customer.entitlements.active['rommz_plus'] !== undefined;
            setIsPremium(hasPremium);
        } catch (err) {
            console.error('Failed to check premium status:', err);
            setIsPremium(false);
        }
    }, []);

    const loadOfferings = useCallback(async () => {
        try {
            const offerings = await Purchases.getOfferings();
            setOfferings(offerings.current);
        } catch (err) {
            console.error('Failed to load offerings:', err);
            setError(err instanceof Error ? err : new Error('Failed to load offerings'));
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            if (!isMounted) return;
            setIsLoading(true);
            try {
                // Check if RevenueCat is configured before calling any API
                const isConfigured = (() => {
                    try { return Purchases.isConfigured(); }
                    catch { return false; }
                })();

                if (!isConfigured) {
                    console.warn('RevenueCat not configured, skipping premium check');
                    if (isMounted) setIsLoading(false);
                    return;
                }

                await checkPremiumStatus();
                await loadOfferings();
            } catch (err) {
                console.error('Premium init error:', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        init();

        return () => {
            isMounted = false;
        };
    }, [checkPremiumStatus, loadOfferings]);

    const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<CustomerInfo> => {
        setIsPurchasing(true);
        setError(null);
        try {
            const { customerInfo } = await Purchases.purchasePackage(pkg);
            await checkPremiumStatus(customerInfo);
            return customerInfo;
        } catch (err: any) {
            if (!err.userCancelled) {
                const error = err instanceof Error ? err : new Error('Purchase failed');
                setError(error);
                throw error;
            }
            throw err;
        } finally {
            setIsPurchasing(false);
        }
    }, [checkPremiumStatus]);

    const restorePurchases = useCallback(async (): Promise<CustomerInfo> => {
        setIsLoading(true);
        setError(null);
        try {
            const customerInfo = await Purchases.restorePurchases();
            await checkPremiumStatus(customerInfo);
            return customerInfo;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Restore failed');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [checkPremiumStatus]);

    return {
        isPremium,
        isLoading,
        offerings,
        customerInfo,
        checkPremium: checkPremiumStatus,
        purchasePackage,
        restorePurchases,
        isPurchasing,
        error,
    };
}
