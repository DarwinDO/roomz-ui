import { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, ChevronLeft, Camera, Image as ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/contexts/AuthContext';
import { useVerification, type DocumentType } from '../../src/hooks/useVerification';
import { DocumentCapture } from '../../components/DocumentCapture';
import { VerificationStatusCard } from '../../components/VerificationStatusCard';

const DOCUMENT_TYPES: { type: DocumentType; label: string }[] = [
    { type: 'cccd', label: 'CCCD' },
    { type: 'passport', label: 'Hộ chiếu' },
    { type: 'student_id', label: 'Thẻ sinh viên' },
];

/**
 * Verification Screen - Identity verification flow
 * States: initial → pending → result (approved/rejected)
 */
export default function VerificationScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { status, isLoading, submit, isSubmitting } = useVerification();

    const [documentType, setDocumentType] = useState<DocumentType>('cccd');
    const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
    const [backImageUri, setBackImageUri] = useState<string | null>(null);
    const [showActionSheet, setShowActionSheet] = useState<'front' | 'back' | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);

    const handleCapture = useCallback(async (source: 'camera' | 'library', side: 'front' | 'back') => {
        setShowActionSheet(null);

        const { status: permissionStatus } = source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionStatus !== 'granted') {
            Alert.alert(
                'Cần quyền truy cập',
                `Vui lòng cấp quyền ${source === 'camera' ? 'camera' : 'thư viện ảnh'} để tiếp tục.`
            );
            return;
        }

        const result = source === 'camera'
            ? await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
                aspect: [3, 2],
            })
            : await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
                aspect: [3, 2],
            });

        if (!result.canceled && result.assets[0]) {
            if (side === 'front') {
                setFrontImageUri(result.assets[0].uri);
            } else {
                setBackImageUri(result.assets[0].uri);
            }
        }
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!user?.id || !frontImageUri || !backImageUri) return;

        try {
            await submit({
                userId: user.id,
                documentType,
                frontImageUri,
                backImageUri,
            });
            setIsRetrying(false);
            Alert.alert('Thành công!', 'Yêu cầu xác minh đã được gửi.');
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
        }
    }, [user?.id, documentType, frontImageUri, backImageUri, submit]);

    const handleRetry = useCallback(() => {
        setFrontImageUri(null);
        setBackImageUri(null);
        setIsRetrying(true);
    }, []);

    const canSubmit = frontImageUri && backImageUri && !isSubmitting;

    // State: Pending or Result (approved/rejected)
    if (!isRetrying && (status?.status === 'pending' || status?.status === 'approved' || status?.status === 'rejected')) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                {/* Header */}
                <View className="flex-row items-center px-4 py-4 border-b border-gray-200">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ChevronLeft size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="flex-1 text-lg font-bold text-text-primary text-center mr-8">
                        Xác minh danh tính
                    </Text>
                </View>

                <ScrollView className="flex-1 p-4">
                    <VerificationStatusCard
                        status={status.status}
                        submittedAt={status.submitted_at}
                        rejectionReason={status.rejection_reason}
                        onRetry={status.status === 'rejected' ? handleRetry : undefined}
                    />

                    {status.status !== 'rejected' && (
                        <View className="mt-6 bg-surface rounded-2xl p-4">
                            <Text className="text-text-secondary text-sm mb-2">Giấy tờ đã gửi</Text>
                            <Text className="text-text-primary font-medium capitalize">
                                {DOCUMENT_TYPES.find(d => d.type === status.document_type)?.label || status.document_type}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        );
    }

    // State: Initial (not submitted yet)
    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center px-4 py-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ChevronLeft size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="flex-1 text-lg font-bold text-text-primary text-center mr-8">
                    Xác minh danh tính
                </Text>
            </View>

            <ScrollView className="flex-1">
                {/* Hero */}
                <View className="items-center py-8 px-6">
                    <View className="w-20 h-20 rounded-full bg-primary-100 items-center justify-center mb-4">
                        <Shield size={40} color="#0d9488" />
                    </View>
                    <Text className="text-xl font-bold text-text-primary text-center">
                        Xác minh danh tính của bạn
                    </Text>
                    <Text className="text-text-secondary text-center mt-2">
                        Giúp tăng độ tin cậy và bảo vệ cộng đồng RommZ
                    </Text>
                </View>

                {/* Document Type Selector */}
                <View className="px-4 mb-6">
                    <Text className="text-text-primary font-medium mb-3">Loại giấy tờ</Text>
                    <View className="flex-row gap-2">
                        {DOCUMENT_TYPES.map((doc) => (
                            <TouchableOpacity
                                key={doc.type}
                                onPress={() => setDocumentType(doc.type)}
                                className={`
                                    flex-1 py-3 px-2 rounded-xl border
                                    ${documentType === doc.type
                                        ? 'bg-primary-500 border-primary-500'
                                        : 'bg-surface border-gray-200'
                                    }
                                `}
                            >
                                <Text
                                    className={`
                                        text-center font-medium
                                        ${documentType === doc.type ? 'text-white' : 'text-text-primary'}
                                    `}
                                >
                                    {doc.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Image Capture Areas */}
                <View className="px-4 gap-4 mb-6">
                    <View>
                        <Text className="text-text-primary font-medium mb-2">Mặt trước</Text>
                        <DocumentCapture
                            label="Chụp mặt trước"
                            imageUri={frontImageUri}
                            onCapture={() => setShowActionSheet('front')}
                            isLoading={isSubmitting}
                        />
                    </View>

                    <View>
                        <Text className="text-text-primary font-medium mb-2">Mặt sau</Text>
                        <DocumentCapture
                            label="Chụp mặt sau"
                            imageUri={backImageUri}
                            onCapture={() => setShowActionSheet('back')}
                            isLoading={isSubmitting}
                        />
                    </View>
                </View>

                {/* Guidelines */}
                <View className="px-4 mb-6">
                    <View className="bg-blue-50 rounded-xl p-4">
                        <Text className="text-blue-900 font-medium mb-1">Lưu ý</Text>
                        <Text className="text-blue-700 text-sm">
                            • Đảm bảo ảnh rõ nét, đầy đủ thông tin{'\n'}
                            • Không chụp qua màn hình hoặc bản photo{'\n'}
                            • Giấy tờ còn hiệu lực
                        </Text>
                    </View>
                </View>

                {/* Submit Button */}
                <View className="px-4 pb-8">
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={!canSubmit}
                        className={`
                            py-4 rounded-full items-center
                            ${canSubmit ? 'bg-primary-500' : 'bg-gray-300'}
                        `}
                        activeOpacity={0.8}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-base">
                                Gửi yêu cầu xác minh
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Action Sheet */}
            {showActionSheet && (
                <View className="absolute inset-0 bg-black/50 justify-end">
                    <TouchableOpacity
                        className="flex-1"
                        onPress={() => setShowActionSheet(null)}
                    />
                    <View className="bg-surface rounded-t-3xl p-4">
                        <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
                        <Text className="text-lg font-bold text-text-primary text-center mb-4">
                            Chọn ảnh
                        </Text>

                        <TouchableOpacity
                            onPress={() => handleCapture('camera', showActionSheet)}
                            className="flex-row items-center py-4 border-b border-gray-100"
                        >
                            <Camera size={24} color="#374151" />
                            <Text className="text-text-primary text-base ml-3">Chụp ảnh</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleCapture('library', showActionSheet)}
                            className="flex-row items-center py-4 border-b border-gray-100"
                        >
                            <ImageIcon size={24} color="#374151" />
                            <Text className="text-text-primary text-base ml-3">Chọn từ thư viện</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowActionSheet(null)}
                            className="flex-row items-center justify-center py-4 mt-2"
                        >
                            <X size={20} color="#64748b" />
                            <Text className="text-text-secondary text-base ml-2">Hủy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}
