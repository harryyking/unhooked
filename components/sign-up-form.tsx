import { SocialConnections } from '@/components/social-connections';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import * as React from 'react';
import { View } from 'react-native';


export function SignUpForm() {
  return (
    <View className="gap-6">
      <Card className="border-border/0 shadow-none sm:border-border sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Create your account</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Welcome! Log in to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <SocialConnections />
        </CardContent>
      </Card>
    </View>
  );
}
