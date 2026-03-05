/**
 * NavigationButton - Button mở Google Maps/Apple Maps để chỉ đường
 * 
 * Features:
 * - iOS: Mở Apple Maps (hoặc Google Maps nếu cài)
 * - Android: Mở Google Maps
 * - Hiển thị tên địa điểm
 */
import React from 'react';
import { TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { Navigation } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';

interface NavigationButtonProps {
    latitude: number;
    longitude: number;
    label?: string;
    variant?: 'default' | 'small' | 'icon-only';
}

export function NavigationButton({
    latitude,
    longitude,
    label = 'Địa điểm',
    variant = 'default',
}: NavigationButtonProps) {
    const openNavigation = async () => {
        const destination = `${latitude},${longitude}`;
        const encodedLabel = encodeURIComponent(label);

        let url: string;

        if (Platform.OS === 'ios') {
            // Thử mở Apple Maps trước
            url = `http://maps.apple.com/?daddr=${destination}&q=${encodedLabel}`;
        } else {
            // Android: Mở Google Maps
            url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${encodedLabel}`;
        }

        // Kiểm tra có thể mở URL không
        const canOpen = await Linking.canOpenURL(url);

        if (canOpen) {
            await Linking.openURL(url);
        } else {
            Alert.alert(
                'Không thể mở bản đồ',
                'Vui lòng cài đặt Google Maps hoặc Apple Maps để sử dụng tính năng chỉ đường.'
            );
        }
    };

    if (variant === 'icon-only') {
        return (
            <TouchableOpacity
                onPress={openNavigation}
                style={{
                    padding: 8,
                    backgroundColor: '#0284C7',
                    borderRadius: 8,
                }}
            >
                <Navigation size={20} color="white" />
            </TouchableOpacity>
        );
    }

    if (variant === 'small') {
        return (
            <TouchableOpacity
                onPress={openNavigation}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    backgroundColor: '#0284C7',
                    borderRadius: 8,
                    gap: 4,
                }}
            >
                <Navigation size={16} color="white" />
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                    Chỉ đường
                </Text>
            </TouchableOpacity>
        );
    }

    // Default variant
    return (
        <TouchableOpacity
            onPress={openNavigation}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: '#0284C7',
                borderRadius: 12,
                gap: 8,
            }}
        >
            <Navigation size={20} color="white" />
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                Chỉ đường
            </Text>
        </TouchableOpacity>
    );
}