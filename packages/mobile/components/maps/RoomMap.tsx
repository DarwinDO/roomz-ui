/**
 * RoomMap - React Native Map Component cho RoomZ
 * Sử dụng react-native-maps với Google Maps provider
 * 
 * Features:
 * - Hiển thị markers cho phòng trọ
 * - Callout khi press marker
 * - Satellite/Hybrid view
 * - User location
 * - Custom styling
 */
import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import MapView, { Marker, Callout, Region, MapType } from 'react-native-maps';
import { Text } from '@/components/Themed';
import { MapPin } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface RoomMapProps {
    rooms: Array<{
        id: string;
        title: string;
        price_per_month: number;
        latitude?: number | null;
        longitude?: number | null;
        address?: string;
        district?: string;
        city?: string;
    }>;
    initialRegion?: Region;
    showUserLocation?: boolean;
    onMarkerPress?: (room: any) => void;
    mapType?: MapType;
    height?: number;
}

// Default region (Ho Chi Minh City)
const DEFAULT_REGION: Region = {
    latitude: 10.8231,
    longitude: 106.6297,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

export function RoomMap({
    rooms,
    initialRegion,
    showUserLocation = true,
    onMarkerPress,
    mapType = 'hybrid',
    height = 300,
}: RoomMapProps) {
    // Filter rooms có tọa độ hợp lệ
    const roomsWithCoords = useMemo(() => {
        return rooms.filter(
            (room): room is typeof room & { latitude: number; longitude: number } =>
                typeof room.latitude === 'number' && typeof room.longitude === 'number'
        );
    }, [rooms]);

    // Tính initial region nếu không có
    const region = useMemo(() => {
        if (initialRegion) return initialRegion;
        if (roomsWithCoords.length === 0) return DEFAULT_REGION;

        // Tính center từ tất cả rooms
        const lats = roomsWithCoords.map(r => r.latitude);
        const lngs = roomsWithCoords.map(r => r.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        return {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.5),
            longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.5),
        };
    }, [initialRegion, roomsWithCoords]);

    const handleMarkerPress = useCallback((room: any) => {
        onMarkerPress?.(room);
    }, [onMarkerPress]);

    // Không có tọa độ
    if (roomsWithCoords.length === 0) {
        return (
            <View style={[styles.placeholder, { height }]}>
                <MapPin size={40} color="#9CA3AF" />
                <Text style={styles.placeholderText}>Chưa có dữ liệu bản đồ</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { height }]}>
            <MapView
                provider={Platform.OS === 'ios' ? undefined : 'google'}
                style={styles.map}
                initialRegion={region}
                showsUserLocation={showUserLocation}
                showsMyLocationButton={true}
                showsCompass={true}
                showsScale={true}
                mapType={mapType}
                rotateEnabled={true}
                scrollEnabled={true}
                zoomEnabled={true}
            >
                {roomsWithCoords.map((room) => (
                    <Marker
                        key={room.id}
                        coordinate={{
                            latitude: room.latitude,
                            longitude: room.longitude,
                        }}
                        title={room.title}
                        description={`${room.price_per_month.toLocaleString()}đ/tháng`}
                        onPress={() => handleMarkerPress(room)}
                        pinColor="#0284C7"
                    >
                        <Callout tooltip>
                            <View style={styles.calloutContainer}>
                                <Text style={styles.calloutTitle} numberOfLines={2}>
                                    {room.title}
                                </Text>
                                <Text style={styles.calloutPrice}>
                                    {room.price_per_month.toLocaleString()}đ/tháng
                                </Text>
                                <Text style={styles.calloutAddress} numberOfLines={2}>
                                    {[room.district, room.city].filter(Boolean).join(', ')}
                                </Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
    },
    placeholderText: {
        marginTop: 8,
        color: '#6B7280',
        fontSize: 14,
    },
    calloutContainer: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        width: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    calloutTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    calloutPrice: {
        fontSize: 13,
        color: '#0284C7',
        fontWeight: '700',
        marginBottom: 4,
    },
    calloutAddress: {
        fontSize: 12,
        color: '#6B7280',
    },
});