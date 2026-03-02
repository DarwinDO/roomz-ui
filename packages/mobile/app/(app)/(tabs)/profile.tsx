import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../../src/contexts/AuthContext";
import { useVerification } from "../../../src/hooks/useVerification";
import { usePremium } from "../../../src/hooks/usePremium";
import { useUnreadCount } from "../../../src/hooks/useUnreadCount";
import { LogOut, Settings, Shield, ChevronRight, Crown, ShieldCheck, Clock, Bell } from "lucide-react-native";

export default function ProfileScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { status: verificationStatus } = useVerification();
    const { isPremium } = usePremium();
    // MVP: dùng chat unread count cho notification badge
    // TODO: Replace với real notification count khi có notifications table
    const { count: unreadCount } = useUnreadCount();

    if (!user) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <Text className="text-text-secondary">Chưa đăng nhập</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-background">
            {/* Header */}
            <View className="bg-primary-500 pt-12 pb-8 px-6 rounded-b-3xl">
                {/* Notification Bell */}
                <View className="flex-row justify-end mb-2">
                    <TouchableOpacity
                        onPress={() => router.push('/(app)/notifications' as never)}
                        className="p-2 relative"
                    >
                        <Bell size={24} color="white" />
                        {unreadCount > 0 && (
                            <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 items-center justify-center">
                                <Text className="text-white text-xs font-bold">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View className="items-center">
                    {/* Avatar with Verification Badge */}
                    <View className="relative">
                        <View className="w-20 h-20 rounded-full bg-primary-300 items-center justify-center border-4 border-white">
                            <Text className="text-2xl font-bold text-white">
                                {(user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)).toUpperCase() || "?"}
                            </Text>
                        </View>
                        {/* Verification Badge */}
                        {verificationStatus?.status === 'approved' && (
                            <View className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 border-2 border-white items-center justify-center">
                                <ShieldCheck size={14} color="white" />
                            </View>
                        )}
                        {verificationStatus?.status === 'pending' && (
                            <View className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 border-2 border-white items-center justify-center">
                                <Clock size={14} color="white" />
                            </View>
                        )}
                    </View>

                    <Text className="text-xl font-bold text-white mt-3">
                        {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                    </Text>
                    <Text className="text-primary-100 text-sm mt-1">
                        {user.email}
                    </Text>

                    {/* Premium Badge */}
                    {isPremium && (
                        <View className="flex-row items-center bg-amber-500/20 px-3 py-1 rounded-full mt-2">
                            <Crown size={12} color="#fbbf24" />
                            <Text className="text-amber-300 text-xs font-bold ml-1">RoomZ+</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Menu Items */}
            <View className="px-4 mt-6 space-y-2">
                <MenuItem
                    icon={<Settings size={20} color="#64748b" />}
                    label="Cài đặt"
                    onPress={() => router.push('/(app)/settings' as never)}
                />
                <MenuItem
                    icon={
                        <Shield
                            size={20}
                            color={verificationStatus?.status === 'approved' ? '#22c55e' : '#64748b'}
                        />
                    }
                    label="Xác minh tài khoản"
                    value={
                        verificationStatus?.status === 'approved'
                            ? '✅ Đã xác minh'
                            : verificationStatus?.status === 'pending'
                                ? '⏳ Đang chờ'
                                : ''
                    }
                    onPress={() => router.push('/verification' as never)}
                />
                <MenuItem
                    icon={<Crown size={20} color="#f59e0b" />}
                    label="RoomZ+ Premium"
                    value={isPremium ? '✅ Đã kích hoạt' : ''}
                    onPress={() => router.push('/payment' as never)}
                />
            </View>

            {/* Sign Out */}
            <View className="px-4 mt-8">
                <TouchableOpacity
                    className="flex-row items-center px-4 py-4 bg-red-50 rounded-xl"
                    onPress={signOut}
                >
                    <LogOut size={20} color="#ef4444" />
                    <Text className="text-red-500 font-medium ml-3">Đăng xuất</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

function MenuItem({ icon, label, value, onPress }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            className="flex-row items-center px-4 py-4 bg-surface rounded-xl"
            onPress={onPress}
        >
            {icon}
            <Text className="flex-1 text-text-primary font-medium ml-3">{label}</Text>
            {value ? (
                <Text className="text-text-secondary text-sm mr-2">{value}</Text>
            ) : null}
            <ChevronRight size={16} color="#94a3b8" />
        </TouchableOpacity>
    );
}
