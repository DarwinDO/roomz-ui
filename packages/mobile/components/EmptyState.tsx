import { View, Text } from 'react-native';
import React from 'react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export const EmptyState = React.memo(function EmptyState({
    icon,
    title,
    subtitle,
    action,
}: EmptyStateProps) {
    return (
        <View className="flex-1 items-center justify-center px-8 py-12">
            {icon && (
                <View className="mb-4">
                    {icon}
                </View>
            )}
            <Text className="text-lg font-semibold text-text-primary text-center mb-2">
                {title}
            </Text>
            {subtitle && (
                <Text className="text-sm text-text-secondary text-center mb-6">
                    {subtitle}
                </Text>
            )}
            {action}
        </View>
    );
});
