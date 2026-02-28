import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";

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
  }, [session, loading, segments]);

  // IMPORTANT: Show loading screen while checking auth to prevent flicker
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#2a9d6a" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGuard />
      </AuthProvider>
    </QueryClientProvider>
  );
}
