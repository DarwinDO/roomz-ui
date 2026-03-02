import { View, Text, TouchableOpacity } from 'react-native';
import { Clock, ShieldCheck, XCircle, RefreshCw } from 'lucide-react-native';
import type { VerificationStatus } from '@roomz/shared';

interface VerificationStatusCardProps {
    status: VerificationStatus | null | undefined;
    submittedAt?: string;
    rejectionReason?: string | null;
    onRetry?: () => void;
}

/**
 * Displays verification status with appropriate UI
 * - Pending: Clock icon with waiting message
 * - Approved: Shield check with verified badge
 * - Rejected: X circle with reason and retry option
 */
export function VerificationStatusCard({
    status,
    submittedAt,
    rejectionReason,
    onRetry,
}: VerificationStatusCardProps) {
    if (status === 'pending') {
        return (
            <View className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <View className="flex-row items-center mb-3">
                    <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center mr-3">
                        <Clock size={24} color="#f59e0b" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-amber-900 font-bold text-lg">
                            Đang xét duyệt
                        </Text>
                        {submittedAt && (
                            <Text className="text-amber-700 text-sm">
                                Gửi lúc {new Date(submittedAt).toLocaleString('vi-VN')}
                            </Text>
                        )}
                    </View>
                </View>
                <Text className="text-amber-800 text-sm leading-5">
                    Quá trình xét duyệt thường mất 1-3 ngày làm việc. Chúng tôi sẽ thông báo khi có kết quả.
                </Text>
            </View>
        );
    }

    if (status === 'approved') {
        return (
            <View className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mr-3">
                        <ShieldCheck size={24} color="#22c55e" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-green-900 font-bold text-lg">
                            Đã xác minh
                        </Text>
                        <Text className="text-green-700 text-sm">
                            Tài khoản của bạn đã được xác thực
                        </Text>
                    </View>
                    <View className="bg-green-500 px-3 py-1 rounded-full">
                        <Text className="text-white text-xs font-bold">VERIFIED</Text>
                    </View>
                </View>
            </View>
        );
    }

    if (status === 'rejected') {
        return (
            <View className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <View className="flex-row items-center mb-3">
                    <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center mr-3">
                        <XCircle size={24} color="#ef4444" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-red-900 font-bold text-lg">
                            Bị từ chối
                        </Text>
                        <Text className="text-red-700 text-sm">
                            Yêu cầu xác minh không được chấp nhận
                        </Text>
                    </View>
                </View>

                {rejectionReason && (
                    <View className="bg-red-100 rounded-xl p-3 mb-4">
                        <Text className="text-red-800 text-sm">
                            <Text className="font-medium">Lý do: </Text>
                            {rejectionReason}
                        </Text>
                    </View>
                )}

                {onRetry && (
                    <TouchableOpacity
                        onPress={onRetry}
                        className="flex-row items-center justify-center bg-red-500 py-3 rounded-xl"
                        activeOpacity={0.8}
                    >
                        <RefreshCw size={18} color="white" />
                        <Text className="text-white font-medium ml-2">Gửi lại</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return null;
}
