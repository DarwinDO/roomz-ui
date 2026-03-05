import { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from "react-native";
import { Link, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { supabase } from "../../src/lib/supabase";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react-native";

const RATE_LIMIT_SECONDS = 60;

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [lastSubmitTime, setLastSubmitTime] = useState<number | null>(null);
    const [countdown, setCountdown] = useState(0);

    // Countdown timer for rate limiting
    useEffect(() => {
        if (!lastSubmitTime) return;

        const interval = setInterval(() => {
            const remaining = Math.max(0, RATE_LIMIT_SECONDS - Math.floor((Date.now() - lastSubmitTime) / 1000));
            setCountdown(remaining);

            if (remaining === 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [lastSubmitTime]);

    const handleSubmit = async () => {
        // Reset states
        setError(null);
        setSuccess(false);

        // Rate limiting check
        if (lastSubmitTime && Date.now() - lastSubmitTime < RATE_LIMIT_SECONDS * 1000) {
            const remaining = Math.ceil((RATE_LIMIT_SECONDS * 1000 - (Date.now() - lastSubmitTime)) / 1000);
            setError(`Vui lòng đợi ${remaining} giây trước khi gửi lại`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        // Validation
        if (!email.trim()) {
            setError("Vui lòng nhập email");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Email không hợp lệ");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setLoading(true);

        try {
            // NOTE: Scheme 'roomz://' must match the "scheme" field in app.json
            // If you change the scheme in app.json, update it here as well
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: "roomz://reset-password",
            });

            if (error) throw error;

            setLastSubmitTime(Date.now());
            setCountdown(RATE_LIMIT_SECONDS);
            setSuccess(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Gửi yêu cầu thất bại";
            setError(errorMessage);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
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
                            Quên mật khẩu?
                        </Text>
                        <Text className="text-base text-text-secondary text-center px-4">
                            Nhập email của bạn để nhận liên kết đặt lại mật khẩu
                        </Text>
                    </View>

                    {success ? (
                        <View className="items-center space-y-6">
                            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center">
                                <CheckCircle size={40} color="#16a34a" />
                            </View>
                            <View className="items-center">
                                <Text className="text-xl font-semibold text-green-700 mb-2">
                                    Kiểm tra email của bạn
                                </Text>
                                <Text className="text-text-secondary text-center px-4">
                                    Chúng tôi đã gửi liên kết đặt lại mật khẩu đến{" "}
                                    <Text className="font-medium text-text-primary">{email}</Text>
                                </Text>
                            </View>
                            <TouchableOpacity
                                className="bg-primary-500 rounded-xl py-4 px-8 items-center mt-4"
                                onPress={() => router.replace("/(auth)/login")}
                                accessibilityLabel="Quay lại đăng nhập"
                                accessibilityHint="Nhấn để quay lại trang đăng nhập"
                            >
                                <Text className="text-white font-semibold text-base">
                                    Quay lại đăng nhập
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setSuccess(false)}
                                accessibilityLabel="Thử lại"
                                accessibilityHint="Nhấn để thử lại với email khác"
                            >
                                <Text className="text-primary-500 text-sm">
                                    Không nhận được email? Thử lại
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="space-y-4">
                            {/* Email Input */}
                            <View>
                                <Text className="text-sm font-medium text-text-primary mb-1">
                                    Email
                                </Text>
                                <View className="relative flex-row items-center">
                                    <View className="absolute left-3 z-10">
                                        <Mail size={20} color="#6b7280" />
                                    </View>
                                    <TextInput
                                        className="flex-1 bg-surface border border-gray-200 rounded-xl px-4 py-3 pl-10 text-base text-text-primary"
                                        placeholder="email@example.com"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!loading}
                                        accessibilityLabel="Email"
                                        accessibilityHint="Nhập địa chỉ email của bạn"
                                    />
                                </View>
                            </View>

                            {/* Error Message */}
                            {error && (
                                <Text className="text-red-500 text-sm text-left">{error}</Text>
                            )}

                            {/* Submit Button */}
                            <TouchableOpacity
                                className={`bg-primary-500 rounded-xl py-4 items-center mt-2 ${loading || countdown > 0 ? "opacity-50" : ""
                                    }`}
                                onPress={handleSubmit}
                                disabled={loading || countdown > 0}
                                accessibilityLabel="Gửi liên kết đặt lại mật khẩu"
                                accessibilityHint="Nhấn để gửi yêu cầu đặt lại mật khẩu"
                                accessibilityRole="button"
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white font-semibold text-base">
                                        {countdown > 0 ? `Đợi ${countdown}s` : "Gửi liên kết đặt lại mật khẩu"}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Login Link */}
                            <View className="flex-row justify-center mt-4">
                                <Text className="text-text-secondary">Bạn nhớ mật khẩu? </Text>
                                <Link href="/(auth)/login" asChild>
                                    <TouchableOpacity
                                        accessibilityLabel="Đăng nhập"
                                        accessibilityHint="Nhấn để đi đến trang đăng nhập"
                                    >
                                        <Text className="text-primary-500 font-semibold">
                                            Đăng nhập
                                        </Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}
