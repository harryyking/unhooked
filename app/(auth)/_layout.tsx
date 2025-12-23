import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      {/* Set the status bar to light because our auth theme is dark */}
      <StatusBar style="light" />
      
      <Stack
        screenOptions={{
          // Hide the default native header so our custom UI takes over
          headerShown: false,
          // Use a dark background color to prevent a white flash between transitions
          contentStyle: { backgroundColor: '#0f172a' },
          // Enable smooth slide transitions (native feel)
          animation: 'slide_from_right',
        }}
      >
        {/* The first screen users see */}
        <Stack.Screen 
          name="index" 
          options={{
            gestureEnabled: false, // Prevent swiping back to the loading screen
          }}
        />

        {/* The 15-question quiz */}
        <Stack.Screen name="quiz" />

        {/* Symptoms and results display */}
        <Stack.Screen name="results" />

        {/* Final sales page / Subscription */}
        <Stack.Screen name="paywall" />

        {/* Sign In with Apple / Google */}
        <Stack.Screen 
          name="login" 
          options={{
            presentation: 'formSheet', // Makes the login slide up from the bottom
            animation: 'slide_from_bottom'
          }}
        />
      </Stack>
    </>
  );
}