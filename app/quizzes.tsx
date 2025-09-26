// screens/Assessment.tsx (or wherever this lives)
import { View, StyleSheet } from 'react-native';
import DesireQuiz from '@/components/quiz';

const Assessment = () => {
  return (
    <View className='flex-1'>
        <DesireQuiz />
    </View>
  );
};

export default Assessment;