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
import PasswordStrengthIndicator from "../../components/PasswordStrengthIndicator";
import { GoogleIcon } from "../../components/icons";
import { Skeleton } from "../../components/Skeleton";

const REMEMBER_ME_KEY = "rommz_remembered_email";

// Skeleton Layout for Register Screen
const RegisterSkeleton = () => (
    <View className="space-y-4">
        {/* Full Name Field Skeleton */}
        <View>
            <Skeleton width={60} height={16} style={{ marginBottom: 4 }} />
            <Skeleton width="100%" height={48} borderRadius={12} />
        </View>
        {/* Email Field Skeleton */}
        <View>
            <Skeleton width={40} height={16} style={{ marginBottom: 4 }} />
            <Skeleton width="100%" height={48} borderRadius={12} />
        </View>
        {/* Password Field Skeleton */}
        <View>
            <Skeleton width={60} height={16} style={{ marginBottom: 4 }} />
            <Skeleton width="100%" height={48} borderRadius={12} />
            <Skeleton width="80%" height={8} borderRadius={4} style={{ marginTop: 8 }} />
        </View>
        {/* Confirm Password Field Skeleton */}
        <View>
            <Skeleton width={100} height={16} style={{ marginBottom: 4 }} />
            <Skeleton width="100%" height={48} borderRadius={12} />
        </View>
        {/* Remember Me Skeleton */}
        <Skeleton width={120} height={20} style={{ marginTop: 4 }} />
        {/* Register Button Skeleton */}
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
    <View className="items-center mb-8">
        <Skeleton width={120} height={40} borderRadius={8} />
        <Skeleton width={140} height={16} borderRadius={4} style={{ marginTop: 8 }} />
    </View>
);

export default function RegisterScreen() {
    const { signUp } = useAuth();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        Animated.stagger(70, inputAnimations.map(anim =>
            Animated.timing(anim, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            })
        )).start();
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

    const handleRegister = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            setError("Vui lòng nhập đầy đủ thông tin");
            triggerErrorShake();
            return;
        }
        if (password !== confirmPassword) {
            setError("Mật khẩu không khớp");
            triggerErrorShake();
            return;
        }
        if (password.length < 8) {
            setError("Mật khẩu phải có ít nhất 8 ký tự");
            triggerErrorShake();
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await signUp(email, password, fullName);

            // Handle remember me
            if (rememberMe) {
                await AsyncStorage.setItem(REMEMBER_ME_KEY, email);
            } else {
                await AsyncStorage.removeItem(REMEMBER_ME_KEY);
            }

            Alert.alert("Thành công", "Vui lòng kiểm tra email để xác nhận đăng ký!");
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Đăng ký thất bại";
            setError(errorMessage);
            triggerErrorShake();
        } finally {
            setLoading(false);
        }
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    // Google OAuth — Supabase official approach using deep linking
    const handleGoogleSignUp = async () => {
        try {
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
                    // User cancelled the OAuth flow - no action needed
                }
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Đăng ký Google thất bại";
            Alert.alert("Google Sign Up", errorMessage);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
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
                            <RegisterSkeleton />
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
                            <View className="items-center mb-8">
                                <Text className="text-4xl font-bold text-primary-500">RommZ</Text>
                                <Text className="text-base text-text-secondary mt-2">
                                    Tạo tài khoản mới
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

                                {/* Full Name Field */}
                                <Animated.View style={getInputStyle(0)}>
                                    <View>
                                        <Text className="text-sm font-medium text-text-primary mb-1">Họ và tên</Text>
                                        <TextInput
                                            className="bg-surface border border-gray-200 rounded-xl px-4 py-3 text-base text-text-primary"
                                            placeholder="Nguyễn Văn A"
                                            value={fullName}
                                            onChangeText={setFullName}
                                            autoCapitalize="words"
                                            accessibilityLabel="Họ và tên"
                                            accessibilityHint="Nhập họ và tên của bạn"
                                        />
                                    </View>
                                </Animated.View>

                                {/* Email Field */}
                                <Animated.View style={getInputStyle(1)}>
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
                                <Animated.View style={getInputStyle(2)}>
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
                                        <PasswordStrengthIndicator password={password} />
                                    </View>
                                </Animated.View>

                                {/* Confirm Password Field */}
                                <Animated.View style={getInputStyle(3)}>
                                    <View>
                                        <Text className="text-sm font-medium text-text-primary mb-1">Xác nhận mật khẩu</Text>
                                        <View className="relative flex-row items-center">
                                            <TextInput
                                                className="flex-1 bg-surface border border-gray-200 rounded-xl px-4 py-3 text-base text-text-primary pr-12"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                                secureTextEntry={!showConfirmPassword}
                                                accessibilityLabel="Xác nhận mật khẩu"
                                                accessibilityHint="Nhập lại mật khẩu để xác nhận"
                                            />
                                            <TouchableOpacity
                                                className="absolute right-3 p-1"
                                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                                accessibilityLabel={showConfirmPassword ? "Ẩn xác nhận mật khẩu" : "Hiển thị xác nhận mật khẩu"}
                                                accessibilityHint="Nhấn để thay đổi hiển thị xác nhận mật khẩu"
                                            >
                                                <Text className="text-primary-500 text-sm font-medium">
                                                    {showConfirmPassword ? "Ẩn" : "Hiện"}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Animated.View>

                                {/* Remember Me Checkbox */}
                                <Animated.View style={getInputStyle(4)}>
                                    <TouchableOpacity
                                        className="flex-row items-center mt-2"
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
                                </Animated.View>

                                {/* Register Button with Press Effect */}
                                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                                    <TouchableOpacity
                                        className={`bg-primary-500 rounded-xl py-4 items-center mt-2 ${loading ? 'opacity-50' : ''}`}
                                        onPress={handleRegister}
                                        onPressIn={handleButtonPressIn}
                                        onPressOut={handleButtonPressOut}
                                        disabled={loading}
                                        accessibilityLabel="Đăng ký"
                                        accessibilityHint="Nhấn để đăng ký tài khoản"
                                        accessibilityRole="button"
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text className="text-white font-semibold text-base">Đăng ký</Text>
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>

                                {/* Google OAuth */}
                                <TouchableOpacity
                                    className="flex-row items-center justify-center bg-surface border border-gray-200 rounded-xl py-4 mt-1 active:bg-gray-50"
                                    onPress={handleGoogleSignUp}
                                    accessibilityLabel="Đăng ký bằng Google"
                                    accessibilityHint="Nhấn để đăng ký bằng tài khoản Google"
                                    accessibilityRole="button"
                                >
                                    <GoogleIcon size={20} />
                                    <Text className="text-text-primary font-medium ml-2">Đăng ký bằng Google</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Login link */}
                            <View className="flex-row justify-center mt-6">
                                <Text className="text-text-secondary">Đã có tài khoản? </Text>
                                <Link href="/login" asChild>
                                    <TouchableOpacity
                                        accessibilityLabel="Đăng nhập"
                                        accessibilityHint="Nhấn để đi đến trang đăng nhập"
                                    >
                                        <Text className="text-primary-500 font-semibold">Đăng nhập</Text>
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
