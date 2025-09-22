import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import HomeTabs from '@/components/hometabs';
import { SafeAreaView } from 'react-native-safe-area-context';



const HomeScreen = () => {
    
    return (
      <SafeAreaView className='flex-1'>
        <HomeTabs/>
      </SafeAreaView>
    );
  };
  
  export default HomeScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        // Add padding top for Android status bar if needed
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      },
      content: {
        flex: 1,
      },

})