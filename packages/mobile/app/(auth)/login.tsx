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
    Animated,
    Easing,
} from "react-native";
import { Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../src/contexts/AuthContext";
import { supabase } from "../../src/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { GoogleIcon } from "../../components/icons";
import { Skeleton } from "../../components/Skeleton";

const REMEMBER_ME_KEY = "rommz_remembered_email";

// Skeleton Layout for Login Screen
const LoginSkeleton = () => (
    <View className="space-y-4">
        {/* Email Field Skeleton */}
        <View>
            <Skeleton width={40} height={16} style={{ marginBottom: 4 }} />
            <Skeleton width="100%" height={48} borderRadius={12} />
        </View>
        {/* Password Field Skeleton */}
        <View>
            <Skeleton width={60} height={16} style={{ marginBottom: 4 }} />
            <Skeleton width="100%" height={48} borderRadius={12} />
        </View>
        {/* Remember Me & Forgot Password Skeleton */}
        <View className="flex-row items-center justify-between mt-2">
            <Skeleton width={120} height={20} />
            <Skeleton width={80} height={20} />
        </View>
        {/* Login Button Skeleton */}
        <Skeleton width="100%" height={48} borderRadius={12} style={{ marginTop: 8 }} />
        {/* Divider Skeleton */}
        <View className="flex-row items-center my-4">
            <Skeleton width="40%" height={1} />
            <Skeleton width="20%" height={16} style={{ marginHorizontal: 8 }} />
            <Skeleton width="40%" height={1} />
        </View>
        {/* Google Button Skeleton */}
        <Skeleton width="100%" height={48} borderRadius={12} />
    </View>
);

// Logo Skeleton
const LogoSkeleton = () => (
    <View className="items-center mb-10">
        <Skeleton width={120} height={40} borderRadius={8} />
        <Skeleton width={180} height={16} borderRadius={4} style={{ marginTop: 8 }} />
    </View>
);

export default function LoginScreen() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const errorShakeAnim = useRef(new Animated.Value(0)).current;
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;
    const inputAnimations = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;

    // Load remembered email on mount and simulate initial loading
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | undefined;
        const loadSavedEmail = async () => {
            try {
                const savedEmail = await AsyncStorage.getItem(REMEMBER_ME_KEY);
                if (savedEmail) {
                    setEmail(savedEmail);
                    setRememberMe(true);
                }
            } catch (e) {
                // Ignore storage errors
            }
            // Simulate loading for skeleton demonstration
            timeoutId = setTimeout(() => {
                setIsPageLoading(false);
                // Start entrance animations
                startEntranceAnimations();
            }, 600);
        };
        loadSavedEmail();
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    const startEntranceAnimations = () => {
        // Fade in and slide up the container
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();

        // Staggered input field animations
        Animated.stagger(80, [
            Animated.timing(inputAnimations[0], {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(inputAnimations[1], {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(inputAnimations[2], {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    };

    const triggerErrorShake = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Animated.sequence([
            Animated.timing(errorShakeAnim, {
                toValue: -10,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(errorShakeAnim, {
                toValue: 10,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(errorShakeAnim, {
                toValue: -10,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(errorShakeAnim, {
                toValue: 10,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(errorShakeAnim, {
                toValue: 0,
                duration: 50,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleButtonPressIn = () => {
        Animated.spring(buttonScaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
            friction: 8,
            tension: 100,
        }).start();
    };

    const handleButtonPressOut = () => {
        Animated.spring(buttonScaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
            tension: 100,
        }).start();
    };

    const handleLogin = async () => {
        if (!email || !password) {
            setError("Vui lòng nhập email và mật khẩu");
            triggerErrorShake();
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await signIn(email, password);

            // Handle remember me
            if (rememberMe) {
                await AsyncStorage.setItem(REMEMBER_ME_KEY, email);
            } else {
                await AsyncStorage.removeItem(REMEMBER_ME_KEY);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Đăng nhập thất bại";
            setError(errorMessage);
            triggerErrorShake();
        } finally {
            setLoading(false);
        }
    };

    // Google OAuth — Supabase official approach using deep linking
    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setError(null);

            const redirectUrl = makeRedirectUri({ scheme: "roomz" });
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: false,
                },
            });

            if (error) throw error;

            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
                if (result.type === "cancel") {
                    setLoading(false);
                }
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Đăng nhập Google thất bại";
            setError(errorMessage);
            triggerErrorShake();
        } finally {
            setLoading(false);
        }
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    // Interpolate animations for input fields
    const getInputStyle = (index: number) => ({
        opacity: inputAnimations[index],
        transform: [
            {
                translateY: inputAnimations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                }),
            },
        ],
    });

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 bg-background"
            >
                <View className="flex-1 justify-center px-6">
                    {isPageLoading ? (
                        // Skeleton Loading State
                        <View>
                            <LogoSkeleton />
                            <LoginSkeleton />
                            <View className="flex-row justify-center mt-6">
                                <Skeleton width={140} height={16} />
                                <Skeleton width={60} height={16} style={{ marginLeft: 4 }} />
                            </View>
                        </View>
                    ) : (
                        // Actual Content with Animations
                        <Animated.View
                            style={{
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }}
                        >
                            {/* Logo */}
                            <View className="items-center mb-10">
                                <Text className="text-4xl font-bold text-primary-500">RommZ</Text>
                                <Text className="text-base text-text-secondary mt-2">
                                    Tìm phòng trọ sinh viên
                                </Text>
                            </View>

                            {/* Form */}
                            <View className="space-y-4">
                                {/* Error Message with Shake Animation */}
                                {error && (
                                    <Animated.View
                                        style={{
                                            transform: [{ translateX: errorShakeAnim }],
                                        }}
                                    >
                                        <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                            <Text className="text-red-500 text-sm text-center">{error}</Text>
                                        </View>
                                    </Animated.View>
                                )}

                                {/* Email Field */}
                                <Animated.View style={getInputStyle(0)}>
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
                                            accessibilityLabel="Email"
                                            accessibilityHint="Nhập địa chỉ email của bạn"
                                        />
                                    </View>
                                </Animated.View>

                                {/* Password Field */}
                                <Animated.View style={getInputStyle(1)}>
                                    <View>
                                        <Text className="text-sm font-medium text-text-primary mb-1">Mật khẩu</Text>
                                        <View className="relative flex-row items-center">
                                            <TextInput
                                                className="flex-1 bg-surface border border-gray-200 rounded-xl px-4 py-3 text-base text-text-primary pr-12"
                                                placeholder="••••••••"
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry={!showPassword}
                                                accessibilityLabel="Mật khẩu"
                                                accessibilityHint="Nhập mật khẩu của bạn"
                                            />
                                            <TouchableOpacity
                                                className="absolute right-3 p-1"
                                                onPress={() => setShowPassword(!showPassword)}
                                                accessibilityLabel={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                                                accessibilityHint="Nhấn để thay đổi hiển thị mật khẩu"
                                            >
                                                <Text className="text-primary-500 text-sm font-medium">
                                                    {showPassword ? "Ẩn" : "Hiện"}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Animated.View>

                                {/* Remember Me & Forgot Password */}
                                <Animated.View style={getInputStyle(2)}>
                                    <View className="flex-row items-center justify-between">
                                        <TouchableOpacity
                                            className="flex-row items-center"
                                            onPress={() => setRememberMe(!rememberMe)}
                                            accessibilityLabel="Ghi nhớ đăng nhập"
                                            accessibilityHint="Nhấn để lưu email cho lần đăng nhập sau"
                                            accessibilityRole="checkbox"
                                            accessibilityState={{ checked: rememberMe }}
                                        >
                                            <View
                                                className={`w-5 h-5 rounded border mr-2 items-center justify-center ${rememberMe ? "bg-primary-500 border-primary-500" : "border-gray-300"
                                                    }`}
                                            >
                                                {rememberMe && <Text className="text-white text-xs">✓</Text>}
                                            </View>
                                            <Text className="text-text-secondary text-sm">Ghi nhớ đăng nhập</Text>
                                        </TouchableOpacity>
                                        <Link href="/forgot-password" asChild>
                                            <TouchableOpacity
                                                accessibilityLabel="Quên mật khẩu"
                                                accessibilityHint="Nhấn để đi đến trang khôi phục mật khẩu"
                                            >
                                                <Text className="text-primary-500 text-sm font-medium">
                                                    Quên mật khẩu?
                                                </Text>
                                            </TouchableOpacity>
                                        </Link>
                                    </View>
                                </Animated.View>

                                {/* Login Button with Press Effect */}
                                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                                    <TouchableOpacity
                                        className={`bg-primary-500 rounded-xl py-4 items-center mt-2 ${loading ? 'opacity-50' : ''}`}
                                        onPress={handleLogin}
                                        onPressIn={handleButtonPressIn}
                                        onPressOut={handleButtonPressOut}
                                        disabled={loading}
                                        accessibilityLabel="Đăng nhập"
                                        accessibilityHint="Nhấn để đăng nhập"
                                        accessibilityRole="button"
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text className="text-white font-semibold text-base">Đăng nhập</Text>
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>

                                {/* Google OAuth */}
                                <TouchableOpacity
                                    className="flex-row items-center justify-center bg-surface border border-gray-200 rounded-xl py-4 mt-1 active:bg-gray-50"
                                    onPress={handleGoogleLogin}
                                    accessibilityLabel="Đăng nhập bằng Google"
                                    accessibilityHint="Nhấn để đăng nhập bằng tài khoản Google"
                                    accessibilityRole="button"
                                >
                                    <GoogleIcon size={20} />
                                    <Text className="text-text-primary font-medium ml-2">Đăng nhập bằng Google</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Register link */}
                            <View className="flex-row justify-center mt-6">
                                <Text className="text-text-secondary">Chưa có tài khoản? </Text>
                                <Link href="/(auth)/register" asChild>
                                    <TouchableOpacity
                                        accessibilityLabel="Đăng ký"
                                        accessibilityHint="Nhấn để đi đến trang đăng ký"
                                    >
                                        <Text className="text-primary-500 font-semibold">Đăng ký</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        </Animated.View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}
