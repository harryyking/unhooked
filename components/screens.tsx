import { ScrollView, View } from 'react-native';
import React from 'react';
import DevotionalCard from './devotional-card';
import MemberCard from './member-card';
import StreakCard from './streak-card';

export const TodayScreen = () => {
  return (
    <ScrollView className="flex-1 p-1" showsVerticalScrollIndicator={false} contentContainerStyle={{flexGrow: 1}}>
      <StreakCard />
      <DevotionalCard />
    </ScrollView>
  );
};

export const CommunityScreen = () => {
  return (
    <View className="flex-1 p-1">
      <MemberCard />
    </View>
  );
};