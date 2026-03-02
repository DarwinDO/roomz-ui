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
            <Stack.Screen name="chat" options={{ headerShown: false }} />
            <Stack.Screen name="search-filter" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen
                name="roommate-profile-setup"
                options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen
                name="compatibility-quiz"
                options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen
                name="post/[id]"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="create-post"
                options={{ headerShown: false, presentation: 'modal' }}
            />
        </Stack>
    );
}
