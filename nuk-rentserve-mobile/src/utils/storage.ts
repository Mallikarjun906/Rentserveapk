// Secure and Standard Storage Utility for React Native

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'nuk_access_token';
const REFRESH_TOKEN_KEY = 'nuk_refresh_token';
const USER_KEY = 'nuk_user_data';
const LANG_KEY = 'nuk_lang_preference';
const ROLE_KEY = 'nuk_active_role';
const SAVED_ITEMS_KEY = 'nuk_saved_listings';

export const Storage = {
  // Access Token
  async setToken(token: string): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      }
    } catch {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS !== 'web') {
        const t = await SecureStore.getItemAsync(TOKEN_KEY);
        if (t) return t;
      }
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      return await AsyncStorage.getItem(TOKEN_KEY);
    }
  },

  // Refresh Token
  async setRefreshToken(token: string): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
      } else {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
      }
    } catch {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      if (Platform.OS !== 'web') {
        const t = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (t) return t;
      }
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    }
  },

  // Clear all tokens on logout
  async clearAuth(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
      }
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch {}
  },

  // User object
  async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser<T = any>(): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // Language preference
  async setLanguage(lang: 'en' | 'kn'): Promise<void> {
    await AsyncStorage.setItem(LANG_KEY, lang);
  },

  async getLanguage(): Promise<'en' | 'kn' | null> {
    const lang = await AsyncStorage.getItem(LANG_KEY);
    return lang === 'kn' ? 'kn' : lang === 'en' ? 'en' : null;
  },

  // Active Role
  async setRole(role: string): Promise<void> {
    await AsyncStorage.setItem(ROLE_KEY, role);
  },

  async getRole(): Promise<string | null> {
    return await AsyncStorage.getItem(ROLE_KEY);
  },

  // Saved / Favourites Listing IDs
  async getSavedIds(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(SAVED_ITEMS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async toggleSavedId(id: string): Promise<string[]> {
    const current = await this.getSavedIds();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    await AsyncStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(next));
    return next;
  },
};
