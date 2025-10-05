import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Function to check (call after sign-in or on mount)
export async function debugSessionStorage() {
  try {
    // Key is `${storagePrefix}:session` from your config
    const sessionKey = `${Constants.expoConfig?.scheme}`;  // e.g., 'unhooked:session'
    const sessionValue = await SecureStore.getItemAsync(sessionKey);
    console.log('Session stored?', !!sessionValue);  // true if present
    if (sessionValue) {
      console.log('Session value preview:', sessionValue.substring(0, 50) + '...');  // First 50 chars (JWT-like)
    }

    // Also check related keys if needed
    const tokenKey = `${Constants.expoConfig?.scheme}`;
    const tokenValue = await SecureStore.getItemAsync(tokenKey);
    console.log('Token stored?', !!tokenValue);
  } catch (error) {
    console.error('SecureStore check failed:', error);
  }
}
