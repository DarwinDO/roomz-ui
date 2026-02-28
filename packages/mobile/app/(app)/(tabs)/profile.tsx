import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { useAuth } from "../../../src/contexts/AuthContext";
import { LogOut, Settings, Shield, ChevronRight } from "lucide-react-native";

export default function ProfileScreen() {
    const { user, signOut } = useAuth();

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
            <View className="bg-primary-500 pt-16 pb-8 px-6 rounded-b-3xl">
                <View className="items-center">
                    <View className="w-20 h-20 rounded-full bg-primary-300 items-center justify-center border-4 border-white">
                        <Text className="text-2xl font-bold text-white">
                            {user.email?.charAt(0).toUpperCase() || "?"}
                        </Text>
                    </View>
                    <Text className="text-xl font-bold text-white mt-3">
                        User Profile
                    </Text>
                    <Text className="text-primary-100 text-sm mt-1">
                        {user.email}
                    </Text>
                </View>
            </View>

            {/* Menu Items */}
            <View className="px-4 mt-6 space-y-2">
                <MenuItem
                    icon={<Settings size={20} color="#64748b" />}
                    label="Cài đặt"
                    onPress={() => { }}
                />
                <MenuItem
                    icon={<Shield size={20} color="#64748b" />}
                    label="Xác minh tài khoản"
                    onPress={() => { }}
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

function MenuItem({ icon, label, onPress }: {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            className="flex-row items-center px-4 py-4 bg-surface rounded-xl"
            onPress={onPress}
        >
            {icon}
            <Text className="flex-1 text-text-primary font-medium ml-3">{label}</Text>
            <ChevronRight size={16} color="#94a3b8" />
        </TouchableOpacity>
    );
}
