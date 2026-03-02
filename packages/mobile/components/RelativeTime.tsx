import { Text } from 'react-native';
import React from 'react';
import { formatRelativeTime } from '../src/utils/relativeTime';

interface RelativeTimeProps {
    date: string;
    className?: string;
}

export const RelativeTime = React.memo(function RelativeTime({
    date,
    className = '',
}: RelativeTimeProps) {
    const formattedTime = formatRelativeTime(date);

    return (
        <Text className={`text-xs text-text-secondary ${className}`}>
            {formattedTime}
        </Text>
    );
});
