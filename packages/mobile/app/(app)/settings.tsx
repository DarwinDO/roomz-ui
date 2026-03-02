import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Moon, Globe, CircleHelp, FileText, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
    pushEnabled: boolean;
    messageNotifications: boolean;
    matchNotifications: boolean;
    darkMode: boolean;
}

const STORAGE_KEY = '@roomz_settings';

export default function SettingsScreen() {
    const router = useRouter();
    const [settings, setSettings] = useState<SettingsState>({
        pushEnabled: true,
        messageNotifications: true,
        matchNotifications: true,
        darkMode: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                setSettings(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async (newSettings: SettingsState) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    };

    const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        saveSettings(newSettings);
    };

    const SettingItem = ({
        icon,
        label,
        value,
        onPress,
        showToggle,
        switchValue,
        onToggle,
    }: {
        icon: React.ReactNode;
        label: string;
        value?: string;
        onPress?: () => void;
        showToggle?: boolean;
        switchValue?: boolean;
        onToggle?: (v: boolean) => void;
    }) => (
        <TouchableOpacity
            onPress={onPress}
            disabled={!onPress && !showToggle}
            className="flex-row items-center px-4 py-4 bg-surface rounded-xl mb-2"
        >
            <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
                {icon}
            </View>
            <Text className="flex-1 text-text-primary font-medium">{label}</Text>
            {value && <Text className="text-text-secondary text-sm mr-2">{value}</Text>}
            {showToggle ? (
                <Switch
                    value={switchValue}
                    onValueChange={onToggle}
                    trackColor={{ false: '#d1d5db', true: '#0891b2' }}
                />
            ) : (
                <ChevronRight size={20} color="#94a3b8" />
            )}
        </TouchableOpacity>
    );

    const ToggleItem = ({
        label,
        value,
        onValueChange,
        disabled
    }: {
        label: string;
        value: boolean;
        onValueChange: (v: boolean) => void;
        disabled?: boolean;
    }) => (
        <View className={`flex-row items-center justify-between px-4 py-3 bg-surface rounded-xl mb-2 ${disabled ? 'opacity-50' : ''}`}>
            <Text className="text-text-primary">{label}</Text>
            <Switch
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                trackColor={{ false: '#d1d5db', true: '#0891b2' }}
            />
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={['top']}>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-text-secondary">Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <View className="flex-row items-center px-4 py-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="flex-1 text-xl font-bold text-text-primary text-center mr-8">
                    Cài đặt
                </Text>
            </View>

            <ScrollView className="flex-1 px-4 pt-4">
                {/* Notifications Section */}
                <View className="mb-6">
                    <Text className="text-sm font-semibold text-text-secondary uppercase mb-3 ml-1">
                        Thông báo
                    </Text>
                    <SettingItem
                        icon={<Bell size={20} color="#0891b2" />}
                        label="Bật thông báo"
                        showToggle
                        switchValue={settings.pushEnabled}
                        onToggle={(v) => updateSetting('pushEnabled', v)}
                    />
                    <ToggleItem
                        label="Thông báo tin nhắn"
                        value={settings.messageNotifications}
                        onValueChange={(v) => updateSetting('messageNotifications', v)}
                        disabled={!settings.pushEnabled}
                    />
                    <ToggleItem
                        label="Thông báo match mới"
                        value={settings.matchNotifications}
                        onValueChange={(v) => updateSetting('matchNotifications', v)}
                        disabled={!settings.pushEnabled}
                    />
                </View>

                {/* Appearance Section */}
                <View className="mb-6">
                    <Text className="text-sm font-semibold text-text-secondary uppercase mb-3 ml-1">
                        Giao diện
                    </Text>
                    <ToggleItem
                        label="Chế độ tối"
                        value={settings.darkMode}
                        onValueChange={(v) => updateSetting('darkMode', v)}
                    />
                    <SettingItem
                        icon={<Globe size={20} color="#0891b2" />}
                        label="Ngôn ngữ"
                        value="Tiếng Việt"
                        onPress={() => { }}
                    />
                </View>

                {/* Support Section */}
                <View className="mb-6">
                    <Text className="text-sm font-semibold text-text-secondary uppercase mb-3 ml-1">
                        Hỗ trợ
                    </Text>
                    <SettingItem
                        icon={<CircleHelp size={20} color="#0891b2" />}
                        label="Trung tâm trợ giúp"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon={<FileText size={20} color="#0891b2" />}
                        label="Điều khoản sử dụng"
                        onPress={() => { }}
                    />
                </View>

                {/* Version */}
                <View className="items-center py-4">
                    <Text className="text-text-tertiary text-sm">RoomZ v1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
