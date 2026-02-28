import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { supabase } from "../../src/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";

export default function LoginScreen() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        if (!email || !password) {
            setError("Vui lòng nhập email và mật khẩu");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await signIn(email, password);
        } catch (err: any) {
            setError(err.message || "Đăng nhập thất bại");
        } finally {
            setLoading(false);
        }
    };

    // Google OAuth — requires Google Cloud Console client IDs for iOS/Android
    // If not configured yet, show placeholder alert
    const handleGoogleLogin = async () => {
        try {
            const redirectUrl = makeRedirectUri({ scheme: "roomz" });
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: redirectUrl },
            });
            if (error) throw error;
            if (data?.url) {
                await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
            }
        } catch (err: any) {
            Alert.alert("Google Login", err.message || "Chưa cấu hình Google OAuth cho mobile. Cần thêm client IDs trong Google Cloud Console.");
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-background"
        >
            <View className="flex-1 justify-center px-6">
                {/* Logo */}
                <View className="items-center mb-10">
                    <Text className="text-4xl font-bold text-primary-500">RoomZ</Text>
                    <Text className="text-base text-text-secondary mt-2">
                        Tìm phòng trọ sinh viên
                    </Text>
                </View>

                {/* Form */}
                <View className="space-y-4">
                    <View>
                        <Text className="text-sm font-medium text-text-primary mb-1">Email</Text>
                        <TextInput
                            className="bg-surface border border-gray-200 rounded-xl px-4 py-3 text-base text-text-primary"
                            placeholder="email@example.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    <View>
                        <Text className="text-sm font-medium text-text-primary mb-1">Mật khẩu</Text>
                        <TextInput
                            className="bg-surface border border-gray-200 rounded-xl px-4 py-3 text-base text-text-primary"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>
                    {error && (
                        <Text className="text-red-500 text-sm text-center">{error}</Text>
                    )}
                    <TouchableOpacity
                        className={`bg-primary-500 rounded-xl py-4 items-center mt-2 ${loading ? 'opacity-50' : ''}`}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-semibold text-base">Đăng nhập</Text>
                        )}
                    </TouchableOpacity>

                    {/* Google OAuth */}
                    <TouchableOpacity
                        className="flex-row items-center justify-center bg-surface border border-gray-200 rounded-xl py-4 mt-1"
                        onPress={handleGoogleLogin}
                    >
                        <Text className="text-text-primary font-medium">Đăng nhập bằng Google</Text>
                    </TouchableOpacity>
                </View>

                {/* Register link */}
                <View className="flex-row justify-center mt-6">
                    <Text className="text-text-secondary">Chưa có tài khoản? </Text>
                    <Link href="/(auth)/register" asChild>
                        <TouchableOpacity>
                            <Text className="text-primary-500 font-semibold">Đăng ký</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
