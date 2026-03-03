import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Purchases from "react-native-purchases";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useNotifications } from "../src/hooks/useNotifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function AuthGuard() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(app)/(tabs)");
    }
  }, [session, loading, segments, router]);

  // IMPORTANT: Show loading screen while checking auth to prevent flicker
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#2a9d6a" />
      </View>
    );
  }

  return <Slot />;
}

function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Initialize push notifications when user is authenticated
  useNotifications();
  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    // Initialize RevenueCat (only on native platforms)
    if (Platform.OS !== 'web') {
      try {
        // Replace with your actual RevenueCat API keys
        const apiKey = Platform.OS === 'ios'
          ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || ''
          : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

        if (apiKey) {
          Purchases.configure({ apiKey });
          console.log('RevenueCat initialized');
        } else {
          console.warn('RevenueCat API key not configured');
        }
      } catch (error) {
        console.error('Failed to initialize RevenueCat:', error);
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <AuthGuard />
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
