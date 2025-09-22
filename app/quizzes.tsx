// screens/Assessment.tsx (or wherever this lives)
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DesireQuiz from '@/components/quiz';

const Assessment = () => {
  return (
    <View className='flex-1'>
        <DesireQuiz />
    </View>
  );
};

export default Assessment;