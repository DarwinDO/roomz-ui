import { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    TouchableWithoutFeedback,
    Keyboard,
} from "react-native";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { supabase } from "../../src/lib/supabase";
import { Lock, ArrowLeft, CheckCircle } from "lucide-react-native";
import PasswordStrengthIndicator from "../../components/PasswordStrengthIndicator";

export default function ResetPasswordScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ token?: string; access_token?: string; refresh_token?: string; type?: string }>();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [hasResetToken, setHasResetToken] = useState(false);
    const isMountedRef = useRef(true);

    // Track mounted state to prevent setState after unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Check if user has a valid reset token from session or deep link params
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                if (isMountedRef.current) setHasResetToken(true);
                return;
            }

            // Check for token from deep link route params
            const accessToken = params.access_token || params.token;
            const refreshToken = params.refresh_token;

            if (accessToken && params.type === "recovery") {
                // Try to set the session from the tokens
                try {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken as string,
                        refresh_token: (refreshToken as string) || "",
                    });
                    if (!error && isMountedRef.current) {
                        setHasResetToken(true);
                        return;
                    }
                } catch {
                    // Fall through to error
                }
            }

            if (isMountedRef.current) {
                setError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
            }
        };

        checkSession();
    }, [params]);

    const handleSubmit = async () => {
        // Reset error
        setError(null);

        // Validation
        if (!password.trim()) {
            setError("Vui lòng nhập mật khẩu mới");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        if (password.length < 8) {
            setError("Mật khẩu phải có ít nhất 8 ký tự");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password,
            });

            if (error) throw error;

            if (isMountedRef.current) {
                setSuccess(true);
            }
        } catch (err: unknown) {
            if (isMountedRef.current) {
                const errorMessage = err instanceof Error ? err.message : "Đặt lại mật khẩu thất bại";
                setError(errorMessage);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 bg-background"
            >
                <View className="flex-1 justify-center px-6">
                    {/* Back Button */}
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity
                            className="absolute top-12 left-6 flex-row items-center"
                            accessibilityLabel="Quay lại đăng nhập"
                            accessibilityHint="Nhấn để quay lại trang đăng nhập"
                        >
                            <ArrowLeft size={20} className="text-text-secondary" />
                            <Text className="text-text-secondary ml-1">Quay lại</Text>
                        </TouchableOpacity>
                    </Link>

                    {/* Header */}
                    <View className="items-center mb-8">
                        <Text className="text-4xl font-bold text-primary-500">RommZ</Text>
                        <Text className="text-2xl font-semibold text-text-primary mt-6 mb-2">
                            Đặt lại mật khẩu
                        </Text>
                        <Text className="text-base text-text-secondary text-center px-4">
                            Tạo mật khẩu mới cho tài khoản của bạn
                        </Text>
                    </View>

                    {success ? (
                        <View className="items-center space-y-6">
                            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center">
                                <CheckCircle size={40} color="#16a34a" />
                            </View>
                            <View className="items-center">
                                <Text className="text-xl font-semibold text-green-700 mb-2">
                                    Đặt lại mật khẩu thành công!
                                </Text>
                                <Text className="text-text-secondary text-center px-4">
                                    Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại bằng mật khẩu mới.
                                </Text>
                            </View>
                            <TouchableOpacity
                                className="bg-primary-500 rounded-xl py-4 px-8 items-center mt-4"
                                onPress={() => router.replace("/(auth)/login")}
                                accessibilityLabel="Đăng nhập"
                                accessibilityHint="Nhấn để đi đến trang đăng nhập"
                            >
                                <Text className="text-white font-semibold text-base">
                                    Đăng nhập
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="space-y-4">
                            {/* Password Input */}
                            <View>
                                <Text className="text-sm font-medium text-text-primary mb-1">
                                    Mật khẩu mới
                                </Text>
                                <View className="relative flex-row items-center">
                                    <View className="absolute left-3 z-10">
                                        <Lock size={20} color="#6b7280" />
                                    </View>
                                    <TextInput
                                        className="flex-1 bg-surface border border-gray-200 rounded-xl px-4 py-3 pl-10 pr-12 text-base text-text-primary"
                                        placeholder="••••••••"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        editable={!loading && hasResetToken}
                                        accessibilityLabel="Mật khẩu mới"
                                        accessibilityHint="Nhập mật khẩu mới của bạn"
                                    />
                                    <TouchableOpacity
                                        className="absolute right-3 p-1"
                                        onPress={() => setShowPassword(!showPassword)}
                                        disabled={!hasResetToken}
                                        accessibilityLabel={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                                        accessibilityHint="Nhấn để thay đổi hiển thị mật khẩu"
                                    >
                                        <Text className="text-primary-500 text-sm font-medium">
                                            {showPassword ? "Ẩn" : "Hiện"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <PasswordStrengthIndicator password={password} />
                            </View>

                            {/* Confirm Password Input */}
                            <View>
                                <Text className="text-sm font-medium text-text-primary mb-1">
                                    Xác nhận mật khẩu mới
                                </Text>
                                <View className="relative flex-row items-center">
                                    <View className="absolute left-3 z-10">
                                        <Lock size={20} color="#6b7280" />
                                    </View>
                                    <TextInput
                                        className="flex-1 bg-surface border border-gray-200 rounded-xl px-4 py-3 pl-10 pr-12 text-base text-text-primary"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                        editable={!loading && hasResetToken}
                                        accessibilityLabel="Xác nhận mật khẩu mới"
                                        accessibilityHint="Nhập lại mật khẩu mới để xác nhận"
                                    />
                                    <TouchableOpacity
                                        className="absolute right-3 p-1"
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        disabled={!hasResetToken}
                                        accessibilityLabel={showConfirmPassword ? "Ẩn xác nhận mật khẩu" : "Hiển thị xác nhận mật khẩu"}
                                        accessibilityHint="Nhấn để thay đổi hiển thị xác nhận mật khẩu"
                                    >
                                        <Text className="text-primary-500 text-sm font-medium">
                                            {showConfirmPassword ? "Ẩn" : "Hiện"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Error Message */}
                            {error && (
                                <Text className="text-red-500 text-sm text-left">{error}</Text>
                            )}

                            {/* Submit Button */}
                            <TouchableOpacity
                                className={`bg-primary-500 rounded-xl py-4 items-center mt-2 ${loading || !hasResetToken ? "opacity-50" : ""
                                    }`}
                                onPress={handleSubmit}
                                disabled={loading || !hasResetToken}
                                accessibilityLabel="Đặt lại mật khẩu"
                                accessibilityHint="Nhấn để đặt lại mật khẩu"
                                accessibilityRole="button"
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white font-semibold text-base">
                                        Đặt lại mật khẩu
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Request New Link */}
                            {!hasResetToken && (
                                <TouchableOpacity
                                    className="items-center mt-2"
                                    onPress={() => router.push("/forgot-password")}
                                    accessibilityLabel="Yêu cầu liên kết mới"
                                    accessibilityHint="Nhấn để yêu cầu liên kết đặt lại mật khẩu mới"
                                >
                                    <Text className="text-primary-500 text-sm font-medium">
                                        Yêu cầu liên kết mới
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}
