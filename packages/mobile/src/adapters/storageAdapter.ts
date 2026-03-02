import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageAdapter } from '@roomz/shared';

export const mobileStorageAdapter: StorageAdapter = {
    getItem: async (key: string) => AsyncStorage.getItem(key),
    setItem: async (key: string, value: string) => AsyncStorage.setItem(key, value),
    removeItem: async (key: string) => AsyncStorage.removeItem(key),
};
