import { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown, ChevronLeft } from 'lucide-react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { usePremium, type SubscriptionPeriod } from '../../src/hooks/usePremium';
import { FeatureItem } from '../../components/FeatureItem';
import { PricingCard } from '../../components/PricingCard';

const PREMIUM_FEATURES = [
    'Xem không giới hạn hồ sơ',
    'Gửi không giới hạn lời mời',
    'Ưu tiên hiển thị trong search',
    'Badge Premium trên profile',
    'Truy cập ưu đãi độc quyền',
];

/**
 * Payment Screen - RommZ+ Premium subscription
 * RevenueCat IAP integration
 */
export default function PaymentScreen() {
    const router = useRouter();
    const {
        isPremium,
        isLoading,
        offerings,
        purchasePackage,
        restorePurchases,
        isPurchasing,
    } = usePremium();

    const [selectedPeriod, setSelectedPeriod] = useState<SubscriptionPeriod>('quarterly');
    const [revenueCatAvailable] = useState(() => {
        try {
            return Purchases.isConfigured();
        } catch {
            return false;
        }
    });

    const handlePurchase = useCallback(async () => {
        if (!revenueCatAvailable || !offerings) {
            Alert.alert('Thông báo', 'Tính năng thanh toán đang được cập nhật.');
            return;
        }

        const packageToBuy = selectedPeriod === 'monthly'
            ? offerings.availablePackages.find(p => p.packageType === 'MONTHLY')
            : offerings.availablePackages.find(p => p.packageType === 'THREE_MONTH' || p.packageType === 'ANNUAL');

        if (!packageToBuy) {
            Alert.alert('Lỗi', 'Không tìm thấy gói đăng ký.');
            return;
        }

        try {
            const customerInfo = await purchasePackage(packageToBuy);
            if (customerInfo.entitlements.active['rommz_plus']) {
                Alert.alert('Thành công!', 'Chào mừng bạn đến RommZ+', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (err: any) {
            if (!err.userCancelled) {
                Alert.alert('Lỗi', 'Không thể hoàn tất thanh toán. Vui lòng thử lại.');
            }
        }
    }, [revenueCatAvailable, offerings, selectedPeriod, purchasePackage, router]);

    const handleRestore = useCallback(async () => {
        if (!revenueCatAvailable) {
            Alert.alert('Thông báo', 'Tính năng khôi phục đang được cập nhật.');
            return;
        }

        try {
            const customerInfo = await restorePurchases();
            if (customerInfo.entitlements.active['rommz_plus']) {
                Alert.alert('Đã khôi phục', 'Tài khoản RommZ+ đã được kích hoạt');
            } else {
                Alert.alert('Thông báo', 'Không tìm thấy giao dịch nào');
            }
        } catch {
            Alert.alert('Lỗi', 'Không thể khôi phục giao dịch');
        }
    }, [revenueCatAvailable, restorePurchases]);

    const openTerms = useCallback(() => {
        Linking.openURL('https://rommz.vn/terms');
    }, []);

    const openPrivacy = useCallback(() => {
        Linking.openURL('https://rommz.vn/privacy');
    }, []);

    // Already premium state
    if (isPremium) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-row items-center px-4 py-4 border-b border-gray-200">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ChevronLeft size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="flex-1 text-lg font-bold text-text-primary text-center mr-8">
                        RommZ+ Premium
                    </Text>
                </View>

                <View className="flex-1 items-center justify-center p-6">
                    <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-6">
                        <Crown size={48} color="#f59e0b" />
                    </View>
                    <Text className="text-2xl font-bold text-text-primary mb-2">
                        Bạn đã là thành viên RommZ+
                    </Text>
                    <Text className="text-text-secondary text-center">
                        Cảm ơn bạn đã đăng ký. Tận hưởng tất cả các tính năng premium!
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mt-8 bg-primary-500 px-8 py-3 rounded-full"
                    >
                        <Text className="text-white font-bold">Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Get pricing from RevenueCat or use defaults
    const monthlyPackage = offerings?.availablePackages.find(p => p.packageType === 'MONTHLY');
    const quarterlyPackage = offerings?.availablePackages.find(p =>
        p.packageType === 'THREE_MONTH' || p.packageType === 'ANNUAL'
    );

    const monthlyPrice = monthlyPackage?.product.priceString || '69.000đ';
    const quarterlyPrice = quarterlyPackage?.product.priceString || '169.000đ';

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center px-4 py-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ChevronLeft size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="flex-1 text-lg font-bold text-text-primary text-center mr-8">
                    RommZ+ Premium
                </Text>
            </View>

            <ScrollView className="flex-1">
                {/* Hero */}
                <View className="bg-primary-500 pt-8 pb-10 px-6">
                    <View className="items-center">
                        <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-4">
                            <Crown size={32} color="white" />
                        </View>
                        <Text className="text-2xl font-bold text-white text-center">
                            RommZ+ Premium
                        </Text>
                        <Text className="text-primary-100 text-center mt-2">
                            Mở khóa toàn bộ tính năng
                        </Text>
                    </View>
                </View>

                {/* Features */}
                <View className="px-4 -mt-4">
                    <View className="bg-surface rounded-2xl p-5 shadow-sm">
                        {PREMIUM_FEATURES.map((feature, index) => (
                            <FeatureItem key={index} text={feature} />
                        ))}
                    </View>
                </View>

                {/* Pricing Cards */}
                <View className="px-4 mt-6">
                    <Text className="text-text-primary font-bold mb-3">Chọn gói đăng ký</Text>
                    <View className="flex-row gap-3">
                        <PricingCard
                            title="Hàng tháng"
                            price={monthlyPrice}
                            period="/tháng"
                            isSelected={selectedPeriod === 'monthly'}
                            onSelect={() => setSelectedPeriod('monthly')}
                        />
                        <PricingCard
                            title="3 tháng"
                            price={quarterlyPrice}
                            period="/3 tháng"
                            savings="Tiết kiệm 18%"
                            isSelected={selectedPeriod === 'quarterly'}
                            onSelect={() => setSelectedPeriod('quarterly')}
                            isBestValue
                        />
                    </View>
                </View>

                {/* CTA Button */}
                <View className="px-4 mt-8 mb-4">
                    <TouchableOpacity
                        onPress={handlePurchase}
                        disabled={isPurchasing || isLoading}
                        className={`
                            py-4 rounded-full items-center shadow-lg
                            ${isPurchasing || isLoading ? 'bg-gray-400' : 'bg-primary-500'}
                        `}
                        activeOpacity={0.8}
                    >
                        {isPurchasing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-base">
                                Đăng ký ngay
                            </Text>
                        )}
                    </TouchableOpacity>

                    {!revenueCatAvailable && (
                        <Text className="text-amber-600 text-xs text-center mt-2">
                            Tính năng thanh toán đang được cập nhật
                        </Text>
                    )}
                </View>

                {/* Auto-renew notice */}
                <Text className="text-text-tertiary text-xs text-center px-8 mb-6">
                    Tự động gia hạn. Hủy bất kỳ lúc nào qua App Store / Google Play.
                </Text>

                {/* Links */}
                <View className="px-4 pb-8">
                    <TouchableOpacity
                        onPress={handleRestore}
                        className="items-center py-3"
                    >
                        <Text className="text-primary-600 text-sm underline">
                            Khôi phục giao dịch
                        </Text>
                    </TouchableOpacity>

                    <View className="flex-row justify-center gap-4 mt-2">
                        <TouchableOpacity onPress={openTerms}>
                            <Text className="text-text-tertiary text-xs underline">
                                Điều khoản
                            </Text>
                        </TouchableOpacity>
                        <Text className="text-text-tertiary text-xs">•</Text>
                        <TouchableOpacity onPress={openPrivacy}>
                            <Text className="text-text-tertiary text-xs underline">
                                Chính sách
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
