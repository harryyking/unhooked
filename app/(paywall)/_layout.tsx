import { Stack } from 'expo-router';

export default function PaywallLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal', // Premium native feel
          animation: 'slide_from_bottom'
        }}
      />
    </Stack>
  );
}
