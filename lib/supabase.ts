import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { createMMKV, MMKV } from 'react-native-mmkv';
import { Database } from '../types/supabase';

// 1. Initialize MMKV instance
const storage =  createMMKV();

// 2. Create a Supabase-compatible adapter
const mmkvAdapter = {
  getItem: (key: string) => {
    return storage.getString(key) ?? null;
  },
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.remove(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

// 3. Initialize Client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: mmkvAdapter, // Use the adapter here
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});