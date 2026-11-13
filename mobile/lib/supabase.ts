import "react-native-url-polyfill/auto";
import { createClient, processLock } from "@supabase/supabase-js";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const storage = {
  getItem: async (k: string) => {
    if (Platform.OS === "web") {
      return typeof localStorage === "undefined" ? null : localStorage.getItem(k);
    }
    return SecureStore.getItemAsync(k);
  },
  setItem: async (k: string, v: string) => {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.setItem(k, v);
      return;
    }
    await SecureStore.setItemAsync(k, v);
  },
  removeItem: async (k: string) => {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.removeItem(k);
      return;
    }
    await SecureStore.deleteItemAsync(k);
  },
};

export const supabase = url && key
  ? createClient(url, key, {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    })
  : null;

export const hasSupabaseConfig = Boolean(url && key);
