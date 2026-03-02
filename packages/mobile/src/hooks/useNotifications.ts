import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

interface UseNotificationsReturn {
    expoPushToken: string | null;
    notification: Notifications.Notification | null;
    registerForPushNotifications: () => Promise<string | null>;
}

export function useNotifications(): UseNotificationsReturn {
    const { user } = useAuth();
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
        try {
            if (!Device.isDevice) {
                console.warn('Push notifications require a physical device');
                return null;
            }
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.warn('Push notification permission not granted');
                return null;
            }
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;
            const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                });
            }
            return token;
        } catch (err) {
            console.warn('Push notification registration failed:', err);
            return null;
        }
    }, []);

    const saveTokenToServer = useCallback(async (token: string) => {
        if (!user?.id) return;
        await supabase
            .from('user_push_tokens')
            .upsert({
                user_id: user.id,
                token,
                platform: Platform.OS,
                device_id: Constants.deviceName || 'unknown',
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,device_id',
            });
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;  // Chờ auth resolve
        registerForPushNotifications().then(token => {
            if (token) {
                setExpoPushToken(token);
                saveTokenToServer(token);
            }
        }).catch(err => console.warn('Push notification setup failed:', err));
        notificationListener.current = Notifications.addNotificationReceivedListener(n => {
            setNotification(n);
        });
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            console.log('Notification opened with data:', data);
        });
        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, [user?.id]);

    return { expoPushToken, notification, registerForPushNotifications };
}
