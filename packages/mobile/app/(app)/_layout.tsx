import { Stack } from "expo-router";

export default function AppLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="room/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="sublet/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="search-filter" options={{ headerShown: false, presentation: 'modal' }} />
        </Stack>
    );
}
