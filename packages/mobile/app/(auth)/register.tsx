import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";

export default function RegisterScreen() {
    const { signUp } = useAuth();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            setError("Vui lòng nhập đầy đủ thông tin");
            return;
        }
        if (password !== confirmPassword) {
            setError("Mật khẩu không khớp");
            return;
        }
        if (password.length < 6) {
            setError("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await signUp(email, password, fullName);
            Alert.alert("Thành công", "Vui lòng kiểm tra email để xác nhận đăng ký!");
        } catch (err: any) {
            setError(err.message || "Đăng ký thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-background"
        >
            <View className="flex-1 justify-center px-6">
                {/* Logo */}
                <View className="items-center mb-8">
                    <Text className="text-4xl font-bold text-primary-500">RommZ</Text>
                    <Text className="text-base text-text-secondary mt-2">
                        Tạo tài khoản mới
                    </Text>
                </View>

                {/* Form */}
                <View className="space-y-4">
                    <View>
                        <Text className="text-sm font-medium text-text-primary mb-1">Họ và tên</Text>
                        <TextInput
                            className="bg-surface border border-gray-200 rounded-xl px-4 py-3 text-base text-text-primary"
                            placeholder="Nguyễn Văn A"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                        />
                    </View>
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
                    <View>
                        <Text className="text-sm font-medium text-text-primary mb-1">Xác nhận mật khẩu</Text>
                        <TextInput
                            className="bg-surface border border-gray-200 rounded-xl px-4 py-3 text-base text-text-primary"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                    </View>
                    {error && (
                        <Text className="text-red-500 text-sm text-center">{error}</Text>
                    )}
                    <TouchableOpacity
                        className={`bg-primary-500 rounded-xl py-4 items-center mt-2 ${loading ? 'opacity-50' : ''}`}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-semibold text-base">Đăng ký</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Login link */}
                <View className="flex-row justify-center mt-6">
                    <Text className="text-text-secondary">Đã có tài khoản? </Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text className="text-primary-500 font-semibold">Đăng nhập</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
