import { SocialConnections } from '@/components/social-connections';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import * as React from 'react';
import { type TextInput, View } from 'react-native';


export function SignInForm() {
  return (
    <View className="gap-6">
      <Card className="border-border/0 shadow-none sm:border-border sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Sign in to Unhooked</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Welcome back! Please sign in to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <SocialConnections />
        </CardContent>
      </Card>
    </View>
  );
}
