import "react-native-url-polyfill/auto";
import { createClient, processLock } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
const url=process.env.EXPO_PUBLIC_SUPABASE_URL;
const key=process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const storage={getItem:(k:string)=>SecureStore.getItemAsync(k),setItem:(k:string,v:string)=>SecureStore.setItemAsync(k,v),removeItem:(k:string)=>SecureStore.deleteItemAsync(k)};
export const supabase=url&&key?createClient(url,key,{auth:{storage,autoRefreshToken:true,persistSession:true,detectSessionInUrl:false,lock:processLock}}):null;
export const hasSupabaseConfig=Boolean(url&&key);
