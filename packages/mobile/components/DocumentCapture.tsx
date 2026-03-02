import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Camera, RefreshCw } from 'lucide-react-native';

interface DocumentCaptureProps {
    label: string;
    imageUri: string | null;
    onCapture: () => void;
    disabled?: boolean;
    isLoading?: boolean;
}

/**
 * Document capture component for ID verification
 * Shows a placeholder when no image, preview when captured
 */
export function DocumentCapture({
    label,
    imageUri,
    onCapture,
    disabled = false,
    isLoading = false,
}: DocumentCaptureProps) {
    if (imageUri) {
        return (
            <View className="relative">
                <Image
                    source={{ uri: imageUri }}
                    className="w-full aspect-[3/2] rounded-2xl"
                    resizeMode="cover"
                />
                {!disabled && (
                    <TouchableOpacity
                        onPress={onCapture}
                        disabled={isLoading}
                        className="absolute bottom-3 right-3 bg-black/70 px-3 py-2 rounded-full flex-row items-center"
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <RefreshCw size={14} color="white" />
                                <Text className="text-white text-xs font-medium ml-1.5">
                                    Chụp lại
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <TouchableOpacity
            onPress={onCapture}
            disabled={disabled || isLoading}
            className={`
                w-full aspect-[3/2] rounded-2xl border-2 border-dashed
                ${disabled ? 'border-gray-200 bg-gray-100' : 'border-gray-300 bg-gray-50'}
                items-center justify-center
            `}
            activeOpacity={0.7}
        >
            {isLoading ? (
                <ActivityIndicator size="large" color="#64748b" />
            ) : (
                <>
                    <View className="w-14 h-14 rounded-full bg-gray-200 items-center justify-center mb-3">
                        <Camera size={24} color="#64748b" />
                    </View>
                    <Text className="text-gray-500 font-medium">{label}</Text>
                    <Text className="text-gray-400 text-xs mt-1">Nhấn để chụp ảnh</Text>
                </>
            )}
        </TouchableOpacity>
    );
}
