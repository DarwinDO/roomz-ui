import { Text } from 'react-native';
import React from 'react';

interface PriceDisplayProps {
    price: number;
    period?: 'month' | 'day';
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-bold',
};

export function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(price);
}

export const PriceDisplay = React.memo(function PriceDisplay({
    price,
    period = 'month',
    className = '',
    size = 'md',
}: PriceDisplayProps) {
    const periodText = period === 'month' ? '/tháng' : '/ngày';

    return (
        <Text className={`text-primary-600 ${sizeClasses[size]} ${className}`}>
            {formatPrice(price)}
            <Text className="text-text-secondary text-sm">{periodText}</Text>
        </Text>
    );
});
