import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MessageCircle, Users, Shield, Tag, Bell } from 'lucide-react-native';
import { formatRelativeTime } from '../src/utils/relativeTime';

const NOTIFICATION_ICONS = {
    message: MessageCircle,
    new_message: MessageCircle,
    match: Users,
    verification: Shield,
    deal: Tag,
    system: Bell,
    booking_request: Bell,
    booking_status: Bell,
    roommate_request: Users,
    sublet_request: Bell,
    sublet_approved: Bell,
    swap_match: Users,
    swap_request: Bell,
    swap_confirmed: Bell,
};

interface NotificationItemProps {
    id: string;
    type: 'message' | 'match' | 'verification' | 'deal' | 'system' | 'new_message' | 'booking_request' | 'booking_status' | 'roommate_request' | 'sublet_request' | 'sublet_approved' | 'swap_match' | 'swap_request' | 'swap_confirmed';
    title: string;
    body: string;
    created_at: string;
    is_read: boolean;
    data?: Record<string, unknown>;
    onPress: () => void;
}

export const NotificationItem = React.memo(function NotificationItem({
    type,
    title,
    body,
    created_at,
    is_read,
    onPress,
}: NotificationItemProps) {
    const Icon = NOTIFICATION_ICONS[type] || Bell;

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-row items-center px-4 py-4 border-b border-gray-100 ${is_read ? 'bg-surface' : 'bg-primary-50 border-l-4 border-l-primary-500'
                }`}
        >
            <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
                <Icon size={20} color="#0891b2" />
            </View>
            <View className="flex-1">
                <Text className="font-semibold text-text-primary">{title}</Text>
                <Text className="text-text-secondary text-sm mt-1" numberOfLines={2}>{body}</Text>
                <Text className="text-text-tertiary text-xs mt-1">{formatRelativeTime(created_at)}</Text>
            </View>
            {!is_read && <View className="w-2 h-2 rounded-full bg-primary-500 ml-2" />}
        </TouchableOpacity>
    );
});
