import { Tabs } from "expo-router";
import { Search, Users, MessageCircle, Compass, User } from "lucide-react-native";
import { useUnreadCount } from "@/src/hooks/useUnreadCount";

export default function TabLayout() {
    const { count: unreadCount } = useUnreadCount();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#2a9d6a",
                tabBarInactiveTintColor: "#94a3b8",
                tabBarStyle: {
                    backgroundColor: "#ffffff",
                    borderTopColor: "#e2e8f0",
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 60,
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Tìm phòng",
                    tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="roommates"
                options={{
                    title: "Bạn cùng phòng",
                    tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: "Tin nhắn",
                    tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                }}
            />
            <Tabs.Screen
                name="discover"
                options={{
                    title: "Khám phá",
                    tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Hồ sơ",
                    tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
